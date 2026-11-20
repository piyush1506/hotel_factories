# 🏨 Hotel Factories — Express.js Backend

Modular Express.js backend for the Hotel Factories prototype, including Indian GST calculations, temporary room holds, Razorpay checkout integration, and admin/hotelier financial ledgers.

> **Production status:** The default database is a single-process JSON store. Writes are serialized and booking transitions are committed atomically within one Node.js process, but this is not a distributed or ACID production database. Before horizontal scaling or accepting real money, migrate bookings, inventory, payments, webhook events, refunds, and payouts to PostgreSQL transactions with database constraints.

---

## 🚀 Quick Start

### 1. Installation & Start
```bash
cd backend
npm install
npm run dev
```

The server will start on `http://localhost:5050`.

### 2. Default Seed Accounts (for Testing)
| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hotelfactories.com` | `Password@123` | Platform Admin (Settlements, Commission rates, GMV analytics) |
| **Hotelier** | `hotelier1@hotelfactories.com` | `Password@123` | Oberoi Grand Palace & Skyline Mumbai Hotel Owner |
| **Hotelier** | `hotelier2@hotelfactories.com` | `Password@123` | Azure Bay Goa & Pinecrest Manali Resort Owner |
| **Customer** | `rahul@example.com` | `Password@123` | Regular guest user |

---

## 🏗️ Architecture & Modules

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js                # Environment config loader
│   │   └── database.js           # Serialized single-process JSON prototype store
│   ├── constants/
│   │   ├── roles.js              # CUSTOMER, HOTELIER, ADMIN
│   │   ├── bookingStatus.js      # HELD, CONFIRMED, CHECKED_IN, CANCELLED
│   │   └── gstRates.js           # 5% (<= ₹7,500) vs 18% (> ₹7,500), 18% Commission GST
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & Role-based Access Control (RBAC)
│   │   └── errorHandler.js       # Centralized error handler
│   ├── services/
│   │   ├── authService.js        # Register, Login, Phone/Email OTP
│   │   ├── hotelService.js       # Hotel discovery, city filters, management
│   │   ├── roomService.js        # Room inventory CRUD & capacity
│   │   ├── inventoryService.js   # Anti-double-booking 10-min hold lock engine
│   │   ├── pricingService.js     # Indian GST & financial breakdown calculation
│   │   ├── bookingService.js     # Booking lifecycle, QR pass generation
│   │   ├── paymentService.js     # Razorpay orders, signature checks & webhook handling
│   │   ├── payoutService.js      # Local settlement queue/ledger (no bank transfer provider yet)
│   │   ├── couponService.js      # Promo discounts & validations
│   │   ├── reviewService.js      # Verified guest reviews & score recalculation
│   │   └── analyticsService.js   # GMV, occupancy, earnings metrics
│   ├── controllers/              # Request handlers
│   ├── routes/                   # Clean REST endpoints
│   ├── utils/
│   │   ├── helpers.js            # Booking code, GST formulas, QR generator
│   │   ├── logger.js             # Formatted timestamp logger
│   │   └── seedData.js           # Realistic initial hotels across India
│   ├── app.js                    # Express app configuration
│   └── server.js                 # HTTP listener & graceful shutdown
├── schema.sql                    # Production PostgreSQL Schema (Indexes & Foreign Keys)
└── .env                          # Configuration variables
```

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register new customer or hotelier
- `POST /api/v1/auth/login` — Login with email and password
- `POST /api/v1/auth/otp-verify` — Quick login via phone/email OTP (Test OTP: `1234`)
- `GET /api/v1/auth/me` — Get current authenticated user profile
- `PUT /api/v1/auth/profile` — Update user profile

### 🏨 Hotels (`/api/v1/hotels`)
- `GET /api/v1/hotels` — Search hotels (Query params: `city`, `category`, `minPrice`, `maxPrice`, `minRating`, `amenities`, `search`, `sortBy`, `page`, `limit`)
- `GET /api/v1/hotels/cities` — Get popular destination cities with hotel counts
- `GET /api/v1/hotels/:id` — Get single hotel details by ID or slug (with rooms and reviews)
- `POST /api/v1/hotels` — Create new hotel listing (*Hotelier / Admin*)
- `PUT /api/v1/hotels/:id` — Update hotel property (*Owner / Admin*)
- `DELETE /api/v1/hotels/:id` — Delete hotel (*Owner / Admin*)

