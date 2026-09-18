// =========================================================
// HOTEL FACTORIES - INTERACTIVE MOBILE APP LOGIC
// =========================================================

let state = {
  currency: "INR",
  currencySymbol: "₹",
  exchangeRate: 1, // 1 for INR, 0.012 for USD
  selectedCategory: "All",
  searchQuery: "",
  filterRating: 0,
  filterMaxPrice: 35000,
  filterSort: "featured",
  activeHotelId: null,
  activeBookingData: {
    hotel: null,
    room: null,
    promoDiscount: 0
  }
};

// Preset images for easy hotel & room creation
const PRESET_IMAGES = {
  palace: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  beach: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  mountain: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  city: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  suite: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  villa: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
  balcony: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
};

// Initialize Application on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  renderHotels();
  renderBookings();
  updateFavoritesBadge();
  setupInitialDates();
  populateHotelDropdown();
});

// Live Phone Clock
function initClock() {
  const update = () => {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    const clockEl = document.getElementById("statusClock");
    if (clockEl) clockEl.textContent = `${hrs}:${mins}`;
  };
  update();
  setInterval(update, 30000);
}

// Format Price with active currency
function formatPrice(amountInInr) {
  if (state.currency === "USD") {
    const usd = Math.round(amountInInr * 0.012);
    return `$${usd.toLocaleString()}`;
  }
  return `₹${Math.round(amountInInr).toLocaleString()}`;
}

// Toggle Currency between INR and USD
function toggleCurrency() {
  if (state.currency === "INR") {
    state.currency = "USD";
    state.currencySymbol = "$";
    state.exchangeRate = 0.012;
  } else {
    state.currency = "INR";
    state.currencySymbol = "₹";
    state.exchangeRate = 1;
  }
  const label = document.getElementById("currencyLabel");
  if (label) label.textContent = `${state.currencySymbol} ${state.currency}`;
  
  // Re-render
  renderHotels();
  if (state.activeHotelId) {
    openHotelDetail(state.activeHotelId);
  }
  showToast(`Currency changed to ${state.currency}`);
}

// View Mode Toggle (Phone Shell vs Mobile Fullscreen)
function setViewMode(mode) {
  const wrapper = document.getElementById("appWrapper");
  const btnPhone = document.getElementById("btnPhoneView");
  const btnFull = document.getElementById("btnFullView");

  if (mode === "full") {
    wrapper.classList.add("fullscreen-mode");
    btnFull.classList.add("active");
    btnPhone.classList.remove("active");
  } else {
    wrapper.classList.remove("fullscreen-mode");
    btnPhone.classList.add("active");
    btnFull.classList.remove("active");
  }
}

// Bottom Navigation Switching
function switchNav(screenName) {
  // Update nav buttons
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  navItems.forEach(btn => btn.classList.remove("active"));
  
  const activeBtnId = `nav${screenName.charAt(0).toUpperCase() + screenName.slice(1)}`;
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) activeBtn.classList.add("active");

  // Switch screen visibility
  const screens = document.querySelectorAll(".app-screen");
  screens.forEach(s => s.classList.remove("active-screen"));

  const targetScreenId = `screen${screenName.charAt(0).toUpperCase() + screenName.slice(1)}`;
  const targetScreen = document.getElementById(targetScreenId);
  if (targetScreen) {
    targetScreen.classList.add("active-screen");
  }

  // Scroll to top of viewport
  const viewport = document.getElementById("appViewport");
  if (viewport) viewport.scrollTo({ top: 0, behavior: "smooth" });

  // Specific screen loads
  if (screenName === "bookings") {
    renderBookings();
  } else if (screenName === "saved") {
    renderSavedHotels();
  } else if (screenName === "admin") {
    populateHotelDropdown();
    renderCatalogManager();
  } else if (screenName === "search") {
    renderSearchResults();
  }
}

