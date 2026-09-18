// MakeMyTrip-grade Hotel & Room Catalog with dynamic local storage support

export const DEFAULT_HOTELS = [
  {
    id: "hotel-1",
    name: "The Oberoi Grand Palace & Spa",
    category: "Luxury Stays",
    city: "Udaipur",
    locality: "Lake Pichola, Haridas Ji Ki Magri",
    distance: "1.8 km from City Palace",
    rating: 4.9,
    ratingText: "Exceptional",
    reviewsCount: 1420,
    startingPrice: 12500,
    originalPrice: 16500,
    discountPercent: 24,
    currency: "₹",
    isMMTAssured: true,
    freeCancellation: true,
    coupleFriendly: true,
    breakfastIncluded: true,
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Nestled along the serene shores of Lake Pichola, The Oberoi Grand Palace offers opulent royal suites, an infinity pool overlooking the water, bespoke Ayurvedic spa therapies, and Michelin-inspired fine dining.",
    highlights: ["Lake Facing Pool", "Ayurvedic Royal Spa", "Fine Dining by Pichola", "24/7 Butler Service", "Complimentary High Tea"],
    amenities: ["Free WiFi", "Infinity Pool", "Luxury Spa", "Fine Dining", "Valet Parking", "Fitness Center", "Airport Shuttle", "Lake View"],
    featured: true,
    rooms: [
      {
        id: "room-101",
        name: "Premier Lake View Suite with Balcony",
        type: "Suite",
        price: 12500,
        originalPrice: 16500,
        bedType: "1 King Bed",
        capacity: "2 Adults, 1 Child",
        size: "650 sq ft",
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Free Buffet Breakfast & Afternoon High Tea Included",
        cancellationPolicy: "Free Cancellation till 24 hrs before check-in",
        amenities: ["Private Balcony", "Lake View", "Marble Bathtub", "Complimentary Breakfast", "High-speed WiFi", "Espresso Machine"],
        availableCount: 4
      },
      {
        id: "room-102",
        name: "Royal Heritage Courtyard Room",
        type: "Deluxe",
        price: 9800,
        originalPrice: 12500,
        bedType: "1 Queen Bed",
        capacity: "2 Adults",
        size: "480 sq ft",
        image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Room with Breakfast Included",
        cancellationPolicy: "Free Cancellation till 48 hrs before check-in",
        amenities: ["Courtyard View", "Rain Shower", "Free Breakfast", "Mini Bar", "Work Desk"],
        availableCount: 6
      },
      {
        id: "room-103",
        name: "Maharaja Presidential Pool Villa",
        type: "Villa",
        price: 26000,
        originalPrice: 34000,
        bedType: "2 King Beds",
        capacity: "4 Adults, 2 Children",
        size: "1400 sq ft",
        image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
        mealPlan: "All Meals Included + Private Chef",
        cancellationPolicy: "Non-Refundable Special Deal",
        amenities: ["Private Plunge Pool", "Dedicated Butler", "Jacuzzi", "Panoramic View", "All Meals Included"],
        availableCount: 2
      }
    ]
  },
  {
    id: "hotel-2",
    name: "Azure Bay Beachfront Resort & Spa",
    category: "Beachfront",
    city: "Goa",
    locality: "Candolim Beach Road, North Goa",
    distance: "Direct Beach Access · 200m from Beach",
    rating: 4.8,
    ratingText: "Superb",
    reviewsCount: 1890,
    startingPrice: 6800,
    originalPrice: 9200,
    discountPercent: 26,
    currency: "₹",
    isMMTAssured: true,
    freeCancellation: true,
    coupleFriendly: true,
    breakfastIncluded: true,
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Step straight from your private cabana onto the golden sands of Candolim. Enjoy beachfront sunset cocktails, water sports center, lagoon swimming pool, and live beach lounge music.",
    highlights: ["Direct Beach Walkway", "Sunset Beach Bar", "Lagoon Pool with Jacuzzi", "Water Sports Desk", "Live DJ Nights"],
    amenities: ["Beach Access", "Free WiFi", "Swimming Pool", "Beach Bar", "Free Breakfast", "Water Sports", "Spa"],
    featured: true,
    rooms: [
      {
        id: "room-201",
        name: "Deluxe Oceanfront Cabana Room",
        type: "Deluxe",
        price: 6800,
        originalPrice: 9200,
        bedType: "1 King Bed",
        capacity: "2 Adults",
        size: "520 sq ft",
        image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Free Breakfast & Evening Sunset Cocktail",
        cancellationPolicy: "Free Cancellation till 24 hrs before check-in",
        amenities: ["Sea View Balcony", "Direct Beach Walkway", "Free Cocktail Hour", "Air Conditioning"],
        availableCount: 5
      },
      {
        id: "room-202",
        name: "Tropical Garden Jacuzzi Suite",
        type: "Suite",
        price: 8900,
        originalPrice: 11500,
        bedType: "1 King Bed + 1 Sofa Bed",
        capacity: "3 Adults",
        size: "700 sq ft",
        image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Breakfast & Dinner Included (Half Board)",
        cancellationPolicy: "Free Cancellation till 48 hrs before check-in",
        amenities: ["Private Hammock Patio", "Outdoor Rain Shower", "Breakfast Included", "Mini Bar"],
        availableCount: 3
      }
    ]
  },
  {
    id: "hotel-3",
    name: "The Skyline Metropolitan Grand Hotel",
    category: "City Center",
    city: "Mumbai",
    locality: "Bandra Kurla Complex (BKC), Bandra East",
    distance: "In Financial District · 6 km from Airport",
    rating: 4.7,
    ratingText: "Very Good",
    reviewsCount: 2310,
    startingPrice: 8200,
    originalPrice: 10800,
    discountPercent: 24,
    currency: "₹",
    isMMTAssured: true,
    freeCancellation: true,
    coupleFriendly: true,
    breakfastIncluded: false,
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "An ultra-modern architectural icon in the heart of BKC. Featuring rooftop infinity pool, 360-degree skyline views, executive lounge, state-of-the-art gym, and business conference suites.",
    highlights: ["Rooftop Sky Lounge", "Infinity Edge Glass Pool", "Express Airport Shuttle", "24hr Business Lounge"],
    amenities: ["Free WiFi", "Rooftop Pool", "Fitness Center", "Meeting Rooms", "Fine Dining", "Concierge", "EV Charging"],
    featured: false,
    rooms: [
      {
        id: "room-301",
        name: "Executive Skyline Business Room",
        type: "Executive",
        price: 8200,
        originalPrice: 10800,
        bedType: "1 King Bed",
        capacity: "2 Adults",
        size: "450 sq ft",
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Room Only · Add Breakfast @ ₹650",
        cancellationPolicy: "Free Cancellation till 24 hrs before check-in",
        amenities: ["Skyline View", "Smart TV 55-inch", "Ergonomic Workstation", "Free Breakfast", "High-speed Fiber WiFi"],
        availableCount: 8
      },
      {
        id: "room-302",
        name: "Grand Horizon Panorama Suite",
        type: "Suite",
        price: 14500,
        originalPrice: 18000,
        bedType: "1 Super King Bed",
        capacity: "2 Adults, 1 Child",
        size: "820 sq ft",
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Executive Lounge Access & Buffet Breakfast",
        cancellationPolicy: "Free Cancellation till 48 hrs before check-in",
        amenities: ["Corner Glass Facade", "Deep Soaking Tub", "Lounge Access", "Complimentary Airport Transfer"],
        availableCount: 3
      }
    ]
  },
  {
    id: "hotel-4",
    name: "Pinecrest Alpine Eco Resort & Spa",
    category: "Mountain Escapes",
    city: "Manali",
    locality: "Old Manali Hills, Log Huts Area",
    distance: "1.2 km from Mall Road · Valley View",
    rating: 4.9,
    ratingText: "Exceptional",
    reviewsCount: 940,
    startingPrice: 5400,
    originalPrice: 7500,
    discountPercent: 28,
    currency: "₹",
    isMMTAssured: true,
    freeCancellation: true,
    coupleFriendly: true,
    breakfastIncluded: true,
    images: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    description: "Surrounded by cedar forests and snow-dusted Himalayan peaks. Features cozy cedar wood chalets, wood-burning fireplaces, bonfire nights, guided treks, and warm mountain hospitality.",
    highlights: ["Snow Peak Balcony Views", "Evening Bonfire & BBQ", "Central Heating", "Mountain Trek Guide"],
    amenities: ["Mountain View", "Fireplace", "Free WiFi", "Bonfire Night", "In-house Cafe", "Free Breakfast", "Heated Rooms"],
    featured: true,
    rooms: [
      {
        id: "room-401",
        name: "Cedar Wood Balcony Chalet",
        type: "Chalet",
        price: 5400,
        originalPrice: 7500,
        bedType: "1 Queen Bed",
        capacity: "2 Adults",
        size: "400 sq ft",
        image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Complimentary Mountain Breakfast Included",
        cancellationPolicy: "Free Cancellation till 24 hrs before check-in",
        amenities: ["Himalayan View Balcony", "Cedar Wood Interior", "Room Heater", "Herbal Tea Kit"],
        availableCount: 4
      },
      {
        id: "room-402",
        name: "Himalayan Duplex Family Villa",
        type: "Villa",
        price: 11200,
        originalPrice: 14500,
        bedType: "2 Queen Beds",
        capacity: "4 Adults, 2 Children",
        size: "950 sq ft",
        image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        mealPlan: "Breakfast & Candlelight Dinner Included",
        cancellationPolicy: "Free Cancellation till 48 hrs before check-in",
        amenities: ["2-Storey Chalet", "Fireplace Lounge", "Mountain Deck", "Breakfast & Dinner Included"],
        availableCount: 2
      }
    ]
  }
];

