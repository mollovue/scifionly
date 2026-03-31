import 'package:flutter/material.dart';

class RatingBadge extends StatelessWidget {
  final double? rating;
  final double size;

  const RatingBadge({super.key, required this.rating, this.size = 24});

  Color get _color {
    if (rating == null) return Colors.grey;
    if (rating! >= 7.0) return const Color(0xFF4CAF50);
    if (rating! >= 5.0) return const Color(0xFFFFC107);
    return const Color(0xFFF44336);
  }

  @override
  Widget build(BuildContext context) {
    if (rating == null) return const SizedBox.shrink();
    final fontSize = size < 30 ? 10.0 : (size < 40 ? 12.0 : 14.0);
    return Semantics(
      label: 'Rating ${rating!.toStringAsFixed(1)} out of 10',
      excludeSemantics: true,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: _color,
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Text(
          rating!.toStringAsFixed(1),
          style: TextStyle(
            color: Colors.white,
            fontSize: fontSize,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
