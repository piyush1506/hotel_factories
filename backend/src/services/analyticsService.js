const db = require('../config/database');
const { BOOKING_STATUS } = require('../constants/bookingStatus');

class AnalyticsService {
  /**
   * Admin Platform High-Level Financial & Operational Overview
   */
  getAdminMetrics() {
    const hotels = db.find('hotels');
    const hotelIds = new Set(hotels.map((hotel) => hotel.id));
    const rooms = db.find('rooms').filter((room) => hotelIds.has(room.hotelId));
    const users = db.find('users');
    const bookings = db.find('bookings');

    let totalGmv = 0;
    let netPlatformCommission = 0;
    let totalConvenienceFees = 0;
    let totalTaxCollected = 0;
    let totalGatewayFees = 0;
    let totalHotelPayouts = 0;

    let confirmedCount = 0;
    let checkedInCount = 0;
    let cancelledCount = 0;

    bookings.forEach((b) => {
      if (b.status !== BOOKING_STATUS.CANCELLED) {
        totalGmv += b.totalAmount || 0;
        netPlatformCommission += b.platformCommissionGross || 0;
        totalConvenienceFees += b.platformConvenienceFee || 0;
        totalTaxCollected += (b.hotelGstAmount || 0) + (b.commissionGst || 0) + (b.convenienceFeeGst || 0);
        totalGatewayFees += b.gatewayFee || 0;
        totalHotelPayouts += b.netHotelPayout || 0;
      }

      if (b.status === BOOKING_STATUS.CONFIRMED) confirmedCount++;
      if (b.status === BOOKING_STATUS.CHECKED_IN || b.status === BOOKING_STATUS.COMPLETED) checkedInCount++;
      if (b.status === BOOKING_STATUS.CANCELLED) cancelledCount++;
    });

    const netPlatformProfit = (netPlatformCommission + totalConvenienceFees) - totalGatewayFees;

    // Monthly GMV breakdown
    const monthlyData = {};
    bookings.forEach((b) => {
      const month = (b.bookedAt || b.checkInDate || '2026-01').slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { month, gmv: 0, commission: 0, bookings: 0 };
      }
      monthlyData[month].gmv += b.totalAmount || 0;
      monthlyData[month].commission += (b.platformCommissionGross || 0);
      monthlyData[month].bookings += 1;
    });

    return {
      financials: {
        totalGmv: Math.round(totalGmv * 100) / 100,
        netPlatformProfit: Math.round(netPlatformProfit * 100) / 100,
        platformCommissionGross: Math.round(netPlatformCommission * 100) / 100,
        convenienceFees: Math.round(totalConvenienceFees * 100) / 100,
        gatewayFees: Math.round(totalGatewayFees * 100) / 100,
        totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
        totalHotelPayouts: Math.round(totalHotelPayouts * 100) / 100
      },
      counts: {
        totalHotels: hotels.length,
        verifiedHotels: hotels.filter((h) => h.isVerified).length,
        totalRooms: rooms.length,
        totalUsers: users.length,
        totalCustomers: users.filter((u) => u.role === 'customer').length,
        totalHoteliers: users.filter((u) => u.role === 'hotel_owner').length,
        totalBookings: bookings.length,
        confirmedBookings: confirmedCount,
        checkedInBookings: checkedInCount,
        cancelledBookings: cancelledCount
      },
      monthlyTrends: Object.values(monthlyData)
    };
  }

  /**
   * Hotelier Portal Dashboard Metrics
   */
  getHotelierMetrics(ownerId) {
    const ownerHotels = db.find('hotels', (h) => h.ownerId === ownerId);
    const hotelIds = ownerHotels.map((h) => h.id);
    const rooms = db.find('rooms', (r) => hotelIds.includes(r.hotelId));
    const bookings = db.find('bookings', (b) => hotelIds.includes(b.hotelId));

    const today = new Date().toISOString().split('T')[0];

    let grossSales = 0;
    let netPayout = 0;
    let todayCheckIns = 0;
    let todayCheckOuts = 0;

    bookings.forEach((b) => {
      if (b.status !== BOOKING_STATUS.CANCELLED) {
        grossSales += b.totalAmount || 0;
        netPayout += b.netHotelPayout || 0;
      }
      if (b.checkInDate === today && b.status === BOOKING_STATUS.CONFIRMED) {
        todayCheckIns++;
      }
      if (b.checkOutDate === today && b.status === BOOKING_STATUS.CHECKED_IN) {
        todayCheckOuts++;
      }
    });

    return {
      propertiesCount: ownerHotels.length,
      roomsCount: rooms.length,
      grossSales: Math.round(grossSales * 100) / 100,
      netPayout: Math.round(netPayout * 100) / 100,
      totalBookings: bookings.length,
      todayCheckIns,
      todayCheckOuts,
      recentBookings: bookings.slice(0, 10),
      hotels: ownerHotels.map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        rating: h.rating,
        commissionRate: h.commissionRate,
        isVerified: h.isVerified
      }))
    };
  }
}

module.exports = new AnalyticsService();
