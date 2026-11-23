const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hf_token') : null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The server took too long to respond. Please try again.');
    throw new Error('Cannot reach the Hotel Factories server. Is the backend running on port 5050?');
  } finally {
    clearTimeout(timeout);
  }

  let data = {};
  const contentType = res.headers.get('content-type') || '';
  try {
    if (!contentType.includes('application/json')) throw new Error('Non-JSON response');
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.message || data.error || `API Error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

// ============ AUTH ============
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  googleAuth: (body) => request('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  otpVerify: (body) => request('/auth/otp-verify', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

// ============ HOTELS ============
export const hotelAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/hotels${query ? `?${query}` : ''}`);
  },
  getCities: () => request('/hotels/cities'),
  getCategories: () => request('/hotels/categories'),
  getById: (id) => request(`/hotels/${id}`),
  create: (body) => request('/hotels', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/hotels/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/hotels/${id}`, { method: 'DELETE' }),
};

// ============ ROOMS ============
export const roomAPI = {
  getByHotel: (hotelId) => request(`/rooms/hotel/${hotelId}`),
  getAvailability: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/rooms/availability?${query}`);
  },
  getById: (id) => request(`/rooms/${id}`),
  create: (body) => request('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
};

// ============ BOOKINGS ============
export const bookingAPI = {
  getQuote: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bookings/quote?${query}`);
  },
  hold: (body) => request('/bookings/hold', { method: 'POST', body: JSON.stringify(body) }),
  cancel: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  checkIn: (bookingCode) => request('/bookings/check-in', { method: 'POST', body: JSON.stringify({ bookingCode }) }),
  checkOut: (bookingCode) => request('/bookings/check-out', { method: 'POST', body: JSON.stringify({ bookingCode }) }),
  noShow: (bookingCode, reason) => request('/bookings/no-show', { method: 'POST', body: JSON.stringify({ bookingCode, reason }) }),
  getMy: () => request('/bookings/my'),
  getById: (id) => request(`/bookings/${id}`),
};

// ============ PAYMENTS ============
export const paymentAPI = {
  getConfig: () => request('/payments/config'),
  createOrder: (body) => request('/payments/order', { method: 'POST', body: JSON.stringify(body) }),
  verify: (body) => request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
  payAtHotel: (body) => request('/payments/pay-at-hotel', { method: 'POST', body: JSON.stringify(body) }),
};

// ============ COUPONS ============
export const couponAPI = {
  getAll: () => request('/coupons'),
  validate: (body) => request('/coupons/validate', { method: 'POST', body: JSON.stringify(body) }),
  create: (body) => request('/coupons', { method: 'POST', body: JSON.stringify(body) }),
};

// ============ REVIEWS ============
export const reviewAPI = {
  getByHotel: (hotelId) => request(`/reviews/hotel/${hotelId}`),
  submit: (hotelId, body) => request(`/reviews/hotel/${hotelId}`, { method: 'POST', body: JSON.stringify(body) }),
  reply: (reviewId, body) => request(`/reviews/${reviewId}/reply`, { method: 'POST', body: JSON.stringify(body) }),
};

// ============ ADMIN ============
export const adminAPI = {
  getMetrics: () => request('/admin/metrics'),
  getHotels: () => request('/admin/hotels'),
  updateCommission: (id, body) => request(`/admin/hotels/${id}/commission`, { method: 'PUT', body: JSON.stringify(body) }),
  verifyHotel: (id, body) => request(`/admin/hotels/${id}/verify`, { method: 'PUT', body: JSON.stringify(body) }),
  getBookings: () => request('/admin/bookings'),
  getUsers: () => request('/admin/users'),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateHotelFlags: (id, body) => request(`/admin/hotels/${id}/flags`, { method: 'PUT', body: JSON.stringify(body) }),
  getCoupons: () => request('/admin/coupons'),
  createCoupon: (body) => request('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
  updateCoupon: (id, body) => request(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoupon: (id) => request(`/admin/coupons/${id}`, { method: 'DELETE' }),
  getReviews: () => request('/admin/reviews'),
  processRefund: (id, body) => request(`/admin/refunds/${id}/process`, { method: 'POST', body: JSON.stringify(body || {}) }),
  resetSeed: () => request('/admin/reset-seed', { method: 'POST' }),
};

// ============ HOTELIER ============
export const hotelierAPI = {
  getDashboard: () => request('/hotelier/dashboard'),
  getHotels: () => request('/hotelier/hotels'),
  getBookings: () => request('/hotelier/bookings'),
  getCalendar: (params = {}) => request(`/hotelier/calendar?${new URLSearchParams(params).toString()}`),
  updateBankDetails: (body) => request('/hotelier/bank-details', { method: 'PUT', body: JSON.stringify(body) }),
};

// ============ PAYOUTS ============
export const payoutAPI = {
  getOverview: () => request('/payouts/overview'),
  execute: (body) => request('/payouts/execute', { method: 'POST', body: JSON.stringify(body) }),
  getHotelierLedger: () => request('/payouts/hotelier-ledger'),
};

// ============ UPLOAD (CLOUDINARY) ============
export const uploadAPI = {
  getConfig: () => request('/upload/config'),
  uploadImage: async (fileOrBase64, folder = 'hotel_factories/hotels') => {
    if (typeof fileOrBase64 === 'string') {
      return request('/upload/image', {
        method: 'POST',
        body: JSON.stringify({ image: fileOrBase64, folder }),
      });
    }

    const formData = new FormData();
    formData.append('image', fileOrBase64);
    formData.append('folder', folder);

    const token = typeof window !== 'undefined' ? localStorage.getItem('hf_token') : null;
    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || `Upload failed (${res.status})`);
    }
    return data;
  },
  uploadMultiple: async (files, folder = 'hotel_factories/hotels') => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('folder', folder);

    const token = typeof window !== 'undefined' ? localStorage.getItem('hf_token') : null;
    const res = await fetch(`${API_BASE}/upload/multiple`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || `Multiple upload failed (${res.status})`);
    }
    return data;
  },
  deleteImage: (publicId) => request(`/upload/${encodeURIComponent(publicId)}`, { method: 'DELETE' }),
};
