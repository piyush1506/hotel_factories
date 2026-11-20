const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      }
      const result = await authService.register({ name, email, phone, password });
      res.status(201).json({ success: true, message: 'User registered successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }
      const result = await authService.login({ email, password });
      res.status(200).json({ success: true, message: 'Logged in successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { phone, email, otp, name } = req.body;
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required.' });
      }
      const result = await authService.verifyOtpLogin({ phone, email, otp, name });
      res.status(200).json({ success: true, message: 'OTP verified successfully.', ...result });
    } catch (err) {
      next(err);
    }
  }

  async googleAuth(req, res, next) {
    try {
      const { credential, email, name, avatar, googleId } = req.body;
      const result = await authService.googleAuth({ credential, email, name, avatar, googleId });
      res.status(200).json({ success: true, message: 'Google authentication successful.', ...result });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      res.status(200).json({ success: true, message: 'Profile updated.', user });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