export const MMT_COUPONS = [
  { code: "MMT20", discount: 0.20, title: "Flat 20% OFF", subtitle: "On Luxury Stays & Resorts with Instant Bank Offer" },
  { code: "LUXURY25", discount: 0.25, title: "Special 25% OFF", subtitle: "Valid on Oberoi, Azure Bay and Villas" },
  { code: "WELCOME500", discount: 0.15, title: "15% Extra Savings", subtitle: "First time mobile app booking voucher" }
];

export const DB = {
  STORAGE_KEY_HOTELS: "mmt_hotel_factories_v2",
  STORAGE_KEY_BOOKINGS: "mmt_bookings_v2",
  STORAGE_KEY_FAVORITES: "mmt_favs_v2",

  getHotels() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_HOTELS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to load hotels:", e);
    }
    this.saveHotels(DEFAULT_HOTELS);
    return JSON.parse(JSON.stringify(DEFAULT_HOTELS));
  },

  saveHotels(hotels) {
    try {
      localStorage.setItem(this.STORAGE_KEY_HOTELS, JSON.stringify(hotels));
    } catch (e) {
      console.error("Failed to save hotels:", e);
    }
  },

  addHotel(hotelData) {
    const hotels = this.getHotels();
    const newHotel = {
      id: "hotel-" + Date.now(),
      name: hotelData.name,
      category: hotelData.category || "Luxury Stays",
      city: hotelData.city,
      locality: hotelData.locality || hotelData.address || "City Center",
      distance: hotelData.distance || "Central Location",
      rating: parseFloat(hotelData.rating) || 4.8,
      ratingText: parseFloat(hotelData.rating) >= 4.8 ? "Exceptional" : "Superb",
      reviewsCount: Math.floor(100 + Math.random() * 500),
      startingPrice: parseFloat(hotelData.startingPrice) || 6000,
      originalPrice: Math.round((parseFloat(hotelData.startingPrice) || 6000) * 1.25),
      discountPercent: 20,
      currency: "₹",
      isMMTAssured: true,
      freeCancellation: true,
      coupleFriendly: true,
      breakfastIncluded: true,
      images: hotelData.images && hotelData.images.length > 0 
        ? hotelData.images 
        : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"],
      description: hotelData.description || "A luxury hospitality property offering first-class comfort and service.",
      highlights: hotelData.highlights || ["MMT Assured Quality", "Free High Speed WiFi", "24/7 Room Service"],
      amenities: hotelData.amenities || ["Free WiFi", "Air Conditioning", "Swimming Pool", "Restaurant"],
      featured: true,
      rooms: hotelData.rooms || []
    };

    if (hotelData.initialRoom && hotelData.initialRoom.name) {
      newHotel.rooms.push({
        id: "room-" + Date.now(),
        name: hotelData.initialRoom.name,
        type: hotelData.initialRoom.type || "Deluxe",
        price: parseFloat(hotelData.initialRoom.price) || newHotel.startingPrice,
        originalPrice: Math.round((parseFloat(hotelData.initialRoom.price) || newHotel.startingPrice) * 1.25),
        bedType: hotelData.initialRoom.bedType || "1 King Bed",
        capacity: hotelData.initialRoom.capacity || "2 Adults",
        size: hotelData.initialRoom.size || "450 sq ft",
        image: hotelData.initialRoom.image || newHotel.images[0],
        mealPlan: "Free Breakfast Included",
        cancellationPolicy: "Free Cancellation till 24 hrs before check-in",
        amenities: hotelData.initialRoom.amenities || ["Free WiFi", "Breakfast Included", "Air Conditioning"],
        availableCount: 4
      });
      newHotel.startingPrice = newHotel.rooms[0].price;
    }

    hotels.unshift(newHotel);
    this.saveHotels(hotels);
    return newHotel;
  },

  deleteHotel(hotelId) {
    let hotels = this.getHotels();
    hotels = hotels.filter(h => h.id !== hotelId);
    this.saveHotels(hotels);
    return hotels;
  },

  addRoomToHotel(hotelId, roomData) {
    const hotels = this.getHotels();
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return null;
    if (!hotel.rooms) hotel.rooms = [];

    const newRoom = {
      id: "room-" + Date.now(),
      name: roomData.name,
      type: roomData.type || "Deluxe",
      price: parseFloat(roomData.price) || 5000,
      originalPrice: parseFloat(roomData.originalPrice) || (parseFloat(roomData.price) * 1.25),
      bedType: roomData.bedType || "1 King Bed",
      capacity: roomData.capacity || "2 Adults",
      size: roomData.size || "500 sq ft",
      image: roomData.image || (hotel.images && hotel.images[0]),
      mealPlan: roomData.mealPlan || "Complimentary Breakfast Included",
      cancellationPolicy: "Free Cancellation till 24 hrs before check-in",
      amenities: roomData.amenities || ["Free WiFi", "Air Conditioning"],
      availableCount: parseInt(roomData.availableCount) || 3
    };

    hotel.rooms.push(newRoom);
    if (newRoom.price < hotel.startingPrice || hotel.rooms.length === 1) {
      hotel.startingPrice = newRoom.price;
    }

    this.saveHotels(hotels);
    return newRoom;
  },

  resetDefaults() {
    localStorage.removeItem(this.STORAGE_KEY_HOTELS);
    this.saveHotels(DEFAULT_HOTELS);
    return JSON.parse(JSON.stringify(DEFAULT_HOTELS));
  },

  getBookings() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_BOOKINGS);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: "MMT-HTL-940214",
        hotelId: "hotel-1",
        hotelName: "The Oberoi Grand Palace & Spa",
        hotelCity: "Udaipur",
        hotelLocality: "Lake Pichola, Rajasthan",
        hotelImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
        roomName: "Premier Lake View Suite with Balcony",
        checkIn: "2026-10-15",
        checkOut: "2026-10-18",
        nights: 3,
        guests: "2 Adults",
        guestName: "Rahul Sharma",
        guestPhone: "+91 98765 43210",
        guestEmail: "rahul.sharma@example.com",
        totalAmount: 42000,
        status: "Confirmed",
        bookedAt: new Date().toISOString()
      }
    ];
  },

  saveBooking(booking) {
    const bookings = this.getBookings();
    bookings.unshift(booking);
    try {
      localStorage.setItem(this.STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch (e) {}
    return booking;
  },

  getFavorites() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_FAVORITES);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return ["hotel-1", "hotel-2"];
  },

  toggleFavorite(hotelId) {
    let favs = this.getFavorites();
    if (favs.includes(hotelId)) {
      favs = favs.filter(id => id !== hotelId);
    } else {
      favs.push(hotelId);
    }
    localStorage.setItem(this.STORAGE_KEY_FAVORITES, JSON.stringify(favs));
    return favs;
  }
};
