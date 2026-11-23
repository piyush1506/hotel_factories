import '../core/formatters.dart';

const String kFallbackHotelImage =
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

dynamic _first(Map<String, dynamic> json, List<String> keys, [dynamic fallback]) {
  for (final key in keys) {
    final value = json[key];
    if (value != null && value != '') return value;
  }
  return fallback;
}

String _string(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  return value.toString();
}

double _double(dynamic value, [double fallback = 0]) {
  if (value is num) return value.toDouble();
  return double.tryParse(_string(value)) ?? fallback;
}

int _int(dynamic value, [int fallback = 0]) {
  if (value is num) return value.toInt();
  return int.tryParse(_string(value)) ?? fallback;
}

bool _bool(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) return value.toLowerCase() == 'true';
  return fallback;
}

List<String> _stringList(dynamic value) {
  if (value is List) {
    return value.map((item) => _string(item)).where((item) => item.isNotEmpty).toList();
  }
  return const [];
}

Map<String, dynamic> _map(dynamic value) {
  if (value is Map) return value.map((key, val) => MapEntry(key.toString(), val));
  return const {};
}

class Hotel {
  Hotel({
    required this.id,
    required this.name,
    required this.city,
    required this.state,
    required this.address,
    required this.locality,
    required this.category,
    required this.country,
    required this.tagline,
    required this.description,
    required this.rating,
    required this.reviewsCount,
    required this.startingPrice,
    required this.originalPrice,
    required this.images,
    required this.amenities,
    required this.starRating,
    required this.isVerified,
    required this.policies,
    required this.cancellationPolicy,
    required this.rooms,
    required this.latitude,
    required this.longitude,
  });

  final String id;
  final String name;
  final String city;
  final String state;
  final String address;
  final String locality;
  final String category;
  final String country;
  final String tagline;
  final String description;
  final double rating;
  final int reviewsCount;
  final double startingPrice;
  final double originalPrice;
  final List<String> images;
  final List<String> amenities;
  final int starRating;
  final bool isVerified;
  final Map<String, dynamic> policies;
  final Map<String, dynamic> cancellationPolicy;
  final List<Room> rooms;
  final double? latitude;
  final double? longitude;

  factory Hotel.fromJson(Map<String, dynamic> json) {
    final rawImages = _stringList(_first(json, ['images', 'gallery']));
    final image = _string(_first(json, ['image', 'coverImage']));
    if (rawImages.isEmpty && image.isNotEmpty) rawImages.add(image);

    return Hotel(
      id: _string(_first(json, ['id', '_id'])),
      name: _string(_first(json, ['name', 'title']), 'Hotel Factories stay'),
      city: _string(_first(json, ['city']), 'India'),
      state: _string(_first(json, ['state'])),
      address: _string(_first(json, ['address', 'fullAddress'])),
      locality: _string(_first(json, ['locality', 'area', 'distanceFromBeach'])),
      category: _string(_first(json, ['category', 'propertyType']), 'Hotels'),
      country: _string(_first(json, ['country']), 'India'),
      tagline: _string(_first(json, ['tagline', 'shortDescription'])),
      description: _string(_first(json, ['description', 'about'])),
      rating: _double(_first(json, ['rating', 'avgRating']), 4.5),
      reviewsCount: _int(_first(json, ['reviewsCount', 'reviewCount']), 0),
      startingPrice: _double(_first(json, ['startingPrice', 'basePrice', 'pricePerNight', 'price']), 2999),
      originalPrice: _double(_first(json, ['originalPrice', 'compareAtPrice']), 0),
      images: rawImages,
      amenities: _stringList(_first(json, ['amenities', 'facilities'])),
      starRating: _int(_first(json, ['starRating', 'stars']), 4),
      isVerified: _bool(_first(json, ['isVerified', 'verified']), true),
      policies: _map(json['policies']),
      cancellationPolicy: _map(json['cancellationPolicy']),
      rooms: ((_first(json, ['rooms'], <dynamic>[]) as List?) ?? const [])
          .whereType<Map>()
          .map((room) => Room.fromJson(room.map((key, value) => MapEntry(key.toString(), value))))
          .toList(),
      latitude: json['latitude'] == null ? null : _double(json['latitude']),
      longitude: json['longitude'] == null ? null : _double(json['longitude']),
    );
  }

