const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const logger = require('../utils/logger');
const WriteLock = require('../utils/writeLock');

class DatabaseEngine {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.dbPath = path.join(this.dataDir, 'hotel_factories_store.json');
    this.data = {
      users: [],
      hotels: [],
      rooms: [],
      inventoryLocks: [], // Temporary 10-min room holds: { id, roomId, date, count, expiresAt, userId }
      bookings: [],
      payouts: [],
      webhookEvents: [],
      coupons: [],
      categories: [],
      reviews: [],
      favorites: []
    };
    this.isLoaded = false;
    this.transactionDepth = 0;
    this.writeLock = new WriteLock();
    this.pool = null;
    this.isPostgres = (process.env.DB_TYPE === 'postgres' || Boolean(process.env.DATABASE_URL));
    this.init();
  }

  init() {
    try {
      this.initJson();
      if (this.isPostgres && process.env.DATABASE_URL) {
        this.initPostgres().catch((err) => {
          logger.warn('PostgreSQL initial connection warning:', err.message);
        });
      }
    } catch (err) {
      logger.error('Database initialization failed:', err);
      throw err;
    }
  }

  // Wrapper to force JSON mode when DB_TYPE is json
  initJsonSafe() {
    try {
      this.initJson();
    } catch (err) {
      logger.error('JSON database initialization failed, falling back to safe mode:', err);
      this.data = {
        users: [],
        hotels: [],
        rooms: [],
        inventoryLocks: [],
        bookings: [],
        payouts: [],
        webhookEvents: [],
        coupons: [],
        categories: [],
        reviews: [],
        favorites: []
      };
      this.isLoaded = true;
    }
  }

  initJson() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(fileContent);
        logger.info('Database loaded from local cache.');
      } else {
        logger.info('Database local cache initialized.');
        this.persistLocalOnly();
      }
      this.isLoaded = true;
    } catch (err) {
      logger.error('Database local cache initialization failed:', err);
      throw err;
    }
  }

  async initPostgres() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return;

    try {
      this.pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await this.pool.connect();
      try {
        logger.info('Connected to PostgreSQL database (Supabase).');

        // Check if hotel_factories_store exists and load data from it
        await client.query(`
          CREATE TABLE IF NOT EXISTS hotel_factories_store (
            collection VARCHAR(100) PRIMARY KEY,
            data JSONB NOT NULL,
            count INT DEFAULT 0,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        const res = await client.query('SELECT collection, data FROM hotel_factories_store;');
        if (res.rows && res.rows.length > 0) {
          for (const row of res.rows) {
            if (row.collection && Array.isArray(row.data)) {
              this.data[row.collection] = row.data;
            }
          }
          logger.info(`Loaded ${res.rows.length} collections directly from Supabase PostgreSQL.`);
          this.persistLocalOnly();
        } else {
          logger.info('Supabase store table empty. Initializing with current data...');
          await this.syncToPostgres();
        }
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('PostgreSQL Database initialization failed:', err.message);
    }
  }

  persist() {
    this.persistLocalOnly();
    if (this.pool) {
      this.syncToPostgres().catch((err) => {
        logger.warn('PostgreSQL sync failed:', err.message);
      });
    }
  }

  persistLocalOnly() {
    try {
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      logger.error('Failed to persist database to disk:', err);
    }
  }

  async syncToPostgres() {
    if (!this.pool) return;
    try {
      const client = await this.pool.connect();
      try {
        for (const col of Object.keys(this.data)) {
          const items = this.data[col] || [];
          await client.query(`
            INSERT INTO hotel_factories_store (collection, data, count, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (collection) DO UPDATE SET data = EXCLUDED.data, count = EXCLUDED.count, updated_at = NOW();
          `, [col, JSON.stringify(items), items.length]);
        }
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('PostgreSQL sync error:', err.message);
    }
  }

  persistIfNeeded() {
    if (this.transactionDepth === 0) this.persist();
  }

  async withWriteLock(work) {
    return this.writeLock.run(work);
  }

  async transaction(work) {
    const snapshot = structuredClone(this.data);
    this.transactionDepth += 1;
    try {
      const result = await work();
      this.transactionDepth -= 1;
      if (this.transactionDepth === 0) this.persist();
      return result;
    } catch (error) {
      this.data = snapshot;
      this.transactionDepth -= 1;
      throw error;
    }
  }

  // Periodic cleaner to auto-release expired 10-minute checkout room locks
  startLockCleanerCron() {
    this.cleanerTimer = setInterval(() => {
      this.cleanExpiredLocks();
    }, 60000); // Check every minute
    this.cleanerTimer.unref?.();
  }

  cleanExpiredLocks() {
    const now = new Date().toISOString();
    const initialCount = this.data.inventoryLocks.length;
    this.data.inventoryLocks = this.data.inventoryLocks.filter(
      (lock) => lock.expiresAt > now
    );
    let expiredBookings = 0;
    this.data.bookings = this.data.bookings.map((booking) => {
      if (booking.status === 'HELD' && booking.lockExpiresAt && booking.lockExpiresAt <= now) {
        expiredBookings += 1;
        return { ...booking, status: 'EXPIRED', lockId: null, updatedAt: now };
      }
      return booking;
    });
    if (this.data.inventoryLocks.length !== initialCount || expiredBookings > 0) {
      logger.info(`Cleaned ${initialCount - this.data.inventoryLocks.length} expired room hold locks.`);
      this.persistIfNeeded();
    }
  }

  // Collection Accessors
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, queryFn) {
    const list = this.getCollection(collectionName);
    if (!queryFn) return [...list];
    return list.filter(queryFn);
  }

  findOne(collectionName, queryFn) {
    const list = this.getCollection(collectionName);
    return list.find(queryFn) || null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, (item) => item.id === id);
  }

  insert(collectionName, doc) {
    const list = this.getCollection(collectionName);
    list.unshift(doc);
    this.persistIfNeeded();
    return doc;
  }

  update(collectionName, id, updates) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    this.persistIfNeeded();
    return list[index];
  }

  delete(collectionName, id) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;

    list.splice(index, 1);
    this.persistIfNeeded();
    return true;
  }
}

const db = new DatabaseEngine();
module.exports = db;
