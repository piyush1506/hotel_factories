import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Error surfaced by the Hotel Factories API with a friendly message.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

String defaultApiBaseUrl() {
  const override = String.fromEnvironment('API_BASE_URL');
  if (override.trim().isNotEmpty) return override.trim();
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    // Android emulator reaches the host machine through 10.0.2.2.
    return 'http://10.0.2.2:5050/api/v1';
  }
  return 'http://localhost:5050/api/v1';
}

class ApiClient {
  ApiClient({String? baseUrl, http.Client? client})
      : baseUrl = (baseUrl ?? defaultApiBaseUrl()).replaceAll(RegExp(r'/+$'), ''),
        _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;
  String? _token;

  String? get token => _token;

  set token(String? value) {
    _token = value;
  }

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        if (_token != null && _token!.isNotEmpty) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(
      queryParameters: (query == null || query.isEmpty) ? null : query,
    );

    final request = http.Request(method, uri);
    request.headers.addAll(_headers);
    if (body != null) request.body = jsonEncode(body);

    try {
      final streamed = await _client.send(request).timeout(const Duration(seconds: 18));
      final response = await http.Response.fromStream(streamed).timeout(const Duration(seconds: 18));
      dynamic decoded;
      if (response.body.isNotEmpty) {
        try {
          decoded = jsonDecode(response.body);
        } catch (_) {
          decoded = null;
        }
      }

      final data = decoded is Map
          ? decoded.map((key, value) => MapEntry(key.toString(), value))
          : <String, dynamic>{'data': decoded};

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = data['message'] ?? data['error'];
        throw ApiException(
          (message is String && message.isNotEmpty) ? message : 'Request failed (${response.statusCode}).',
          statusCode: response.statusCode,
        );
      }

      return data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data);
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException('The server took too long to respond. Please try again.');
    } catch (error) {
      throw ApiException('Cannot reach the Hotel Factories server. Check your connection and try again.');
    }
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) =>
      _send('POST', path, body: body);

  Future<Map<String, dynamic>> put(String path, {Map<String, dynamic>? body}) =>
      _send('PUT', path, body: body);

  // ---------------------------------------------------------------------------
  // Catalogue
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> getHotels({int limit = 100}) =>
      get('/hotels', query: {'limit': '$limit'});

  Future<Map<String, dynamic>> getCities() => get('/hotels/cities');

  Future<Map<String, dynamic>> getCategories() => get('/hotels/categories');

  Future<Map<String, dynamic>> getHotel(String id) => get('/hotels/$id');

  Future<Map<String, dynamic>> getCoupons() => get('/coupons');

  Future<Map<String, dynamic>> getReviews(String hotelId) => get('/reviews/hotel/$hotelId');

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> login(String email, String password) =>
      post('/auth/login', body: {'email': email, 'password': password});

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) =>
      post('/auth/register', body: {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
      });

  Future<Map<String, dynamic>> verifyOtp({
    String? phone,
    String? email,
    required String otp,
    String? name,
  }) =>
      post('/auth/otp-verify', body: {
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (email != null && email.isNotEmpty) 'email': email,
        'otp': otp,
        if (name != null && name.isNotEmpty) 'name': name,
      });

  Future<Map<String, dynamic>> getMe() => get('/auth/me');

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> updates) =>
      put('/auth/profile', body: updates);

  // ---------------------------------------------------------------------------
  // Bookings & payments
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> getQuote({
    required String hotelId,
    required String roomId,
    required String checkInDate,
    required String checkOutDate,
    required int roomsCount,
    String? couponCode,
  }) =>
      get('/bookings/quote', query: {
        'hotelId': hotelId,
        'roomId': roomId,
        'checkInDate': checkInDate,
        'checkOutDate': checkOutDate,
        'roomsCount': '$roomsCount',
        if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
      });

  Future<Map<String, dynamic>> holdBooking(Map<String, dynamic> body) =>
      post('/bookings/hold', body: body);

  Future<Map<String, dynamic>> getMyBookings() => get('/bookings/my');

  Future<Map<String, dynamic>> cancelBooking(String bookingId, String reason) =>
      post('/bookings/$bookingId/cancel', body: {'reason': reason});

  Future<Map<String, dynamic>> payAtHotel(String bookingId) =>
      post('/payments/pay-at-hotel', body: {'bookingId': bookingId});

  Future<Map<String, dynamic>> createPaymentOrder(String bookingId) =>
      post('/payments/order', body: {'bookingId': bookingId});

  Future<Map<String, dynamic>> verifyPayment(Map<String, dynamic> body) =>
      post('/payments/verify', body: body);

  Future<Map<String, dynamic>> getPaymentConfig() => get('/payments/config');

  void close() => _client.close();
}
