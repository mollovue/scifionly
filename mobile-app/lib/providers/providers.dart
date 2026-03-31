import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:sqflite/sqflite.dart';
import '../features/database/database_helper.dart';
import '../features/database/content_repository.dart';
import '../models/search_state.dart';
import '../models/search_result.dart';
import '../models/movie_detail.dart';
import '../models/tv_detail.dart';
import '../models/person_detail.dart';

// Theme
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.dark);

// Database
final databaseProvider =
    StateNotifierProvider<DatabaseNotifier, AsyncValue<Database?>>((ref) {
  return DatabaseNotifier();
});

class DatabaseNotifier extends StateNotifier<AsyncValue<Database?>> {
  DatabaseNotifier() : super(const AsyncValue<Database?>.data(null)) {
    _init();
  }

  Future<void> _init() async {
    try {
      if (await DatabaseHelper.hasDatabaseFile()) {
        state = const AsyncValue<Database?>.loading();
        final db = await DatabaseHelper.openDb();
        state = AsyncValue<Database?>.data(db);
      }
    } catch (e) {
      state = const AsyncValue<Database?>.data(null);
    }
  }

  Future<void> importDatabase(String path) async {
    state = const AsyncValue<Database?>.loading();
    try {
      await DatabaseHelper.importDatabase(path);
      final db = await DatabaseHelper.database;
      state = AsyncValue<Database?>.data(db);
    } catch (e) {
      state = AsyncValue<Database?>.error(e, StackTrace.current);
    }
  }

  Future<void> loadDemoData() async {
    state = const AsyncValue<Database?>.loading();
    try {
      await DatabaseHelper.createDemoDatabase();
      final db = await DatabaseHelper.database;
      state = AsyncValue<Database?>.data(db);
    } catch (e) {
      state = AsyncValue<Database?>.error(e, StackTrace.current);
    }
  }
}

// Repository
final repositoryProvider = Provider<ContentRepository?>((ref) {
  final dbState = ref.watch(databaseProvider);
  return dbState.whenOrNull(
      data: (db) => db != null ? ContentRepository(db) : null);
});

// Stats
final statsProvider = FutureProvider<Map<String, int>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return {'movies': 0, 'tvSeries': 0};
  return repo.getStats();
});

// Search
final searchProvider =
    StateNotifierProvider<SearchNotifier, SearchState>((ref) {
  return SearchNotifier(ref);
});

class SearchNotifier extends StateNotifier<SearchState> {
  final Ref _ref;

  SearchNotifier(this._ref) : super(const SearchState());

  void setQuery(String query) {
    state = state.copyWith(query: query, currentPage: 1, results: []);
    _search();
  }

  void setFilters(SearchFilters filters) {
    state = state.copyWith(filters: filters, currentPage: 1, results: []);
    _search();
  }

  void clearFilters() {
    state = state.copyWith(
      filters: SearchFilters.empty,
      currentPage: 1,
      results: [],
    );
    _search();
  }

  void loadMore() {
    if (state.isLoading) return;
    state = state.copyWith(currentPage: state.currentPage + 1);
    _search(append: true);
  }

  Future<void> _search({bool append = false}) async {
    final repo = _ref.read(repositoryProvider);
    if (repo == null) return;
    if (!state.hasSearchActive && !append) {
      state = state.copyWith(
        results: [],
        totalResults: 0,
        isLoading: false,
        error: () => null,
      );
      return;
    }

    state = state.copyWith(isLoading: true, error: () => null);
    try {
      final response = await repo.search(
        query: state.query,
        filters: state.filters,
        page: state.currentPage,
      );
      final results =
          append ? [...state.results, ...response.results] : response.results;
      state = state.copyWith(
        results: results,
        totalResults: response.total,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: () => e.toString());
    }
  }
}

// Browse categories
final trendingMoviesProvider = FutureProvider<List<SearchResult>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return [];
  return repo.getTrending('movie');
});

final trendingTvProvider = FutureProvider<List<SearchResult>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return [];
  return repo.getTrending('tv');
});

final topRatedMoviesProvider = FutureProvider<List<SearchResult>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return [];
  return repo.getTopRated('movie');
});

final topRatedTvProvider = FutureProvider<List<SearchResult>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return [];
  return repo.getTopRated('tv');
});

final recentMoviesProvider = FutureProvider<List<SearchResult>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return [];
  return repo.getRecent('movie');
});

final recentTvProvider = FutureProvider<List<SearchResult>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return [];
  return repo.getRecent('tv');
});

final combinedTrendingProvider =
    FutureProvider<List<SearchResult>>((ref) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return [];
  return repo.getCombinedTrending();
});

// Detail providers
final movieDetailProvider =
    FutureProvider.family<MovieDetail?, int>((ref, id) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return null;
  return repo.getMovieById(id);
});

final tvDetailProvider = FutureProvider.family<TvDetail?, int>((ref, id) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return null;
  return repo.getTvSeriesById(id);
});

final personDetailProvider =
    FutureProvider.family<PersonDetail?, int>((ref, id) async {
  final repo = ref.watch(repositoryProvider);
  if (repo == null) return null;
  return repo.getPersonById(id);
});
