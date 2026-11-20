const fs = require('fs');
const path = require('path');

const NEW_HOTELS = [
  // ===================== BHILWARA HOTELS =====================
  {
    id: 'hotel-bhilwara-palm',
    slug: 'the-palm-resort-and-convention-centre-bhilwara',
    ownerId: 'usr-hotelier-1',
    name: 'The Palm Resort & Convention Centre',
    tagline: 'Lush green landscaped lawns, royal banquet & outdoor swimming pool',
    category: 'Resort',
    city: 'Bhilwara',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Chittorgarh Road, Harni Kalan, Bhilwara',
    address: 'NH-79, Chittorgarh Road, Harni Kalan, Bhilwara, Rajasthan 311001',
    latitude: 25.3255,
    longitude: 74.6189,
    starRating: 4,
    rating: 4.7,
    reviewsCount: 328,
    startingPrice: 3200,
    originalPrice: 4200,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'The Palm Hospitality Bhilwara',
      accountNumber: '912020084729104',
      ifscCode: 'HDFC0002134',
      bankName: 'HDFC Bank, Bhilwara Branch',
      payoutAccountId: 'rzp_acc_palm_bhw'
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'The premier luxury resort in Bhilwara, featuring sprawling emerald lawns, an expansive swimming pool, multi-cuisine gourmet dining at Saffron Restaurant, banquet facilities, and contemporary royal suites.',
    amenities: [
      'Swimming Pool', 'Free High-Speed WiFi', 'Multi-Cuisine Restaurant', 'Sprawling Garden Lawns',
      'Complimentary Breakfast', 'Free Valet Parking', 'Fitness Center', '24/7 Room Service'
    ],
    policies: {
      checkIn: '14:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 24 hours before check-in.',
      petPolicy: 'Pet friendly in garden suites',
      childPolicy: 'Children under 6 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-02-01T00:00:00.000Z'
  },
  {
    id: 'hotel-bhilwara-mewar',
    slug: 'hotel-mewar-grand-and-royal-suites-bhilwara',
    ownerId: 'usr-hotelier-2',
    name: 'Hotel Mewar Grand & Royal Suites',
    tagline: 'Central business luxury, elegant suites & authentic Mewari cuisine',
    category: 'City Center',
    city: 'Bhilwara',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Station Road, Bhopalganj, Bhilwara',
    address: 'Station Road, Bhopalganj, Bhilwara, Rajasthan 311001',
    latitude: 25.3468,
    longitude: 74.6366,
    starRating: 4,
    rating: 4.6,
    reviewsCount: 245,
    startingPrice: 2400,
    originalPrice: 3100,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Mewar Grand Stays Bhilwara',
      accountNumber: '501002948201948',
      ifscCode: 'ICIC0000842',
      bankName: 'ICICI Bank, Bhopalganj Bhilwara',
      payoutAccountId: 'rzp_acc_mewar_bhw'
    },
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Centrally positioned in the commercial heart of the Textile City. Offers spacious air-conditioned suites, conference spaces, multi-cuisine restaurant serving traditional dal baati churma and continental fare.',
    amenities: [
      'Central City Location', 'Free WiFi', 'Mewari Fine Dining', 'Conference & Boardroom',
      'Complimentary Breakfast', 'Airport / Station Shuttle', '24-hour Front Desk'
    ],
    policies: {
      checkIn: '13:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 12 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 8 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-02-05T00:00:00.000Z'
  },
  {
    id: 'hotel-bhilwara-ranbanka',
    slug: 'ranbanka-heritage-palace-bhilwara',
    ownerId: 'usr-hotelier-1',
    name: 'Ranbanka Heritage Palace Bhilwara',
    tagline: 'Timeless Rajasthani courtyard architecture, jharokha balconies & folk music',
    category: 'Heritage',
    city: 'Bhilwara',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Mandal Road, Pur Road Crossing, Bhilwara',
    address: 'Near Pur Road Crossing, Mandal Road, Bhilwara, Rajasthan 311001',
    latitude: 25.3582,
    longitude: 74.6214,
    starRating: 4,
    rating: 4.8,
    reviewsCount: 192,
    startingPrice: 3800,
    originalPrice: 4800,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Ranbanka Heritage Stays',
      accountNumber: '0004928172948',
      ifscCode: 'UTIB0001094',
      bankName: 'Axis Bank, Bhilwara',
      payoutAccountId: 'rzp_acc_ranbanka_bhw'
    },
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Experience traditional Rajasthani royalty with carved stone jharokhas, central courtyard fountains, candle-lit terrace dinners, and authentic cultural performances under starry desert skies.',
    amenities: [
      'Heritage Architecture', 'Courtyard Swimming Pool', 'Folk Dance Nights', 'Rooftop Bar & Grill',
      'Free Breakfast', 'Ayurvedic Massage Care', 'Free WiFi'
    ],
    policies: {
      checkIn: '14:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 48 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 6 stay free'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-02-10T00:00:00.000Z'
  },
  {
    id: 'hotel-bhilwara-cityclub',
    slug: 'city-club-continental-boutique-bhilwara',
    ownerId: 'usr-hotelier-2',
    name: 'City Club Continental Boutique Stays',
    tagline: 'Modern smart rooms, fiber WiFi & all-day gourmet cafe',
    category: 'Budget',
    city: 'Bhilwara',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Subhash Nagar, Bhilwara',
    address: 'Opposite City Park, Subhash Nagar, Bhilwara, Rajasthan 311001',
    latitude: 25.3392,
    longitude: 74.6441,
    starRating: 3,
    rating: 4.5,
    reviewsCount: 178,
    startingPrice: 1650,
    originalPrice: 2100,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'City Club Hospitality',
      accountNumber: '382910482910',
      ifscCode: 'SBIN0003921',
      bankName: 'SBI, Subhash Nagar Bhilwara',
      payoutAccountId: 'rzp_acc_cityclub_bhw'
    },
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Modern and affordable boutique comfort for business travelers and tourists exploring Rajasthan textile heritage. Featuring plush orthopedic bedding, high-speed WiFi, smart LED TVs, and quick room service.',
    amenities: [
      'High-Speed WiFi', 'All-Day Cafe', 'Air Conditioning', 'Free Parking', 'Doctor on Call', 'Express Check-In'
    ],
    policies: {
      checkIn: '12:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 6 hours before check-in.',
      petPolicy: 'Pet friendly',
      childPolicy: 'Children under 10 stay free'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-02-12T00:00:00.000Z'
  },

  // ===================== JAIPUR HOTELS =====================
  {
    id: 'hotel-jaipur-rambagh',
    slug: 'rambagh-fort-palace-royal-sanctuary-jaipur',
    ownerId: 'usr-hotelier-1',
    name: 'Rambagh Fort Palace & Royal Sanctuary',
    tagline: 'Former residence of the Maharaja with 47 acres of tranquil Mughal gardens',
    category: 'Luxury',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Bhawani Singh Road, C-Scheme, Jaipur',
    address: 'Bhawani Singh Road, Rambagh Circle, Jaipur, Rajasthan 302005',
    latitude: 26.8967,
    longitude: 75.8083,
    starRating: 5,
    rating: 4.96,
    reviewsCount: 1420,
    startingPrice: 16500,
    originalPrice: 21000,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Rambagh Palace Group Ltd',
      accountNumber: '11002948201948',
      ifscCode: 'HDFC0000045',
      bankName: 'HDFC Bank, C-Scheme Jaipur',
      payoutAccountId: 'rzp_acc_rambagh_jpr'
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Often called the Jewel of Jaipur. Grand palace architecture, marble corridors, resident dancing peacocks, historic dining halls, polo bar, and world-renowned Jiva Grande Spa therapies.',
    amenities: [
      'Palace Architecture', 'Outdoor & Indoor Heated Pools', 'Jiva Grande Spa', 'Fine Dining Suvarna Mahal',
      'Polo Bar & Lounge', 'Vintage Car Chauffeur', '24/7 Butler Service', 'Free WiFi'
    ],
    policies: {
      checkIn: '14:00', checkOut: '12:00',
      cancellation: 'Free cancellation up to 48 hours before check-in.',
      petPolicy: 'Pet friendly in garden pavilions',
      childPolicy: 'Children under 6 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-02-14T00:00:00.000Z'
  },
  {
    id: 'hotel-jaipur-pinkcity',
    slug: 'the-pink-city-grand-fort-and-suites-jaipur',
    ownerId: 'usr-hotelier-2',
    name: 'The Pink City Grand Fort & Suites',
    tagline: 'Panoramic Aravalli hill views, infinity pool & royal Rajputana feasts',
    category: 'Heritage',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Amer Fort Road, Jaipur',
    address: 'Kukas Amer Road, Near Amber Fort, Jaipur, Rajasthan 302028',
    latitude: 27.0125,
    longitude: 75.8924,
    starRating: 5,
    rating: 4.88,
    reviewsCount: 540,
    startingPrice: 5800,
    originalPrice: 7500,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Pink City Grand Hospitality',
      accountNumber: '50100382910482',
      ifscCode: 'ICIC0001029',
      bankName: 'ICICI Bank, Amer Jaipur',
      payoutAccountId: 'rzp_acc_pinkcity_jpr'
    },
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Perched overlooking the Aravalli hills and Amer Fort. Highlights include royal sandstone terraces, temperature-controlled infinity pool, evening puppet and Kalbeliya folk dances, and authentic royal thaali.',
    amenities: [
      'Aravalli Hill Views', 'Infinity Pool', 'Rooftop Bar', 'Complimentary Breakfast',
      'Cultural Folk Shows', 'Free WiFi', 'Ayurvedic Wellness Spa'
    ],
    policies: {
      checkIn: '13:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 24 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 8 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-02-16T00:00:00.000Z'
  },
  {
    id: 'hotel-jaipur-radisson',
    slug: 'radisson-blu-city-center-jaipur',
    ownerId: 'usr-hotelier-1',
    name: 'Radisson Blu City Center Jaipur',
    tagline: 'Contemporary luxury 5 minutes from Jaipur International Airport',
    category: 'City Center',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Tonk Road, Durgapura, Jaipur',
    address: 'Plot No. 5-6, Airport Plaza, Tonk Road, Jaipur, Rajasthan 302018',
    latitude: 26.8524,
    longitude: 75.7951,
    starRating: 4,
    rating: 4.74,
    reviewsCount: 890,
    startingPrice: 4200,
    originalPrice: 5400,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Radisson Blu Jaipur Ops',
      accountNumber: '920182749201948',
      ifscCode: 'UTIB0000492',
      bankName: 'Axis Bank, Tonk Road Jaipur',
      payoutAccountId: 'rzp_acc_radisson_jpr'
    },
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Modern luxury for vacationers and corporate travelers. Features a rooftop pool overlooking the Pink City, 24-hour fitness center, steam and sauna, The Great Kabab Factory, and high-speed fiber internet.',
    amenities: [
      'Rooftop Pool', 'Airport Shuttle', 'Free High-Speed WiFi', 'Steam & Sauna',
      'Kabab Factory Restaurant', 'Fitness Center', 'Executive Club Lounge'
    ],
    policies: {
      checkIn: '14:00', checkOut: '12:00',
      cancellation: 'Free cancellation up to 24 hours prior to check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 12 stay free'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-02-18T00:00:00.000Z'
  },

  // ===================== UDAIPUR HOTELS =====================
  {
    id: 'hotel-udaipur-tajlake',
    slug: 'taj-lake-sanctuary-palace-udaipur',
    ownerId: 'usr-hotelier-1',
    name: 'Taj Lake Sanctuary Palace Udaipur',
    tagline: 'Floating marble palace in the middle of Lake Pichola with royal speedboats',
    category: 'Luxury',
    city: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Lake Pichola Island, Udaipur',
    address: 'P.O. Box 5, Lake Pichola, Udaipur, Rajasthan 313001',
    latitude: 24.5755,
    longitude: 73.6798,
    starRating: 5,
    rating: 4.98,
    reviewsCount: 2150,
    startingPrice: 18500,
    originalPrice: 24000,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Taj Lake Palace Corp',
      accountNumber: '00039281948291',
      ifscCode: 'HDFC0000091',
      bankName: 'HDFC Bank, City Palace Udaipur',
      payoutAccountId: 'rzp_acc_tajlake_udp'
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Built in 1746 by Maharana Jagat Singh II as a royal summer palace. An iconic white marble island palace rising like a mirage from the blue waters of Lake Pichola with 360 degree lake and City Palace views.',
    amenities: [
      'Private Speedboat Arrival', 'Lake Pichola 360° Views', 'Jiva Spa Boat', 'Rooftop Fine Dining',
      'Royal Butler Service', 'Heated Swimming Pool', 'Complimentary Champagne Breakfast', 'Free WiFi'
    ],
    policies: {
      checkIn: '15:00', checkOut: '12:00',
      cancellation: 'Free cancellation up to 72 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 6 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-02-20T00:00:00.000Z'
  },
  {
    id: 'hotel-udaipur-leela',
    slug: 'the-leela-waterfront-palace-udaipur',
    ownerId: 'usr-hotelier-2',
    name: 'The Leela Waterfront Palace & Villas Udaipur',
    tagline: 'Grand Mewari architecture, lakefront infinity pool & Sheesh Mahal dining',
    category: 'Luxury',
    city: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Lake Pichola Waterfront, Udaipur',
    address: 'Lake Pichola, Chandpole, Udaipur, Rajasthan 313001',
    latitude: 24.5821,
    longitude: 73.6738,
    starRating: 5,
    rating: 4.93,
    reviewsCount: 1670,
    startingPrice: 14200,
    originalPrice: 18500,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'The Leela Palaces Udaipur',
      accountNumber: '50100482918291',
      ifscCode: 'ICIC0000284',
      bankName: 'ICICI Bank, Udaipur',
      payoutAccountId: 'rzp_acc_leela_udp'
    },
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Exemplifying Rajasthani grandeur on the banks of Lake Pichola. Breathtaking views of the heritage City Palace, royal Rajasthani music, open-air fine dining under starlit skies at Sheesh Mahal, and holistic spa retreats.',
    amenities: [
      'Lakefront Infinity Pool', 'Sheesh Mahal Dining', 'ESPA Ayurvedic Spa', 'Heritage Courtyard',
      'Complimentary Boat Tour', 'Free High-Speed WiFi', 'Valet Parking'
    ],
    policies: {
      checkIn: '14:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 48 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 8 stay free'
    },
    featured: true,
    status: 'ACTIVE',
    createdAt: '2026-02-22T00:00:00.000Z'
  },
  {
    id: 'hotel-udaipur-fatehgarh',
    slug: 'fateh-garh-heritage-fort-sanctuary-udaipur',
    ownerId: 'usr-hotelier-1',
    name: 'Fateh Garh Heritage Fort & Sanctuary',
    tagline: 'Hilltop eco-fort, vintage automobile museum & 360° sunset vistas',
    category: 'Heritage',
    city: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Sisarma Hills, Udaipur',
    address: 'Sisarma, Udaipur, Rajasthan 313001',
    latitude: 24.5512,
    longitude: 73.6543,
    starRating: 4,
    rating: 4.81,
    reviewsCount: 620,
    startingPrice: 6400,
    originalPrice: 8200,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Fateh Garh Hospitality',
      accountNumber: '920194829182',
      ifscCode: 'UTIB0000829',
      bankName: 'Axis Bank, Chetak Circle Udaipur',
      payoutAccountId: 'rzp_acc_fatehgarh_udp'
    },
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Perched on a serene hill in Sisarma, Fateh Garh is a pioneer in sustainable heritage conservation. Features dramatic views across Udaipur valley, two infinity pools, vintage car collection, and rooftop stargazing dining.',
    amenities: [
      'Panoramic Hilltop Views', 'Two Infinity Pools', 'Vintage Car Museum', 'Sunset Terrace Dining',
      'Free Breakfast', 'Eco-friendly Heritage Architecture', 'Free WiFi'
    ],
    policies: {
      checkIn: '13:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 48 hours before check-in.',
      petPolicy: 'Pet friendly in courtyard suites',
      childPolicy: 'Children under 6 stay free'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-02-24T00:00:00.000Z'
  },
  {
    id: 'hotel-udaipur-radisson',
    slug: 'radisson-blu-udaipur-palace-resort-and-spa',
    ownerId: 'usr-hotelier-2',
    name: 'Radisson Blu Udaipur Palace Resort & Spa',
    tagline: 'Multi-tiered cascading swimming pool overlooking tranquil Fateh Sagar Lake',
    category: 'Resort',
    city: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    locality: 'Fateh Sagar Lake, Udaipur',
    address: 'B-1, Ambamata Scheme, Opp. Aravali Hospital, Fateh Sagar, Udaipur, Rajasthan 313001',
    latitude: 24.5982,
    longitude: 73.6687,
    starRating: 5,
    rating: 4.76,
    reviewsCount: 980,
    startingPrice: 5200,
    originalPrice: 6800,
    currency: '₹',
    commissionRate: 15.0,
    isVerified: true,
    verificationStatus: 'APPROVED',
    bankAccount: {
      accountHolderName: 'Radisson Blu Udaipur Resort',
      accountNumber: '38291048291048',
      ifscCode: 'SBIN0001824',
      bankName: 'SBI, Ambamata Udaipur',
      payoutAccountId: 'rzp_acc_radisson_udp'
    },
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Set against the backdrop of the Aravalli mountains and Fateh Sagar Lake. Boasts a massive two-tier outdoor pool, upscale pan-Asian and Indian restaurants, nightclub lounge, and lush wedding lawns.',
    amenities: [
      'Two-Tier Cascading Pool', 'Fateh Sagar Lake View', 'Luxury Spa & Sauna', 'Pan-Asian & Indian Dining',
      'Free WiFi', 'Airport Shuttle', 'Kids Play Zone'
    ],
    policies: {
      checkIn: '14:00', checkOut: '11:00',
      cancellation: 'Free cancellation up to 24 hours before check-in.',
      petPolicy: 'Not allowed',
      childPolicy: 'Children under 10 stay free'
    },
    featured: false,
    status: 'ACTIVE',
    createdAt: '2026-02-26T00:00:00.000Z'
  }
];

const NEW_ROOMS = [
  // --- Bhilwara Palm Resort Rooms ---
  {
    id: 'room-bhw-palm-101', hotelId: 'hotel-bhilwara-palm', name: 'Executive Garden View Room', type: 'Deluxe',
    basePrice: 3200, originalPrice: 4200, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 420, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Garden View Balcony', 'Free Buffet Breakfast', 'Rain Shower', 'High-Speed WiFi', 'Tea/Coffee Maker'],
    totalInventory: 10, status: 'AVAILABLE'
  },
  {
    id: 'room-bhw-palm-102', hotelId: 'hotel-bhilwara-palm', name: 'Royal Palm Pool Suite', type: 'Suite',
    basePrice: 4800, originalPrice: 6200, bedType: '1 King Bed + Living Area', capacityAdults: 3, capacityChildren: 1,
    sizeSqFt: 620, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenities: ['Poolside View', 'Separate Living Room', 'Bathtub & Rain Shower', 'Complimentary Breakfast', 'Mini Bar'],
    totalInventory: 6, status: 'AVAILABLE'
  },

  // --- Bhilwara Mewar Grand Rooms ---
  {
    id: 'room-bhw-mewar-101', hotelId: 'hotel-bhilwara-mewar', name: 'Deluxe City View Room', type: 'Deluxe',
    basePrice: 2400, originalPrice: 3100, bedType: '1 Queen Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 360, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    amenities: ['City Center View', 'High-Speed WiFi', 'Air Conditioning', 'Free Breakfast', 'Smart LED TV'],
    totalInventory: 12, status: 'AVAILABLE'
  },
  {
    id: 'room-bhw-mewar-102', hotelId: 'hotel-bhilwara-mewar', name: 'Mewar Royal Executive Suite', type: 'Suite',
    basePrice: 3600, originalPrice: 4500, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 520, image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    amenities: ['Spacious Lounge Area', 'Ergonomic Work Desk', 'Express Room Service', 'Complimentary Breakfast'],
    totalInventory: 5, status: 'AVAILABLE'
  },

  // --- Bhilwara Ranbanka Palace Rooms ---
  {
    id: 'room-bhw-ranbanka-101', hotelId: 'hotel-bhilwara-ranbanka', name: 'Courtyard Heritage Chamber', type: 'Heritage',
    basePrice: 3800, originalPrice: 4800, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 0,
    sizeSqFt: 440, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Carved Jharokha Balcony', 'Fountain Courtyard View', 'Authentic Rajput Furnishings', 'Free Breakfast'],
    totalInventory: 8, status: 'AVAILABLE'
  },
  {
    id: 'room-bhw-ranbanka-102', hotelId: 'hotel-bhilwara-ranbanka', name: 'Maharaja Royal Suite', type: 'Suite',
    basePrice: 5600, originalPrice: 7000, bedType: '1 Four-Poster King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 680, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    amenities: ['Four-Poster Royal Bed', 'Deep Soaking Tub', 'Complimentary High Tea', 'Personal Butler Service'],
    totalInventory: 4, status: 'AVAILABLE'
  },

  // --- Bhilwara City Club Rooms ---
  {
    id: 'room-bhw-cityclub-101', hotelId: 'hotel-bhilwara-cityclub', name: 'Smart Comfort King Room', type: 'Standard',
    basePrice: 1650, originalPrice: 2100, bedType: '1 Queen Bed', capacityAdults: 2, capacityChildren: 0,
    sizeSqFt: 280, image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    amenities: ['1 Gbps Fiber WiFi', 'Smart LED TV', 'Air Conditioning', 'Orthopedic Mattress', 'Doctor on Call'],
    totalInventory: 15, status: 'AVAILABLE'
  },

  // --- Jaipur Rambagh Fort Palace Rooms ---
  {
    id: 'room-jpr-rambagh-101', hotelId: 'hotel-jaipur-rambagh', name: 'Palace Garden View Suite', type: 'Suite',
    basePrice: 16500, originalPrice: 21000, bedType: '1 King Bed', capacityAdults: 3, capacityChildren: 1,
    sizeSqFt: 750, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Peacock Garden Balcony', 'Italian Marble Bathroom', '24/7 Butler Service', 'Complimentary Champagne Breakfast'],
    totalInventory: 5, status: 'AVAILABLE'
  },
  {
    id: 'room-jpr-rambagh-102', hotelId: 'hotel-jaipur-rambagh', name: 'Grand Royal Maharani Suite', type: 'Luxury Suite',
    basePrice: 28000, originalPrice: 35000, bedType: '1 Maharaja King Bed', capacityAdults: 3, capacityChildren: 1,
    sizeSqFt: 1100, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Private Courtyard Terrace', 'Jaccuzi & Clawfoot Tub', 'Vintage Car Airport Pick-up', 'All-Inclusive Dining'],
    totalInventory: 3, status: 'AVAILABLE'
  },

  // --- Jaipur Pink City Grand Fort Rooms ---
  {
    id: 'room-jpr-pinkcity-101', hotelId: 'hotel-jaipur-pinkcity', name: 'Aravalli Fort View Deluxe Room', type: 'Deluxe',
    basePrice: 5800, originalPrice: 7500, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 460, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenities: ['Amer Fort View', 'Private Balcony', 'Free Breakfast Buffet', 'Rain Shower', 'High-Speed WiFi'],
    totalInventory: 8, status: 'AVAILABLE'
  },
  {
    id: 'room-jpr-pinkcity-102', hotelId: 'hotel-jaipur-pinkcity', name: 'Rajputana Heritage Suite', type: 'Suite',
    basePrice: 8500, originalPrice: 10500, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 650, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    amenities: ['Panoramic Sunset View', 'Deep Marble Bathtub', 'Evening Folk Dance Pass', 'Mini Bar'],
    totalInventory: 5, status: 'AVAILABLE'
  },

  // --- Jaipur Radisson Blu Rooms ---
  {
    id: 'room-jpr-radisson-101', hotelId: 'hotel-jaipur-radisson', name: 'Superior City View King Room', type: 'Executive',
    basePrice: 4200, originalPrice: 5400, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 410, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    amenities: ['City Skyline View', 'Ergonomic Work Desk', 'Rooftop Pool Access', 'Complimentary Breakfast', 'Free WiFi'],
    totalInventory: 12, status: 'AVAILABLE'
  },

  // --- Udaipur Taj Lake Palace Rooms ---
  {
    id: 'room-udp-tajlake-101', hotelId: 'hotel-udaipur-tajlake', name: 'Luxury Lake Pichola View Room', type: 'Deluxe',
    basePrice: 18500, originalPrice: 24000, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 580, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    amenities: ['Direct Lake Pichola View', 'Speedboat Transfer', 'Marble Bath with Tub', 'Champagne Breakfast', '24/7 Butler'],
    totalInventory: 6, status: 'AVAILABLE'
  },
  {
    id: 'room-udp-tajlake-102', hotelId: 'hotel-udaipur-tajlake', name: 'Historical Royal Palace Suite', type: 'Royal Suite',
    basePrice: 32000, originalPrice: 42000, bedType: '1 Maharaja King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 950, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    amenities: ['Historic Frescoes & Jharokha', 'City Palace Panorama', 'Private Jiva Boat Experience', 'All Meals Included'],
    totalInventory: 2, status: 'AVAILABLE'
  },

  // --- Udaipur The Leela Rooms ---
  {
    id: 'room-udp-leela-101', hotelId: 'hotel-udaipur-leela', name: 'Grand Heritage Lake View Room', type: 'Deluxe',
    basePrice: 14200, originalPrice: 18500, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 550, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    amenities: ['Unobstructed Lake Pichola Panorama', 'Mewari Silk Furnishings', 'Marble Bathtub', 'Gourmet Breakfast'],
    totalInventory: 8, status: 'AVAILABLE'
  },
  {
    id: 'room-udp-leela-102', hotelId: 'hotel-udaipur-leela', name: 'Royal Waterfront Suite with Plunge Pool', type: 'Suite',
    basePrice: 24500, originalPrice: 31000, bedType: '1 King Bed', capacityAdults: 3, capacityChildren: 1,
    sizeSqFt: 880, image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    amenities: ['Private Waterfront Plunge Pool', 'Personal Butler', 'Sheesh Mahal Dining Credit', 'Complimentary Champagne'],
    totalInventory: 3, status: 'AVAILABLE'
  },

  // --- Udaipur Fateh Garh Rooms ---
  {
    id: 'room-udp-fatehgarh-101', hotelId: 'hotel-udaipur-fatehgarh', name: 'Renaissance Hilltop Chamber', type: 'Deluxe',
    basePrice: 6400, originalPrice: 8200, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 460, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    amenities: ['Valley & Mountain Views', 'Infinity Pool Access', 'Vintage Museum Tour', 'Complimentary Breakfast'],
    totalInventory: 7, status: 'AVAILABLE'
  },

  // --- Udaipur Radisson Blu Rooms ---
  {
    id: 'room-udp-radisson-101', hotelId: 'hotel-udaipur-radisson', name: 'Superior Fateh Sagar Lake View Room', type: 'Superior',
    basePrice: 5200, originalPrice: 6800, bedType: '1 King Bed', capacityAdults: 2, capacityChildren: 1,
    sizeSqFt: 430, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    amenities: ['Fateh Sagar Lake View Balcony', 'Free High-Speed WiFi', 'Rain Shower', 'Cascading Pool Access', 'Buffet Breakfast'],
    totalInventory: 10, status: 'AVAILABLE'
  }
];

module.exports = { NEW_HOTELS, NEW_ROOMS };
