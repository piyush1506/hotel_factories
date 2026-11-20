const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const config = require('../config/env');
const ROLES = require('../constants/roles');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  async register({ name, email, phone, password }) {
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedName.length < 2 || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      const error = new Error('A valid name and email address are required.');
      error.statusCode = 400;
      throw error;
    }
    if (String(password || '').length < 8) {
      const error = new Error('Password must contain at least 8 characters.');
      error.statusCode = 400;
      throw error;
    }
    const existing = db.findOne('users', (u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('User already exists with this email address.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      name: normalizedName,
      email: normalizedEmail,
      phone: phone || '',
      password: hashedPassword,
      role: ROLES.CUSTOMER,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedName)}`,
      createdAt: new Date().toISOString()
    };

    db.insert('users', newUser);

    const safeUser = { ...newUser };
    delete safeUser.password;
    const token = this.generateToken(newUser);

    return { user: safeUser, token };
  }

  async login({ email, password }) {
    const user = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const safeUser = { ...user };
    delete safeUser.password;
    const token = this.generateToken(user);

    return { user: safeUser, token };
  }

  // Simulated Instant OTP Login (Phone or Email)
  async verifyOtpLogin({ phone, email, otp, name }) {
    if (!config.ENABLE_TEST_OTP) {
      const error = new Error('OTP login is not configured. Use email and password.');
      error.statusCode = 503;
      throw error;
    }
    if (otp !== '1234' && otp !== '123456') {
      throw new Error('Invalid OTP. Use test OTP: 1234');
    }

    let user = null;
    if (phone) {
      user = db.findOne('users', (u) => u.phone === phone);
    } else if (email) {
      user = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      const defaultName = name || (phone ? `Guest ${phone.slice(-4)}` : 'Guest User');
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      user = {
        id: `usr-${uuidv4().slice(0, 8)}`,
        name: defaultName,
        email: email ? email.toLowerCase() : `${phone || Date.now()}@guest.hotelfactories.com`,
        phone: phone || '',
        password: hashedPassword,
        role: ROLES.CUSTOMER,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(defaultName)}`,
        createdAt: new Date().toISOString()
      };
      db.insert('users', user);
    }

    const safeUser = { ...user };
    delete safeUser.password;
    const token = this.generateToken(user);

    return { user: safeUser, token };
  }

  async googleAuth({ credential, email, name, avatar, googleId }) {
    let resolvedEmail = email;
    let resolvedName = name;
    let resolvedAvatar = avatar;

    if (credential && !resolvedEmail) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          resolvedEmail = decoded.email;
          resolvedName = resolvedName || decoded.name || decoded.given_name;
          resolvedAvatar = resolvedAvatar || decoded.picture;
        }
      } catch (e) {
        // Fallback if not standard JWT format
      }
    }

    const normalizedEmail = String(resolvedEmail || '').trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      const error = new Error('A valid Google email address is required.');
      error.statusCode = 400;
      throw error;
    }

    let user = db.findOne('users', (u) => u.email && u.email.toLowerCase() === normalizedEmail);

    if (user) {
      // User exists - update avatar/provider if helpful
      const updates = {};
      if (!user.avatar && resolvedAvatar) updates.avatar = resolvedAvatar;
      if (!user.authProvider) updates.authProvider = 'google';
      if (Object.keys(updates).length > 0) {
        user = db.update('users', user.id, updates) || user;
      }
    } else {
      // New user registration via Google
      const autoName = String(resolvedName || normalizedEmail.split('@')[0]).trim();
      const randomPassword = await bcrypt.hash(uuidv4(), 10);
      user = {
        id: `usr-${uuidv4().slice(0, 8)}`,
        name: autoName,
        email: normalizedEmail,
        phone: '',
        password: randomPassword,
        role: ROLES.CUSTOMER,
        avatar: resolvedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(autoName)}`,
        authProvider: 'google',
        createdAt: new Date().toISOString()
      };
      db.insert('users', user);
    }

    const safeUser = { ...user };
    delete safeUser.password;
    const token = this.generateToken(user);

    return { user: safeUser, token };
  }

  async getProfile(userId) {
    const user = db.findById('users', userId);
    if (!user) throw new Error('User not found.');
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }

  async updateProfile(userId, updates) {
    const allowed = ['name', 'phone', 'avatar'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }
    const updated = db.update('users', userId, filtered);
    if (!updated) throw new Error('Failed to update profile.');
    const safeUser = { ...updated };
    delete safeUser.password;
    return safeUser;
  }
}

module.exports = new AuthService();
