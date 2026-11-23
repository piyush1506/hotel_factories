import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/app_theme.dart';

class HfNetworkImage extends StatelessWidget {
  const HfNetworkImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.borderRadius,
  });

  final String url;
  final BoxFit fit;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      width: width,
      height: height,
      color: AppColors.cardMuted,
      alignment: Alignment.center,
      child: const Icon(Icons.photo_outlined, color: AppColors.lightMuted, size: 28),
    );

    final image = url.trim().isEmpty
        ? fallback
        : CachedNetworkImage(
            imageUrl: url,
            width: width,
            height: height,
            fit: fit,
            fadeInDuration: const Duration(milliseconds: 220),
            placeholder: (context, value) => Container(
              width: width,
              height: height,
              color: AppColors.cardMuted,
              alignment: Alignment.center,
              child: const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 1.8, color: AppColors.lightMuted),
              ),
            ),
            errorWidget: (context, value, error) => fallback,
          );

    if (borderRadius == null) return image;
    return ClipRRect(borderRadius: borderRadius!, child: image);
  }
}

class HfLogo extends StatelessWidget {
  const HfLogo({super.key, this.iconSize = 36, this.showWordmark = true});

  final double iconSize;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: iconSize,
          height: iconSize,
          decoration: BoxDecoration(
            color: const Color(0xFF13A4F4),
            borderRadius: BorderRadius.circular(iconSize * 0.28),
          ),
          child: Icon(Icons.apartment_rounded, color: Colors.white, size: iconSize * 0.62),
        ),
        if (showWordmark) ...[
          const SizedBox(width: 9),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: 'Hotel',
                  style: AppTheme.style(size: iconSize * 0.58, weight: FontWeight.w800, letterSpacing: -0.6),
                ),
                TextSpan(
                  text: 'Factories',
                  style: AppTheme.style(
                    size: iconSize * 0.58,
                    weight: FontWeight.w800,
                    color: const Color(0xFF0B9BF0),
                    letterSpacing: -0.6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class HfIconButton extends StatelessWidget {
  const HfIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.background = Colors.white,
    this.foreground = AppColors.ink,
    this.borderColor = AppColors.border,
    this.size = 42,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color background;
  final Color foreground;
  final Color borderColor;
  final double size;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final button = Material(
      color: background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(size / 2),
        side: BorderSide(color: borderColor),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(size / 2),
        onTap: onTap,
        child: SizedBox(
          width: size,
          height: size,
          child: Icon(icon, size: size * 0.44, color: foreground),
        ),
      ),
    );
    if (tooltip == null) return button;
    return Tooltip(message: tooltip!, child: button);
  }
}

class HfButton extends StatelessWidget {
  const HfButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.backgroundColor = AppColors.ink,
    this.foregroundColor = Colors.white,
    this.height = 50,
    this.expanded = true,
    this.loading = false,
    this.borderColor,
    this.textSize = 14,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color backgroundColor;
  final Color foregroundColor;
  final double height;
  final bool expanded;
  final bool loading;
  final Color? borderColor;
  final double textSize;

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    final child = AnimatedOpacity(
      duration: const Duration(milliseconds: 160),
      opacity: disabled ? 0.65 : 1,
      child: Row(
        mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (loading)
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: foregroundColor),
            )
          else if (icon != null)
            Icon(icon, size: textSize + 3, color: foregroundColor),
          if (loading || icon != null) const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.style(size: textSize, weight: FontWeight.w800, color: foregroundColor),
            ),
          ),
        ],
      ),
    );

    return SizedBox(
      width: expanded ? double.infinity : null,
      height: height,
      child: Material(
        color: disabled ? backgroundColor.withOpacity(0.82) : backgroundColor,
        borderRadius: BorderRadius.circular(14),
        shape: borderColor == null
            ? null
            : RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: BorderSide(color: borderColor!),
              ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: disabled ? null : onPressed,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: expanded ? 16 : 22),
            child: child,
          ),
        ),
      ),
    );
  }
}

class HfLabel extends StatelessWidget {
  const HfLabel(this.text, {super.key, this.color = AppColors.muted});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: AppTheme.style(size: 10.5, weight: FontWeight.w800, color: color, letterSpacing: 0.9),
    );
  }
}

