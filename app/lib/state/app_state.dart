import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/formatters.dart';
import '../models/models.dart';
import '../services/api_client.dart';

class SearchCriteria {
  const SearchCriteria({
    required this.destination,
    required this.checkIn,
    required this.checkOut,
    required this.rooms,
    required this.adultsMale,
    required this.adultsFemale,
    required this.children,
  });

  factory SearchCriteria.defaults() {
    final today = dateOnly(DateTime.now());
    return SearchCriteria(
      destination: 'Bhilwara',
      checkIn: today.add(const Duration(days: 1)),
      checkOut: today.add(const Duration(days: 4)),
      rooms: 1,
      adultsMale: 1,
      adultsFemale: 1,
      children: 0,
    );
  }

  final String destination;
  final DateTime checkIn;
  final DateTime checkOut;
  final int rooms;
  final int adultsMale;
  final int adultsFemale;
  final int children;

  int get adults => adultsMale + adultsFemale;

  int get totalGuests => adults + children;

  int get nights => nightsBetween(checkIn, checkOut).clamp(1, 365);

  bool get isAllDestinations {
    final value = destination.trim().toLowerCase();
    return value.isEmpty || value == 'all' || value == 'all destinations';
  }

  String get guestLabel {
    final kids = children > 0 ? ', $children ${children == 1 ? 'Child' : 'Children'}' : '';
    return '$rooms ${rooms == 1 ? 'Room' : 'Rooms'} · $adults ${adults == 1 ? 'Adult' : 'Adults'}$kids';
  }

  String get compactGuestLabel =>
      '$rooms ${rooms == 1 ? 'Room' : 'Rooms'} · $adults Adults (${adultsMale}M, ${adultsFemale}F)';

  String get dateRangeLabel => '${shortWeekdayDate(checkIn)} — ${shortWeekdayDate(checkOut)}';

  String get checkInLabel => shortWeekdayDate(checkIn);

  String get checkOutLabel => shortWeekdayDate(checkOut);

  Map<String, dynamic> get guestCount => {
        'adults': adults,
        'adultsMale': adultsMale,
        'adultsFemale': adultsFemale,
        'children': children,
      };

  SearchCriteria copyWith({
    String? destination,
    DateTime? checkIn,
    DateTime? checkOut,
    int? rooms,
    int? adultsMale,
    int? adultsFemale,
    int? children,
  }) {
    return SearchCriteria(
      destination: destination ?? this.destination,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      rooms: rooms ?? this.rooms,
      adultsMale: adultsMale ?? this.adultsMale,
      adultsFemale: adultsFemale ?? this.adultsFemale,
      children: children ?? this.children,
    );
  }
}

class SearchFilters {
  SearchFilters({
    this.priceTier = 'all',
    this.minRating = 0,
    this.sort = 'featured',
    this.deal = 'all',
    this.keyword = '',
    Set<String>? amenities,
    Set<String>? localities,
  })  : amenities = amenities ?? <String>{},
        localities = localities ?? <String>{};

  String priceTier;
  double minRating;
  String sort;
  String deal;
  String keyword;
  Set<String> amenities;
  Set<String> localities;

  int get activeCount {
    var count = 0;
    if (priceTier != 'all') count++;
    if (minRating > 0) count++;
    if (sort != 'featured') count++;
    if (deal != 'all') count++;
    if (keyword.trim().isNotEmpty) count++;
    count += amenities.length;
    count += localities.length;
    return count;
  }

  String get priceLabel {
    switch (priceTier) {
      case 'under2k':
        return 'Under ₹2,000';
      case '2k-4k':
        return '₹2,000 – ₹4,000';
      case '4k-8k':
        return '₹4,000 – ₹8,000';
      case 'above8k':
        return '₹8,000+';
      default:
        return 'Any budget';
    }
  }

  String get dealLabel {
    switch (deal) {
      case 'flash':
        return 'Flash deals';
      case 'budget':
        return 'Under ₹3,000';
      case 'under2k':
        return 'Super value';
      case 'royal':
        return 'HF Royal';
      default:
        return 'All stays';
    }
  }

  String get sortLabel {
    switch (sort) {
      case 'price_low':
        return 'Price: low to high';
      case 'price_high':
        return 'Price: high to low';
      case 'rating':
        return 'Top rated';
      default:
        return 'Recommended';
    }
  }

