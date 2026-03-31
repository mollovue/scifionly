import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/ui/components/content_card.dart';
import '../fixtures/sample_data.dart';
import '../helpers/test_helpers.dart';

void main() {
  group('ContentCard', () {
    testWidgets('standard card shows title', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        ContentCard(
          item: sampleSearchResult,
          onTap: () {},
        ),
      ));
      expect(find.text('The Matrix'), findsOneWidget);
    });

    testWidgets('standard card shows year', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        ContentCard(
          item: sampleSearchResult,
          onTap: () {},
        ),
      ));
      expect(find.text('1999'), findsOneWidget);
    });

    testWidgets('standard card shows type badge', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        ContentCard(
          item: sampleSearchResult,
          onTap: () {},
        ),
      ));
      expect(find.text('Movie'), findsOneWidget);
    });

    testWidgets('compact card shows title below image', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        ContentCard(
          item: sampleSearchResult,
          compact: true,
          onTap: () {},
        ),
      ));
      expect(find.text('The Matrix'), findsOneWidget);
    });

    testWidgets('tap callback is invoked', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(wrapWithTheme(
        ContentCard(
          item: sampleSearchResult,
          onTap: () => tapped = true,
        ),
      ));
      await tester.tap(find.text('The Matrix'));
      expect(tapped, true);
    });

    testWidgets('TV type badge shows TV', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        ContentCard(
          item: sampleTvSearchResult,
          onTap: () {},
        ),
      ));
      expect(find.text('TV'), findsOneWidget);
    });
  });
}