### 🛏️ Rooms & Inventory (`/api/v1/rooms`)
- `GET /api/v1/rooms/hotel/:hotelId` — Get all rooms for a hotel
- `GET /api/v1/rooms/availability` — Check live room availability for date range (`roomId`, `checkInDate`, `checkOutDate`, `roomsCount`)
- `GET /api/v1/rooms/:id` — Get single room details
- `POST /api/v1/rooms` — Add new room type (*Hotelier / Admin*)
- `PUT /api/v1/rooms/:id` — Update room (*Owner / Admin*)
- `DELETE /api/v1/rooms/:id` — Delete room (*Owner / Admin*)

### 📅 Bookings & Pricing (`/api/v1/bookings`)
- `GET /api/v1/bookings/quote` — Live price quote with GST, discounts, and fee breakdown
- `POST /api/v1/bookings/hold` — **Step 1:** Lock room for 10 minutes and create pending reservation
- `POST /api/v1/bookings/confirm` — **Step 2:** Confirm booking upon payment and generate QR code
- `POST /api/v1/bookings/check-in` — Check-in guest via booking code or QR scanner (*Hotelier / Admin*)
- `POST /api/v1/bookings/:id/cancel` — Cancel booking with policy refund calculation
- `GET /api/v1/bookings/my` — Get logged-in customer's booking history
- `GET /api/v1/bookings/:id` — Get booking reservation pass by ID or booking code

### 💳 Payments & Escrow (`/api/v1/payments`)
- `POST /api/v1/payments/order` — Create Razorpay order
- `POST /api/v1/payments/verify` — Verify payment signature and confirm booking
- `POST /api/v1/payments/webhook` — Razorpay server-to-server webhook handler

### 💰 Hotel Payouts & Settlement (`/api/v1/payouts`)
- `GET /api/v1/payouts/overview` — Admin financial dashboard (GMV, Commission, Pending hotel funds)
- `POST /api/v1/payouts/execute` — Admin executes bank payout transfer to hotel (*Admin only*)
- `GET /api/v1/payouts/hotelier-ledger` — Hotelier view of completed stays & payout history

### 🎟️ Coupons (`/api/v1/coupons`)
- `GET /api/v1/coupons` — List active coupons (`WELCOME500`, `LUXURY15`, `WEEKEND10`)
- `POST /api/v1/coupons/validate` — Validate coupon code against booking amount
- `POST /api/v1/coupons` — Create promotional coupon (*Admin only*)

### ⭐ Reviews (`/api/v1/reviews`)
- `GET /api/v1/reviews/hotel/:hotelId` — Get reviews for a hotel
- `POST /api/v1/reviews/hotel/:hotelId` — Submit guest review & rating
- `POST /api/v1/reviews/:reviewId/reply` — Hotelier reply to review

### 📊 Admin Portal (`/api/v1/admin`)
- `GET /api/v1/admin/metrics` — Platform overview (Total GMV, Net Profit, Bookings count, Trends)
- `GET /api/v1/admin/hotels` — View all registered hotels with performance metrics
- `PUT /api/v1/admin/hotels/:id/commission` — Update custom commission rate (e.g., 12%, 15%, 18%)
- `PUT /api/v1/admin/hotels/:id/verify` — Approve or reject hotel verification
- `GET /api/v1/admin/bookings` — All platform bookings ledger
- `GET /api/v1/admin/users` — List registered customers and hotel owners
- `POST /api/v1/admin/reset-seed` — Reset database to seed defaults

### 🏨 Hotelier Extranet (`/api/v1/hotelier`)
- `GET /api/v1/hotelier/dashboard` — Hotelier KPI dashboard (Today check-ins, occupancy, revenue)
- `GET /api/v1/hotelier/hotels` — Properties owned by the logged-in hotelier
- `GET /api/v1/hotelier/bookings` — Reservations for hotelier properties
- `GET /api/v1/hotelier/calendar` — Date-wise room inventory & price calendar
- `PUT /api/v1/hotelier/bank-details` — Update hotel payout bank details