class HfTextField extends StatelessWidget {
  const HfTextField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.obscureText = false,
    this.maxLines = 1,
    this.prefixIcon,
    this.suffix,
    this.textInputAction,
    this.onChanged,
    this.enabled = true,
    this.required = false,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;
  final bool obscureText;
  final int maxLines;
  final IconData? prefixIcon;
  final Widget? suffix;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HfLabel(required ? '$label *' : label),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          maxLines: maxLines,
          enabled: enabled,
          textInputAction: textInputAction,
          onChanged: onChanged,
          style: AppTheme.style(size: 14, weight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: prefixIcon == null
                ? null
                : Icon(prefixIcon, size: 18, color: AppColors.lightMuted),
            suffixIcon: suffix,
            fillColor: AppColors.background,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          ),
        ),
      ],
    );
  }
}

class SectionHeading extends StatelessWidget {
  const SectionHeading({
    super.key,
    this.eyebrow,
    required this.title,
    this.subtitle,
    this.trailing,
    this.padding = EdgeInsets.zero,
    this.titleSize = 22,
  });

  final String? eyebrow;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final EdgeInsets padding;
  final double titleSize;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (eyebrow != null) ...[
                  HfLabel(eyebrow!, color: AppColors.slate),
                  const SizedBox(height: 6),
                ],
                Text(
                  title,
                  style: AppTheme.style(size: titleSize, weight: FontWeight.w800, height: 1.15, letterSpacing: -0.4),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 5),
                  Text(
                    subtitle!,
                    style: AppTheme.style(size: 12.5, color: AppColors.muted, height: 1.45),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 12),
            Padding(padding: const EdgeInsets.only(top: 2), child: trailing!),
          ],
        ],
      ),
    );
  }
}

class HfTag extends StatelessWidget {
  const HfTag({
    super.key,
    required this.label,
    this.background = AppColors.cardMuted,
    this.foreground = AppColors.slate,
    this.icon,
    this.padding = const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    this.borderColor,
  });

  final String label;
  final Color background;
  final Color foreground;
  final IconData? icon;
  final EdgeInsets padding;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
        border: borderColor == null ? null : Border.all(color: borderColor!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: foreground),
            const SizedBox(width: 4),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.style(size: 10.5, weight: FontWeight.w700, color: foreground, height: 1.2),
            ),
          ),
        ],
      ),
    );
  }
}

class ScorePill extends StatelessWidget {
  const ScorePill({
    super.key,
    required this.rating,
    this.reviews,
    this.dark = false,
    this.compact = false,
  });

  final double rating;
  final int? reviews;
  final bool dark;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.star_rounded, size: 15, color: AppColors.gold),
        const SizedBox(width: 3),
        Text(
          rating.toStringAsFixed(1),
          style: AppTheme.style(
            size: compact ? 11.5 : 12.5,
            weight: FontWeight.w800,
            color: dark ? Colors.white : AppColors.ink,
          ),
        ),
        if (reviews != null) ...[
          const SizedBox(width: 3),
          Text(
            '($reviews)',
            style: AppTheme.style(size: 10.5, weight: FontWeight.w500, color: dark ? Colors.white70 : AppColors.lightMuted),
          ),
        ],
      ],
    );
  }
}

class StarRow extends StatelessWidget {
  const StarRow({super.key, required this.count, this.size = 15, this.color = AppColors.gold});

  final int count;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        count.clamp(0, 5),
        (index) => Icon(Icons.star_rounded, size: size, color: color),
      ),
    );
  }
}

class PageDots extends StatelessWidget {
  const PageDots({super.key, required this.count, required this.index, this.dark = true});

  final int count;
  final int index;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    if (count <= 1) return const SizedBox.shrink();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(count.clamp(0, 6), (dot) {
        final active = dot == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: active ? 14 : 5,
          height: 5,
          margin: const EdgeInsets.only(right: 3),
          decoration: BoxDecoration(
            color: dark
                ? (active ? Colors.white : Colors.white.withOpacity(0.48))
                : (active ? AppColors.ink : AppColors.lightMuted.withOpacity(0.55)),
            borderRadius: BorderRadius.circular(99),
          ),
        );
      }),
    );
  }
}

class DashedContainer extends StatelessWidget {
  const DashedContainer({
    super.key,
    required this.child,
    this.color = const Color(0xFFB7C6D9),
    this.radius = 18,
    this.padding = const EdgeInsets.all(24),
    this.backgroundColor = Colors.white,
  });

  final Widget child;
  final Color color;
  final double radius;
  final EdgeInsets padding;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedBorderPainter(color: color, radius: radius),
      child: Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(color: backgroundColor, borderRadius: BorderRadius.circular(radius)),
        child: child,
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  _DashedBorderPainter({required this.color, required this.radius});

  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    final rrect = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius));
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = math.min(distance + 6, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + 4;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.radius != radius;
}

