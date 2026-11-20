const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { slugify } = require('../utils/helpers');
const ROLES = require('../constants/roles');
const { pick, httpError } = require('../utils/sanitize');

const HOTEL_UPDATE_FIELDS = [
  'name', 'tagline', 'category', 'city', 'state', 'country', 'address', 'latitude', 'longitude',
  'starRating', 'startingPrice', 'images', 'description', 'amenities', 'policies', 'bankAccount', 'cancellationPolicy'
];

function toPublicHotel(hotel) {
  const { bankAccount, commissionRate, ownerId, ...publicHotel } = hotel;
  return publicHotel;
}

class HotelService {
  getAllHotels({
    city,
    category,
    minPrice,
    maxPrice,
    minRating,
    amenities,
    featured,
    search,
    sortBy = 'recommended',
    page = 1,
    limit = 20
  } = {}) {
    let hotels = db.find('hotels', (h) => h.status === 'ACTIVE' && h.isVerified === true);

    // City filter
    if (city) {
      hotels = hotels.filter((h) => h.city.toLowerCase() === city.toLowerCase());
    }

    // Category filter
    if (category) {
      hotels = hotels.filter((h) => h.category.toLowerCase() === category.toLowerCase());
    }

    // Price range
    if (minPrice) {
      hotels = hotels.filter((h) => h.startingPrice >= parseFloat(minPrice));
    }
    if (maxPrice) {
      hotels = hotels.filter((h) => h.startingPrice <= parseFloat(maxPrice));
    }

    // Rating
    if (minRating) {
      hotels = hotels.filter((h) => h.rating >= parseFloat(minRating));
    }

    // Featured
    if (featured !== undefined) {
      const isFeatured = String(featured).toLowerCase() === 'true';
      hotels = hotels.filter((h) => h.featured === isFeatured);
    }

    // Search query (keyword in name, address, city, description)
    if (search) {
      const q = search.toLowerCase();
      hotels = hotels.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.state.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q)
      );
    }

    // Amenities filter (comma-separated e.g. "WiFi,Pool")
    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim().toLowerCase());
      hotels = hotels.filter((h) =>
        amenityList.every((reqAmenity) =>
          h.amenities.some((hotelAmenity) => hotelAmenity.toLowerCase().includes(reqAmenity))
        )
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      hotels.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_desc') {
      hotels.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'rating') {
      hotels.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'reviews') {
      hotels.sort((a, b) => b.reviewsCount - a.reviewsCount);
    } else {
      // Default: featured first, then rating
      hotels.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.rating - a.rating;
      });
    }

    // Attach rooms count
    const enriched = hotels.map((h) => {
      const rooms = db.find('rooms', (r) => r.hotelId === h.id);
      return {
        ...toPublicHotel(h),
        roomsCount: rooms.length,
        rooms: rooms
      };
    });

    // Pagination
    const total = enriched.length;
    const startIndex = (page - 1) * limit;
    const paginated = enriched.slice(startIndex, startIndex + limit);

    return {
      hotels: paginated,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };
  }

  getHotelById(id) {
    if (!id) return null;
    let hotel = db.findById('hotels', id);
    if (!hotel && typeof id === 'string') {
      if (id.startsWith('ref-')) {
        hotel = db.findById('hotels', id.replace('ref-', 'hotel-'));
      }
      if (!hotel) {
        hotel = db.findOne('hotels', (h) => h.slug === id || (h.name && h.name.toLowerCase() === id.toLowerCase()));
      }
    }
    if (!hotel) return null;
    const rooms = db.find('rooms', (r) => r.hotelId === hotel.id);
    const reviews = db.find('reviews', (rev) => rev.hotelId === hotel.id);
    return {
      ...toPublicHotel(hotel),
      rooms,
      reviews
    };
  }

  getHotelBySlug(slug) {
    if (!slug) return null;
    let hotel = db.findOne('hotels', (h) => h.slug === slug);
    if (!hotel && typeof slug === 'string') {
      if (slug.startsWith('ref-')) {
        const altId = slug.replace('ref-', 'hotel-');
        hotel = db.findById('hotels', altId) || db.findOne('hotels', (h) => h.slug.includes(slug.replace('ref-', '')));
      }
    }
    if (!hotel) return null;
    const rooms = db.find('rooms', (r) => r.hotelId === hotel.id);
    const reviews = db.find('reviews', (rev) => rev.hotelId === hotel.id);
    return {
      ...toPublicHotel(hotel),
      rooms,
      reviews
    };
  }

  createHotel(hotelData, ownerId) {
    const slug = slugify(`${hotelData.name}-${hotelData.city}`);
    const newHotel = {
      id: `hotel-${uuidv4().slice(0, 8)}`,
      slug,
      ownerId: ownerId || hotelData.ownerId,
      name: hotelData.name,
      tagline: hotelData.tagline || '',
      category: hotelData.category || 'Standard',
      city: hotelData.city,
      state: hotelData.state || 'India',
      country: hotelData.country || 'India',
      address: hotelData.address,
      latitude: parseFloat(hotelData.latitude) || 0,
      longitude: parseFloat(hotelData.longitude) || 0,
      starRating: parseInt(hotelData.starRating) || 4,
      rating: parseFloat(hotelData.rating) || 4.8,
      reviewsCount: 1,
      startingPrice: parseFloat(hotelData.startingPrice) || 3000,
      currency: '₹',
      commissionRate: parseFloat(hotelData.commissionRate) || 15.0,
      isVerified: false,
      verificationStatus: 'PENDING',
      bankAccount: hotelData.bankAccount || {},
      images:
        hotelData.images && hotelData.images.length > 0
          ? hotelData.images
          : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
      description: hotelData.description || 'Welcome to our premium hotel property.',
      amenities: hotelData.amenities || ['Free WiFi', 'Air Conditioning', 'Room Service'],
      cancellationPolicy: hotelData.cancellationPolicy || {
        refundable: false,
        type: 'NON_REFUNDABLE',
        windowHours: 0,
        summary: 'Non-refundable: No refund upon cancellation or no-show.',
        badgeText: 'Non-refundable'
      },
      policies: hotelData.policies || {
        checkIn: '12:00',
        checkOut: '11:00',
        cancellation: hotelData.cancellationPolicy?.summary || 'Non-refundable: No refund upon cancellation or no-show.'
      },
      featured: hotelData.featured || false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    db.insert('hotels', newHotel);

    // If initial room provided
    if (hotelData.initialRoom && hotelData.initialRoom.name) {
      const initialRoom = {
        id: `room-${uuidv4().slice(0, 8)}`,
        hotelId: newHotel.id,
        name: hotelData.initialRoom.name,
        type: hotelData.initialRoom.type || 'Deluxe',
        basePrice: parseFloat(hotelData.initialRoom.price) || newHotel.startingPrice,
        originalPrice: parseFloat(hotelData.initialRoom.originalPrice) || newHotel.startingPrice * 1.25,
        bedType: hotelData.initialRoom.bedType || '1 King Bed',
        capacityAdults: parseInt(hotelData.initialRoom.capacityAdults) || 2,
        capacityChildren: parseInt(hotelData.initialRoom.capacityChildren) || 1,
        sizeSqFt: parseInt(hotelData.initialRoom.sizeSqFt) || 450,
        image: hotelData.initialRoom.image || newHotel.images[0],
        amenities: hotelData.initialRoom.amenities || ['Free WiFi', 'Air Conditioning', 'Free Breakfast'],
        totalInventory: parseInt(hotelData.initialRoom.totalInventory) || 5,
        status: 'AVAILABLE'
      };
      db.insert('rooms', initialRoom);
      newHotel.startingPrice = initialRoom.basePrice;
      db.update('hotels', newHotel.id, { startingPrice: initialRoom.basePrice });
    }

    return newHotel;
  }

  updateHotel(hotelId, hotelData, user) {
    const hotel = db.findById('hotels', hotelId);
    if (!hotel) throw httpError('Hotel not found.', 404);

    // Security check: only hotel owner or admin can update
    if (user.role !== ROLES.ADMIN && hotel.ownerId !== user.id) {
      throw httpError('Unauthorized to modify this hotel.', 403);
    }

    const updated = db.update('hotels', hotelId, pick(hotelData, HOTEL_UPDATE_FIELDS));
    return updated;
  }

  deleteHotel(hotelId, user) {
    const hotel = db.findById('hotels', hotelId);
    if (!hotel) throw httpError('Hotel not found.', 404);

    if (user.role !== ROLES.ADMIN && hotel.ownerId !== user.id) {
      throw httpError('Unauthorized to delete this hotel.', 403);
    }

    const activeBookings = db.find('bookings', (booking) =>
      booking.hotelId === hotelId && ['CONFIRMED', 'CHECKED_IN'].includes(booking.status)
    );
    if (activeBookings.length > 0) throw httpError('Hotel cannot be deleted while it has active bookings.', 409);

    // Also delete associated rooms
    const rooms = db.find('rooms', (r) => r.hotelId === hotelId);
    rooms.forEach((r) => db.delete('rooms', r.id));

    return db.delete('hotels', hotelId);
  }

  getHotelsByOwner(ownerId) {
    const hotels = db.find('hotels', (h) => h.ownerId === ownerId);
    return hotels.map((h) => {
      const rooms = db.find('rooms', (r) => r.hotelId === h.id);
      const bookings = db.find('bookings', (b) => b.hotelId === h.id);
      return {
        ...h,
        roomsCount: rooms.length,
        totalBookings: bookings.length,
        rooms
      };
    });
  }

  getCities() {
    const hotels = db.find('hotels', (h) => h.status === 'ACTIVE' && h.isVerified === true);
    const cityMap = {};

    hotels.forEach((h) => {
      if (!cityMap[h.city]) {
        cityMap[h.city] = {
          name: h.city,
          state: h.state,
          hotelsCount: 0,
          image: h.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
          minPrice: h.startingPrice
        };
      }
      cityMap[h.city].hotelsCount += 1;
      if (h.startingPrice < cityMap[h.city].minPrice) {
        cityMap[h.city].minPrice = h.startingPrice;
      }
    });

    return Object.values(cityMap);
  }

  getCategories() {
    const hotels = db.find('hotels', (h) => h.status === 'ACTIVE' && h.isVerified === true);
    let categories = db.find('categories');

    // Default category models for Hotels, Resorts, and 5-Bed Combos
    if (!categories || categories.length === 0) {
      categories = [
        {
          id: 'hotels',
          name: 'Hotels',
          slug: 'hotels',
          icon: 'fa-hotel',
          description: 'Comfortable city hotels, 3-star business & budget stays'
        },
        {
          id: 'resorts',
          name: 'Resorts',
          slug: 'resorts',
          icon: 'fa-umbrella-beach',
          description: 'Leisure resorts & getaways with lawn and dining'
        },
        {
          id: 'combos',
          name: 'Dorms & Combos',
          slug: 'dorms-combos',
          icon: 'fa-people-group',
          description: '5-Bed combos, mixed dorms, and budget group stays'
        }
      ];
    } else if (!categories.some((c) => (c.name || '').toLowerCase().includes('combo') || (c.id || '').includes('combo'))) {
      categories.push({
        id: 'combos',
        name: 'Dorms & Combos',
        slug: 'dorms-combos',
        icon: 'fa-people-group',
        description: '5-Bed combos, mixed dorms, and budget group stays'
      });
    }

    // Link and compute stats for each category dynamically from verified hotels
    const result = categories.map((cat) => {
      const catName = (cat.name || '').toLowerCase().trim();
      const catSlug = (cat.slug || cat.id || '').toLowerCase().trim();

      const matchingHotels = hotels.filter((h) => {
        const hCat = (h.category || '').toLowerCase().trim();
        if (catName.includes('combo') || catSlug.includes('combo') || catName.includes('dorm')) {
          const hotelRooms = db.find('rooms', (r) => r.hotelId === h.id);
          const hasComboRoom = hotelRooms.some((r) => r.isCombo || (r.type && r.type.toLowerCase().includes('dorm')));
          return hCat.includes('combo') || hCat.includes('dorm') || hasComboRoom;
        }
        return hCat === catName || hCat === catSlug || (catName === 'hotels' && (hCat === 'hotels' || hCat === 'all'));
      });

      const count = matchingHotels.length;
      const minPrice = count > 0 
        ? Math.min(...matchingHotels.map((h) => Number(h.startingPrice) || 99999))
        : 0;

      const previewImage = matchingHotels[0]?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';

      return {
        id: cat.id || cat.slug,
        name: cat.name,
        label: cat.name,
        slug: cat.slug || cat.id,
        icon: cat.icon || 'fa-hotel',
        description: cat.description || '',
        count,
        staysText: `${count.toLocaleString('en-IN')} ${count === 1 ? 'stay' : 'stays'}`,
        minPrice,
        image: previewImage,
        categoryFilter: cat.name,
        searchQuery: cat.name
      };
    });

    // Also include any extra custom categories that exist in hotels table
    const existingNames = new Set(categories.map((c) => (c.name || '').toLowerCase().trim()));
    hotels.forEach((h) => {
      const hCat = (h.category || '').trim();
      if (hCat && !existingNames.has(hCat.toLowerCase())) {
        existingNames.add(hCat.toLowerCase());
        const customMatching = hotels.filter((hotel) => (hotel.category || '').toLowerCase().trim() === hCat.toLowerCase());
        result.push({
          id: hCat.toLowerCase().replace(/\s+/g, '-'),
          name: hCat,
          label: hCat,
          slug: hCat.toLowerCase().replace(/\s+/g, '-'),
          icon: 'fa-map-pin',
          description: `${hCat} stays & verified properties`,
          count: customMatching.length,
          staysText: `${customMatching.length.toLocaleString('en-IN')} ${customMatching.length === 1 ? 'stay' : 'stays'}`,
          minPrice: Math.min(...customMatching.map((hotel) => Number(hotel.startingPrice) || 99999)),
          image: customMatching[0]?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
          categoryFilter: hCat,
          searchQuery: hCat
        });
      }
    });

    return result;
  }
}

module.exports = new HotelService();
