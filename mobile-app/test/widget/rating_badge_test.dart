import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/ui/components/rating_badge.dart';
import '../helpers/test_helpers.dart';

void main() {
  group('RatingBadge', () {
    testWidgets('shows rating text', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const RatingBadge(rating: 8.2),
      ));
      expect(find.text('8.2'), findsOneWidget);
    });

    testWidgets('shows nothing for null rating', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const RatingBadge(rating: null),
      ));
      expect(find.byType(SizedBox), findsOneWidget);
    });

    testWidgets('green for rating >= 7', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const RatingBadge(rating: 7.5, size: 36),
      ));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, const Color(0xFF4CAF50));
    });

    testWidgets('amber for rating >= 5', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const RatingBadge(rating: 6.0, size: 36),
      ));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, const Color(0xFFFFC107));
    });

    testWidgets('red for rating < 5', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const RatingBadge(rating: 3.0, size: 36),
      ));
      final container = tester.widget<Container>(find.byType(Container).first);
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, const Color(0xFFF44336));
    });

    testWidgets('has semantics label', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const RatingBadge(rating: 8.0),
      ));
      expect(
        tester.getSemantics(find.byType(RatingBadge)),
        matchesSemantics(label: 'Rating 8.0 out of 10'),
      );
    });
  });
}
