import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/features/sync/sync_state.dart';

void main() {
  group('SyncProgress', () {
    test('default values are zero', () {
      const progress = SyncProgress();
      expect(progress.added, 0);
      expect(progress.updated, 0);
      expect(progress.removed, 0);
      expect(progress.errors, 0);
      expect(progress.status, '');
    });

    test('copyWith updates specific fields', () {
      const progress = SyncProgress(added: 1, updated: 2, removed: 3);
      final updated = progress.copyWith(added: 5, status: 'done');
      expect(updated.added, 5);
      expect(updated.updated, 2);
      expect(updated.removed, 3);
      expect(updated.status, 'done');
    });

    test('summary formats correctly', () {
      const progress = SyncProgress(added: 5, updated: 12, removed: 0);
      expect(progress.summary, 'Synced: 5 added, 12 updated, 0 removed');
    });
  });

  group('SyncStateData', () {
    test('fromMap parses correctly', () {
      final data = SyncStateData.fromMap({
        'last_sync_date': '2026-03-30',
        'last_sync_type': 'incremental',
        'total_movies': 100,
        'total_tv_series': 50,
        'last_change_date': '2026-03-30',
      });
      expect(data.lastSyncDate, '2026-03-30');
      expect(data.lastSyncType, 'incremental');
      expect(data.totalMovies, 100);
      expect(data.totalTvSeries, 50);
      expect(data.lastChangeDate, '2026-03-30');
    });

    test('fromMap handles nulls', () {
      final data = SyncStateData.fromMap({
        'last_sync_date': null,
        'last_sync_type': null,
        'total_movies': null,
        'total_tv_series': null,
        'last_change_date': null,
      });
      expect(data.lastSyncDate, isNull);
      expect(data.lastSyncType, isNull);
      expect(data.totalMovies, 0);
      expect(data.totalTvSeries, 0);
      expect(data.lastChangeDate, isNull);
    });

    test('toMap serializes correctly', () {
      const data = SyncStateData(
        lastSyncDate: '2026-03-30',
        lastSyncType: 'incremental',
        totalMovies: 100,
        totalTvSeries: 50,
        lastChangeDate: '2026-03-30',
      );
      final map = data.toMap();
      expect(map['last_sync_date'], '2026-03-30');
      expect(map['last_sync_type'], 'incremental');
      expect(map['total_movies'], 100);
      expect(map['total_tv_series'], 50);
      expect(map['last_change_date'], '2026-03-30');
    });
  });

  group('SyncUiState', () {
    test('default values', () {
      const state = SyncUiState();
      expect(state.status, SyncStatus.idle);
      expect(state.errorMessage, isNull);
      expect(state.lastSyncState, isNull);
    });

    test('copyWith updates status', () {
      const state = SyncUiState();
      final updated = state.copyWith(status: SyncStatus.syncing);
      expect(updated.status, SyncStatus.syncing);
    });

    test('copyWith sets error message', () {
      const state = SyncUiState();
      final updated = state.copyWith(
        status: SyncStatus.error,
        errorMessage: () => 'Failed',
      );
      expect(updated.status, SyncStatus.error);
      expect(updated.errorMessage, 'Failed');
    });

    test('copyWith clears error message', () {
      final state = const SyncUiState().copyWith(errorMessage: () => 'Failed');
      final cleared = state.copyWith(errorMessage: () => null);
      expect(cleared.errorMessage, isNull);
    });
  });
}
