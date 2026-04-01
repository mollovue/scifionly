import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:scifionly/ui/screens/movie_detail_screen.dart';
import 'package:scifionly/providers/providers.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import '../fixtures/sample_data.dart';

void main() {
  Widget buildScreen(List<Override> overrides) {
    return ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        theme: AppTheme.darkTheme(),
        home: const MovieDetailScreen(movieId: 1),
      ),
    );
  }

  List<Override> withData() => [
        movieDetailProvider(1).overrideWith((ref) async => sampleMovieDetail),
      ];

  group('MovieDetailScreen', () {
    testWidgets('renders year, runtime, status info', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      // Year "1999" should appear, as well as runtime and status
      expect(find.textContaining('1999'), findsOneWidget);
      expect(find.textContaining('Released'), findsOneWidget);
    });

    testWidgets('renders movie title and details', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('The Matrix'), findsOneWidget);
      expect(find.text('Overview'), findsOneWidget);
    });

    testWidgets('renders genre chips', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Science Fiction'), findsOneWidget);
      expect(find.text('Action'), findsOneWidget);
    });

    testWidgets('renders cast section', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Top Cast'), findsOneWidget);
      expect(find.text('Keanu Reeves'), findsOneWidget);
    });

    testWidgets('renders crew section with Director', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Crew'), findsOneWidget);
      expect(find.text('Lana Wachowski'), findsOneWidget);
      expect(find.text('Director'), findsOneWidget);
    });

    testWidgets('renders details panel with language', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Details'), findsOneWidget);
      expect(find.text('Language'), findsOneWidget);
      expect(find.text('English'), findsOneWidget);
    });

    testWidgets('renders budget and revenue', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Budget'), findsOneWidget);
      expect(find.text('Revenue'), findsOneWidget);
    });

    testWidgets('renders production companies', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Production'), findsOneWidget);
      expect(find.text('Village Roadshow Pictures'), findsOneWidget);
    });

    testWidgets('renders keywords', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('artificial intelligence'), findsOneWidget);
    });

    testWidgets('renders tagline', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Welcome to the Real World.'), findsOneWidget);
    });

    testWidgets('renders share and TMDB buttons', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Share'), findsOneWidget);
      expect(find.text('TMDB'), findsOneWidget);
      expect(find.text('IMDB'), findsOneWidget);
    });

    testWidgets('renders TMDB attribution', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.textContaining('Data provided by TMDB'), findsOneWidget);
    });

    testWidgets('shows "Movie not found" when data is null', (tester) async {
      await tester.pumpWidget(ProviderScope(
        overrides: [
          movieDetailProvider(999).overrideWith((ref) async => null),
        ],
        child: MaterialApp(
          theme: AppTheme.darkTheme(),
          home: const MovieDetailScreen(movieId: 999),
        ),
      ));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Movie not found'), findsOneWidget);
    });

    testWidgets('shows error state', (tester) async {
      await tester.pumpWidget(ProviderScope(
        overrides: [
          movieDetailProvider(1)
              .overrideWith((ref) async => throw Exception('Test error')),
        ],
        child: MaterialApp(
          theme: AppTheme.darkTheme(),
          home: const MovieDetailScreen(movieId: 1),
        ),
      ));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.textContaining('Error'), findsOneWidget);
    });

    testWidgets('renders rating badge', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('8.2'), findsOneWidget);
    });

    testWidgets('renders vote count', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('24.0k votes'), findsOneWidget);
    });

    testWidgets('renders back button', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byIcon(Icons.arrow_back), findsOneWidget);
    });

    testWidgets('renders volume icon for TTS', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byIcon(Icons.volume_up), findsOneWidget);
    });
  });
}
