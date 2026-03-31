class SyncProgress {
  final String status;
  final int added;
  final int updated;
  final int removed;
  final int errors;

  const SyncProgress({
    this.status = '',
    this.added = 0,
    this.updated = 0,
    this.removed = 0,
    this.errors = 0,
  });

  SyncProgress copyWith({
    String? status,
    int? added,
    int? updated,
    int? removed,
    int? errors,
  }) {
    return SyncProgress(
      status: status ?? this.status,
      added: added ?? this.added,
      updated: updated ?? this.updated,
      removed: removed ?? this.removed,
      errors: errors ?? this.errors,
    );
  }

  String get summary =>
      'Synced: $added added, $updated updated, $removed removed';
}

class SyncStateData {
  final String? lastSyncDate;
  final String? lastSyncType;
  final int totalMovies;
  final int totalTvSeries;
  final String? lastChangeDate;

  const SyncStateData({
    this.lastSyncDate,
    this.lastSyncType,
    this.totalMovies = 0,
    this.totalTvSeries = 0,
    this.lastChangeDate,
  });

  factory SyncStateData.fromMap(Map<String, dynamic> map) {
    return SyncStateData(
      lastSyncDate: map['last_sync_date'] as String?,
      lastSyncType: map['last_sync_type'] as String?,
      totalMovies: (map['total_movies'] as int?) ?? 0,
      totalTvSeries: (map['total_tv_series'] as int?) ?? 0,
      lastChangeDate: map['last_change_date'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'last_sync_date': lastSyncDate,
      'last_sync_type': lastSyncType,
      'total_movies': totalMovies,
      'total_tv_series': totalTvSeries,
      'last_change_date': lastChangeDate,
    };
  }
}

enum SyncStatus {
  idle,
  syncing,
  completed,
  error,
}

class SyncUiState {
  final SyncStatus status;
  final SyncProgress progress;
  final String? errorMessage;
  final SyncStateData? lastSyncState;

  const SyncUiState({
    this.status = SyncStatus.idle,
    this.progress = const SyncProgress(),
    this.errorMessage,
    this.lastSyncState,
  });

  SyncUiState copyWith({
    SyncStatus? status,
    SyncProgress? progress,
    String? Function()? errorMessage,
    SyncStateData? Function()? lastSyncState,
  }) {
    return SyncUiState(
      status: status ?? this.status,
      progress: progress ?? this.progress,
      errorMessage: errorMessage != null ? errorMessage() : this.errorMessage,
      lastSyncState:
          lastSyncState != null ? lastSyncState() : this.lastSyncState,
    );
  }
}
