import 'package:intl/intl.dart';

final NumberFormat _inr = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);
final NumberFormat _inrExact = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 2,
);

String money(num? amount, {bool decimals = false}) {
  final value = amount ?? 0;
  return decimals && value % 1 != 0 ? _inrExact.format(value) : _inr.format(value);
}

String moneyCompact(num? amount) {
  final value = (amount ?? 0).toDouble();
  if (value >= 10000000) return '₹${(value / 10000000).toStringAsFixed(1)}Cr';
  if (value >= 100000) return '₹${(value / 100000).toStringAsFixed(1)}L';
  return money(value);
}

String ordinalDate(DateTime date) {
  final day = date.day;
  final suffix = day % 10 == 1 && day != 11
      ? 'st'
      : day % 10 == 2 && day != 12
          ? 'nd'
          : day % 10 == 3 && day != 13
              ? 'rd'
              : 'th';
  return '${DateFormat('EEE, d').format(date)}$suffix ${DateFormat('MMM yyyy').format(date)}';
}

String sheetDate(DateTime date) => DateFormat('d MMM yyyy').format(date);

String shortDate(DateTime date) => DateFormat('d MMM').format(date);

String shortWeekdayDate(DateTime date) => DateFormat('EEE, d MMM').format(date);

String dayMonth(DateTime date) => DateFormat('d MMM').format(date);

String monthYear(DateTime date) => DateFormat('MMMM yyyy').format(date);

String monthShort(DateTime date) => DateFormat('MMM').format(date);

String weekday(DateTime date) => DateFormat('EEEE').format(date);

String weekdayShort(DateTime date) => DateFormat('EEE').format(date);

String dayNumber(DateTime date) => DateFormat('d').format(date);

String monthYearShort(DateTime date) => "${DateFormat('MMM').format(date)}'${DateFormat('yy').format(date)}";

String longDate(DateTime date) => DateFormat('EEE, MMM d, yyyy').format(date);

String fullDate(DateTime date) => DateFormat('EEEE, d MMMM yyyy').format(date);

String longDateRange(DateTime checkIn, DateTime checkOut) =>
    '${longDate(checkIn)} — ${longDate(checkOut)}';

String isoDate(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

DateTime dateOnly(DateTime date) => DateTime(date.year, date.month, date.day);

DateTime parseIsoDate(String? value) {
  if (value == null || value.isEmpty) return DateTime.now();
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return DateTime.now();
  return DateTime(parsed.year, parsed.month, parsed.day);
}

int nightsBetween(DateTime checkIn, DateTime checkOut) {
  final diff = dateOnly(checkOut).difference(dateOnly(checkIn)).inDays;
  return diff < 0 ? 0 : diff;
}

String guestSummary(int rooms, int adultsMale, int adultsFemale, int children) {
  final adults = adultsMale + adultsFemale;
  final kids = children > 0 ? ', $children ${children == 1 ? 'Child' : 'Children'}' : '';
  return '$rooms ${rooms == 1 ? 'Room' : 'Rooms'} · $adults ${adults == 1 ? 'Adult' : 'Adults'}$kids';
}

String priceRangeLabel(double maxPrice) {
  if (maxPrice >= 40000) return 'Any budget';
  if (maxPrice <= 1500) return '₹0 – ₹1,500';
  if (maxPrice <= 2000) return 'Under ₹2,000';
  if (maxPrice <= 4000) return '₹2,000 – ₹4,000';
  if (maxPrice <= 8000) return '₹4,000 – ₹8,000';
  return '₹8,000+';
}

String timeLeftLabel(Duration duration) {
  final hours = duration.inHours;
  final minutes = duration.inMinutes.remainder(60);
  final seconds = duration.inSeconds.remainder(60);
  String two(int n) => n.toString().padLeft(2, '0');
  return 'Ends in ${two(hours)}h ${two(minutes)}m ${two(seconds)}s';
}

String initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
  if (parts.isEmpty) return 'HF';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
}
