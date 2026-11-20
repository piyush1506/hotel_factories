let checkoutLoader;

function loadCheckoutScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Payment checkout is only available in the browser.'));
  if (window.Razorpay) return Promise.resolve();
  if (checkoutLoader) return checkoutLoader;

  checkoutLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if (window.Razorpay) {
        resolve();
      } else {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', () => reject(new Error('Could not load Razorpay Checkout script.')));
      }
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout. Please check your internet connection and try again.'));
    document.head.appendChild(script);
  });
  return checkoutLoader;
}

function openMockSimulatorModal(order) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return resolve({ razorpayOrderId: order.orderId, razorpayPaymentId: null, razorpaySignature: null });
    }

    const existing = document.getElementById('hf-razorpay-sim-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hf-razorpay-sim-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;backdrop-filter:blur(4px);';

    overlay.innerHTML = `
      <div style="background:#ffffff;border-radius:18px;max-width:440px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#0c2340;color:#ffffff;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="background:#ffffff;border-radius:6px;padding:3px 8px;display:flex;align-items:center;">
              <span style="font-weight:900;color:#0c2340;font-size:14px;letter-spacing:-0.5px;">Razorpay</span>
            </div>
            <span style="background:rgba(255,255,255,0.18);padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700;color:#93c5fd;letter-spacing:0.04em;">TEST SIMULATOR</span>
          </div>
          <button id="hf-rzp-close-btn" style="background:transparent;border:0;color:#94a3b8;cursor:pointer;font-size:22px;line-height:1;padding:0 4px;" title="Close">&times;</button>
        </div>
        <div style="padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:16px;border-bottom:1px solid #f1f5f9;">
            <div>
              <p style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;margin:0;letter-spacing:0.05em;">Total Payable</p>
              <h2 style="font-size:26px;font-weight:800;color:#0f172a;margin:4px 0 0;">₹${Number(order.amount || 0).toLocaleString('en-IN')}</h2>
            </div>
            <div style="text-align:right;">
              <p style="font-size:11px;color:#64748b;margin:0;">Reservation</p>
              <span style="font-family:monospace;font-size:12px;font-weight:700;color:#0284c7;">${order.bookingCode || 'HF-PASS'}</span>
            </div>
          </div>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin:16px 0;font-size:12px;color:#475569;line-height:1.5;">
            <p style="margin:0 0 4px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#f59e0b;"></span>
              Developer Sandbox Mode
            </p>
            Placeholder keys are set in <code>backend/.env</code>. To open the real Razorpay popup with live UPI QR, Google Pay, PhonePe, and Cards, paste your real <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code>.
          </div>

          <p style="font-size:12px;color:#334155;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.04em;">Select payment outcome:</p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button id="hf-rzp-pay-success-btn" style="width:100%;padding:12px;border-radius:12px;background:#059669;color:#ffffff;font-weight:700;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;box-shadow:0 4px 14px rgba(5,150,105,0.3);transition:all 0.15s ease;">
              ✓ Authorize Payment (UPI / Card Success)
            </button>
            <button id="hf-rzp-pay-fail-btn" style="width:100%;padding:10px;border-radius:12px;background:#ffffff;color:#e11d48;font-weight:700;border:1px solid #fecdd3;cursor:pointer;font-size:13px;transition:all 0.15s ease;">
              ✕ Simulate User Cancel / Abandon
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    const successBtn = document.getElementById('hf-rzp-pay-success-btn');
    const failBtn = document.getElementById('hf-rzp-pay-fail-btn');
    const closeBtn = document.getElementById('hf-rzp-close-btn');

    if (successBtn) {
      successBtn.onclick = () => {
        cleanup();
        resolve({
          razorpayOrderId: order.orderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'simulated_signature'
        });
      };
    }

    if (failBtn) {
      failBtn.onclick = () => {
        cleanup();
        reject(new Error('Payment was cancelled in test simulation.'));
      };
    }

    if (closeBtn) {
      closeBtn.onclick = () => {
        cleanup();
        reject(new Error('Payment modal closed by user.'));
      };
    }
  });
}

export async function openRazorpayCheckout(order) {
  // If the server explicitly created a mock order in development mode, show the test simulator popup
  if (order.mock) {
    return openMockSimulatorModal(order);
  }

  if (!order.keyId) {
    throw new Error('Razorpay Key ID was not returned by the server. Please verify your Razorpay API configuration in backend/.env.');
  }

  await loadCheckoutScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountInPaise,
      currency: order.currency || 'INR',
      name: 'Hotel Factories',
      description: `Reservation at ${order.hotelName || 'Property'}`,
      prefill: {
        name: order.customer?.name || '',
        email: order.customer?.email || '',
        contact: order.customer?.phone || ''
      },
      notes: {
        booking_id: order.bookingId,
        booking_code: order.bookingCode
      },
      theme: {
        color: '#00224f'
      },
      handler: function (response) {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment was cancelled. You can retry paying before the room hold expires.'));
        }
      }
    };

    try {
      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', function (response) {
        const error = response.error || {};
        reject(new Error(error.description || error.reason || 'Payment failed. Please try a different card, UPI or NetBanking.'));
      });
      checkout.open();
    } catch (err) {
      reject(new Error(err.message || 'Could not launch Razorpay checkout modal.'));
    }
  });
}
