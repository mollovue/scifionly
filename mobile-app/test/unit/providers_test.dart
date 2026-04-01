import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sqflite/sqflite.dart';
import 'package:scifionly/providers/providers.dart';
import 'package:scifionly/models/search_state.dart';
import 'package:scifionly/models/search_result.dart';
import 'package:scifionly/features/database/content_repository.dart';

class _FakeDatabase implements Database {
  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

void main() {
  group('themeModeProvider', () {
    test('defaults to dark mode', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final mode = container.read(themeModeProvider);
      expect(mode.name, 'dark');
    });
  });

  group('databaseProvider', () {
    test('starts with null data', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final state = container.read(databaseProvider);
      // Initial state should be data(null) since no file exists
      expect(state.value, isNull);
    });
  });

  group('repositoryProvider', () {
    test('returns null when no database', () {
      final container = ProviderContainer(
        overrides: [
          databaseProvider.overrideWith((ref) {
            final notifier = DatabaseNotifier();
            return notifier;
          }),
        ],
      );
      addTearDown(container.dispose);
      final repo = container.read(repositoryProvider);
      expect(repo, isNull);
    });

    test('returns ContentRepository when database loaded', () {
      final fakeDb = _FakeDatabase();
      final container = ProviderContainer(
        overrides: [
          databaseProvider.overrideWith((ref) {
            return _LoadedNotifier(fakeDb);
          }),
        ],
      );
      addTearDown(container.dispose);
      final repo = container.read(repositoryProvider);
      expect(repo, isA<ContentRepository>());
    });
  });

  group('statsProvider', () {
    test('returns zeros when no repository', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final stats = await container.read(statsProvider.future);
      expect(stats, {'movies': 0, 'tvSeries': 0});
    });
  });

  group('SearchNotifier', () {
    test('starts with empty state', () {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final state = container.read(searchProvider);
      expect(state.query, '');
      expect(state.results, isEmpty);
      expect(state.isLoading, false);
      expect(state.totalResults, 0);
    });

    test('setQuery updates query', () {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      container.read(searchProvider.notifier).setQuery('matrix');
      final state = container.read(searchProvider);
      expect(state.query, 'matrix');
    });

    test('setFilters updates filters', () {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      container.read(searchProvider.notifier).setFilters(
            SearchFilters.empty.copyWith(contentType: ContentType.movie),
          );
      final state = container.read(searchProvider);
      expect(state.filters.contentType, ContentType.movie);
    });

    test('clearFilters resets to empty', () {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      container.read(searchProvider.notifier).setFilters(
            SearchFilters.empty.copyWith(contentType: ContentType.movie),
          );
      container.read(searchProvider.notifier).clearFilters();
      final state = container.read(searchProvider);
      expect(state.filters.contentType, ContentType.all);
    });

    test('loadMore increments page', () {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      container.read(searchProvider.notifier).loadMore();
      final state = container.read(searchProvider);
      expect(state.currentPage, 2);
    });
  });

  group('browse category providers', () {
    test('trendingMoviesProvider returns empty when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(trendingMoviesProvider.future);
      expect(result, isEmpty);
    });

    test('trendingTvProvider returns empty when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(trendingTvProvider.future);
      expect(result, isEmpty);
    });

    test('topRatedMoviesProvider returns empty when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(topRatedMoviesProvider.future);
      expect(result, isEmpty);
    });

    test('topRatedTvProvider returns empty when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(topRatedTvProvider.future);
      expect(result, isEmpty);
    });

    test('recentMoviesProvider returns empty when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(recentMoviesProvider.future);
      expect(result, isEmpty);
    });

    test('recentTvProvider returns empty when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(recentTvProvider.future);
      expect(result, isEmpty);
    });

    test('combinedTrendingProvider returns empty when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(combinedTrendingProvider.future);
      expect(result, isEmpty);
    });
  });

  group('detail providers', () {
    test('movieDetailProvider returns null when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(movieDetailProvider(1).future);
      expect(result, isNull);
    });

    test('tvDetailProvider returns null when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(tvDetailProvider(1).future);
      expect(result, isNull);
    });

    test('personDetailProvider returns null when no repo', () async {
      final container = ProviderContainer(
        overrides: [
          repositoryProvider.overrideWithValue(null),
        ],
      );
      addTearDown(container.dispose);
      final result = await container.read(personDetailProvider(1).future);
      expect(result, isNull);
    });
  });
}

class _LoadedNotifier extends DatabaseNotifier {
  _LoadedNotifier(Database db) : super() {
    state = AsyncValue<Database?>.data(db);
  }
}