  String get image => images.isNotEmpty ? images.first : kFallbackHotelImage;

  List<String> get gallery => images.isEmpty ? [kFallbackHotelImage] : images;

  String get locationLabel {
    if (locality.isNotEmpty) return locality;
    if (address.isNotEmpty) return address;
    return '$city, $country';
  }

  double get effectiveOriginalPrice {
    if (originalPrice > startingPrice) return originalPrice;
    return startingPrice * 1.35;
  }

  int get discountPercent {
    if (effectiveOriginalPrice <= 0) return 0;
    final percent = ((effectiveOriginalPrice - startingPrice) / effectiveOriginalPrice * 100).round();
    return percent.clamp(0, 90);
  }

  String get cancellationLabel {
    final summary = _string(cancellationPolicy['summary']);
    if (summary.isNotEmpty) return summary;
    final policy = _string(policies['cancellation']);
    if (policy.isNotEmpty) return policy;
    return 'Free cancellation up to 24 hours before check-in.';
  }

  bool get isRefundable => cancellationPolicy['refundable'] != false;

  String? get cancellationBadge {
    final badge = _string(cancellationPolicy['badgeText']);
    return badge.isEmpty ? null : badge;
  }

  int get cancellationWindowHours => _int(cancellationPolicy['windowHours'], 24);

  String get checkInTime => _string(policies['checkIn'], '14:00');

  String get checkOutTime => _string(policies['checkOut'], '11:00');

  String get petPolicy => _string(policies['petPolicy'], 'Pets are not allowed');

  String get childPolicy => _string(policies['childPolicy'], 'Children are welcome');

  String get scoreLabel {
    if (rating >= 4.8) return 'Exceptional';
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very good';
    return 'Verified stay';
  }

  double get scoreOutOfTen => rating > 5 ? rating : rating * 2;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'city': city,
        'state': state,
        'address': address,
        'locality': locality,
        'category': category,
        'country': country,
        'tagline': tagline,
        'description': description,
        'rating': rating,
        'reviewsCount': reviewsCount,
        'startingPrice': startingPrice,
        'originalPrice': originalPrice,
        'images': images,
        'amenities': amenities,
        'starRating': starRating,
        'isVerified': isVerified,
        'policies': policies,
        'cancellationPolicy': cancellationPolicy,
        'latitude': latitude,
        'longitude': longitude,
      };
}

class Room {
  Room({
    required this.id,
    required this.name,
    required this.type,
    required this.images,
    required this.bedType,
    required this.sizeSqFt,
    required this.amenities,
    required this.basePrice,
    required this.originalPrice,
    required this.capacityAdults,
    required this.capacityChildren,
    required this.totalInventory,
    required this.status,
  });

  final String id;
  final String name;
  final String type;
  final List<String> images;
  final String bedType;
  final int sizeSqFt;
  final List<String> amenities;
  final double basePrice;
  final double originalPrice;
  final int capacityAdults;
  final int capacityChildren;
  final int totalInventory;
  final String status;

  factory Room.fromJson(Map<String, dynamic> json) {
    final rawImages = _stringList(_first(json, ['images', 'gallery']));
    final image = _string(_first(json, ['image', 'coverImage']));
    if (rawImages.isEmpty && image.isNotEmpty) rawImages.add(image);

    return Room(
      id: _string(_first(json, ['id', '_id'])),
      name: _string(_first(json, ['name', 'title']), 'Room'),
      type: _string(_first(json, ['type', 'category']), 'Deluxe'),
      images: rawImages,
      bedType: _string(_first(json, ['bedType', 'bed']), '1 King Bed'),
      sizeSqFt: _int(_first(json, ['sizeSqFt', 'size']), 0),
      amenities: _stringList(json['amenities']),
      basePrice: _double(_first(json, ['basePrice', 'pricePerNight', 'price']), 0),
      originalPrice: _double(json['originalPrice'], 0),
      capacityAdults: _int(_first(json, ['capacityAdults', 'maxAdults']), 2),
      capacityChildren: _int(json['capacityChildren'], 0),
      totalInventory: _int(_first(json, ['totalInventory', 'inventory']), 1),
      status: _string(_first(json, ['status']), 'AVAILABLE'),
    );
  }

