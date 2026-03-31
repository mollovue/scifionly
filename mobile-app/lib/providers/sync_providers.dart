import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../features/sync/sync_engine.dart';
import '../features/sync/sync_state.dart';
import '../features/sync/tmdb_client.dart';
import 'providers.dart';

const _tokenKey = 'tmdb_api_token';
const _syncEnabledKey = 'sync_enabled';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Must be overridden with a real SharedPreferences');
});

final tmdbTokenProvider =
    StateNotifierProvider<TmdbTokenNotifier, String?>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return TmdbTokenNotifier(prefs);
});

class TmdbTokenNotifier extends StateNotifier<String?> {
  final SharedPreferences _prefs;

  TmdbTokenNotifier(this._prefs) : super(_prefs.getString(_tokenKey));

  Future<void> setToken(String token) async {
    await _prefs.setString(_tokenKey, token);
    state = token;
  }

  Future<void> clearToken() async {
    await _prefs.remove(_tokenKey);
    state = null;
  }
}

final syncEnabledProvider =
    StateNotifierProvider<SyncEnabledNotifier, bool>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return SyncEnabledNotifier(prefs);
});

class SyncEnabledNotifier extends StateNotifier<bool> {
  final SharedPreferences _prefs;

  SyncEnabledNotifier(this._prefs)
      : super(_prefs.getBool(_syncEnabledKey) ?? false);

  Future<void> setEnabled(bool enabled) async {
    await _prefs.setBool(_syncEnabledKey, enabled);
    state = enabled;
  }
}

final syncUiStateProvider =
    StateNotifierProvider<SyncUiNotifier, SyncUiState>((ref) {
  return SyncUiNotifier();
});

class SyncUiNotifier extends StateNotifier<SyncUiState> {
  SyncUiNotifier() : super(const SyncUiState());

  void setStatus(SyncStatus status) {
    state = state.copyWith(status: status);
  }

  void setProgress(SyncProgress progress) {
    state = state.copyWith(progress: progress);
  }

  void setError(String message) {
    state = state.copyWith(
      status: SyncStatus.error,
      errorMessage: () => message,
    );
  }

  void setCompleted(SyncProgress progress) {
    state = state.copyWith(
      status: SyncStatus.completed,
      progress: progress,
      errorMessage: () => null,
    );
  }

  void setIdle() {
    state = state.copyWith(
      status: SyncStatus.idle,
      errorMessage: () => null,
    );
  }

  void setSyncState(SyncStateData? data) {
    state = state.copyWith(lastSyncState: () => data);
  }
}

final syncStateDataProvider = FutureProvider<SyncStateData?>((ref) async {
  final dbState = ref.watch(databaseProvider);
  final db = dbState.valueOrNull;
  if (db == null) return null;

  try {
    final rows = await db.rawQuery('SELECT * FROM sync_state WHERE id = 1');
    if (rows.isEmpty) return null;
    return SyncStateData.fromMap(rows.first);
  } catch (_) {
    return null;
  }
});

Future<void> runIncrementalSync(WidgetRef ref) async {
  final token = ref.read(tmdbTokenProvider);
  final dbState = ref.read(databaseProvider);
  final db = dbState.valueOrNull;
  final syncUi = ref.read(syncUiStateProvider.notifier);

  if (token == null || token.isEmpty || db == null) return;

  syncUi.setStatus(SyncStatus.syncing);
  syncUi.setProgress(const SyncProgress(status: 'Starting sync...'));

  final client = TmdbClient(apiToken: token);
  final engine = SyncEngine(
    db: db,
    client: client,
    onProgress: (progress) {
      syncUi.setProgress(progress);
    },
  );

  try {
    final result = await engine.runSync();
    syncUi.setCompleted(result);
    // Invalidate providers that depend on database content
    ref.invalidate(statsProvider);
    ref.invalidate(syncStateDataProvider);
    ref.invalidate(trendingMoviesProvider);
    ref.invalidate(trendingTvProvider);
    ref.invalidate(topRatedMoviesProvider);
    ref.invalidate(topRatedTvProvider);
    ref.invalidate(recentMoviesProvider);
    ref.invalidate(recentTvProvider);
    ref.invalidate(combinedTrendingProvider);
  } catch (e) {
    syncUi.setError(e.toString());
  } finally {
    client.close();
  }
}

Future<void> checkAndRunAutoSync(WidgetRef ref) async {
  final syncEnabled = ref.read(syncEnabledProvider);
  final token = ref.read(tmdbTokenProvider);
  final dbState = ref.read(databaseProvider);

  if (!syncEnabled ||
      token == null ||
      token.isEmpty ||
      dbState.valueOrNull == null) {
    return;
  }

  final syncState = await ref.read(syncStateDataProvider.future);
  final today = SyncEngine.todayUtc();

  if (syncState?.lastSyncDate == today) return;

  await runIncrementalSync(ref);
}