// Render Hotels in Main Feed
function renderHotels() {
  const container = document.getElementById("hotelsListContainer");
  if (!container) return;

  const hotels = DB.getHotels();
  const favorites = DB.getFavorites();

  // Filter
  let filtered = hotels.filter(h => {
    // Category
    if (state.selectedCategory !== "All" && h.category !== state.selectedCategory) {
      return false;
    }
    // Search
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const match = h.name.toLowerCase().includes(q) ||
                    h.city.toLowerCase().includes(q) ||
                    (h.amenities && h.amenities.some(a => a.toLowerCase().includes(q)));
      if (!match) return false;
    }
    // Rating
    if (state.filterRating > 0 && h.rating < state.filterRating) {
      return false;
    }
    // Max Price
    if (h.startingPrice > state.filterMaxPrice) {
      return false;
    }
    return true;
  });

  // Sorting
  if (state.filterSort === "price_low") {
    filtered.sort((a, b) => a.startingPrice - b.startingPrice);
  } else if (state.filterSort === "price_high") {
    filtered.sort((a, b) => b.startingPrice - a.startingPrice);
  } else if (state.filterSort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--app-muted);">
        <i class="fa-solid fa-hotel" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4;"></i>
        <div style="font-weight: 700; color: var(--app-text); margin-bottom: 6px;">No hotels found</div>
        <p style="font-size: 0.8rem;">Try clearing your search query or adjusting your filters.</p>
        <button class="control-btn" style="margin: 14px auto 0 auto; color: var(--app-text);" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(hotel => {
    const isFav = favorites.includes(hotel.id);
    const coverImage = (hotel.images && hotel.images[0]) || PRESET_IMAGES.palace;
    const roomCount = hotel.rooms ? hotel.rooms.length : 0;

    return `
      <div class="hotel-card" onclick="openHotelDetail('${hotel.id}')">
        <div class="hotel-image-wrapper">
          <img src="${coverImage}" alt="${hotel.name}" loading="lazy">
          ${hotel.featured ? `
            <div class="tag-featured">
              <i class="fa-solid fa-crown"></i> Featured
            </div>
          ` : ''}
          <button class="fav-btn ${isFav ? 'is-fav' : ''}" onclick="toggleFav(event, '${hotel.id}')" title="Wishlist">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>

        <div class="hotel-info-block">
          <div class="hotel-rating-row">
            <span class="rating-pill">
              <i class="fa-solid fa-star"></i> ${hotel.rating}
            </span>
            <span class="reviews-cnt">${hotel.reviewsCount || 100}+ reviews</span>
          </div>

          <h3 class="hotel-title">${hotel.name}</h3>
          
          <div class="hotel-location">
            <i class="fa-solid fa-location-dot"></i> ${hotel.city}, India · <span style="color: var(--primary); font-weight: 600;">${roomCount} room types</span>
          </div>

          <div class="hotel-amenities-pills">
            ${(hotel.amenities || []).slice(0, 3).map(a => `
              <span class="amenity-micro-chip">${a}</span>
            `).join('')}
          </div>

          <div class="hotel-price-row">
            <div>
              <div class="price-subtext">Starting from</div>
              <div>
                <span class="price-amount">${formatPrice(hotel.startingPrice)}</span>
                <span class="price-unit">/ night</span>
              </div>
            </div>
            <button class="book-quick-btn" onclick="event.stopPropagation(); openHotelDetail('${hotel.id}')">
              Select Room <i class="fa-solid fa-chevron-right" style="font-size: 0.65rem;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Category filter
function filterByCategory(category) {
  state.selectedCategory = category;
  
  // Highlight active chip
  const chips = document.querySelectorAll(".cat-chip");
  chips.forEach(chip => {
    if (chip.textContent.trim().includes(category)) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  renderHotels();
}

// Search Handler
function handleSearch(val) {
  state.searchQuery = val.trim();
  renderHotels();
  renderSearchResults();
}

// Search Screen Results
function renderSearchResults() {
  const container = document.getElementById("searchResultsContainer");
  const countLabel = document.getElementById("searchResultCount");
  if (!container) return;

  const hotels = DB.getHotels();
  const filtered = hotels.filter(h => {
    if (!state.searchQuery) return true;
    const q = state.searchQuery.toLowerCase();
    return h.name.toLowerCase().includes(q) ||
           h.city.toLowerCase().includes(q) ||
           (h.amenities && h.amenities.some(a => a.toLowerCase().includes(q)));
  });

  if (countLabel) {
    countLabel.textContent = state.searchQuery ? `Search Results (${filtered.length})` : `All Properties (${filtered.length})`;
  }

  container.innerHTML = filtered.map(hotel => `
    <div class="hotel-card" onclick="openHotelDetail('${hotel.id}')">
      <div class="hotel-image-wrapper" style="height: 140px;">
        <img src="${hotel.images[0] || PRESET_IMAGES.palace}" alt="${hotel.name}">
      </div>
      <div class="hotel-info-block">
        <div style="font-size: 0.72rem; color: var(--primary); font-weight: 700;">${hotel.city}</div>
        <h4 class="hotel-title" style="font-size: 0.95rem;">${hotel.name}</h4>
        <div class="hotel-price-row" style="margin-top: 6px; padding-top: 6px;">
          <div>
            <span class="price-amount" style="font-size: 1rem;">${formatPrice(hotel.startingPrice)}</span>
            <span class="price-unit">/ night</span>
          </div>
          <button class="book-quick-btn" style="padding: 5px 12px; font-size: 0.72rem;">View</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Open Hotel Detail Screen
function openHotelDetail(hotelId) {
  const hotels = DB.getHotels();
  const hotel = hotels.find(h => h.id === hotelId);
  if (!hotel) return;

  state.activeHotelId = hotelId;
  const detailScreen = document.getElementById("screenDetail");
  const container = document.getElementById("hotelDetailContainer");
  if (!detailScreen || !container) return;

  // Switch screens
  document.querySelectorAll(".app-screen").forEach(s => s.classList.remove("active-screen"));
  detailScreen.classList.add("active-screen");

  // Scroll to top
  document.getElementById("appViewport").scrollTo({ top: 0, behavior: "smooth" });

  const isFav = DB.getFavorites().includes(hotel.id);
  const images = hotel.images && hotel.images.length > 0 ? hotel.images : [PRESET_IMAGES.palace];

  container.innerHTML = `
    <!-- Top Action Buttons Overlay -->
    <div class="detail-nav-bar">
      <button class="detail-nav-btn" onclick="switchNav('home')">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div style="display: flex; gap: 8px;">
        <button class="detail-nav-btn" onclick="shareHotel('${hotel.name}')">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
        <button class="detail-nav-btn" onclick="toggleFav(event, '${hotel.id}'); this.querySelector('i').className = DB.getFavorites().includes('${hotel.id}') ? 'fa-solid fa-heart' : 'fa-regular fa-heart';">
          <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isFav ? 'color:#EF4444;' : ''}"></i>
        </button>
      </div>
    </div>

    <!-- Image Gallery Slider -->
    <div class="detail-gallery-slider" id="detailGallery">
      <img id="detailMainImg" src="${images[0]}" alt="${hotel.name}">
      <div class="gallery-counter-badge">
        <i class="fa-solid fa-camera"></i> <span id="galleryIndex">1</span>/${images.length}
      </div>
    </div>

    <!-- Gallery Thumbnail Dots -->
    <div style="display: flex; gap: 6px; justify-content: center; padding: 10px 0; background: var(--app-bg);">
      ${images.map((img, idx) => `
        <img src="${img}" style="width: 48px; height: 36px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--primary)' : 'transparent'};" 
             onclick="changeDetailImage('${img}', ${idx + 1}, this)">
      `).join('')}
    </div>

    <!-- Hotel Information Body -->
    <div class="detail-content-body">
      <div class="detail-badge-row">
        <span class="rating-pill">
          <i class="fa-solid fa-star"></i> ${hotel.rating} (${hotel.reviewsCount || 200}+ reviews)
        </span>
        <span class="amenity-micro-chip" style="background: var(--primary-light); color: var(--primary); font-weight: 700;">
          ${hotel.category}
        </span>
      </div>

      <h1 class="detail-hotel-title">${hotel.name}</h1>
      
      <div class="detail-address">
        <i class="fa-solid fa-location-dot"></i>
        <span>${hotel.address}</span>
      </div>

      <!-- Quick Feature Amenities Grid -->
      <div class="amenities-feature-grid">
        <div class="amenity-feature-box">
          <i class="fa-solid fa-wifi"></i>
          <span>Free WiFi</span>
        </div>
        <div class="amenity-feature-box">
          <i class="fa-solid fa-water-ladder"></i>
          <span>Pool</span>
        </div>
        <div class="amenity-feature-box">
          <i class="fa-solid fa-spa"></i>
          <span>Spa Resort</span>
        </div>
        <div class="amenity-feature-box">
          <i class="fa-solid fa-utensils"></i>
          <span>Fine Dining</span>
        </div>
      </div>

      <p class="detail-desc-text">${hotel.description}</p>

      <!-- DYNAMIC ROOM SELECTION SECTION -->
      <div class="rooms-section-title">
        <span>Available Rooms & Suites</span>
        <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">
          ${(hotel.rooms || []).length} Types Available
        </span>
      </div>

      <div class="rooms-container" id="detailRoomsList">
        ${renderHotelRoomsList(hotel)}
      </div>
    </div>
  `;
}

// Render dynamic rooms for a hotel
function renderHotelRoomsList(hotel) {
  if (!hotel.rooms || hotel.rooms.length === 0) {
    return `
      <div style="background: var(--app-card); border: 1px dashed var(--app-border); border-radius: var(--radius-md); padding: 18px; text-align: center;">
        <p style="font-size: 0.8rem; color: var(--app-muted); margin-bottom: 8px;">No rooms configured yet for this hotel.</p>
        <button class="book-quick-btn" onclick="openAddRoomForHotel('${hotel.id}')">+ Add Room to Hotel</button>
      </div>
    `;
  }

  return hotel.rooms.map(room => {
    const roomImg = room.image || (hotel.images && hotel.images[0]) || PRESET_IMAGES.suite;
    return `
      <div class="room-card">
        <div class="room-image-area">
          <img src="${roomImg}" alt="${room.name}">
          <div class="room-type-badge">${room.type || 'Deluxe'}</div>
        </div>

        <div class="room-details-body">
          <h4 class="room-name">${room.name}</h4>
          
          <div class="room-specs-row">
            <span><i class="fa-solid fa-bed"></i> ${room.bedType || '1 King Bed'}</span>
            <span><i class="fa-solid fa-user-group"></i> ${room.capacity || '2 Adults'}</span>
            <span><i class="fa-solid fa-vector-square"></i> ${room.size || '450 sq ft'}</span>
          </div>

          <div class="room-amenities-list">
            ${(room.amenities || []).slice(0, 3).map(a => `
              <span class="room-amenity-tag">${a}</span>
            `).join('')}
          </div>

          <div class="room-action-row">
            <div class="room-price-display">
              ${room.originalPrice ? `<span class="room-original-price">${formatPrice(room.originalPrice)}</span>` : ''}
              <span class="room-current-price">${formatPrice(room.price)} <small style="font-size: 0.65rem; color: var(--app-muted);">/ night</small></span>
            </div>

            <button class="room-select-btn" onclick="openBookingSheet('${hotel.id}', '${room.id}')">
              Book Room
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Change Gallery Main Image
function changeDetailImage(src, index, thumbEl) {
  const main = document.getElementById("detailMainImg");
  const idx = document.getElementById("galleryIndex");
  if (main) main.src = src;
  if (idx) idx.textContent = index;

  // Highlight thumb
  const thumbs = thumbEl.parentElement.querySelectorAll("img");
  thumbs.forEach(t => t.style.borderColor = "transparent");
  thumbEl.style.borderColor = "var(--primary)";
}

// Open Booking Modal Sheet
function openBookingSheet(hotelId, roomId) {
  const hotels = DB.getHotels();
  const hotel = hotels.find(h => h.id === hotelId);
  if (!hotel) return;

  const room = (hotel.rooms || []).find(r => r.id === roomId);
  if (!room) return;

  state.activeBookingData = {
    hotel: hotel,
    room: room,
    promoDiscount: 0
  };

  // Populate booking summary pill
  const summaryEl = document.getElementById("bookingSummaryPill");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <img src="${room.image || hotel.images[0]}" class="booking-summary-img" alt="${room.name}">
      <div>
        <div class="booking-hotel-name">${hotel.name}</div>
        <div class="booking-room-name">${room.name}</div>
        <div style="font-size: 0.72rem; color: var(--app-muted);">${formatPrice(room.price)} / night · ${hotel.city}</div>
      </div>
    `;
  }

  // Set default dates
  setupInitialDates();
  recalculateBill();

  // Show sheet
  document.getElementById("sheetOverlay").classList.add("active");
  document.getElementById("bookingSheet").classList.add("active");
}

// Setup initial dates (Tomorrow -> 3 days after)
function setupInitialDates() {
  const checkInInput = document.getElementById("bookCheckIn");
  const checkOutInput = document.getElementById("bookCheckOut");
  if (!checkInInput || !checkOutInput) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 4);

  checkInInput.value = tomorrow.toISOString().split("T")[0];
  checkOutInput.value = checkOut.toISOString().split("T")[0];
}

// Recalculate bill
function recalculateBill() {
  if (!state.activeBookingData.room) return;

  const checkInStr = document.getElementById("bookCheckIn").value;
  const checkOutStr = document.getElementById("bookCheckOut").value;

  const d1 = new Date(checkInStr);
  const d2 = new Date(checkOutStr);

  let nights = 1;
  if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
    const diffTime = Math.abs(d2 - d1);
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  if (nights < 1) nights = 1;

  const roomRate = state.activeBookingData.room.price * nights;
  const taxes = Math.round(roomRate * 0.12); // 12% GST
  let discount = 0;

  if (state.activeBookingData.promoDiscount > 0) {
    discount = Math.round(roomRate * state.activeBookingData.promoDiscount);
    document.getElementById("promoDiscountRow").style.display = "flex";
    document.getElementById("billDiscount").textContent = `-${formatPrice(discount)}`;
  } else {
    document.getElementById("promoDiscountRow").style.display = "none";
  }

  const total = Math.max(0, roomRate + taxes - discount);

  document.getElementById("billNights").textContent = nights;
  document.getElementById("billRoomRate").textContent = formatPrice(roomRate);
  document.getElementById("billTaxes").textContent = formatPrice(taxes);
  document.getElementById("billTotal").textContent = formatPrice(total);

  state.activeBookingData.calculatedNights = nights;
  state.activeBookingData.calculatedTotal = total;
}

// Apply Promo Code
function applyPromoCode() {
  const code = (document.getElementById("bookPromo").value || "").trim().toUpperCase();
  if (code === "LUXURY20" || code === "WELCOME20") {
    state.activeBookingData.promoDiscount = 0.20;
    recalculateBill();
    showToast("🎉 Promo code applied: 20% Discount!");
  } else if (code === "") {
    state.activeBookingData.promoDiscount = 0;
    recalculateBill();
  } else {
    showToast("Invalid promo code. Try LUXURY20");
  }
}

// Handle Booking Form Submit
function handleBookingSubmit(e) {
  e.preventDefault();

  const hotel = state.activeBookingData.hotel;
  const room = state.activeBookingData.room;
  const guestName = document.getElementById("bookGuestName").value;
  const guestPhone = document.getElementById("bookGuestPhone").value;
  const guestEmail = document.getElementById("bookGuestEmail").value;
  const checkIn = document.getElementById("bookCheckIn").value;
  const checkOut = document.getElementById("bookCheckOut").value;
  const guests = document.getElementById("bookGuests").value;

  const bookingId = "BK-" + Math.floor(100000 + Math.random() * 900000);

  const newBooking = {
    id: bookingId,
    hotelId: hotel.id,
    hotelName: hotel.name,
    hotelCity: hotel.city,
    hotelImage: room.image || hotel.images[0],
    roomName: room.name,
    checkIn: checkIn,
    checkOut: checkOut,
    nights: state.activeBookingData.calculatedNights || 1,
    guests: guests,
    guestName: guestName,
    guestPhone: guestPhone,
    guestEmail: guestEmail,
    totalAmount: state.activeBookingData.calculatedTotal,
    status: "Confirmed",
    bookedAt: new Date().toISOString()
  };

  DB.saveBooking(newBooking);

  // Close booking sheet and open voucher sheet
  document.getElementById("bookingSheet").classList.remove("active");
  renderVoucher(newBooking);
  document.getElementById("voucherSheet").classList.add("active");

  // Show badge
  const badge = document.getElementById("bookingNavBadge");
  if (badge) badge.style.display = "block";

  showToast(`Booking ${bookingId} confirmed successfully!`);
}

// Render Digital Boarding Pass / Voucher
function renderVoucher(booking) {
  const container = document.getElementById("voucherCardContent");
  if (!container) return;

  container.innerHTML = `
    <div class="ticket-card">
      <div class="ticket-header">
        <div>
          <div class="ticket-brand">HOTEL FACTORIES PASS</div>
          <div style="font-size: 0.72rem; color: #64748B;">Official Reservation Voucher</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.65rem; color: #64748B;">BOOKING ID</div>
          <div style="font-weight: 800; font-family: var(--font-heading); color: #0F172A;">${booking.id}</div>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #0F172A;">${booking.hotelName}</h3>
        <div style="font-size: 0.78rem; color: var(--primary); font-weight: 600;">${booking.roomName}</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem; background: #F8FAFC; padding: 10px; border-radius: 8px;">
        <div>
          <span style="color: #64748B; display: block; font-size: 0.65rem;">CHECK-IN</span>
          <strong>${booking.checkIn}</strong>
        </div>
        <div>
          <span style="color: #64748B; display: block; font-size: 0.65rem;">CHECK-OUT</span>
          <strong>${booking.checkOut}</strong>
        </div>
        <div>
          <span style="color: #64748B; display: block; font-size: 0.65rem;">GUEST</span>
          <strong>${booking.guestName}</strong>
        </div>
        <div>
          <span style="color: #64748B; display: block; font-size: 0.65rem;">AMOUNT PAID</span>
          <strong style="color: var(--primary);">${formatPrice(booking.totalAmount)}</strong>
        </div>
      </div>

      <div class="ticket-qr-section">
        <div class="qr-code-img">
          <i class="fa-solid fa-qrcode"></i>
        </div>
        <div style="font-size: 0.68rem; color: #64748B;">Show this digital QR voucher at hotel front desk</div>
      </div>
    </div>
  `;
}

// Render Bookings Screen
function renderBookings() {
  const container = document.getElementById("bookingsListContainer");
  if (!container) return;

  const bookings = DB.getBookings();

  if (bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--app-muted);">
        <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4;"></i>
        <div style="font-weight: 700; color: var(--app-text); margin-bottom: 6px;">No bookings found</div>
        <p style="font-size: 0.8rem;">Your upcoming room reservations will appear here.</p>
        <button class="book-quick-btn" style="margin: 14px auto 0 auto;" onclick="switchNav('home')">Explore Hotels</button>
      </div>
    `;
    return;
  }

  container.innerHTML = bookings.map(b => `
    <div style="background: var(--app-card); border: 1px solid var(--app-border); border-radius: var(--radius-lg); padding: 14px; margin-bottom: 12px; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.72rem; font-weight: 700; color: var(--primary);">${b.id}</span>
        <span style="background: #D1FAE5; color: #10B981; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full);">${b.status}</span>
      </div>

      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
        <img src="${b.hotelImage || PRESET_IMAGES.palace}" style="width: 54px; height: 54px; border-radius: 8px; object-fit: cover;" alt="${b.hotelName}">
        <div>
          <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--app-text);">${b.hotelName}</h4>
          <div style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">${b.roomName}</div>
          <div style="font-size: 0.7rem; color: var(--app-muted);">${b.checkIn} to ${b.checkOut} (${b.nights} nights)</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--app-border); padding-top: 8px;">
        <div>
          <span style="font-size: 0.68rem; color: var(--app-muted);">Total</span>
          <div style="font-weight: 800; font-family: var(--font-heading); color: var(--app-text);">${formatPrice(b.totalAmount)}</div>
        </div>
        <button class="control-btn" style="padding: 5px 12px; font-size: 0.72rem; color: var(--app-text); background: var(--app-bg);" onclick="viewBookingVoucher('${b.id}')">
          <i class="fa-solid fa-qrcode"></i> View Voucher
        </button>
      </div>
    </div>
  `).join('');
}

// View voucher for existing booking
function viewBookingVoucher(bookingId) {
  const booking = DB.getBookings().find(b => b.id === bookingId);
  if (!booking) return;

  renderVoucher(booking);
  document.getElementById("sheetOverlay").classList.add("active");
  document.getElementById("voucherSheet").classList.add("active");
}

// Saved / Wishlist Screen
function renderSavedHotels() {
  const container = document.getElementById("savedHotelsContainer");
  if (!container) return;

  const favorites = DB.getFavorites();
  const hotels = DB.getHotels().filter(h => favorites.includes(h.id));

  if (hotels.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--app-muted);">
        <i class="fa-regular fa-heart" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4;"></i>
        <div style="font-weight: 700; color: var(--app-text); margin-bottom: 6px;">Your Wishlist is Empty</div>
        <p style="font-size: 0.8rem;">Tap the heart icon on any hotel card to save it for your next trip.</p>
        <button class="book-quick-btn" style="margin: 14px auto 0 auto;" onclick="switchNav('home')">Browse Hotels</button>
      </div>
    `;
    return;
  }

  container.innerHTML = hotels.map(hotel => `
    <div class="hotel-card" onclick="openHotelDetail('${hotel.id}')">
      <div class="hotel-image-wrapper" style="height: 150px;">
        <img src="${hotel.images[0] || PRESET_IMAGES.palace}" alt="${hotel.name}">
        <button class="fav-btn is-fav" onclick="toggleFav(event, '${hotel.id}'); renderSavedHotels();">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <div class="hotel-info-block">
        <h4 class="hotel-title">${hotel.name}</h4>
        <div class="hotel-location"><i class="fa-solid fa-location-dot"></i> ${hotel.city}</div>
        <div class="hotel-price-row">
          <span class="price-amount">${formatPrice(hotel.startingPrice)}</span>
          <button class="book-quick-btn">Book</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Toggle Wishlist / Favorite
function toggleFav(e, hotelId) {
  if (e) e.stopPropagation();
  const updatedFavs = DB.toggleFavorite(hotelId);
  const isNowFav = updatedFavs.includes(hotelId);
  
  updateFavoritesBadge();
  renderHotels();
  showToast(isNowFav ? "Added to your wishlist ❤️" : "Removed from wishlist");
}

function updateFavoritesBadge() {
  const count = DB.getFavorites().length;
  const badge = document.getElementById("favBadge");
  if (badge) {
    badge.style.display = count > 0 ? "block" : "none";
  }
}

// =========================================================
// DYNAMIC HOTELIER & ADMIN FUNCTIONS
// =========================================================

// Switch Admin Tabs
function switchAdminTab(tab) {
  const tabs = ["newHotel", "newRoom", "catalog"];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const pane = document.getElementById(`pane${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.remove("active");
    if (pane) pane.classList.remove("active-pane");
  });

  const activeBtn = document.getElementById(`tabBtn${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  const activePane = document.getElementById(`pane${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  if (activeBtn) activeBtn.classList.add("active");
  if (activePane) activePane.classList.add("active-pane");

  if (tab === "newRoom") {
    populateHotelDropdown();
  } else if (tab === "catalog") {
    renderCatalogManager();
  }
}

// Quick presets for Hotel Image
function setHotelImagePreset(key) {
  const input = document.getElementById("newHotelImage");
  if (input && PRESET_IMAGES[key]) {
    input.value = PRESET_IMAGES[key];
    showToast(`Loaded ${key} photo preset`);
  }
}

// Quick presets for Room Image
function setRoomImagePreset(key) {
  const input = document.getElementById("addRoomImage");
  if (input && PRESET_IMAGES[key]) {
    input.value = PRESET_IMAGES[key];
    showToast(`Loaded ${key} room photo preset`);
  }
}

// Populate target hotel dropdown for adding rooms
function populateHotelDropdown() {
  const select = document.getElementById("targetHotelSelect");
  if (!select) return;

  const hotels = DB.getHotels();
  select.innerHTML = hotels.map(h => `
    <option value="${h.id}">${h.name} (${h.city})</option>
  `).join('');
}

// Handle Create New Hotel
function handleCreateHotel(e) {
  e.preventDefault();

  const name = document.getElementById("newHotelName").value.trim();
  const city = document.getElementById("newHotelCity").value.trim();
  const category = document.getElementById("newHotelCategory").value;
  const address = document.getElementById("newHotelAddress").value.trim();
  const rating = parseFloat(document.getElementById("newHotelRating").value) || 4.9;
  const startingPrice = parseFloat(document.getElementById("newHotelPrice").value) || 6000;
  const imageUrl = document.getElementById("newHotelImage").value.trim();
  const description = document.getElementById("newHotelDesc").value.trim();

  // Amenities
  const checkboxes = document.querySelectorAll("#newHotelAmenitiesList input[type='checkbox']:checked");
  const amenities = Array.from(checkboxes).map(c => c.value);

  // Initial room
  const initialRoomName = document.getElementById("newRoomName").value.trim() || "Deluxe Suite";
  const initialRoomPrice = parseFloat(document.getElementById("newRoomPrice").value) || startingPrice;

  const newHotel = DB.addHotel({
    name,
    city,
    category,
    address,
    rating,
    startingPrice,
    images: [imageUrl],
    description,
    amenities,
    featured: true,
    initialRoom: {
      name: initialRoomName,
      price: initialRoomPrice,
      originalPrice: Math.round(initialRoomPrice * 1.2),
      type: "Deluxe",
      bedType: "1 King Bed",
      capacity: "2 Adults",
      size: "500 sq ft",
      image: imageUrl,
      amenities: ["Free WiFi", "Breakfast Included", "Air Conditioning"],
      availableCount: 4
    }
  });

  showToast(`✅ "${newHotel.name}" published successfully!`);
  e.target.reset();

  // Re-render
  renderHotels();
  populateHotelDropdown();
  
  // Navigate directly to the newly added hotel to see it!
  openHotelDetail(newHotel.id);
}

// Handle Add Room to Existing Hotel
function handleCreateRoom(e) {
  e.preventDefault();

  const hotelId = document.getElementById("targetHotelSelect").value;
  const name = document.getElementById("addRoomTitle").value.trim();
  const price = parseFloat(document.getElementById("addRoomPrice").value);
  const origPrice = parseFloat(document.getElementById("addRoomOrigPrice").value) || Math.round(price * 1.25);
  const bedType = document.getElementById("addRoomBed").value.trim();
  const capacity = document.getElementById("addRoomCapacity").value.trim();
  const image = document.getElementById("addRoomImage").value.trim();
  const amenitiesStr = document.getElementById("addRoomAmenities").value.trim();
  const amenities = amenitiesStr ? amenitiesStr.split(",").map(s => s.trim()) : ["Free WiFi"];

  const room = DB.addRoomToHotel(hotelId, {
    name,
    price,
    originalPrice: origPrice,
    bedType,
    capacity,
    image,
    amenities
  });

  if (room) {
    showToast(`✅ Room "${room.name}" added to hotel!`);
    e.target.reset();
    renderHotels();
    openHotelDetail(hotelId);
  }
}

// Shortcut to open Add Room tab pre-selecting specific hotel
function openAddRoomForHotel(hotelId) {
  switchNav("admin");
  switchAdminTab("newRoom");
  const select = document.getElementById("targetHotelSelect");
  if (select) select.value = hotelId;
}

// Render Catalog Manager in Admin Tab
function renderCatalogManager() {
  const container = document.getElementById("catalogHotelsList");
  const countBadge = document.getElementById("totalHotelsCount");
  if (!container) return;

  const hotels = DB.getHotels();
  if (countBadge) countBadge.textContent = hotels.length;

  container.innerHTML = hotels.map(h => `
    <div class="mgmt-hotel-card">
      <img src="${h.images[0] || PRESET_IMAGES.palace}" class="mgmt-hotel-thumb" alt="${h.name}">
      <div class="mgmt-hotel-info">
        <div class="mgmt-title">${h.name}</div>
        <div class="mgmt-sub">${h.city} · ${(h.rooms || []).length} rooms · From ${formatPrice(h.startingPrice)}</div>
      </div>
      <div class="mgmt-actions">
        <button class="mgmt-action-btn" onclick="openAddRoomForHotel('${h.id}')" title="Add Room">
          <i class="fa-solid fa-plus"></i>
        </button>
        <button class="mgmt-action-btn delete" onclick="handleDeleteHotel('${h.id}')" title="Delete Hotel">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function handleDeleteHotel(hotelId) {
  if (confirm("Are you sure you want to delete this hotel from inventory?")) {
    DB.deleteHotel(hotelId);
    showToast("Hotel removed from catalog");
    renderCatalogManager();
    renderHotels();
  }
}

// Reset data to default samples
function resetDemoData() {
  if (confirm("Reset all hotel and room data to luxury defaults?")) {
    DB.resetDefaults();
    showToast("Reset to factory defaults completed");
    renderHotels();
    populateHotelDropdown();
    renderCatalogManager();
    switchNav("home");
  }
}

// =========================================================
// FILTER & BOTTOM SHEET HELPERS
// =========================================================

function openAdminSheet() {
  switchNav("admin");
}

function openFilterSheet() {
  document.getElementById("sheetOverlay").classList.add("active");
  document.getElementById("filterSheet").classList.add("active");
}

function closeAllSheets() {
  document.getElementById("sheetOverlay").classList.remove("active");
  document.querySelectorAll(".bottom-sheet").forEach(s => s.classList.remove("active"));
}

function updatePriceSliderVal(val) {
  state.filterMaxPrice = parseFloat(val);
  const label = document.getElementById("maxPriceVal");
  if (label) label.textContent = formatPrice(val);
}

function setRatingFilter(rating, btn) {
  state.filterRating = rating;
  btn.parentElement.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
}

function applyFilters() {
  const sort = document.getElementById("filterSortBy").value;
  state.filterSort = sort;
  renderHotels();
  showToast("Filters applied");
}

function resetFilters() {
  state.searchQuery = "";
  state.selectedCategory = "All";
  state.filterRating = 0;
  state.filterMaxPrice = 35000;
  state.filterSort = "featured";

  const searchBox = document.getElementById("quickSearchInput");
  if (searchBox) searchBox.value = "";
  const fullSearch = document.getElementById("fullSearchInput");
  if (fullSearch) fullSearch.value = "";

  document.querySelectorAll(".cat-chip").forEach((c, idx) => {
    c.classList.toggle("active", idx === 0);
  });

  renderHotels();
  showToast("Filters reset");
}

function openCityPicker() {
  const cities = ["All Destinations", "Udaipur", "Goa", "Mumbai", "Manali"];
  const current = document.getElementById("currentCityLabel").textContent;
  const nextIdx = (cities.indexOf(current) + 1) % cities.length;
  const chosen = cities[nextIdx];
  
  document.getElementById("currentCityLabel").textContent = chosen;
  state.searchQuery = chosen === "All Destinations" ? "" : chosen;
  renderHotels();
  showToast(`Showing hotels in ${chosen}`);
}

function shareHotel(name) {
  if (navigator.share) {
    navigator.share({ title: name, url: window.location.href });
  } else {
    showToast(`Link for "${name}" copied to clipboard!`);
  }
}

// Toast Notification
function showToast(msg) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
