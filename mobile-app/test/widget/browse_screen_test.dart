import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sqflite/sqflite.dart';
import 'package:scifionly/ui/screens/browse_screen.dart';
import 'package:scifionly/providers/providers.dart';
import 'package:scifionly/models/search_result.dart';
import 'package:scifionly/ui/theme/app_theme.dart';

class _FakeDatabase implements Database {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

// Use search results without poster paths to avoid network image loading issues
const _movieResult = SearchResult(
  id: 1,
  tmdbId: 603,
  type: 'movie',
  title: 'The Matrix',
  voteAverage: 8.2,
  popularity: 80.0,
);

const _tvResult = SearchResult(
  id: 1,
  tmdbId: 1399,
  type: 'tv',
  title: 'The Expanse',
  voteAverage: 8.4,
  popularity: 60.0,
);

void main() {
  group('BrowseScreen', () {
    testWidgets('shows no database message when db is null', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider.overrideWith((ref) => _NullDatabaseNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.darkTheme(),
            home: const BrowseScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('No database loaded'), findsOneWidget);
      expect(find.text('Go to Settings'), findsOneWidget);
      expect(find.byIcon(Icons.storage), findsOneWidget);
    });

    testWidgets('shows Browse title in app bar', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider.overrideWith((ref) => _NullDatabaseNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.darkTheme(),
            home: const BrowseScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Browse'), findsOneWidget);
    });

    testWidgets('shows section headers when database loaded', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider
                .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
            trendingMoviesProvider
                .overrideWith((ref) async => [_movieResult]),
            topRatedMoviesProvider
                .overrideWith((ref) async => [_movieResult]),
            recentMoviesProvider
                .overrideWith((ref) async => [_movieResult]),
            trendingTvProvider
                .overrideWith((ref) async => [_tvResult]),
            topRatedTvProvider
                .overrideWith((ref) async => [_tvResult]),
            recentTvProvider
                .overrideWith((ref) async => [_tvResult]),
          ],
          child: MaterialApp(
            theme: AppTheme.darkTheme(),
            home: const BrowseScreen(),
          ),
        ),
      );
      // Pump multiple times to let Riverpod FutureProviders resolve
      for (var i = 0; i < 10; i++) {
        await tester.pump(const Duration(milliseconds: 50));
      }

      expect(find.text('Movies'), findsOneWidget);
      // Drag up to reveal TV section below the fold
      await tester.drag(find.byType(ListView).first, const Offset(0, -500));
      await tester.pump();
      expect(find.text('TV Series'), findsOneWidget);
    });

    testWidgets('shows browse rows with data', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider
                .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
            trendingMoviesProvider
                .overrideWith((ref) async => [_movieResult]),
            topRatedMoviesProvider
                .overrideWith((ref) async => [_movieResult]),
            recentMoviesProvider
                .overrideWith((ref) async => [_movieResult]),
            trendingTvProvider
                .overrideWith((ref) async => [_tvResult]),
            topRatedTvProvider
                .overrideWith((ref) async => [_tvResult]),
            recentTvProvider
                .overrideWith((ref) async => [_tvResult]),
          ],
          child: MaterialApp(
            theme: AppTheme.darkTheme(),
            home: const BrowseScreen(),
          ),
        ),
      );
      for (var i = 0; i < 10; i++) {
        await tester.pump(const Duration(milliseconds: 50));
      }

      // Verify visible movie rows render with data
      expect(find.text('Trending Movies'), findsOneWidget);
      expect(find.text('Top Rated Movies'), findsOneWidget);
      // Drag up to reveal TV section
      await tester.drag(find.byType(ListView).first, const Offset(0, -900));
      await tester.pump();
      expect(find.text('Trending TV Series'), findsOneWidget);
    });

    testWidgets('hides section on error', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider
                .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
            trendingMoviesProvider
                .overrideWith((ref) async => throw Exception('fail')),
            topRatedMoviesProvider
                .overrideWith((ref) async => <SearchResult>[]),
            recentMoviesProvider
                .overrideWith((ref) async => <SearchResult>[]),
            trendingTvProvider
                .overrideWith((ref) async => <SearchResult>[]),
            topRatedTvProvider
                .overrideWith((ref) async => <SearchResult>[]),
            recentTvProvider
                .overrideWith((ref) async => <SearchResult>[]),
          ],
          child: MaterialApp(
            theme: AppTheme.darkTheme(),
            home: const BrowseScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Trending Movies row should not appear (error hides it)
      expect(find.text('Trending Movies'), findsNothing);
    });

    testWidgets('shows empty rows as nothing for empty data', (tester) async {
      final fakeDb = _FakeDatabase();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider
                .overrideWith((ref) => _LoadedDatabaseNotifier(fakeDb)),
            trendingMoviesProvider
                .overrideWith((ref) async => <SearchResult>[]),
            topRatedMoviesProvider
                .overrideWith((ref) async => <SearchResult>[]),
            recentMoviesProvider
                .overrideWith((ref) async => <SearchResult>[]),
            trendingTvProvider
                .overrideWith((ref) async => <SearchResult>[]),
            topRatedTvProvider
                .overrideWith((ref) async => <SearchResult>[]),
            recentTvProvider
                .overrideWith((ref) async => <SearchResult>[]),
          ],
          child: MaterialApp(
            theme: AppTheme.darkTheme(),
            home: const BrowseScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // BrowseRow renders nothing when items is empty
      expect(find.text('Trending Movies'), findsNothing);
    });

    testWidgets('shows settings button on no database state', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            databaseProvider.overrideWith((ref) => _NullDatabaseNotifier()),
          ],
          child: MaterialApp(
            theme: AppTheme.darkTheme(),
            home: const BrowseScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.settings), findsOneWidget);
    });
  });
}

class _NullDatabaseNotifier extends StateNotifier<AsyncValue<Database?>>
    implements DatabaseNotifier {
  _NullDatabaseNotifier() : super(const AsyncValue<Database?>.data(null));

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

class _LoadedDatabaseNotifier extends StateNotifier<AsyncValue<Database?>>
    implements DatabaseNotifier {
  _LoadedDatabaseNotifier(Database db) : super(AsyncValue<Database?>.data(db));

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}
