const { Pool } = require('pg');
const logger = require('../utils/logger');
const WriteLock = require('../utils/writeLock');
const config = require('./env');

function normalizeConnectionString(connStr) {
  if (!connStr) return connStr;
  // Render and certain hosting providers operate in IPv4-only networks.
  // Supabase direct host (db.<ref>.supabase.co) resolves only to IPv6, causing ENETUNREACH.
  // Automatically route through Supabase IPv4 connection pooler.
  const directMatch = connStr.match(/postgresql:\/\/([^:]+):([^@]+)@db\.([a-zA-Z0-9]+)\.supabase\.co:(\d+)\/(.+)/);
  if (directMatch) {
    const [, user, pass, ref, port, dbName] = directMatch;
    const poolUser = user.includes('.') ? user : `${user}.${ref}`;
    return `postgresql://${poolUser}:${pass}@aws-1-ap-northeast-1.pooler.supabase.com:${port}/${dbName}`;
  }
  return connStr;
}

class DatabaseEngine {
  constructor() {
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
    this.isLoaded = false;
    this.transactionDepth = 0;
    this.writeLock = new WriteLock();
    this.pool = null;
    this.connectionString = normalizeConnectionString(process.env.DATABASE_URL || config.DATABASE_URL);
    this.readyPromise = this.init();
  }

  async init() {
    try {
      if (!this.connectionString) {
        logger.warn('No DATABASE_URL configured. Running with in-memory store.');
        this.isLoaded = true;
        return;
      }

      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await this.pool.connect();
      try {
        logger.info('Connected to PostgreSQL (Supabase) as Primary Database.');

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
            if (row.collection && Array.isArray(row.data) && row.data.length > 0) {
              this.data[row.collection] = row.data;
            }
          }
          logger.info(`Loaded ${res.rows.length} collections directly from PostgreSQL Primary Database.`);
        }
        this.isLoaded = true;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('PostgreSQL Primary Database initialization error:', err.message);
      this.isLoaded = true;
    }
  }

  async ready() {
    if (this.readyPromise) await this.readyPromise;
    return this.isLoaded;
  }

  async syncCollectionToPostgres(col) {
    if (!this.pool) return;
    try {
      const items = this.data[col] || [];
      await this.pool.query(`
        INSERT INTO hotel_factories_store (collection, data, count, updated_at)
        VALUES ($1, $2::jsonb, $3, NOW())
        ON CONFLICT (collection) 
        DO UPDATE SET data = EXCLUDED.data, count = EXCLUDED.count, updated_at = NOW();
      `, [col, JSON.stringify(items), items.length]);
    } catch (err) {
      logger.error(`PostgreSQL sync error on [${col}]:`, err.message);
    }
  }

  async syncToPostgres() {
    if (!this.pool) return;
    try {
      for (const col of Object.keys(this.data)) {
        await this.syncCollectionToPostgres(col);
      }
    } catch (err) {
      logger.error('PostgreSQL bulk sync error:', err.message);
    }
  }

  persist(collectionName = null) {
    if (collectionName) {
      this.syncCollectionToPostgres(collectionName).catch((err) => {
        logger.warn(`PostgreSQL write failed for ${collectionName}:`, err.message);
      });
    } else {
      this.syncToPostgres().catch((err) => {
        logger.warn('PostgreSQL write failed:', err.message);
      });
    }
  }

  persistIfNeeded(collectionName = null) {
    if (this.transactionDepth === 0) {
      this.persist(collectionName);
    }
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

  startLockCleanerCron() {
    this.cleanerTimer = setInterval(() => {
      this.cleanExpiredLocks();
    }, 60000);
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
      this.persistIfNeeded('inventoryLocks');
      this.persistIfNeeded('bookings');
    }
  }

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
    this.persistIfNeeded(collectionName);
    return doc;
  }

  update(collectionName, id, updates) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    this.persistIfNeeded(collectionName);
    return list[index];
  }

  delete(collectionName, id) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;

    list.splice(index, 1);
    this.persistIfNeeded(collectionName);
    return true;
  }
}

const db = new DatabaseEngine();
module.exports = db;