  String get image => images.isNotEmpty ? images.first : kFallbackHotelImage;

  List<String> get gallery => images.isEmpty ? [kFallbackHotelImage] : images;

  String get capacityLabel {
    final kids = capacityChildren > 0
        ? ', $capacityChildren ${capacityChildren == 1 ? 'Child' : 'Children'}'
        : '';
    return 'Fits $capacityAdults Adults$kids';
  }

  String get sizeLabel {
    if (sizeSqFt <= 0) return '';
    final sqm = (sizeSqFt / 10.7639).round();
    return '$sqm m² / $sizeSqFt sq ft';
  }

  bool get isAvailable => status.toUpperCase() != 'SOLD_OUT';

  double get effectiveOriginalPrice => originalPrice > basePrice ? originalPrice : basePrice * 1.3;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'type': type,
        'images': images,
        'bedType': bedType,
        'sizeSqFt': sizeSqFt,
        'amenities': amenities,
        'basePrice': basePrice,
        'originalPrice': originalPrice,
        'capacityAdults': capacityAdults,
        'capacityChildren': capacityChildren,
        'totalInventory': totalInventory,
        'status': status,
      };
}

class CityInfo {
  const CityInfo({
    required this.name,
    required this.state,
    required this.hotelsCount,
    required this.image,
    required this.minPrice,
    this.category = 'all',
    this.tag = 'POPULAR STAYS',
    this.description = '',
  });

  final String name;
  final String state;
  final int hotelsCount;
  final String image;
  final double minPrice;
  final String category;
  final String tag;
  final String description;

  factory CityInfo.fromJson(Map<String, dynamic> json) {
    return CityInfo(
      name: _string(json['name'], _string(json['city'])),
      state: _string(json['state']),
      hotelsCount: _int(json['hotelsCount'], 0),
      image: _string(json['image'], kFallbackHotelImage),
      minPrice: _double(json['minPrice'], 0),
    );
  }

  String get staysLabel => '$hotelsCount ${hotelsCount == 1 ? 'verified stay' : 'verified stays'}';
}

class CategoryInfo {
  const CategoryInfo({
    required this.id,
    required this.name,
    required this.label,
    required this.count,
    required this.minPrice,
    required this.description,
    required this.image,
  });

  final String id;
  final String name;
  final String label;
  final int count;
  final double minPrice;
  final String description;
  final String image;

  factory CategoryInfo.fromJson(Map<String, dynamic> json) {
    return CategoryInfo(
      id: _string(json['id'], _string(json['slug'])),
      name: _string(json['name'], _string(json['label'])),
      label: _string(_first(json, ['label', 'name']), 'Stays'),
      count: _int(json['count'], 0),
      minPrice: _double(json['minPrice'], 0),
      description: _string(json['description']),
      image: _string(json['image'], kFallbackHotelImage),
    );
  }
}

class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.avatar,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String avatar;
  final String createdAt;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: _string(_first(json, ['id', '_id'])),
      name: _string(json['name'], 'Traveller'),
      email: _string(json['email']),
      phone: _string(json['phone']),
      role: _string(json['role'], 'customer'),
      avatar: _string(json['avatar']),
      createdAt: _string(json['createdAt']),
    );
  }

  String get firstName => name.split(RegExp(r'\s+')).first;

  String get roleLabel {
    switch (role) {
      case 'admin':
        return 'Platform Admin';
      case 'hotel_owner':
        return 'Hotel Partner';
      default:
        return 'Traveller';
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'role': role,
        'avatar': avatar,
        'createdAt': createdAt,
      };
}

