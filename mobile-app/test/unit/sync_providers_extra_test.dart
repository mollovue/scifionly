import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:scifionly/providers/sync_providers.dart';
import 'package:scifionly/features/sync/sync_state.dart';

void main() {
  group('TmdbTokenNotifier', () {
    test('reads initial token from SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({'tmdb_api_token': 'saved-token'});
      final prefs = await SharedPreferences.getInstance();
      final notifier = TmdbTokenNotifier(prefs);
      expect(notifier.debugState, 'saved-token');
    });

    test('returns null when no token saved', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final notifier = TmdbTokenNotifier(prefs);
      expect(notifier.debugState, isNull);
    });

    test('setToken saves to prefs and updates state', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final notifier = TmdbTokenNotifier(prefs);

      await notifier.setToken('new-token');
      expect(notifier.debugState, 'new-token');
      expect(prefs.getString('tmdb_api_token'), 'new-token');
    });

    test('clearToken removes from prefs and sets null', () async {
      SharedPreferences.setMockInitialValues({'tmdb_api_token': 'old-token'});
      final prefs = await SharedPreferences.getInstance();
      final notifier = TmdbTokenNotifier(prefs);

      await notifier.clearToken();
      expect(notifier.debugState, isNull);
      expect(prefs.getString('tmdb_api_token'), isNull);
    });
  });

  group('SyncEnabledNotifier', () {
    test('reads initial value from SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({'sync_enabled': true});
      final prefs = await SharedPreferences.getInstance();
      final notifier = SyncEnabledNotifier(prefs);
      expect(notifier.debugState, true);
    });

    test('defaults to false when not saved', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final notifier = SyncEnabledNotifier(prefs);
      expect(notifier.debugState, false);
    });

    test('setEnabled saves and updates state', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final notifier = SyncEnabledNotifier(prefs);

      await notifier.setEnabled(true);
      expect(notifier.debugState, true);
      expect(prefs.getBool('sync_enabled'), true);

      await notifier.setEnabled(false);
      expect(notifier.debugState, false);
      expect(prefs.getBool('sync_enabled'), false);
    });
  });

  group('SyncUiNotifier', () {
    test('initial state is idle', () {
      final notifier = SyncUiNotifier();
      expect(notifier.debugState.status, SyncStatus.idle);
      expect(notifier.debugState.errorMessage, isNull);
      expect(notifier.debugState.lastSyncState, isNull);
    });

    test('setStatus updates status', () {
      final notifier = SyncUiNotifier();
      notifier.setStatus(SyncStatus.syncing);
      expect(notifier.debugState.status, SyncStatus.syncing);
    });

    test('setProgress updates progress', () {
      final notifier = SyncUiNotifier();
      notifier.setProgress(const SyncProgress(status: 'Working...', added: 5));
      expect(notifier.debugState.progress.status, 'Working...');
      expect(notifier.debugState.progress.added, 5);
    });

    test('setError updates status and message', () {
      final notifier = SyncUiNotifier();
      notifier.setError('Something went wrong');
      expect(notifier.debugState.status, SyncStatus.error);
      expect(notifier.debugState.errorMessage, 'Something went wrong');
    });

    test('setCompleted updates status and progress', () {
      final notifier = SyncUiNotifier();
      final progress = const SyncProgress(status: 'Done', added: 3, updated: 1);
      notifier.setCompleted(progress);
      expect(notifier.debugState.status, SyncStatus.completed);
      expect(notifier.debugState.progress.added, 3);
      expect(notifier.debugState.errorMessage, isNull);
    });

    test('setIdle resets to idle and clears error', () {
      final notifier = SyncUiNotifier();
      notifier.setError('Error!');
      notifier.setIdle();
      expect(notifier.debugState.status, SyncStatus.idle);
      expect(notifier.debugState.errorMessage, isNull);
    });

    test('setSyncState sets last sync state', () {
      final notifier = SyncUiNotifier();
      final data = const SyncStateData(
        lastSyncDate: '2024-01-01',
        lastSyncType: 'incremental',
        totalMovies: 100,
        totalTvSeries: 50,
        lastChangeDate: '2024-01-01',
      );
      notifier.setSyncState(data);
      expect(notifier.debugState.lastSyncState, isNotNull);
      expect(notifier.debugState.lastSyncState!.totalMovies, 100);
    });

    test('setSyncState with null clears it', () {
      final notifier = SyncUiNotifier();
      notifier.setSyncState(const SyncStateData(lastSyncDate: '2024-01-01'));
      notifier.setSyncState(null);
      expect(notifier.debugState.lastSyncState, isNull);
    });
  });

  group('Providers with Riverpod container', () {
    test('tmdbTokenProvider reads from SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({'tmdb_api_token': 'my-token'});
      final prefs = await SharedPreferences.getInstance();

      final container = ProviderContainer(overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ]);
      addTearDown(container.dispose);

      expect(container.read(tmdbTokenProvider), 'my-token');
    });

    test('syncEnabledProvider reads from SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({'sync_enabled': true});
      final prefs = await SharedPreferences.getInstance();

      final container = ProviderContainer(overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ]);
      addTearDown(container.dispose);

      expect(container.read(syncEnabledProvider), true);
    });

    test('syncUiStateProvider starts idle', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final state = container.read(syncUiStateProvider);
      expect(state.status, SyncStatus.idle);
    });

    test('can update syncUiState through notifier', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(syncUiStateProvider.notifier).setStatus(SyncStatus.syncing);
      expect(container.read(syncUiStateProvider).status, SyncStatus.syncing);
    });

    test('tmdbTokenProvider notifier can set and clear token', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      final container = ProviderContainer(overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ]);
      addTearDown(container.dispose);

      expect(container.read(tmdbTokenProvider), isNull);

      await container.read(tmdbTokenProvider.notifier).setToken('new-token');
      expect(container.read(tmdbTokenProvider), 'new-token');

      await container.read(tmdbTokenProvider.notifier).clearToken();
      expect(container.read(tmdbTokenProvider), isNull);
    });

    test('syncEnabledProvider notifier can toggle', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      final container = ProviderContainer(overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ]);
      addTearDown(container.dispose);

      expect(container.read(syncEnabledProvider), false);

      await container.read(syncEnabledProvider.notifier).setEnabled(true);
      expect(container.read(syncEnabledProvider), true);
    });
  });

  group('SyncUiState', () {
    test('copyWith preserves values when not overridden', () {
      const state = SyncUiState(
        status: SyncStatus.syncing,
        progress: SyncProgress(status: 'Working', added: 5),
        errorMessage: 'test',
      );

      final copied = state.copyWith();
      expect(copied.status, SyncStatus.syncing);
      expect(copied.progress.added, 5);
      expect(copied.errorMessage, 'test');
    });

    test('copyWith overrides specified values', () {
      const state = SyncUiState();

      final copied = state.copyWith(
        status: SyncStatus.error,
        errorMessage: () => 'Failed',
      );
      expect(copied.status, SyncStatus.error);
      expect(copied.errorMessage, 'Failed');
    });

    test('copyWith can set errorMessage to null', () {
      const state = SyncUiState(errorMessage: 'error');
      final copied = state.copyWith(errorMessage: () => null);
      expect(copied.errorMessage, isNull);
    });

    test('copyWith can set lastSyncState', () {
      const state = SyncUiState();
      final copied = state.copyWith(
        lastSyncState: () => const SyncStateData(lastSyncDate: '2024-01-01'),
      );
      expect(copied.lastSyncState, isNotNull);
      expect(copied.lastSyncState!.lastSyncDate, '2024-01-01');
    });
  });
}
