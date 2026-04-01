import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:scifionly/ui/screens/tv_detail_screen.dart';
import 'package:scifionly/providers/providers.dart';
import 'package:scifionly/models/tv_detail.dart';
import 'package:scifionly/models/tv_series.dart';
import 'package:scifionly/models/genre.dart';
import 'package:scifionly/models/cast_member.dart';
import 'package:scifionly/models/crew_member.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import '../fixtures/sample_data.dart';

void main() {
  Widget buildScreen(List<Override> overrides, {int tvId = 1}) {
    return ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        theme: AppTheme.darkTheme(),
        home: TvDetailScreen(tvId: tvId),
      ),
    );
  }

  List<Override> withData() => [
        tvDetailProvider(1).overrideWith((ref) async => sampleTvDetail),
      ];

  group('TvDetailScreen', () {
    testWidgets('renders episode and status info', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.textContaining('2015'), findsWidgets);
      expect(find.textContaining('Ended'), findsWidgets);
    });

    testWidgets('renders TV series title', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('The Expanse'), findsOneWidget);
    });

    testWidgets('renders genre chips', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Science Fiction'), findsOneWidget);
    });

    testWidgets('renders series info card with seasons and episodes',
        (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Seasons'), findsOneWidget);
      expect(find.text('6'), findsOneWidget);
      expect(find.text('Episodes'), findsOneWidget);
    });

    testWidgets('renders networks', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Networks'), findsOneWidget);
      expect(find.text('Amazon Prime Video'), findsOneWidget);
    });

    testWidgets('renders aired date range', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Aired'), findsOneWidget);
    });

    testWidgets('renders overview', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Overview'), findsOneWidget);
    });

    testWidgets('renders cast section', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Top Cast'), findsOneWidget);
      expect(find.text('Keanu Reeves'), findsOneWidget);
    });

    testWidgets('renders share and TMDB buttons', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Share'), findsOneWidget);
      expect(find.text('TMDB'), findsOneWidget);
    });

    testWidgets('renders rating badge', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('8.4'), findsOneWidget);
    });

    testWidgets('renders TMDB attribution', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.textContaining('Data provided by TMDB'), findsOneWidget);
    });

    testWidgets('renders details panel with language', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Details'), findsOneWidget);
    });

    testWidgets('shows "TV series not found" when data is null',
        (tester) async {
      await tester.pumpWidget(buildScreen([
        tvDetailProvider(999).overrideWith((ref) async => null),
      ], tvId: 999));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('TV series not found'), findsOneWidget);
    });

    testWidgets('shows error state', (tester) async {
      await tester.pumpWidget(buildScreen([
        tvDetailProvider(1)
            .overrideWith((ref) async => throw Exception('Test error')),
      ]));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.textContaining('Error'), findsOneWidget);
    });

    testWidgets('renders crew section with Creator', (tester) async {
      final tvDetailWithCreator = TvDetail(
        series: sampleTvSeries,
        genres: const [Genre(id: 878, name: 'Science Fiction')],
        cast: const [sampleCastMember],
        crew: const [
          CrewMember(
            personId: 5,
            name: 'Test Creator',
            profilePath: null,
            job: 'Creator',
            department: 'Writing',
          ),
        ],
      );
      await tester.pumpWidget(buildScreen([
        tvDetailProvider(1).overrideWith((ref) async => tvDetailWithCreator),
      ]));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Crew'), findsOneWidget);
      expect(find.text('Test Creator'), findsOneWidget);
      expect(find.text('Creator'), findsOneWidget);
    });

    testWidgets('renders back button', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byIcon(Icons.arrow_back), findsOneWidget);
    });

    testWidgets('renders tagline when present', (tester) async {
      final tvWithTagline = TvDetail(
        series: const TvSeries(
          id: 1,
          tmdbId: 1399,
          name: 'The Expanse',
          originalName: 'The Expanse',
          overview: 'A detective discovers a vast conspiracy.',
          firstAirDate: '2015-12-14',
          lastAirDate: '2022-01-14',
          status: 'Ended',
          numberOfSeasons: 6,
          numberOfEpisodes: 62,
          voteAverage: 8.4,
          voteCount: 2500,
          popularity: 60.0,
          originalLanguage: 'en',
          tagline: 'The future of humanity is at stake.',
          networks: '["Amazon Prime Video"]',
        ),
        genres: const [Genre(id: 878, name: 'Science Fiction')],
        cast: const [],
        crew: const [],
      );
      await tester.pumpWidget(buildScreen([
        tvDetailProvider(1).overrideWith((ref) async => tvWithTagline),
      ]));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('The future of humanity is at stake.'), findsOneWidget);
    });

    testWidgets('renders volume icon for TTS', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byIcon(Icons.volume_up), findsOneWidget);
    });
  });
}
