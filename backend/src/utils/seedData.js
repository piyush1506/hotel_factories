const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { NEW_HOTELS, NEW_ROOMS } = require('./dummyHotelsRajasthan');

/**
 * Build seed users at runtime from environment variables.
 * No credentials are hardcoded — everything comes from .env
 */
function buildSeedUsers() {
  const users = [];

  // Admin account
  if (config.ADMIN_EMAIL && config.ADMIN_PASSWORD) {
    users.push({
      id: 'usr-admin-1',
      name: config.ADMIN_NAME,
      email: config.ADMIN_EMAIL,
      phone: config.ADMIN_PHONE,
      password: bcrypt.hashSync(config.ADMIN_PASSWORD, 10),
      role: 'admin',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(config.ADMIN_NAME)}`,
      createdAt: new Date().toISOString()
    });
  }

  // Hotelier 1
  if (config.HOTELIER1_EMAIL && config.HOTELIER1_PASSWORD) {
    users.push({
      id: 'usr-hotelier-1',
      name: config.HOTELIER1_NAME,
      email: config.HOTELIER1_EMAIL,
      phone: config.HOTELIER1_PHONE,
      password: bcrypt.hashSync(config.HOTELIER1_PASSWORD, 10),
      role: 'hotel_owner',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(config.HOTELIER1_NAME)}`,
      createdAt: new Date().toISOString()
    });
  }

  // Hotelier 2
  if (config.HOTELIER2_EMAIL && config.HOTELIER2_PASSWORD) {
    users.push({
      id: 'usr-hotelier-2',
      name: config.HOTELIER2_NAME,
      email: config.HOTELIER2_EMAIL,
      phone: config.HOTELIER2_PHONE,
      password: bcrypt.hashSync(config.HOTELIER2_PASSWORD, 10),
      role: 'hotel_owner',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(config.HOTELIER2_NAME)}`,
      createdAt: new Date().toISOString()
    });
  }

  // Test Customer
  if (config.CUSTOMER1_EMAIL && config.CUSTOMER1_PASSWORD) {
    users.push({
      id: 'usr-customer-1',
      name: config.CUSTOMER1_NAME,
      email: config.CUSTOMER1_EMAIL,
      phone: config.CUSTOMER1_PHONE,
      password: bcrypt.hashSync(config.CUSTOMER1_PASSWORD, 10),
      role: 'customer',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(config.CUSTOMER1_NAME)}`,
      createdAt: new Date().toISOString()
    });
  }

  return users;
}

