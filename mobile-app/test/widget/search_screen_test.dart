import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:scifionly/ui/screens/search_screen.dart';
import 'package:scifionly/providers/providers.dart';
import 'package:scifionly/providers/sync_providers.dart';
import 'package:scifionly/models/search_state.dart';
import 'package:scifionly/models/search_result.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import '../fixtures/sample_data.dart';

class _FakeDatabase implements Database {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

void main() {
  group('SearchScreen', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    Widget buildSearchScreen({
      required List<Override> overrides,
    }) {
      return ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          theme: AppTheme.darkTheme(),
          home: const SearchScreen(),
        ),
      );
    }

    List<Override> baseOverrides(SharedPreferences prefs, {Database? db}) {
      return [
        sharedPreferencesProvider.overrideWithValue(prefs),
        if (db != null)
          databaseProvider.overrideWith((ref) => _LoadedDatabaseNotifier(db))
        else
          databaseProvider.overrideWith((ref) => _NullDatabaseNotifier()),
        statsProvider.overrideWith((ref) async => {'movies': 5, 'tvSeries': 3}),
        combinedTrendingProvider.overrideWith((ref) async => <SearchResult>[]),
      ];
    }

    testWidgets('renders hero section with app title', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: baseOverrides(prefs),
      ));
      await tester.pumpAndSettle();

      expect(find.text('SciFi Only'), findsOneWidget);
      expect(find.text('Explore the Sci-Fi Universe'), findsOneWidget);
    });

    testWidgets('renders stat chips with counts', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          databaseProvider.overrideWith((ref) => _NullDatabaseNotifier()),
          statsProvider.overrideWith(
              (ref) async => {'movies': 100, 'tvSeries': 50}),
          combinedTrendingProvider
              .overrideWith((ref) async => <SearchResult>[]),
        ],
      ));
      await tester.pumpAndSettle();

      expect(find.text('100 Movies'), findsOneWidget);
      expect(find.text('50 TV Series'), findsOneWidget);
    });

    testWidgets('renders search bar', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: baseOverrides(prefs),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsOneWidget);
      expect(find.byIcon(Icons.search), findsOneWidget);
    });

    testWidgets('shows no database state', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: baseOverrides(prefs),
      ));
      await tester.pumpAndSettle();

      expect(find.text('No database loaded'), findsOneWidget);
      expect(find.text('Import a database from Settings.'), findsOneWidget);
      expect(find.text('Go to Settings'), findsOneWidget);
    });

    testWidgets('renders advanced filters toggle', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: baseOverrides(prefs),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Advanced Filters'), findsOneWidget);
    });

    testWidgets('shows filter panel when toggle clicked', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: baseOverrides(prefs),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Advanced Filters'));
      await tester.pumpAndSettle();

      expect(find.text('Content Type'), findsOneWidget);
      expect(find.text('Year Range'), findsOneWidget);
      expect(find.text('Sort By'), findsOneWidget);
      expect(find.text('Apply'), findsOneWidget);
      expect(find.text('Reset'), findsOneWidget);
    });

    testWidgets('shows trending section when database loaded and no search',
        (tester) async {
      final fakeDb = _FakeDatabase();
      // Use a search result without posterPath to avoid CachedNetworkImage issues
      const noImageResult = SearchResult(
        id: 1,
        tmdbId: 603,
        type: 'movie',
        title: 'The Matrix',
        voteAverage: 8.2,
        popularity: 80.0,
      );
      await tester.pumpWidget(buildSearchScreen(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          databaseProvider
              .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
          statsProvider
              .overrideWith((ref) async => {'movies': 5, 'tvSeries': 3}),
          combinedTrendingProvider
              .overrideWith((ref) async => [noImageResult]),
        ],
      ));
      // Use pump with duration instead of pumpAndSettle to avoid image loading loop
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Trending Now'), findsOneWidget);
    });

    testWidgets('shows search results with count', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(buildSearchScreen(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          databaseProvider
              .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
          statsProvider
              .overrideWith((ref) async => {'movies': 5, 'tvSeries': 3}),
          combinedTrendingProvider
              .overrideWith((ref) async => <SearchResult>[]),
          searchProvider.overrideWith((ref) => _TestSearchNotifier(
                const SearchState(
                  query: 'matrix',
                  results: [sampleSearchResult],
                  totalResults: 1,
                ),
              )),
        ],
      ));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('1 results'), findsOneWidget);
    });

    testWidgets('shows no results state', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(buildSearchScreen(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          databaseProvider
              .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
          statsProvider
              .overrideWith((ref) async => {'movies': 5, 'tvSeries': 3}),
          combinedTrendingProvider
              .overrideWith((ref) async => <SearchResult>[]),
          searchProvider.overrideWith((ref) => _TestSearchNotifier(
                const SearchState(
                  query: 'xyznonexistent',
                  filters: SearchFilters(contentType: ContentType.movie),
                  results: [],
                  totalResults: 0,
                  isLoading: false,
                ),
              )),
        ],
      ));
      await tester.pumpAndSettle();

      expect(find.text('No results found'), findsOneWidget);
      expect(find.text('Try adjusting your filters.'), findsOneWidget);
      expect(find.byIcon(Icons.search_off), findsOneWidget);
    });

    testWidgets('shows result count when searching', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(buildSearchScreen(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          databaseProvider
              .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
          statsProvider
              .overrideWith((ref) async => {'movies': 50, 'tvSeries': 3}),
          combinedTrendingProvider
              .overrideWith((ref) async => <SearchResult>[]),
          searchProvider.overrideWith((ref) => _TestSearchNotifier(
                const SearchState(
                  query: 'movie',
                  results: [sampleSearchResult],
                  totalResults: 1,
                ),
              )),
        ],
      ));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('1 results'), findsOneWidget);
    });

    testWidgets('shows active filter chips', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(buildSearchScreen(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          databaseProvider
              .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
          statsProvider
              .overrideWith((ref) async => {'movies': 5, 'tvSeries': 3}),
          combinedTrendingProvider
              .overrideWith((ref) async => <SearchResult>[]),
          searchProvider.overrideWith((ref) => _TestSearchNotifier(
                const SearchState(
                  query: 'test',
                  filters: SearchFilters(
                    contentType: ContentType.movie,
                    yearMin: 2000,
                    yearMax: 2020,
                    ratingMin: 7.0,
                    ratingMax: 9.0,
                    status: 'Released',
                  ),
                  results: [],
                  totalResults: 0,
                ),
              )),
        ],
      ));
      await tester.pumpAndSettle();

      expect(find.text('Movies'), findsOneWidget);
      expect(find.text('Year: 2000-2020'), findsOneWidget);
      expect(find.text('Rating: 7.0-9.0'), findsOneWidget);
      expect(find.text('Released'), findsOneWidget);
      expect(find.text('Clear all'), findsOneWidget);
    });

    testWidgets('renders no database icon', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: baseOverrides(prefs),
      ));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.storage), findsOneWidget);
    });

    testWidgets('shows search hint text', (tester) async {
      await tester.pumpWidget(buildSearchScreen(
        overrides: baseOverrides(prefs),
      ));
      await tester.pumpAndSettle();

      expect(
          find.text('Search movies, TV shows, cast, crew...'), findsOneWidget);
    });
  });
}

class _NullDatabaseNotifier extends DatabaseNotifier {
  _NullDatabaseNotifier() : super() {
    state = const AsyncValue<Database?>.data(null);
  }
}

class _LoadedDatabaseNotifier extends DatabaseNotifier {
  _LoadedDatabaseNotifier(Database db) : super() {
    state = AsyncValue<Database?>.data(db);
  }
}

class _TestSearchNotifier extends SearchNotifier {
  _TestSearchNotifier(SearchState initialState) : super(_FakeRef()) {
    state = initialState;
  }
}

class _FakeRef implements Ref {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}