  void reset() {
    priceTier = 'all';
    minRating = 0;
    sort = 'featured';
    deal = 'all';
    keyword = '';
    amenities = <String>{};
    localities = <String>{};
  }

  SearchFilters copy() {
    return SearchFilters(
      priceTier: priceTier,
      minRating: minRating,
      sort: sort,
      deal: deal,
      keyword: keyword,
      amenities: {...amenities},
      localities: {...localities},
    );
  }
}

class AppState extends ChangeNotifier {
  AppState({ApiClient? api, SearchCriteria? criteria})
      : api = api ?? ApiClient(),
        criteria = criteria ?? SearchCriteria.defaults();

  final ApiClient api;
  SharedPreferences? _prefs;

  SearchCriteria criteria;
  SearchFilters filters = SearchFilters();

  List<Hotel> hotels = const [];
  List<CityInfo> cities = const [];
  List<CategoryInfo> categories = const [];
  List<Coupon> coupons = const [];

  bool initialized = false;
  bool loadingHotels = true;
  String? catalogError;

  String selectedCategory = 'All';

  int tabIndex = 0;
  bool destinationsMode = false;

  AppUser? user;
  String? token;
  List<Booking> bookings = const [];
  bool bookingsLoading = false;

  final Set<String> favorites = <String>{};

  // ---------------------------------------------------------------------------
  // Bootstrap & catalogue
  // ---------------------------------------------------------------------------

  Future<void> bootstrap() async {
    _prefs = await SharedPreferences.getInstance();
    final storedToken = _prefs?.getString('hf_token');
    if (storedToken != null && storedToken.isNotEmpty) {
      token = storedToken;
      api.token = storedToken;
    }
    favorites
      ..clear()
      ..addAll(_prefs?.getStringList('hf_favorites') ?? const <String>[]);

    await refreshCatalog(showLoading: true);
    if (token != null) {
      await _restoreSession();
    }
    initialized = true;
    notifyListeners();
  }

  Future<T?> _attempt<T>(Future<T> Function() task) async {
    try {
      return await task();
    } catch (error) {
      debugPrint('Hotel Factories API error: $error');
      return null;
    }
  }

  Future<void> refreshCatalog({bool showLoading = false}) async {
    if (showLoading) {
      loadingHotels = true;
      notifyListeners();
    }

    final hotelsFuture = _attempt(() async {
      final data = await api.getHotels(limit: 100);
      return _mapList(data, 'hotels').map(Hotel.fromJson).toList();
    });
    final citiesFuture = _attempt(() async {
      final data = await api.getCities();
      return _mapList(data, 'cities').map(CityInfo.fromJson).toList();
    });
    final categoriesFuture = _attempt(() async {
      final data = await api.getCategories();
      return _mapList(data, 'categories').map(CategoryInfo.fromJson).toList();
    });
    final couponsFuture = _attempt(() async {
      final data = await api.getCoupons();
      return _mapList(data, 'coupons').map(Coupon.fromJson).toList();
    });

    final loadedHotels = await hotelsFuture;
    final loadedCities = await citiesFuture;
    final loadedCategories = await categoriesFuture;
    final loadedCoupons = await couponsFuture;

    if (loadedHotels != null) {
      hotels = loadedHotels;
      catalogError = null;
    } else {
      catalogError = 'We could not load stays right now. Please check that the Hotel Factories API is running.';
    }
    if (loadedCities != null) cities = loadedCities;
    if (loadedCategories != null) categories = loadedCategories;
    if (loadedCoupons != null) coupons = loadedCoupons;

    loadingHotels = false;
    notifyListeners();
  }

  List<Map<String, dynamic>> _mapList(Map<String, dynamic> data, String key) {
    dynamic raw = data[key];
    if (raw == null) raw = data['data'];
    if (raw is Map) raw = raw[key];
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((item) => item.map((key, value) => MapEntry(key.toString(), value)))
        .toList();
  }

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------

