const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function migrate() {
  const connectionString = 'postgresql://postgres:j5xuHFP2l01cmqoc@db.ezmzwdewurflhavtpihg.supabase.co:5432/postgres';
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase PostgreSQL...');
  const client = await pool.connect();

  try {
    console.log('Creating database schemas and tables in Supabase...');

    await client.query(`
      -- Core collection storage table for atomic document persistence
      CREATE TABLE IF NOT EXISTS hotel_factories_store (
        collection VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        count INT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Relational Tables for Supabase Dashboard & SQL Explorer
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'customer',
        avatar TEXT,
        password VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hotels (
        id VARCHAR(100) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        property_type VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        address TEXT,
        locality VARCHAR(255),
        starting_price DECIMAL(10, 2),
        rating DECIMAL(3, 2) DEFAULT 4.5,
        reviews_count INT DEFAULT 0,
        star_rating INT DEFAULT 4,
        images TEXT[],
        amenities TEXT[],
        description TEXT,
        policies JSONB,
        cancellation_policy JSONB,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(100) PRIMARY KEY,
        hotel_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) DEFAULT 'Deluxe',
        base_price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        bed_type VARCHAR(100),
        capacity VARCHAR(100),
        size VARCHAR(100),
        amenities TEXT[],
        images TEXT[],
        total_inventory INT DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(100) PRIMARY KEY,
        booking_code VARCHAR(100) UNIQUE NOT NULL,
        user_id VARCHAR(100),
        hotel_id VARCHAR(100) NOT NULL,
        room_id VARCHAR(100) NOT NULL,
        hotel_name VARCHAR(255),
        room_name VARCHAR(255),
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) NOT NULL,
        guest_phone VARCHAR(50),
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        nights INT DEFAULT 1,
        rooms_count INT DEFAULT 1,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'CONFIRMED',
        payment_status VARCHAR(50) DEFAULT 'PAID',
        payment_method VARCHAR(50),
        payment_transaction_id VARCHAR(255),
        booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percentage INT,
        discount_amount DECIMAL(10, 2),
        max_discount DECIMAL(10, 2),
        min_booking_amount DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(100) PRIMARY KEY,
        hotel_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        user_name VARCHAR(255),
        rating DECIMAL(3, 2),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully in Supabase.');

    // Load local JSON data
    const localStorePath = path.join(__dirname, '../data/hotel_factories_store.json');
    if (fs.existsSync(localStorePath)) {
      const raw = fs.readFileSync(localStorePath, 'utf8');
      const storeData = JSON.parse(raw);
      const collections = Object.keys(storeData);

      console.log(`Migrating ${collections.length} collections into Supabase...`);

      for (const col of collections) {
        const items = storeData[col] || [];
        await client.query(`
          INSERT INTO hotel_factories_store (collection, data, count, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (collection) DO UPDATE SET data = EXCLUDED.data, count = EXCLUDED.count, updated_at = NOW();
        `, [col, JSON.stringify(items), items.length]);
        console.log(`  ✓ Synced collection "${col}" (${items.length} items)`);
      }

      // Sync relational tables
      // 1. Users
      if (Array.isArray(storeData.users)) {
        for (const u of storeData.users) {
          await client.query(`
            INSERT INTO users (id, name, email, phone, role, avatar, password)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
              role = EXCLUDED.role, avatar = EXCLUDED.avatar;
          `, [u.id, u.name, u.email, u.phone || null, u.role || 'customer', u.avatar || null, u.password || null]);
        }
        console.log(`  ✓ Synced ${storeData.users.length} rows to "users" table`);
      }

      // 2. Hotels
      if (Array.isArray(storeData.hotels)) {
        for (const h of storeData.hotels) {
          await client.query(`
            INSERT INTO hotels (id, slug, name, category, property_type, city, state, country, address, locality, starting_price, rating, reviews_count, star_rating, images, amenities, description, policies, cancellation_policy, featured)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, starting_price = EXCLUDED.starting_price, rating = EXCLUDED.rating;
          `, [
            h.id, h.slug || h.id, h.name, h.category || null, h.propertyType || null,
            h.city || 'India', h.state || 'India', h.country || 'India',
            h.address || null, h.locality || null,
            Number(h.startingPrice || 0), Number(h.rating || 4.5), Number(h.reviewsCount || 0),
            Number(h.starRating || h.stars || 4),
            h.images || (h.image ? [h.image] : []),
            h.amenities || [],
            h.description || null,
            h.policies ? JSON.stringify(h.policies) : null,
            h.cancellationPolicy ? JSON.stringify(h.cancellationPolicy) : null,
            Boolean(h.featured)
          ]);
        }
        console.log(`  ✓ Synced ${storeData.hotels.length} rows to "hotels" table`);
      }

      // 3. Rooms
      if (Array.isArray(storeData.rooms)) {
        for (const r of storeData.rooms) {
          await client.query(`
            INSERT INTO rooms (id, hotel_id, name, type, base_price, original_price, bed_type, capacity, size, amenities, images, total_inventory)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, base_price = EXCLUDED.base_price;
          `, [
            r.id, r.hotelId, r.name, r.type || 'Deluxe',
            Number(r.basePrice || r.price || 0), Number(r.originalPrice || 0) || null,
            r.bedType || null, r.capacity || null, r.size || null,
            r.amenities || [], r.images || [], Number(r.totalInventory || 5)
          ]);
        }
        console.log(`  ✓ Synced ${storeData.rooms.length} rows to "rooms" table`);
      }

      // 4. Bookings
      if (Array.isArray(storeData.bookings)) {
        for (const b of storeData.bookings) {
          await client.query(`
            INSERT INTO bookings (id, booking_code, user_id, hotel_id, room_id, hotel_name, room_name, guest_name, guest_email, guest_phone, check_in_date, check_out_date, nights, rooms_count, total_amount, status, payment_status, payment_method, payment_transaction_id, booked_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status, payment_status = EXCLUDED.payment_status;
          `, [
            b.id, b.bookingCode || b.id, b.userId || null, b.hotelId, b.roomId,
            b.hotelName || null, b.roomName || null, b.guestName || 'Guest',
            b.guestEmail || '', b.guestPhone || null,
            b.checkInDate || '2026-11-20', b.checkOutDate || '2026-11-22',
            Number(b.nights || 1), Number(b.roomsCount || 1), Number(b.totalAmount || 0),
            b.status || 'CONFIRMED', b.paymentStatus || 'PAID',
            b.paymentMethod || null, b.paymentTransactionId || null,
            b.bookedAt || new Date().toISOString()
          ]);
        }
        console.log(`  ✓ Synced ${storeData.bookings.length} rows to "bookings" table`);
      }
    }

    console.log('🎉 Supabase database migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);

