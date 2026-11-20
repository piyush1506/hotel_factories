const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/database');
const ROLES = require('../constants/roles');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = db.findById('users', decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User not found.'
      });
    }

    // Attach safe user object without password
    const safeUser = { ...user };
    delete safeUser.password;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = db.findById('users', decoded.id);
      if (user) {
        const safeUser = { ...user };
        delete safeUser.password;
        req.user = safeUser;
      }
    } catch (err) {
      // Ignore token error for optional auth
    }
  }
  next();
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
}

function requireHotelierOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.HOTELIER) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden. Hotelier or Admin access required.'
  });
}

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  requireHotelierOrAdmin
};
