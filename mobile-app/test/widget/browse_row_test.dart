import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/ui/components/browse_row.dart';
import 'package:scifionly/models/search_result.dart';
import '../helpers/test_helpers.dart';
import '../fixtures/sample_data.dart';

void main() {
  group('BrowseRow', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        BrowseRow(
          title: 'Trending Movies',
          items: [sampleSearchResult],
          onItemTap: (_) {},
        ),
      ));
      expect(find.text('Trending Movies'), findsOneWidget);
    });

    testWidgets('renders content cards for items', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        BrowseRow(
          title: 'Test Row',
          items: [sampleSearchResult, sampleTvSearchResult],
          onItemTap: (_) {},
        ),
      ));
      expect(find.text('The Matrix'), findsOneWidget);
      expect(find.text('The Expanse'), findsOneWidget);
    });

    testWidgets('renders nothing when items is empty', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        BrowseRow(
          title: 'Empty Row',
          items: const [],
          onItemTap: (_) {},
        ),
      ));
      expect(find.text('Empty Row'), findsNothing);
    });

    testWidgets('shows See All button when onSeeAll provided', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        BrowseRow(
          title: 'Test',
          items: [sampleSearchResult],
          onItemTap: (_) {},
          onSeeAll: () {},
        ),
      ));
      expect(find.text('See All'), findsOneWidget);
    });

    testWidgets('does not show See All button when onSeeAll is null',
        (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        BrowseRow(
          title: 'Test',
          items: [sampleSearchResult],
          onItemTap: (_) {},
        ),
      ));
      expect(find.text('See All'), findsNothing);
    });

    testWidgets('tap on item triggers callback', (tester) async {
      SearchResult? tapped;
      await tester.pumpWidget(wrapWithTheme(
        BrowseRow(
          title: 'Test',
          items: [sampleSearchResult],
          onItemTap: (item) => tapped = item,
        ),
      ));
      await tester.tap(find.text('The Matrix'));
      expect(tapped, sampleSearchResult);
    });

    testWidgets('has horizontal scroll', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        BrowseRow(
          title: 'Scrollable',
          items: [sampleSearchResult],
          onItemTap: (_) {},
        ),
      ));
      expect(find.byType(ListView), findsOneWidget);
    });
  });
}