const SEED_HOTELS = [
  {
    id: 'hotel-1',
    slug: 'the-oberoi-grand-palace-and-spa-udaipur',
    ownerId: 'usr-hotelier-1',
    name: 'The Oberoi Grand Palace & Spa',
    tagline: 'Royal lakeside heritage and Michelin-grade luxury',
    category: 'Luxury',
    city: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    address: 'Haridas Ji Ki Magri, Lake Pichola, Udaipur, Rajasthan 313001',
    latitude: 24.5764,
    longitude: 73.6835,
    starRating: 5,
    rating: 4.9,
    reviewsCount: 348,
    startingPrice: 12500,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Oberoi Hotels & Resorts Ltd',
      accountNumber: '918020045612349',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank, Udaipur Branch',
      payoutAccountId: 'rzp_acc_oberoi_001'
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Nestled along the serene shores of Lake Pichola, The Oberoi Grand Palace offers opulent royal suites, an infinity pool overlooking the water, bespoke Ayurvedic spa therapies, and Michelin-inspired fine dining.',
    amenities: [
      'Free High-Speed WiFi', 'Infinity Pool', 'Luxury Ayurvedic Spa', 'Fine Dining Restaurant',
      'Valet Parking', 'Fitness Center', 'Airport Shuttle', 'Lake View Balconies', '24/7 Butler Service', 'Bar & Lounge'
    ],
    policies: {
      checkIn: '14:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 48 hours before check-in. 50% refund within 24 hours.',
      petPolicy: 'Pet friendly in designated garden suites',
      childPolicy: 'Children under 6 stay free when using existing bedding'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'hotel-2',
    slug: 'azure-bay-beach-resort-and-club-goa',
    ownerId: 'usr-hotelier-2',
    name: 'Azure Bay Beach Resort & Club',
    tagline: 'Private beach access, sunset cabanas, and lively coastal vibe',
    category: 'Beachfront',
    city: 'Goa',
    state: 'Goa',
    country: 'India',
    address: 'Candolim Beach Road, North Goa, Goa 403515',
    latitude: 15.5173,
    longitude: 73.7628,
    starRating: 5,
    rating: 4.8,
    reviewsCount: 292,
    startingPrice: 6800,
    currency: '₹',
    commissionRate: 12.5,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Azure Bay Hospitality LLP',
      accountNumber: '501004829103941',
      ifscCode: 'ICIC0000456',
      bankName: 'ICICI Bank, Candolim Goa',
      payoutAccountId: 'rzp_acc_azure_002'
    },
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Step straight from your private cabana onto the golden sands of Candolim. Enjoy beachfront sunset cocktails, water sports center, lagoon swimming pool, and live beach lounge music.',
    amenities: [
      'Direct Beach Access', 'Free WiFi', 'Lagoon Swimming Pool', 'Beachside Cocktail Bar',
      'Complimentary Breakfast', 'Water Sports & Jet Ski', 'Wellness Spa', 'Live Music Lounge'
    ],
    policies: {
      checkIn: '13:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 24 hours prior to arrival.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children of all ages welcome'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-01-08T00:00:00.000Z'
  },
  {
    id: 'hotel-3',
    slug: 'the-skyline-metropolitan-hotel-mumbai',
    ownerId: 'usr-hotelier-1',
    name: 'The Skyline Metropolitan Hotel',
    tagline: 'Ultra-modern business luxury in the heart of BKC Mumbai',
    category: 'City Center',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    address: 'Bandra Kurla Complex (BKC), G-Block, Bandra East, Mumbai 400051',
    latitude: 19.0662,
    longitude: 72.8687,
    starRating: 4,
    rating: 4.7,
    reviewsCount: 419,
    startingPrice: 8200,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Metropolitan Hotels India Pvt Ltd',
      accountNumber: '0004050098231',
      ifscCode: 'UTIB0000004',
      bankName: 'Axis Bank, BKC Branch',
      payoutAccountId: 'rzp_acc_skyline_003'
    },
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An ultra-modern architectural icon in the heart of BKC. Featuring rooftop infinity pool, 360-degree skyline views, executive lounge, state-of-the-art gym, and business conference suites.',
    amenities: [
      'Free High-Speed WiFi', 'Rooftop Infinity Pool', '24/7 Fitness Center', 'Executive Meeting Rooms',
      'Rooftop Bar & Grill', 'Concierge Service', 'EV Supercharging Station'
    ],
    policies: {
      checkIn: '14:00', checkOut: '12:00',
      cancellation: 'Free cancellation up to 24 hours prior to check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children stay free up to 12 years'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'hotel-4',
    slug: 'pinecrest-alpine-eco-resort-manali',
    ownerId: 'usr-hotelier-2',
    name: 'Pinecrest Alpine Eco Resort',
    tagline: 'Snow-capped Himalayan views, cedar chalets & cozy fireplaces',
    category: 'Mountain View',
    city: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    address: 'Old Manali Hills, Log Huts Road, Manali, Himachal Pradesh 175131',
    latitude: 32.2432,
    longitude: 77.1892,
    starRating: 4,
    rating: 4.9,
    reviewsCount: 198,
    startingPrice: 5400,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Pinecrest Hospitality Manali',
      accountNumber: '620194827101',
      ifscCode: 'SBIN0001239',
      bankName: 'State Bank of India, Manali',
      payoutAccountId: 'rzp_acc_pinecrest_004'
    },
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Surrounded by cedar forests and snow-dusted Himalayan peaks. Features cozy cedar wood chalets, wood-burning fireplaces, bonfire nights, guided treks, and warm mountain hospitality.',
    amenities: [
      'Panoramic Mountain View', 'Wood Fireplace in Rooms', 'Free WiFi', 'Nightly Bonfire & BBQ',
      'In-house Organic Cafe', 'Complimentary Hot Breakfast', 'Underfloor Heating'
    ],
    policies: {
      checkIn: '12:00', checkOut: '10:00',
      cancellation: 'Free cancellation up to 72 hours before check-in.',
      petPolicy: 'Pet friendly property',
      childPolicy: 'Children under 5 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-01-12T00:00:00.000Z'
  },
  {
    id: 'hotel-5',
    slug: 'jaipur-royal-heritage-haveli-jaipur',
    ownerId: 'usr-hotelier-1',
    name: 'Jaipur Royal Heritage Haveli',
    tagline: 'Authentic Rajasthani architecture, marble courtyards & folk nights',
    category: 'Heritage',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    address: 'Near Jal Mahal, Amer Road, Jaipur, Rajasthan 302002',
    latitude: 26.9534,
    longitude: 75.8458,
    starRating: 4,
    rating: 4.85,
    reviewsCount: 310,
    startingPrice: 3800,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Heritage Haveli Jaipur Group',
      accountNumber: '112233445566',
      ifscCode: 'PUNB0123400',
      bankName: 'Punjab National Bank, Amer Jaipur',
      payoutAccountId: 'rzp_acc_haveli_005'
    },
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Immerse yourself in authentic Rajput hospitality. Built in 1845 and lovingly restored, featuring hand-painted frescos, courtyard fountain dining, daily cultural folk performances, and rooftop sunset views of Nahargarh Fort.',
    amenities: [
      'Heritage Architecture', 'Courtyard Swimming Pool', 'Free Breakfast', 'Rooftop Fort-View Restaurant',
      'Free High-Speed WiFi', 'Daily Cultural Folk Dance', 'Ayurvedic Massage'
    ],
    policies: {
      checkIn: '13:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 48 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 6 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-01-14T00:00:00.000Z'
  },
  {
    id: 'hotel-6',
    slug: 'backwater-palms-resort-kerala',
    ownerId: 'usr-hotelier-2',
    name: 'Backwater Palms Luxury Resort',
    tagline: 'Tranquil canals, Ayurvedic wellness sanctuary & private houseboats',
    category: 'Resort',
    city: 'Alleppey',
    state: 'Kerala',
    country: 'India',
    address: 'Punnamada Lake Front, Alleppey, Kerala 688006',
    latitude: 9.5126,
    longitude: 76.3533,
    starRating: 5,
    rating: 4.92,
    reviewsCount: 265,
    startingPrice: 7500,
    currency: '₹',
    commissionRate: 14.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Kerala Backwater Retreats Pvt Ltd',
      accountNumber: '334455667788',
      ifscCode: 'FDRL0001429',
      bankName: 'Federal Bank, Alleppey',
      payoutAccountId: 'rzp_acc_backwater_006'
    },
    images: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Set on the edge of the world-famous Vembanad Backwaters. Enjoy private traditional wood cottages, sunset canoe cruises, doctor-curated Panchakarma treatments, and authentic Kerala seafood delicacies.',
    amenities: [
      'Private Houseboat Cruises', 'Ayurvedic Hospital & Spa', 'Infinity Pool facing Lake', 'Free WiFi',
      'Traditional Kerala Dining', 'Yoga & Meditation Pavilion', 'Complimentary Canoe Tour'
    ],
    policies: {
      checkIn: '14:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 7 days before arrival.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 5 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-01-16T00:00:00.000Z'
  },
  {
    id: 'hotel-7',
    slug: 'urban-nest-smart-hotel-bengaluru',
    ownerId: 'usr-hotelier-1',
    name: 'Urban Nest Smart Tech Hotel',
    tagline: 'Modern smart rooms, keyless check-in, high-speed fiber for digital nomads',
    category: 'Budget',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    latitude: 12.9784,
    longitude: 77.6408,
    starRating: 3,
    rating: 4.65,
    reviewsCount: 520,
    startingPrice: 1800,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Urban Nest Stays LLP',
      accountNumber: '998877665544',
      ifscCode: 'KKBK0008012',
      bankName: 'Kotak Mahindra Bank, Indiranagar',
      payoutAccountId: 'rzp_acc_urbannest_007'
    },
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Designed for the modern tech professional and smart traveler. Offers automated digital key entry, 1 Gbps symmetric mesh WiFi, ergonomic Herman Miller chairs, soundproof pods, and a bustling ground-floor cafe.',
    amenities: [
      '1 Gbps Dedicated Fiber WiFi', 'Ergonomic Work Desk', '24/7 Specialty Coffee Bar', 'Keyless Mobile Entry',
      'Soundproof Glazing', 'Smart TV with Netflix', 'Self-Service Laundry'
    ],
    policies: {
      checkIn: '12:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 6 hours before check-in.',
      petPolicy: 'Pet friendly',
      childPolicy: 'Children welcome'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-01-20T00:00:00.000Z'
  },
  {
    id: 'hotel-8',
    slug: 'the-comfort-inn-express-delhi',
    ownerId: 'usr-hotelier-2',
    name: 'The Comfort Inn Express Airport',
    tagline: 'Clean, reliable budget stay 5 minutes from IGI Airport Terminal 3',
    category: 'Budget',
    city: 'Delhi',
    state: 'Delhi NCR',
    country: 'India',
    address: 'Mahipalpur Extension, Near IGI Airport, New Delhi 110037',
    latitude: 28.5524,
    longitude: 77.1265,
    starRating: 3,
    rating: 4.5,
    reviewsCount: 680,
    startingPrice: 1200,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Comfort Airport Stays Pvt Ltd',
      accountNumber: '445566778899',
      ifscCode: 'SBIN0005041',
      bankName: 'State Bank of India, Mahipalpur',
      payoutAccountId: 'rzp_acc_comfort_008'
    },
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Perfect for transit travelers and short business stays. Free 24/7 airport transfer, comfortable orthopedic mattress, hot shower, express check-in, and 24-hour room service menu.',
    amenities: [
      'Free 24/7 Airport Shuttle', 'High Speed WiFi', 'Air Conditioning', 'Hot Water 24/7',
      '24/7 Room Service', 'Luggage Storage', 'Complimentary Morning Tea/Coffee'
    ],
    policies: {
      checkIn: '12:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 2 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 8 stay free'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-01-22T00:00:00.000Z'
  },
  ...NEW_HOTELS
];

const SEED_ROOMS = [
  {
    id: 'room-101', hotelId: 'hotel-1', name: 'Premier Lake View Suite', type: 'Suite',
    basePrice: 12500, originalPrice: 15000, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 650, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Balcony', 'Lake View', 'Marble Bathtub', 'Complimentary Breakfast', 'High-speed WiFi', 'Espresso Machine'],
    totalInventory: 5, status: 'AVAILABLE'
  },
  {
    id: 'room-102', hotelId: 'hotel-1', name: 'Royal Heritage Courtyard Room', type: 'Deluxe',
    basePrice: 9800, originalPrice: 11500, bedType: '1 Queen Bed', capacityAdults: 2, capacityChildren: 0,
    sizeSqFt: 480, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    amenities: ['Courtyard View', 'Rain Shower', 'Free Breakfast', 'Mini Bar', 'Work Desk'],
    totalInventory: 8, status: 'AVAILABLE'
  },
  {
    id: 'room-103', hotelId: 'hotel-1', name: 'Maharaja Presidential Villa', type: 'Villa',
    basePrice: 26000, originalPrice: 32000, bedType: '2 King Beds', capacityAdults: 4, capacityChildren: 2,
    sizeSqFt: 1400, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Plunge Pool', 'Dedicated Butler', 'Jacuzzi', 'Panoramic View', 'All Meals Included'],
    totalInventory: 2, status: 'AVAILABLE'
  },
  {
    id: 'room-201', hotelId: 'hotel-2', name: 'Deluxe Oceanfront Cabana', type: 'Deluxe',
    basePrice: 6800, originalPrice: 8500, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 520, image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
    amenities: ['Sea View Balcony', 'Direct Beach Walkway', 'Free Cocktail Hour', 'Air Conditioning'],
    totalInventory: 6, status: 'AVAILABLE'
  },
  {
    id: 'room-202', hotelId: 'hotel-2', name: 'Tropical Garden Suite', type: 'Suite',
    basePrice: 8900, originalPrice: 10500, bedType: '1 King Bed + 1 Sofa Bed', capacityAdults: 3, capacityChildren: 1,
    sizeSqFt: 700, image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Hammock Patio', 'Outdoor Rain Shower', 'Breakfast Included', 'Mini Bar'],
    totalInventory: 4, status: 'AVAILABLE'
  },
  {
    id: 'room-301', hotelId: 'hotel-3', name: 'Executive City View Room', type: 'Executive',
    basePrice: 8200, originalPrice: 9500, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 0,
    sizeSqFt: 450, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenities: ['Skyline View', 'Smart TV 55-inch', 'Ergonomic Workstation', 'Free Breakfast', 'High-speed Fiber WiFi'],
    totalInventory: 10, status: 'AVAILABLE'
  },
  {
    id: 'room-401', hotelId: 'hotel-4', name: 'Cedar Wood Balcony Chalet', type: 'Chalet',
    basePrice: 5400, originalPrice: 6500, bedType: '1 Queen Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 400, image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    amenities: ['Himalayan View Balcony', 'Cedar Wood Interior', 'Room Heater', 'Herbal Tea Kit'],
    totalInventory: 6, status: 'AVAILABLE'
  },
  {
    id: 'room-501', hotelId: 'hotel-5', name: 'Royal Heritage Deluxe Room', type: 'Deluxe',
    basePrice: 3800, originalPrice: 4800, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 420, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Jharokha Balcony', 'Courtyard View', 'Authentic Rajasthani Furnishings', 'Free Breakfast'],
    totalInventory: 8, status: 'AVAILABLE'
  },
  {
    id: 'room-601', hotelId: 'hotel-6', name: 'Lagoon Waterfront Cottage', type: 'Cottage',
    basePrice: 7500, originalPrice: 9000, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 600, image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    amenities: ['Direct Backwater View', 'Teak Wood Deck', 'Ayurvedic Bath Amenities', 'Free Breakfast'],
    totalInventory: 5, status: 'AVAILABLE'
  },
  {
    id: 'room-701', hotelId: 'hotel-7', name: 'Smart Solo Studio', type: 'Studio',
    basePrice: 1800, originalPrice: 2200, bedType: '1 Queen Bed', capacityAdults: 2, capacityChildren: 0,
    sizeSqFt: 280, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenities: ['Smart Voice Controls', 'Ergonomic Desk', '1 Gbps WiFi', 'Air Conditioning'],
    totalInventory: 15, status: 'AVAILABLE'
  },
  {
    id: 'room-801', hotelId: 'hotel-8', name: 'Standard Express Double Room', type: 'Standard',
    basePrice: 1200, originalPrice: 1500, bedType: '1 Double Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 240, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    amenities: ['Free Airport Shuttle', 'Hot Shower 24/7', 'Air Conditioning', 'Free WiFi'],
    totalInventory: 20, status: 'AVAILABLE'
  },
  ...NEW_ROOMS
];

const SEED_COUPONS = [
  {
    id: 'cpn-1', code: 'WELCOME500', description: 'Flat ₹500 off on your first booking above ₹2,500',
    discountType: 'FLAT', discountValue: 500, minBookingAmount: 2500, maxDiscountCap: 500,
    expiresAt: '2026-12-31T23:59:59.000Z', isActive: true, usageCount: 42
  },
  {
    id: 'cpn-2', code: 'LUXURY15', description: '15% instant discount on luxury & heritage stays',
    discountType: 'PERCENT', discountValue: 15, minBookingAmount: 5000, maxDiscountCap: 2000,
    expiresAt: '2026-12-31T23:59:59.000Z', isActive: true, usageCount: 89
  },
  {
    id: 'cpn-3', code: 'WEEKEND10', description: '10% off on all weekend resort stays',
    discountType: 'PERCENT', discountValue: 10, minBookingAmount: 3000, maxDiscountCap: 1000,
    expiresAt: '2026-12-31T23:59:59.000Z', isActive: true, usageCount: 120
  }
];

const SEED_REVIEWS = [
  {
    id: 'rev-1', hotelId: 'hotel-1', userId: 'usr-customer-1',
    userName: 'Verified Guest', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest1',
    rating: 5, cleanlinessRating: 5, serviceRating: 5, locationRating: 5, valueRating: 4.8,
    title: 'Unforgettable royal experience in Udaipur',
    comment: 'The view of Lake Pichola from the Premier Suite was absolutely magical. The butler service, dinner by the lakeside, and morning yoga were world-class.',
    stayDate: '2026-02-15',
    hotelResponse: 'Thank you for your kind words! We look forward to welcoming you back to the royal palace.',
    createdAt: '2026-02-18T10:00:00.000Z'
  },
  {
    id: 'rev-2', hotelId: 'hotel-2', userId: 'usr-customer-1',
    userName: 'Verified Guest', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest2',
    rating: 5, cleanlinessRating: 5, serviceRating: 4.9, locationRating: 5, valueRating: 4.7,
    title: 'Best beach resort in North Goa!',
    comment: 'Direct beach access made our family vacation incredible. The kids loved the lagoon pool and the sunset cocktails at the beach bar were top notch.',
    stayDate: '2026-03-01',
    hotelResponse: 'Happy to know your family had a splendid time at Candolim.',
    createdAt: '2026-03-05T14:30:00.000Z'
  }
];

const SEED_BOOKINGS = [];

module.exports = {
  buildSeedUsers,
  SEED_HOTELS,
  SEED_ROOMS,
  SEED_COUPONS,
  SEED_REVIEWS,
  SEED_BOOKINGS
};
