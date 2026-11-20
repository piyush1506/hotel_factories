-- =====================================================================
-- HOTEL FACTORIES PRODUCTION POSTGRESQL DATABASE SCHEMA
-- Multi-Vendor Hotel Marketplace, Inventory Locking & Payout Ledger
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & ROLES
CREATE TYPE user_role AS ENUM ('customer', 'hotel_owner', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. HOTELS / PROPERTIES
CREATE TYPE hotel_verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    category VARCHAR(100) DEFAULT 'Standard',
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    star_rating INT DEFAULT 4,
    rating DECIMAL(3, 2) DEFAULT 4.8,
    reviews_count INT DEFAULT 0,
    starting_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT '₹',
    commission_rate DECIMAL(5, 2) DEFAULT 15.00, -- e.g. 15.00%
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status hotel_verification_status DEFAULT 'PENDING',
    
    -- Bank Account Info for Automated Payouts
    bank_account_holder VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    payout_account_id VARCHAR(100), -- Razorpay Route / Stripe Connected ID

    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    policies JSONB DEFAULT '{"checkIn": "14:00", "checkOut": "11:00", "cancellation": "Free cancellation up to 24h before check-in."}'::jsonb,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_hotels_owner ON hotels(owner_id);
CREATE INDEX idx_hotels_starting_price ON hotels(starting_price);
CREATE INDEX idx_hotels_rating ON hotels(rating);
CREATE INDEX idx_hotels_featured ON hotels(featured);

-- 3. ROOM TYPES & PRICING
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Deluxe', -- Suite, Deluxe, Villa, Standard, Chalet
    base_price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    bed_type VARCHAR(100) DEFAULT '1 King Bed',
    capacity_adults INT DEFAULT 2,
    capacity_children INT DEFAULT 1,
    size_sq_ft INT DEFAULT 400,
    image_url TEXT,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    total_inventory INT DEFAULT 5,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX idx_rooms_price ON rooms(base_price);

-- 4. CONCURRENCY & TEMPORARY ROOM LOCKS (10-Minute Hold)
CREATE TABLE inventory_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    rooms_count INT DEFAULT 1,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locks_room_dates ON inventory_locks(room_id, check_in_date, check_out_date);
CREATE INDEX idx_locks_expiry ON inventory_locks(expires_at);

-- 5. BOOKINGS & FINANCIAL BREAKDOWN
CREATE TYPE booking_status_type AS ENUM (
    'HELD',
    'PENDING_PAYMENT',
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE payment_status_type AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);

CREATE TYPE payout_status_type AS ENUM (
    'PENDING_ESCROW',
    'READY_FOR_PAYOUT',
    'PROCESSING',
    'SETTLED',
    'FAILED'
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(30) UNIQUE NOT NULL, -- e.g. "HF-2026-X8K9M"
    hotel_id UUID NOT NULL REFERENCES hotels(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Guest Details
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(30) NOT NULL,
    guest_adults INT DEFAULT 2,
    guest_children INT DEFAULT 0,
    special_requests TEXT,

    -- Stay Schedule
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INT NOT NULL,
    rooms_count INT DEFAULT 1,

    -- Financial Breakdown (INR)
    base_room_price DECIMAL(10, 2) NOT NULL,
    total_base_tariff DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    coupon_applied VARCHAR(50),
    discounted_tariff DECIMAL(10, 2) NOT NULL,
    
    -- Taxes (5% for <= 7500, 18% for > 7500)
    gst_rate_percentage DECIMAL(5, 2) NOT NULL,
    hotel_gst_amount DECIMAL(10, 2) NOT NULL,
    platform_convenience_fee DECIMAL(10, 2) DEFAULT 99.00,
    convenience_fee_gst DECIMAL(10, 2) DEFAULT 17.82,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Platform Earning & Hotel Settlement
    commission_rate_percentage DECIMAL(5, 2) DEFAULT 15.00,
    platform_commission_gross DECIMAL(10, 2) NOT NULL,
    commission_gst DECIMAL(10, 2) NOT NULL,
    gateway_fee DECIMAL(10, 2) NOT NULL,
    tds_deduction DECIMAL(10, 2) DEFAULT 0.00,
    net_hotel_payout DECIMAL(10, 2) NOT NULL,
    admin_net_profit DECIMAL(10, 2) NOT NULL,

    -- Status & Tracking
    status booking_status_type DEFAULT 'HELD',
    payment_status payment_status_type DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(100),
    payout_status payout_status_type DEFAULT 'PENDING_ESCROW',
    
    qr_code_data TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    refund_amount DECIMAL(10, 2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_hotel ON bookings(hotel_id);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- 6. HOTEL PAYOUTS LEDGER
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    hotel_id UUID NOT NULL REFERENCES hotels(id),
    hotel_owner_id UUID REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    bank_account_snapshot JSONB NOT NULL,
    transfer_reference_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'SETTLED',
    settled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settled_by VARCHAR(255)
);

CREATE INDEX idx_payouts_hotel ON payouts(hotel_id);
CREATE INDEX idx_payouts_owner ON payouts(hotel_owner_id);

-- 7. COUPONS & PROMOTIONS
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) DEFAULT 'PERCENT', -- FLAT or PERCENT
    discount_value DECIMAL(10, 2) NOT NULL,
    min_booking_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount_cap DECIMAL(10, 2),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. REVIEWS & RATINGS
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT,
    rating DECIMAL(2, 1) NOT NULL,
    cleanliness_rating DECIMAL(2, 1) DEFAULT 5.0,
    service_rating DECIMAL(2, 1) DEFAULT 5.0,
    location_rating DECIMAL(2, 1) DEFAULT 5.0,
    value_rating DECIMAL(2, 1) DEFAULT 5.0,
    title VARCHAR(255),
    comment TEXT,
    stay_date DATE,
    hotel_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_hotel ON reviews(hotel_id);