class Booking {
  Booking({
    required this.id,
    required this.code,
    required this.status,
    required this.hotelId,
    required this.hotelName,
    required this.hotelCity,
    required this.hotelImage,
    required this.hotelAddress,
    required this.roomName,
    required this.roomType,
    required this.guestName,
    required this.guestEmail,
    required this.guestPhone,
    required this.checkIn,
    required this.checkOut,
    required this.nights,
    required this.roomsCount,
    required this.totalAmount,
    required this.baseRoomPrice,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.bookedAt,
    required this.qrCodeData,
    required this.verifyUrl,
    required this.specialRequests,
    required this.refundAmount,
    required this.guestCount,
  });

  final String id;
  final String code;
  final String status;
  final String hotelId;
  final String hotelName;
  final String hotelCity;
  final String hotelImage;
  final String hotelAddress;
  final String roomName;
  final String roomType;
  final String guestName;
  final String guestEmail;
  final String guestPhone;
  final DateTime checkIn;
  final DateTime checkOut;
  final int nights;
  final int roomsCount;
  final double totalAmount;
  final double baseRoomPrice;
  final String paymentStatus;
  final String paymentMethod;
  final DateTime? bookedAt;
  final String qrCodeData;
  final String verifyUrl;
  final String specialRequests;
  final double? refundAmount;
  final dynamic guestCount;

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: _string(_first(json, ['id', '_id'])),
      code: _string(_first(json, ['bookingCode', 'code', 'id'])),
      status: _string(_first(json, ['status']), 'CONFIRMED').toUpperCase(),
      hotelId: _string(json['hotelId']),
      hotelName: _string(_first(json, ['hotelName']), 'Hotel Factories stay'),
      hotelCity: _string(_first(json, ['hotelCity', 'city'])),
      hotelImage: _string(_first(json, ['hotelImage', 'image']), kFallbackHotelImage),
      hotelAddress: _string(json['hotelAddress']),
      roomName: _string(_first(json, ['roomName', 'room']), 'Room'),
      roomType: _string(json['roomType']),
      guestName: _string(json['guestName']),
      guestEmail: _string(json['guestEmail']),
      guestPhone: _string(json['guestPhone']),
      checkIn: parseIsoDate(_string(_first(json, ['checkInDate', 'checkIn']))),
      checkOut: parseIsoDate(_string(_first(json, ['checkOutDate', 'checkOut']))),
      nights: _int(json['nights'], 1),
      roomsCount: _int(_first(json, ['roomsCount', 'rooms']), 1),
      totalAmount: _double(_first(json, ['totalAmount', 'amount']), 0),
      baseRoomPrice: _double(_first(json, ['baseRoomPrice', 'roomPrice']), 0),
      paymentStatus: _string(json['paymentStatus'], 'PAID'),
      paymentMethod: _string(json['paymentMethod']),
      bookedAt: DateTime.tryParse(_string(_first(json, ['bookedAt', 'createdAt']))),
      qrCodeData: _string(_first(json, ['qrCodeData', 'qrCode'])),
      verifyUrl: _string(json['verifyUrl']),
      specialRequests: _string(_first(json, ['specialRequests', 'specialRequest'])),
      refundAmount: json['refundAmount'] == null ? null : _double(json['refundAmount']),
      guestCount: json['guestCount'],
    );
  }

  bool get isUpcoming {
    if (status == 'CANCELLED' || status == 'REFUNDED' || status == 'EXPIRED' || status == 'NO_SHOW') {
      return false;
    }
    if (status == 'COMPLETED') return false;
    return checkOut.isAfter(DateTime.now().subtract(const Duration(days: 1)));
  }

  bool get isCancellable => const ['CONFIRMED', 'PENDING_PAYMENT', 'HELD'].contains(status);

  String get statusLabel {
    switch (status) {
      case 'HELD':
      case 'PENDING_PAYMENT':
        return 'Payment pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CHECKED_IN':
        return 'Checked in';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REFUNDED':
        return 'Refunded';
      case 'NO_SHOW':
        return 'No-show';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  }

  bool get isPayAtHotel => paymentMethod.toUpperCase().contains('HOTEL');

  Map<String, dynamic> toJson() => {
        'id': id,
        'bookingCode': code,
        'status': status,
        'hotelId': hotelId,
        'hotelName': hotelName,
        'hotelCity': hotelCity,
        'hotelImage': hotelImage,
        'hotelAddress': hotelAddress,
        'roomName': roomName,
        'roomType': roomType,
        'guestName': guestName,
        'guestEmail': guestEmail,
        'guestPhone': guestPhone,
        'checkInDate': isoDate(checkIn),
        'checkOutDate': isoDate(checkOut),
        'nights': nights,
        'roomsCount': roomsCount,
        'totalAmount': totalAmount,
        'baseRoomPrice': baseRoomPrice,
        'paymentStatus': paymentStatus,
        'paymentMethod': paymentMethod,
        'bookedAt': bookedAt?.toIso8601String(),
        'qrCodeData': qrCodeData,
        'verifyUrl': verifyUrl,
        'specialRequests': specialRequests,
        'refundAmount': refundAmount,
        'guestCount': guestCount,
      };
}

