import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/app_theme.dart';
import '../core/formatters.dart';
import '../models/models.dart';
import 'common.dart';

class BookingStatusChip extends StatelessWidget {
  const BookingStatusChip({super.key, required this.booking, this.compact = false});

  final Booking booking;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    late final Color background;
    late final Color foreground;
    switch (booking.status) {
      case 'CONFIRMED':
      case 'CHECKED_IN':
        background = AppColors.greenSoft;
        foreground = AppColors.greenText;
        break;
      case 'HELD':
      case 'PENDING_PAYMENT':
        background = AppColors.goldSoft;
        foreground = AppColors.goldDeep;
        break;
      case 'CANCELLED':
      case 'REFUNDED':
        background = AppColors.redSoft;
        foreground = AppColors.red;
        break;
      case 'COMPLETED':
        background = AppColors.blueSoft;
        foreground = AppColors.blueDark;
        break;
      default:
        background = AppColors.cardMuted;
        foreground = AppColors.slate;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 10, vertical: compact ? 4 : 5),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(99)),
      child: Text(
        booking.statusLabel,
        style: AppTheme.style(
          size: compact ? 9.5 : 10.5,
          weight: FontWeight.w800,
          color: foreground,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

/// Decoded QR pass. The API usually returns a base64 data URL, but older
/// records may contain a plain verification link.
class BookingQrView extends StatelessWidget {
  const BookingQrView({super.key, required this.data, this.size = 176});

  final String data;
  final double size;

  Uint8List? _decode() {
    final value = data.trim();
    if (!value.startsWith('data:image')) return null;
    final comma = value.indexOf(',');
    if (comma < 0) return null;
    try {
      return base64Decode(value.substring(comma + 1));
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bytes = _decode();
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: bytes == null
          ? Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.qr_code_2_rounded, size: 62, color: AppColors.ink),
                const SizedBox(height: 6),
                Text(
                  'QR pass',
                  style: AppTheme.style(size: 10.5, weight: FontWeight.w700, color: AppColors.muted),
                ),
              ],
            )
          : Image.memory(
              bytes,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stack) => const Icon(
                Icons.qr_code_2_rounded,
                size: 62,
                color: AppColors.ink,
              ),
            ),
    );
  }
}

String bookingGuestLabel(Booking booking) {
  final raw = booking.guestCount;
  if (raw is Map) {
    final adults = raw['adults'];
    final children = raw['children'];
    if (adults != null) {
      final kids = (children is num && children > 0)
          ? ', ${children.toInt()} ${children == 1 ? 'child' : 'children'}'
          : '';
      return '$adults ${adults == 1 ? 'adult' : 'adults'}$kids';
    }
  }
  if (raw is num) return '$raw ${raw == 1 ? 'guest' : 'guests'}';
  return '${booking.roomsCount} ${booking.roomsCount == 1 ? 'room' : 'rooms'}';
}

String bookingStayLabel(Booking booking) {
  final nights = booking.nights == 1 ? '1 night' : '${booking.nights} nights';
  final rooms = booking.roomsCount == 1 ? '1 room' : '${booking.roomsCount} rooms';
  return '$nights · $rooms · ${bookingGuestLabel(booking)}';
}

Future<void> copyBookingCode(BuildContext context, String code) async {
  await Clipboard.setData(ClipboardData(text: code));
  if (!context.mounted) return;
  showHfSnack(context, 'Booking code $code copied');
}

class PaymentBadge extends StatelessWidget {
  const PaymentBadge({super.key, required this.booking});

  final Booking booking;

  @override
  Widget build(BuildContext context) {
    final paid = booking.paymentStatus.toUpperCase() == 'PAID';
    final label = paid
        ? 'Paid online'
        : booking.isPayAtHotel
            ? 'Pay at hotel'
            : 'Payment pending';
    return HfTag(
      label: label,
      icon: paid ? Icons.verified_rounded : Icons.account_balance_rounded,
      background: paid ? AppColors.greenSoft : AppColors.goldSoft,
      foreground: paid ? AppColors.greenText : AppColors.goldDeep,
    );
  }
}
