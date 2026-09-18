import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';

export default function AdminScreen() {
  const { 
    hotels, 
    adminTab, 
    setAdminTab, 
    targetHotelIdForRoom, 
    setTargetHotelIdForRoom, 
    handleAddHotel, 
    handleDeleteHotel, 
    handleAddRoom, 
    resetDemoData, 
    formatPrice,
    openAddRoomForHotel
  } = useApp();

  // Form states - Add Hotel
  const [hotelName, setHotelName] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [hotelCategory, setHotelCategory] = useState('Luxury Stays');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelRating, setHotelRating] = useState('4.9');
  const [hotelPrice, setHotelPrice] = useState('7500');
  const [hotelImage, setHotelImage] = useState(PRESET_IMAGES.palace);
  const [hotelDesc, setHotelDesc] = useState('');
  const [hotelAmenities, setHotelAmenities] = useState([
    'Free WiFi', 'Infinity Pool', 'Luxury Spa', 'Fine Dining', 'Free Breakfast'
  ]);
  const [initRoomName, setInitRoomName] = useState('Deluxe King Suite');
  const [initRoomPrice, setInitRoomPrice] = useState('7500');

  // Form states - Add Room
  const [targetHotelId, setTargetHotelId] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [roomPrice, setRoomPrice] = useState('9500');
  const [roomOrigPrice, setRoomOrigPrice] = useState('11500');
  const [roomBed, setRoomBed] = useState('1 Super King Bed');
  const [roomCapacity, setRoomCapacity] = useState('2 Adults, 1 Child');
  const [roomImage, setRoomImage] = useState(PRESET_IMAGES.suite);
  const [roomMealPlan, setRoomMealPlan] = useState('Free Buffet Breakfast Included');
  const [roomAmenitiesStr, setRoomAmenitiesStr] = useState('Jacuzzi, Balcony, Breakfast Included, Free WiFi');

  useEffect(() => {
    if (targetHotelIdForRoom) {
      setTargetHotelId(targetHotelIdForRoom);
    } else if (hotels.length > 0 && !targetHotelId) {
      setTargetHotelId(hotels[0].id);
    }
  }, [targetHotelIdForRoom, hotels]);

  const allPossibleAmenities = [
    'Free WiFi', 'Infinity Pool', 'Luxury Spa', 'Fine Dining', 
    'Free Breakfast', 'Fitness Center', 'Valet Parking', 'Beach Access', 'Airport Shuttle'
  ];

  const toggleHotelAmenity = (amenity) => {
    if (hotelAmenities.includes(amenity)) {
      setHotelAmenities(hotelAmenities.filter(a => a !== amenity));
    } else {
      setHotelAmenities([...hotelAmenities, amenity]);
    }
  };

  const onSubmitHotel = (e) => {
    e.preventDefault();
    handleAddHotel({
      name: hotelName.trim(),
      city: hotelCity.trim(),
      category: hotelCategory,
      locality: hotelAddress.trim(),
      distance: 'Central Location',
      rating: parseFloat(hotelRating) || 4.8,
      startingPrice: parseFloat(hotelPrice) || 6000,
      images: [hotelImage.trim() || PRESET_IMAGES.palace],
      description: hotelDesc.trim() || 'A premier luxury stay offering world-class hospitality and amenities.',
      amenities: hotelAmenities,
      featured: true,
      initialRoom: {
        name: initRoomName.trim() || 'Deluxe Room',
        price: parseFloat(initRoomPrice) || parseFloat(hotelPrice) || 6000,
        originalPrice: Math.round((parseFloat(initRoomPrice) || 6000) * 1.25),
        type: 'Deluxe',
        bedType: '1 King Bed',
        capacity: '2 Adults',
        size: '500 sq ft',
        image: hotelImage.trim() || PRESET_IMAGES.palace,
        mealPlan: 'Free Breakfast Included',
        cancellationPolicy: 'Free Cancellation till 24 hrs before check-in',
        amenities: ['Free WiFi', 'Breakfast Included', 'Air Conditioning'],
        availableCount: 4
      }
    });

    setHotelName('');
    setHotelCity('');
    setHotelAddress('');
    setHotelDesc('');
  };

  const onSubmitRoom = (e) => {
    e.preventDefault();
    if (!targetHotelId) return;

    const amenities = roomAmenitiesStr ? roomAmenitiesStr.split(',').map(s => s.trim()) : ['Free WiFi'];
    handleAddRoom(targetHotelId, {
      name: roomTitle.trim(),
      price: parseFloat(roomPrice),
      originalPrice: parseFloat(roomOrigPrice) || Math.round(parseFloat(roomPrice) * 1.25),
      bedType: roomBed.trim(),
      capacity: roomCapacity.trim(),
      image: roomImage.trim(),
      mealPlan: roomMealPlan,
      amenities
    });

    setRoomTitle('');
    setTargetHotelIdForRoom('');
  };

  return (
    <div className="app-screen">
      <div className="app-header" style={{ borderBottom: '1px solid var(--app-border)' }}>
        <div>
          <div className="section-heading" style={{ fontSize: '1.2rem' }}>Hotelier Partner Extranet</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--app-muted)' }}>List properties, room tariffs, & inventory</div>
        </div>
        <button className="icon-btn" onClick={resetDemoData} title="Reset to Defaults">
          <i className="fa-solid fa-arrow-rotate-left"></i>
        </button>
      </div>
      
      <div style={{ padding: '0 18px 18px 18px' }}>
        {/* Tab Selector */}
        <div className="admin-header-tabs" style={{ background: 'white', padding: '0 10px', borderRadius: '12px', border: '1px solid var(--app-border)', marginTop: '12px' }}>
          <button 
            className={`admin-tab-btn ${adminTab === 'newHotel' ? 'active' : ''}`}
            onClick={() => setAdminTab('newHotel')}
          >
            <i className="fa-solid fa-hotel"></i> List Property
          </button>
          <button 
            className={`admin-tab-btn ${adminTab === 'newRoom' ? 'active' : ''}`}
            onClick={() => setAdminTab('newRoom')}
          >
            <i className="fa-solid fa-bed"></i> Add Room
          </button>
          <button 
            className={`admin-tab-btn ${adminTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setAdminTab('catalog')}
          >
            <i className="fa-solid fa-list-check"></i> Manage ({hotels.length})
          </button>
        </div>

        {/* PANE 1: LIST HOTEL */}
        {adminTab === 'newHotel' && (
          <div className="admin-content-pane active-pane" style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--app-border)', marginTop: '14px' }}>
            <form onSubmit={onSubmitHotel}>
              <div className="form-group">
                <label className="form-label">Hotel Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. The Taj Lakefront Resort" 
                  required 
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Udaipur / Goa / Mumbai" 
                    required 
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select" 
                    value={hotelCategory}
                    onChange={(e) => setHotelCategory(e.target.value)}
                  >
                    <option value="Luxury Stays">Luxury Stays</option>
                    <option value="Beachfront">Beachfront</option>
                    <option value="Mountain Escapes">Mountain Escapes</option>
                    <option value="City Center">City Center</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Locality / Landmark *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Lake Pichola, 2 km from City Center" 
                  required 
                  value={hotelAddress}
                  onChange={(e) => setHotelAddress(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Star Rating</label>
                  <select 
                    className="form-select" 
                    value={hotelRating}
                    onChange={(e) => setHotelRating(e.target.value)}
                  >
                    <option value="5.0">5.0 ⭐ (Ultra Luxury)</option>
                    <option value="4.9">4.9 ⭐ (Exceptional)</option>
                    <option value="4.8">4.8 ⭐ (Superb)</option>
                    <option value="4.5">4.5 ⭐ (Very Good)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Starting Tariff / Night *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 7500" 
                    required 
                    value={hotelPrice}
                    onChange={(e) => setHotelPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cover Photo URL</label>
                <div className="preset-pills-row">
                  <span className="preset-pill" onClick={() => setHotelImage(PRESET_IMAGES.palace)}>🏰 Palace</span>
                  <span className="preset-pill" onClick={() => setHotelImage(PRESET_IMAGES.beach)}>🏖️ Beach Resort</span>
                  <span className="preset-pill" onClick={() => setHotelImage(PRESET_IMAGES.mountain)}>🏔️ Mountain Villa</span>
                  <span className="preset-pill" onClick={() => setHotelImage(PRESET_IMAGES.city)}>🏙️ City Tower</span>
                </div>
                <input 
                  type="url" 
                  className="form-input" 
                  value={hotelImage}
                  onChange={(e) => setHotelImage(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Key Amenities</label>
                <div className="checkbox-amenities-grid">
                  {allPossibleAmenities.map(amenity => (
                    <label key={amenity} className="check-item">
                      <input 
                        type="checkbox" 
                        checked={hotelAmenities.includes(amenity)}
                        onChange={() => toggleHotelAmenity(amenity)}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Property Description</label>
                <textarea 
                  className="form-input" 
                  rows="2" 
                  placeholder="Highlight heritage, location, or signature hospitality features..."
                  value={hotelDesc}
                  onChange={(e) => setHotelDesc(e.target.value)}
                ></textarea>
              </div>

              {/* Initial Room */}
              <div style={{ background: '#F8FAFC', border: '1px solid var(--app-border)', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', color: 'var(--primary)' }}>
                  <i className="fa-solid fa-bed" style={{ marginRight: '4px' }}></i> Initial Room Configuration
                </div>
                <div className="form-row-2">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Room Name" 
                    value={initRoomName}
                    onChange={(e) => setInitRoomName(e.target.value)}
                  />
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Tariff" 
                    value={initRoomPrice}
                    onChange={(e) => setInitRoomPrice(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary-block">
                <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i> Publish & List Property
              </button>
            </form>
          </div>
        )}

        {/* PANE 2: ADD ROOM */}
        {adminTab === 'newRoom' && (
          <div className="admin-content-pane active-pane" style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--app-border)', marginTop: '14px' }}>
            <form onSubmit={onSubmitRoom}>
              <div className="form-group">
                <label className="form-label">Select Property *</label>
                <select 
                  className="form-select" 
                  required 
                  value={targetHotelId}
                  onChange={(e) => setTargetHotelId(e.target.value)}
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Room Type / Category *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Royal Balcony Jacuzzi Suite" 
                  required 
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Tariff / Night *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 9500" 
                    required 
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Original Price</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 12000" 
                    value={roomOrigPrice}
                    onChange={(e) => setRoomOrigPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Bed Type</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={roomBed}
                    onChange={(e) => setRoomBed(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Capacity</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Meal Plan Inclusion</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={roomMealPlan}
                  onChange={(e) => setRoomMealPlan(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Room Photo URL</label>
                <div className="preset-pills-row">
                  <span className="preset-pill" onClick={() => setRoomImage(PRESET_IMAGES.suite)}>🛏️ Master Suite</span>
                  <span className="preset-pill" onClick={() => setRoomImage(PRESET_IMAGES.villa)}>🏡 Private Villa</span>
                  <span className="preset-pill" onClick={() => setRoomImage(PRESET_IMAGES.balcony)}>🌅 Balcony View</span>
                </div>
                <input 
                  type="url" 
                  className="form-input" 
                  value={roomImage}
                  onChange={(e) => setRoomImage(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amenities (comma separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={roomAmenitiesStr}
                  onChange={(e) => setRoomAmenitiesStr(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-block">
                <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Add Room to Property
              </button>
            </form>
          </div>
        )}

        {/* PANE 3: MANAGE CATALOG */}
        {adminTab === 'catalog' && (
          <div className="admin-content-pane active-pane" style={{ marginTop: '14px' }}>
            {hotels.map(h => (
              <div key={h.id} className="mgmt-hotel-card">
                <img 
                  src={(h.images && h.images[0]) || PRESET_IMAGES.palace} 
                  className="mgmt-hotel-thumb" 
                  alt={h.name} 
                />
                <div className="mgmt-hotel-info">
                  <div className="mgmt-title">{h.name}</div>
                  <div className="mgmt-sub">
                    {h.city} · {(h.rooms || []).length} room types · From {formatPrice(h.startingPrice)}
                  </div>
                </div>
                <div className="mgmt-actions">
                  <button 
                    className="mgmt-action-btn" 
                    onClick={() => openAddRoomForHotel(h.id)} 
                    title="Add Room"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                  <button 
                    className="mgmt-action-btn delete" 
                    onClick={() => handleDeleteHotel(h.id)} 
                    title="Delete Hotel"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