class HfEmptyState extends StatelessWidget {
  const HfEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.primaryAction,
    this.secondaryAction,
    this.padding = const EdgeInsets.symmetric(horizontal: 26, vertical: 34),
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? primaryAction;
  final Widget? secondaryAction;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return DashedContainer(
      padding: padding,
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, size: 27, color: AppColors.lightMuted),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: AppTheme.style(size: 19, weight: FontWeight.w800, height: 1.25),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppTheme.style(size: 12.5, color: AppColors.muted, height: 1.55),
          ),
          if (primaryAction != null) ...[const SizedBox(height: 20), primaryAction!],
          if (secondaryAction != null) ...[const SizedBox(height: 10), secondaryAction!],
        ],
      ),
    );
  }
}

class HfInfoRow extends StatelessWidget {
  const HfInfoRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor = AppColors.ink,
    this.labelSize = 12.5,
    this.valueWeight = FontWeight.w700,
  });

  final String label;
  final String value;
  final Color valueColor;
  final double labelSize;
  final FontWeight valueWeight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(label, style: AppTheme.style(size: labelSize, color: AppColors.muted)),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: AppTheme.style(size: labelSize, weight: valueWeight, color: valueColor),
            ),
          ),
        ],
      ),
    );
  }
}

class HfLoadingBlock extends StatelessWidget {
  const HfLoadingBlock({super.key, this.height = 160, this.message});

  final double height;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 2.2, color: AppColors.ink),
          ),
          if (message != null) ...[
            const SizedBox(height: 12),
            Text(message!, style: AppTheme.small),
          ],
        ],
      ),
    );
  }
}

IconData amenityIcon(String amenity) {
  final text = amenity.toLowerCase();
  if (text.contains('wifi') || text.contains('internet')) return Icons.wifi_rounded;
  if (text.contains('pool') || text.contains('swimming')) return Icons.pool_rounded;
  if (text.contains('ac') || text.contains('air condition') || text.contains('cool')) return Icons.ac_unit_rounded;
  if (text.contains('tv') || text.contains('television')) return Icons.tv_rounded;
  if (text.contains('breakfast') || text.contains('dining') || text.contains('restaurant') || text.contains('meal')) {
    return Icons.restaurant_rounded;
  }
  if (text.contains('parking') || text.contains('valet')) return Icons.local_parking_rounded;
  if (text.contains('spa') || text.contains('massage') || text.contains('yoga')) return Icons.spa_rounded;
  if (text.contains('beach') || text.contains('lake') || text.contains('sea') || text.contains('river')) {
    return Icons.water_rounded;
  }
  if (text.contains('mountain') || text.contains('hill') || text.contains('garden')) return Icons.landscape_rounded;
  if (text.contains('bar') || text.contains('lounge')) return Icons.local_bar_rounded;
  if (text.contains('gym') || text.contains('fitness')) return Icons.fitness_center_rounded;
  if (text.contains('pet')) return Icons.pets_rounded;
  if (text.contains('butler') || text.contains('concierge') || text.contains('service') || text.contains('front desk')) {
    return Icons.concierge_rounded;
  }
  if (text.contains('bath') || text.contains('shower') || text.contains('tub')) return Icons.bathtub_rounded;
  if (text.contains('power') || text.contains('backup')) return Icons.bolt_rounded;
  if (text.contains('pet')) return Icons.pets_rounded;
  if (text.contains('boat') || text.contains('cruise')) return Icons.directions_boat_rounded;
  return Icons.check_circle_rounded;
}

IconData categoryIcon(String category) {
  final value = category.toLowerCase();
  if (value.contains('resort')) return Icons.beach_access_rounded;
  if (value.contains('dorm') || value.contains('combo')) return Icons.groups_rounded;
  return Icons.hotel_rounded;
}

void showHfSnack(BuildContext context, String message, {bool error = false, SnackBarAction? action}) {
  final messenger = ScaffoldMessenger.of(context);
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        backgroundColor: error ? const Color(0xFF881337) : AppColors.navy,
        action: action,
        content: Row(
          children: [
            Icon(
              error ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
              color: error ? const Color(0xFFFECDD3) : const Color(0xFF6EE7B7),
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: AppTheme.style(size: 12.5, weight: FontWeight.w600, color: Colors.white, height: 1.35),
              ),
            ),
          ],
        ),
      ),
    );
}

Future<void> showInfoDialog(
  BuildContext context, {
  required String title,
  required String message,
  String buttonLabel = 'Got it',
}) {
  return showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(title, style: AppTheme.h3),
      content: Text(message, style: AppTheme.body),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            buttonLabel,
            style: AppTheme.style(size: 13, weight: FontWeight.w800, color: AppColors.ink),
          ),
        ),
      ],
    ),
  );
}
