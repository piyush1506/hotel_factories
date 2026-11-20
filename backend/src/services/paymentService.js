const crypto = require('crypto');
const Razorpay = require('razorpay');
const config = require('../config/env');
const db = require('../config/database');
const bookingService = require('./bookingService');
const logger = require('../utils/logger');

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function safeEqual(left, right) {
  const supplied = Buffer.from(String(left || ''));
  const expected = Buffer.from(String(right || ''));
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

class PaymentService {
  isRealConfigured() {
    const keyId = (config.RAZORPAY_KEY_ID || '').trim();
    const secret = (config.RAZORPAY_KEY_SECRET || '').trim();
    if (!keyId || !secret) return false;
    // Real keys start with rzp_test_ or rzp_live_ and are not dummy placeholder strings
    const isStandardPrefix = keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_');
    const isMockPlaceholder = keyId.includes('mock') || secret.includes('mock');
    return isStandardPrefix && !isMockPlaceholder;
  }

  getClient() {
    if (!this.isRealConfigured()) {
      return null;
    }
    return new Razorpay({
      key_id: config.RAZORPAY_KEY_ID.trim(),
      key_secret: config.RAZORPAY_KEY_SECRET.trim()
    });
  }

  getPublicConfig() {
    const isReal = this.isRealConfigured();
    return {
      gateway: 'razorpay',
      isReal,
      keyId: isReal ? config.RAZORPAY_KEY_ID.trim() : null,
      currency: 'INR',
      allowMock: Boolean(config.ALLOW_MOCK_PAYMENTS)
    };
  }

  assertPayable(booking, user) {
    if (!booking) throw httpError('Booking reservation not found.', 404);
    if (booking.userId !== user.id && user.role !== 'admin') {
      throw httpError('You are not authorized to pay for this booking.', 403);
    }
    if (booking.status !== 'HELD' || booking.lockExpiresAt <= new Date().toISOString()) {
      throw httpError('This booking hold has expired or is no longer payable.', 409);
    }
  }

  orderResponse(booking, orderId, mock = false) {
    return {
      orderId,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      amount: booking.totalAmount,
      amountInPaise: Math.round(booking.totalAmount * 100),
      currency: 'INR',
      keyId: mock ? null : config.RAZORPAY_KEY_ID.trim(),
      mock,
      hotelName: booking.hotelName,
      customer: {
        name: booking.guestName,
        email: booking.guestEmail,
        phone: booking.guestPhone
      }
    };
  }

  async createPaymentOrder({ bookingId, user }) {
    return db.withWriteLock(() => this.createPaymentOrderLocked({ bookingId, user }));
  }

  async createPaymentOrderLocked({ bookingId, user }) {
    const booking = db.findById('bookings', bookingId);
    this.assertPayable(booking, user);

    // Reuse existing valid order if present
    if (booking.paymentOrderId) {
      return this.orderResponse(booking, booking.paymentOrderId, Boolean(booking.paymentOrderMock));
    }

    const amountInPaise = Math.round(booking.totalAmount * 100);

    // If real Razorpay keys are configured, create real order via Razorpay SDK
    if (this.isRealConfigured()) {
      const razorpay = this.getClient();
      try {
        const providerOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${(booking.bookingCode || booking.id).slice(0, 30)}`,
          notes: {
            booking_id: booking.id,
            booking_code: booking.bookingCode,
            hotel_name: String(booking.hotelName || '').slice(0, 30),
            guest_name: String(booking.guestName || '').slice(0, 30)
          }
        });

        if (!providerOrder || !providerOrder.id) {
          throw httpError('Failed to obtain a valid order ID from Razorpay.', 502);
        }

        db.update('bookings', booking.id, {
          paymentOrderId: providerOrder.id,
          paymentOrderMock: false,
          paymentOrderAmount: providerOrder.amount,
          paymentOrderCreatedAt: new Date().toISOString()
        });

        logger.info(`Real Razorpay order created: ${providerOrder.id} for booking ${booking.bookingCode} (₹${booking.totalAmount})`);
        return this.orderResponse(booking, providerOrder.id, false);
      } catch (err) {
        logger.error('Razorpay order creation error:', err.message || err);
        throw httpError(err.message || 'Payment gateway could not create order. Please verify credentials.', err.statusCode || 502);
      }
    }

    // Fallback: If mock payments are permitted in development
    if (config.ALLOW_MOCK_PAYMENTS) {
      const orderId = `order_mock_${crypto.randomUUID().replace(/-/g, '')}`;
      db.update('bookings', booking.id, {
        paymentOrderId: orderId,
        paymentOrderMock: true,
        paymentOrderAmount: amountInPaise,
        paymentOrderCreatedAt: new Date().toISOString()
      });
      logger.warn(`Razorpay mock order created for booking ${booking.bookingCode}. Set real RAZORPAY_KEY_ID in .env for production.`);
      return this.orderResponse(booking, orderId, true);
    }

    throw httpError('Razorpay is not configured for real payments. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.', 503);
  }

  async verifyAndConfirmPayment({ bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, user }) {
    const booking = db.findById('bookings', bookingId);
    if (!booking) throw httpError('Booking reservation not found.', 404);
    if (booking.userId !== user.id && user.role !== 'admin') {
      throw httpError('You are not authorized to confirm this payment.', 403);
    }
    if (!booking.paymentOrderId || booking.paymentOrderId !== razorpayOrderId) {
      throw httpError('Payment order does not match this reservation.', 400);
    }

    let transactionId;
    let paymentMethod = 'RAZORPAY_ONLINE';

    // Mock payment confirmation in development
    if (booking.paymentOrderMock) {
      if (!config.ALLOW_MOCK_PAYMENTS) {
        throw httpError('Mock payment confirmation is disabled on this server.', 403);
      }
      transactionId = `pay_mock_${crypto.randomUUID().replace(/-/g, '')}`;
      paymentMethod = 'DEVELOPMENT_MOCK';
    } else {
      // Real Razorpay signature verification
      if (!config.RAZORPAY_KEY_SECRET || !razorpayPaymentId || !razorpaySignature) {
        throw httpError('Complete Razorpay payment transaction details are required.', 400);
      }

      const expected = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET.trim())
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (!safeEqual(razorpaySignature, expected)) {
        logger.error(`Razorpay signature mismatch for booking ${booking.bookingCode}`);
        throw httpError('Payment verification signature mismatch. Security check failed.', 400);
      }

      // Query Razorpay API to inspect the captured transaction details & payment mode
      try {
        const razorpay = this.getClient();
        if (razorpay) {
          const paymentEntity = await razorpay.payments.fetch(razorpayPaymentId);
          if (paymentEntity) {
            const status = paymentEntity.status;
            if (status !== 'captured' && status !== 'authorized') {
              throw httpError(`Razorpay reports payment status as "${status}". Only captured payments can confirm bookings.`, 400);
            }
            const expectedAmountPaise = Math.round(booking.totalAmount * 100);
            if (paymentEntity.amount !== expectedAmountPaise) {
              throw httpError('Payment amount mismatch between gateway and booking folio.', 400);
            }
            paymentMethod = `RAZORPAY_${(paymentEntity.method || 'ONLINE').toUpperCase()}`;
          }
        }
      } catch (fetchErr) {
        // If API lookup times out or fails network check, signature already verified cryptographically
        logger.warn('Could not query payment entity details, signature is verified:', fetchErr.message);
      }

      transactionId = razorpayPaymentId;
    }

    const confirmedBooking = await bookingService.confirmBooking({
      bookingId,
      paymentTransactionId: transactionId,
      paymentMethod
    });

    logger.info(`Booking ${confirmedBooking.bookingCode} confirmed with payment txn ${transactionId}`);
    return {
      success: true,
      message: 'Payment verified and reservation confirmed!',
      booking: confirmedBooking
    };
  }

  async confirmPayAtHotel({ bookingId, user }) {
    const booking = db.findById('bookings', bookingId);
    if (!booking) throw httpError('Booking reservation not found.', 404);
    if (booking.userId !== user.id && user.role !== 'admin') {
      throw httpError('You are not authorized to confirm this booking.', 403);
    }
    if (booking.status !== 'HELD' || booking.lockExpiresAt <= new Date().toISOString()) {
      throw httpError('This booking hold has expired or is no longer payable.', 409);
    }

    const confirmedBooking = await bookingService.confirmBooking({
      bookingId,
      paymentTransactionId: `desk_${Date.now()}`,
      paymentMethod: 'PAY_AT_HOTEL'
    });

    // Mark payment status as PENDING since customer pays at property check-in
    const updated = db.update('bookings', bookingId, {
      paymentStatus: 'PENDING'
    });

    logger.info(`Booking ${updated.bookingCode} confirmed with Pay at Hotel`);
    return {
      success: true,
      message: 'Reservation confirmed! Payment will be collected at hotel check-in.',
      booking: updated
    };
  }

  async processRefund({ booking, refundAmount, note }) {
    const txnId = booking.paymentTransactionId;
    if (txnId && txnId.startsWith('pay_') && !txnId.startsWith('pay_mock_') && this.isRealConfigured()) {
      try {
        const razorpay = this.getClient();
        const amountInPaise = Math.round(refundAmount * 100);
        const refund = await razorpay.payments.refund(txnId, {
          amount: amountInPaise,
          notes: {
            booking_code: booking.bookingCode,
            booking_id: booking.id,
            reason: note || 'Refund approved by administrator'
          }
        });
        logger.info(`Real Razorpay refund executed: ${refund.id} for booking ${booking.bookingCode} (₹${refundAmount})`);
        return { success: true, refundId: refund.id };
      } catch (err) {
        logger.error('Razorpay refund API error:', err.message);
        throw httpError(`Razorpay refund failed: ${err.message}`, 502);
      }
    }
    return { success: true, refundId: `RFND-${Date.now().toString(36).toUpperCase()}` };
  }

  async handleWebhook(eventBody, signature, rawBody) {
    if (!config.RAZORPAY_WEBHOOK_SECRET || !signature || !rawBody) {
      throw httpError('Webhook verification is not configured.', 503);
    }
    const expected = crypto.createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET.trim()).update(rawBody).digest('hex');
    if (!safeEqual(signature, expected)) throw httpError('Invalid webhook signature.', 400);

    const eventKey = crypto.createHash('sha256').update(rawBody).digest('hex');
    if (db.findById('webhookEvents', eventKey)) return { status: 'already_processed' };
    db.insert('webhookEvents', { id: eventKey, event: eventBody.event, processedAt: new Date().toISOString() });

    try {
      const paymentEntity = eventBody?.payload?.payment?.entity;
      if ((eventBody.event === 'payment.captured' || eventBody.event === 'order.paid') && paymentEntity) {
        const booking = db.findOne('bookings', (item) =>
          item.id === paymentEntity.notes?.booking_id || item.paymentOrderId === paymentEntity.order_id
        );
        if (!booking) throw httpError('Webhook payment is not linked to a booking.', 400);
        if (paymentEntity.amount !== Math.round(booking.totalAmount * 100) || paymentEntity.currency !== 'INR') {
          throw httpError('Webhook payment amount does not match the booking.', 400);
        }
        await bookingService.confirmBooking({
          bookingId: booking.id,
          paymentTransactionId: paymentEntity.id,
          paymentMethod: `RAZORPAY_${(paymentEntity.method || 'ONLINE').toUpperCase()}`
        });
      }
    } catch (error) {
      db.delete('webhookEvents', eventKey);
      throw error;
    }
    return { status: 'processed' };
  }
}

module.exports = new PaymentService();
