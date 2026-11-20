const GST_RATES = {
  // Hotel accommodation GST slabs (as per 2025/2026 regulations)
  ACCOMMODATION_THRESHOLD: 7500, // INR per room/night
  TIER1_RATE: 0.05,             // 5% for <= ₹7,500 / night
  TIER2_RATE: 0.18,             // 18% for > ₹7,500 / night

  // Platform commission GST
  COMMISSION_GST_RATE: 0.18,    // 18% on platform's commission fee

  // Payment Gateway costs
  PAYMENT_GATEWAY_RATE: 0.02,   // 2% base
  GATEWAY_GST_RATE: 0.18,       // 18% GST on gateway fee
  EFFECTIVE_GATEWAY_RATE: 0.0236, // 2.36%

  // E-commerce TDS (Section 194-O)
  TDS_RATE: 0.01 // 1%
};

module.exports = GST_RATES;