class BookingQuote {
  BookingQuote({
    required this.nights,
    required this.baseTariff,
    required this.discountedTariff,
    required this.discountAmount,
    required this.hotelGst,
    required this.convenienceFee,
    required this.convenienceFeeGst,
    required this.totalPayable,
    required this.appliedCoupon,
    required this.gstRate,
  });

  final int nights;
  final double baseTariff;
  final double discountedTariff;
  final double discountAmount;
  final double hotelGst;
  final double convenienceFee;
  final double convenienceFeeGst;
  final double totalPayable;
  final String appliedCoupon;
  final double gstRate;

  factory BookingQuote.fromJson(Map<String, dynamic> json) {
    return BookingQuote(
      nights: _int(json['nights'], 1),
      baseTariff: _double(_first(json, ['totalBaseTariff', 'baseAmount']), 0),
      discountedTariff: _double(_first(json, ['discountedTariff']), 0),
      discountAmount: _double(json['discountAmount'], 0),
      hotelGst: _double(json['hotelGstAmount'], 0),
      convenienceFee: _double(_first(json, ['platformConvenienceFee', 'convenienceFee']), 0),
      convenienceFeeGst: _double(json['convenienceFeeGst'], 0),
      totalPayable: _double(_first(json, ['totalPayableByCustomer', 'finalAmount']), 0),
      appliedCoupon: _string(json['appliedCoupon']),
      gstRate: _double(json['gstRatePercentage'], 0),
    );
  }

  double get taxes => hotelGst + convenienceFeeGst;
}

class Coupon {
  const Coupon({
    required this.code,
    required this.description,
    required this.discountType,
    required this.discountValue,
    required this.maxDiscountCap,
    required this.minBookingAmount,
  });

  final String code;
  final String description;
  final String discountType;
  final double discountValue;
  final double maxDiscountCap;
  final double minBookingAmount;

  factory Coupon.fromJson(Map<String, dynamic> json) {
    return Coupon(
      code: _string(json['code']).toUpperCase(),
      description: _string(json['description'], 'Special saving on your stay'),
      discountType: _string(json['discountType'], 'FLAT').toUpperCase(),
      discountValue: _double(json['discountValue']),
      maxDiscountCap: _double(json['maxDiscountCap']),
      minBookingAmount: _double(json['minBookingAmount']),
    );
  }

  bool get isPercent => discountType == 'PERCENT';

  String get savingsLabel => isPercent
      ? '${discountValue.toStringAsFixed(discountValue % 1 == 0 ? 0 : 1)}% off'
      : '${money(discountValue)} off';

  String get minimumLabel => 'Min. booking ${money(minBookingAmount)}';
}