  Future<void> _restoreSession() async {
    try {
      final data = await api.getMe();
      final rawUser = data['user'] ?? data['data'];
      if (rawUser is Map) {
        user = AppUser.fromJson(Map<String, dynamic>.from(rawUser));
      }
      await refreshBookings(silent: true);
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        await _clearSession();
      }
    }
  }

  Future<AppUser> signIn(String email, String password) async {
    final data = await api.login(email.trim(), password);
    return _applySession(data, fallbackMessage: 'Welcome back');
  }

  Future<AppUser> signInWithOtp({
    String? phone,
    String? email,
    required String otp,
    String? name,
  }) async {
    final data = await api.verifyOtp(phone: phone, email: email, otp: otp, name: name);
    return _applySession(data, fallbackMessage: 'Signed in');
  }

  Future<AppUser> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final data = await api.register(
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password,
    );
    return _applySession(data, fallbackMessage: 'Account created');
  }

  Future<AppUser> _applySession(Map<String, dynamic> data, {required String fallbackMessage}) async {
    final sessionToken = (data['token'] ?? data['data']?['token'])?.toString();
    final rawUser = data['user'] ?? data['data']?['user'];
    if (sessionToken == null || sessionToken.isEmpty) {
      throw ApiException('No session token returned by the server.');
    }
    if (rawUser is! Map) {
      throw ApiException('The server did not return your profile.');
    }
    token = sessionToken;
    api.token = sessionToken;
    user = AppUser.fromJson(Map<String, dynamic>.from(rawUser));
    await _prefs?.setString('hf_token', sessionToken);
    notifyListeners();
    await refreshBookings(silent: true);
    return user!;
  }

  Future<void> _clearSession() async {
    token = null;
    api.token = null;
    user = null;
    bookings = const [];
    await _prefs?.remove('hf_token');
    notifyListeners();
  }

  Future<void> signOut() => _clearSession();

  Future<AppUser> updateProfile(Map<String, dynamic> updates) async {
    final data = await api.updateProfile(updates);
    final rawUser = data['user'] ?? data['data'];
    if (rawUser is! Map) throw ApiException('Profile could not be updated.');
    user = AppUser.fromJson({...?user?.toJson(), ...Map<String, dynamic>.from(rawUser)});
    notifyListeners();
    return user!;
  }

  Future<void> refreshBookings({bool silent = false}) async {
    if (token == null) return;
    if (!silent) {
      bookingsLoading = true;
      notifyListeners();
    }
    try {
      final data = await api.getMyBookings();
      final list = _mapList(data, 'bookings')
          .map(Booking.fromJson)
          .where((booking) => booking.status != 'HELD')
          .toList()
        ..sort((a, b) => (b.bookedAt ?? DateTime(2000)).compareTo(a.bookedAt ?? DateTime(2000)));
      bookings = list;
    } catch (error) {
      debugPrint('Could not load bookings: $error');
    } finally {
      bookingsLoading = false;
      notifyListeners();
    }
  }

  List<Booking> get upcomingBookings => bookings.where((booking) => booking.isUpcoming).toList();

  List<Booking> get pastBookings => bookings
      .where((booking) => !booking.isUpcoming && booking.status != 'CANCELLED' && booking.status != 'REFUNDED')
      .toList();

  List<Booking> get cancelledBookings => bookings
      .where((booking) => booking.status == 'CANCELLED' || booking.status == 'REFUNDED')
      .toList();

  // ---------------------------------------------------------------------------
  // Favourites
  // ---------------------------------------------------------------------------

  bool isFavorite(String hotelId) => favorites.contains(hotelId);

  Future<void> toggleFavorite(String hotelId) async {
    if (!favorites.remove(hotelId)) favorites.add(hotelId);
    notifyListeners();
    await _prefs?.setStringList('hf_favorites', favorites.toList());
  }

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  void switchTab(int index) {
    tabIndex = index;
    destinationsMode = false;
    notifyListeners();
  }

  void openDestinations() {
    destinationsMode = true;
    notifyListeners();
  }

  void openStayMode() {
    destinationsMode = false;
    tabIndex = 0;
    notifyListeners();
  }

  void runSearch({String? destination}) {
    if (destination != null) criteria = criteria.copyWith(destination: destination);
    destinationsMode = false;
    tabIndex = 1;
    notifyListeners();
  }

  void browseCategory(String category) {
    filters.reset();
    selectedCategory = category.isEmpty ? 'All' : category;
    criteria = criteria.copyWith(destination: 'All Destinations');
    destinationsMode = false;
    tabIndex = 1;
    notifyListeners();
  }

  void searchCity(String city, {String category = 'All'}) {
    criteria = criteria.copyWith(destination: city);
    filters.reset();
    selectedCategory = category;
    destinationsMode = false;
    tabIndex = 1;
    notifyListeners();
  }

  void searchAllHotels({String? keyword}) {
    criteria = criteria.copyWith(destination: 'All Destinations');
    filters.reset();
    if (keyword != null && keyword.trim().isNotEmpty) filters.keyword = keyword.trim();
    selectedCategory = 'All';
    destinationsMode = false;
    tabIndex = 1;
    notifyListeners();
  }

  void updateCriteria(SearchCriteria next) {
    criteria = next;
    notifyListeners();
  }

  void replaceFilters(SearchFilters next, {String? category}) {
    filters = next;
    if (category != null) selectedCategory = category;
    notifyListeners();
  }

  void selectCategory(String category) {
    selectedCategory = category;
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Derived catalogue
  // ---------------------------------------------------------------------------

  List<String> get amenityOptions {
    final counts = <String, int>{};
    for (final hotel in hotels) {
      for (final amenity in hotel.amenities) {
        final value = amenity.trim();
        if (value.isEmpty) continue;
        counts[value] = (counts[value] ?? 0) + 1;
      }
    }
    final entries = counts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    return entries.take(12).map((entry) => entry.key).toList();
  }

  List<String> get localityOptions {
    final names = <String>{};
    for (final city in cities) {
      if (city.name.isNotEmpty) names.add(city.name);
    }
    if (names.isEmpty) {
      for (final hotel in hotels) {
        if (hotel.city.isNotEmpty) names.add(hotel.city);
      }
    }
    return names.toList()..sort();
  }

  List<Hotel> get flashDeals {
    final list = hotels.where((hotel) => hotel.discountPercent >= 10).toList()
      ..sort((a, b) => b.discountPercent.compareTo(a.discountPercent));
    return list.take(8).toList();
  }

  List<Hotel> hotelsInCity(String city) => hotels.where((hotel) => hotel.city == city).toList();

  List<Hotel> resultsFor(SearchFilters source, {String? category}) {
    final activeFilters = source;
    final query = criteria.isAllDestinations ? '' : criteria.destination.trim().toLowerCase();
    final keyword = activeFilters.keyword.trim().toLowerCase();
    final categoryValue = (category ?? selectedCategory).toLowerCase().trim();

    final results = hotels.where((hotel) {
      if (query.isNotEmpty && query != 'near me') {
        final haystack = [
          hotel.name,
          hotel.city,
          hotel.state,
          hotel.country,
          hotel.locality,
          hotel.address,
          hotel.category,
          hotel.description,
          ...hotel.amenities,
          ...hotel.rooms.map((room) => '${room.name} ${room.type}'),
        ].join(' ').toLowerCase();
        if (!haystack.contains(query)) return false;
      }

      if (keyword.isNotEmpty) {
        final haystack = [
          hotel.name,
          hotel.city,
          hotel.locality,
          hotel.description,
          ...hotel.amenities,
        ].join(' ').toLowerCase();
        if (!haystack.contains(keyword)) return false;
      }

      final price = hotel.startingPrice;
      switch (activeFilters.priceTier) {
        case 'under2k':
          if (price >= 2000) return false;
          break;
        case '2k-4k':
          if (price < 2000 || price > 4000) return false;
          break;
        case '4k-8k':
          if (price < 4000 || price > 8000) return false;
          break;
        case 'above8k':
          if (price < 8000) return false;
          break;
      }

      if (activeFilters.minRating > 0 && hotel.rating < activeFilters.minRating) return false;

      if (categoryValue != 'all' && categoryValue.isNotEmpty) {
        final hotelCategory = hotel.category.toLowerCase().trim();
        final isCombo = categoryValue.contains('combo') || categoryValue.contains('dorm');
        final matches = (isCombo &&
                (hotelCategory.contains('combo') ||
                    hotelCategory.contains('dorm') ||
                    hotel.rooms.any((room) =>
                        room.type.toLowerCase().contains('dorm') ||
                        room.name.toLowerCase().contains('combo')))) ||
            hotelCategory == categoryValue ||
            hotelCategory.replaceAll(RegExp(r's$'), '') == categoryValue.replaceAll(RegExp(r's$'), '') ||
            (categoryValue == 'hotels' &&
                (hotelCategory == 'hotel' || hotelCategory == 'hotels' || hotelCategory == 'all'));
        if (!matches) return false;
      }

      if (activeFilters.localities.isNotEmpty) {
        final location = '${hotel.city} ${hotel.locality} ${hotel.state}'.toLowerCase();
        if (!activeFilters.localities.any((item) => location.contains(item.toLowerCase()))) return false;
      }

      if (activeFilters.amenities.isNotEmpty) {
        final amenities = hotel.amenities.map((item) => item.toLowerCase()).toList();
        if (!activeFilters.amenities.every(
          (required) => amenities.any((item) => item.contains(required.toLowerCase())),
        )) {
          return false;
        }
      }

      if (activeFilters.deal == 'flash' && hotel.discountPercent < 10) return false;
      if (activeFilters.deal == 'budget' && price > 3000) return false;
      if (activeFilters.deal == 'under2k' && price > 2000) return false;
      if (activeFilters.deal == 'royal' &&
          !(price >= 5000 || hotel.starRating >= 5 || hotel.rating >= 4.85)) {
        return false;
      }

      return true;
    }).toList();

    switch (activeFilters.sort) {
      case 'price_low':
        results.sort((a, b) => a.startingPrice.compareTo(b.startingPrice));
        break;
      case 'price_high':
        results.sort((a, b) => b.startingPrice.compareTo(a.startingPrice));
        break;
      case 'rating':
        results.sort((a, b) => b.rating.compareTo(a.rating));
        break;
    }

    return results;
  }

  List<Hotel> get filteredHotels => resultsFor(filters);

  // ---------------------------------------------------------------------------
  // Booking helpers
  // ---------------------------------------------------------------------------

  Future<BookingQuote> fetchQuote({
    required Hotel hotel,
    required Room room,
    String? couponCode,
  }) async {
    final data = await api.getQuote(
      hotelId: hotel.id,
      roomId: room.id,
      checkInDate: isoDate(criteria.checkIn),
      checkOutDate: isoDate(criteria.checkOut),
      roomsCount: criteria.rooms,
      couponCode: couponCode,
    );
    final raw = data['quote'] ?? data['data'];
    if (raw is! Map) throw ApiException('A price quote could not be loaded.');
    return BookingQuote.fromJson(Map<String, dynamic>.from(raw));
  }

  Future<Booking> createPayAtHotelBooking({
    required Hotel hotel,
    required Room room,
    required String guestName,
    required String guestEmail,
    required String guestPhone,
    required String specialRequests,
    required String couponCode,
  }) async {
    if (token == null || user == null) {
      throw ApiException('Please sign in or create an account to complete this booking.');
    }

    final hold = await api.holdBooking({
      'roomId': room.id,
      'checkInDate': isoDate(criteria.checkIn),
      'checkOutDate': isoDate(criteria.checkOut),
      'roomsCount': criteria.rooms,
      'guestName': guestName,
      'guestEmail': guestEmail,
      'guestPhone': guestPhone,
      'guestCount': criteria.guestCount,
      'specialRequests': specialRequests,
      if (couponCode.trim().isNotEmpty) 'couponCode': couponCode.trim().toUpperCase(),
    });

    final heldRaw = hold['booking'] ?? hold['data'];
    if (heldRaw is! Map) throw ApiException('We could not reserve this room. Please try again.');
    final held = Booking.fromJson(Map<String, dynamic>.from(heldRaw));
    if (held.id.isEmpty) throw ApiException('We could not reserve this room. Please try again.');

    final paid = await api.payAtHotel(held.id);
    final confirmedRaw = paid['booking'] ?? paid['data'];
    if (confirmedRaw is! Map) throw ApiException('The hotel could not confirm this reservation.');
    final confirmed = Booking.fromJson(Map<String, dynamic>.from(confirmedRaw));

    bookings = [
      confirmed,
      ...bookings.where((booking) => booking.id != confirmed.id),
    ];
    notifyListeners();
    await refreshBookings(silent: true);
    return confirmed;
  }

  Future<Booking> cancelBooking(Booking booking) async {
    final data = await api.cancelBooking(booking.id, 'Cancelled by guest from My Trips');
    final raw = data['booking'] ?? data['data'];
    Booking updated = booking;
    if (raw is Map) {
      updated = Booking.fromJson({...booking.toJson(), ...Map<String, dynamic>.from(raw)});
    } else {
      updated = Booking.fromJson({...booking.toJson(), 'status': 'CANCELLED'});
    }
    bookings = bookings.map((item) => item.id == booking.id ? updated : item).toList();
    notifyListeners();
    await refreshBookings(silent: true);
    return updated;
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope is missing from the widget tree.');
    return scope!.notifier!;
  }
}

String readableError(Object error) => error is ApiException ? error.message : '$error';
