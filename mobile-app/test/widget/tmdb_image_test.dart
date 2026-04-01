import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/ui/components/tmdb_image.dart';
import '../helpers/test_helpers.dart';

void main() {
  group('TmdbImage', () {
    testWidgets('shows placeholder when path is null', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const TmdbImage(
          path: null,
          imageType: ImageType.poster,
          width: 100,
          height: 150,
        ),
      ));
      expect(find.byIcon(Icons.movie), findsOneWidget);
    });

    testWidgets('shows placeholder when path is empty', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const TmdbImage(
          path: '',
          imageType: ImageType.poster,
          width: 100,
          height: 150,
        ),
      ));
      expect(find.byIcon(Icons.movie), findsOneWidget);
    });

    testWidgets('shows landscape icon for backdrop type', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const TmdbImage(
          path: null,
          imageType: ImageType.backdrop,
          width: 200,
          height: 100,
        ),
      ));
      expect(find.byIcon(Icons.landscape), findsOneWidget);
    });

    testWidgets('shows person icon for profile type', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const TmdbImage(
          path: null,
          imageType: ImageType.profile,
          width: 80,
          height: 80,
        ),
      ));
      expect(find.byIcon(Icons.person), findsOneWidget);
    });

    testWidgets('renders with border radius', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const TmdbImage(
          path: null,
          imageType: ImageType.poster,
          width: 100,
          height: 150,
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
      ));
      // Should render without error
      expect(find.byType(TmdbImage), findsOneWidget);
    });

    testWidgets('renders with valid path (CachedNetworkImage)', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const TmdbImage(
          path: '/test.jpg',
          size: 'w342',
          imageType: ImageType.poster,
          width: 100,
          height: 150,
        ),
      ));
      // CachedNetworkImage will attempt to load, shows shimmer placeholder initially
      expect(find.byType(TmdbImage), findsOneWidget);
    });

    testWidgets('renders with borderRadius and valid path', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        const TmdbImage(
          path: '/test.jpg',
          size: 'w500',
          imageType: ImageType.poster,
          width: 100,
          height: 150,
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ));
      // Should wrap in ClipRRect
      expect(find.byType(ClipRRect), findsOneWidget);
    });
  });

  group('ImageType', () {
    test('has correct enum values', () {
      expect(ImageType.values.length, 3);
      expect(ImageType.poster, isNotNull);
      expect(ImageType.backdrop, isNotNull);
      expect(ImageType.profile, isNotNull);
    });
  });
}
