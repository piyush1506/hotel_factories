const crypto = require('crypto');
const QRCode = require('qrcode');
const GST_RATES = require('../constants/gstRates');

/**
 * Generate a clean unique booking code e.g. "HF-2026-X8K9M"
 */
function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `HF-${year}-${randomPart}`;
}

/**
 * Generate slug from string e.g. "The Oberoi Grand Palace & Spa Udaipur" -> "the-oberoi-grand-palace-spa-udaipur"
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate difference in nights between two YYYY-MM-DD dates
 */
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Generate date array string between checkIn and checkOut
 */
function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const stopDate = new Date(endDate);
  
  while (currentDate < stopDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

/**
 * Complete Indian Hotel Booking Financial Breakdown
 * Handles 5% (<= ₹7,500/night) vs 18% (> ₹7,500/night), Platform Convenience Fee,
 * Platform Commission %, Commission GST (18%), Gateway charges (2.36%), and Net Hotel Payout.
 */
function calculateFinancialBreakdown({
  baseRoomPrice,        // Price per night before tax
  nights = 1,
  roomsCount = 1,
  discountAmount = 0,
  commissionRate = 15.0, // Hotel's commission % (default 15%)
  convenienceFee = 99.0
}) {
  const totalBaseTariff = (baseRoomPrice * nights * roomsCount);
  const discountedTariff = Math.max(0, totalBaseTariff - discountAmount);
  const effectiveNightlyRate = (discountedTariff / (nights * roomsCount));

  // Determine GST slab based on per-night price
  const gstRate = effectiveNightlyRate <= GST_RATES.ACCOMMODATION_THRESHOLD 
    ? GST_RATES.TIER1_RATE 
    : GST_RATES.TIER2_RATE;

  const hotelGstAmount = Math.round(discountedTariff * gstRate * 100) / 100;
  const platformConvenienceFee = convenienceFee;
  const convenienceFeeGst = Math.round(platformConvenienceFee * 0.18 * 100) / 100;

  // Total paid by customer
  const totalPayableByCustomer = Math.round((discountedTariff + hotelGstAmount + platformConvenienceFee + convenienceFeeGst) * 100) / 100;

  // Platform Earnings Calculation
  const commissionPercentage = commissionRate / 100;
  const platformCommissionGross = Math.round(discountedTariff * commissionPercentage * 100) / 100;
  const commissionGst = Math.round(platformCommissionGross * GST_RATES.COMMISSION_GST_RATE * 100) / 100;

  // Payment gateway fee (calculated on total collected from customer)
  const gatewayFee = Math.round(totalPayableByCustomer * GST_RATES.EFFECTIVE_GATEWAY_RATE * 100) / 100;

  // TDS on e-commerce (1% on gross tariff)
  const tdsDeduction = Math.round(discountedTariff * GST_RATES.TDS_RATE * 100) / 100;

  // Net Hotel Payout
  // Hotel gets Room Tariff + Hotel GST - Platform Commission - Commission GST - TDS
  const netHotelPayout = Math.round((discountedTariff + hotelGstAmount - platformCommissionGross - commissionGst - tdsDeduction) * 100) / 100;

  // Admin Net Profit after gateway charges
  const adminNetProfit = Math.round((platformCommissionGross + platformConvenienceFee - gatewayFee) * 100) / 100;

  return {
    baseRoomPrice,
    nights,
    roomsCount,
    totalBaseTariff,
    discountAmount,
    discountedTariff,
    effectiveNightlyRate,
    gstRatePercentage: gstRate * 100,
    hotelGstAmount,
    platformConvenienceFee,
    convenienceFeeGst,
    totalPayableByCustomer,
    commissionRatePercentage: commissionRate,
    platformCommissionGross,
    commissionGst,
    gatewayFee,
    tdsDeduction,
    netHotelPayout,
    adminNetProfit
  };
}

/**
 * Generate QR code data URL for check-in verification
 */
async function generateQRCode(textData) {
  try {
    return await QRCode.toDataURL(textData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 250,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateBookingCode,
  slugify,
  calculateNights,
  getDatesInRange,
  calculateFinancialBreakdown,
  generateQRCode
};
