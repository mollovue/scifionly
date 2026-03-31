import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'tmdb_client.dart';
import 'sync_state.dart';

const int _sciFiMovieGenre = 878;
const int _sciFiTvGenre = 10765;
const int _maxChangeWindowDays = 14;

const List<String> _relevantMovieCrewJobs = [
  'Director',
  'Writer',
  'Screenplay',
  'Producer',
  'Executive Producer',
];

const List<String> _relevantTvCrewJobs = [
  'Director',
  'Creator',
  'Showrunner',
  'Executive Producer',
];

class SyncEngine {
  final Database db;
  final TmdbClient client;
  bool _isSyncing = false;
  void Function(SyncProgress)? onProgress;

  SyncEngine({required this.db, required this.client, this.onProgress});

  bool get isSyncing => _isSyncing;

  static String todayUtc() {
    return DateTime.now().toUtc().toIso8601String().substring(0, 10);
  }

  static int daysBetween(String startStr, String endStr) {
    final start = DateTime.parse(startStr);
    final end = DateTime.parse(endStr);
    return end.difference(start).inDays;
  }

  static String addDays(String dateStr, int days) {
    final d = DateTime.parse(dateStr).add(Duration(days: days));
    return d.toIso8601String().substring(0, 10);
  }

  static List<List<String>> splitDateRange(
      String startDate, String endDate, int maxDays) {
    final chunks = <List<String>>[];
    var current = startDate;

    while (current.compareTo(endDate) < 0) {
      final chunkEnd = addDays(current, maxDays);
      chunks.add([
        current,
        chunkEnd.compareTo(endDate) > 0 ? endDate : chunkEnd,
      ]);
      current = addDays(current, maxDays);
      if (current.compareTo(endDate) >= 0) break;
    }

    return chunks;
  }

  Future<SyncStateData?> _readSyncState() async {
    final rows = await db.rawQuery('SELECT * FROM sync_state WHERE id = 1');
    if (rows.isEmpty) return null;
    return SyncStateData.fromMap(rows.first);
  }

  Future<void> _ensureSyncStateRow() async {
    await db.rawInsert('INSERT OR IGNORE INTO sync_state(id) VALUES (1)');
  }

  Future<SyncProgress> runSync() async {
    if (_isSyncing) {
      return const SyncProgress(status: 'Sync already in progress');
    }
    _isSyncing = true;
    var progress = const SyncProgress(status: 'Starting sync...');

    try {
      await _ensureSyncStateRow();
      final syncState = await _readSyncState();

      String startDate;
      if (syncState?.lastChangeDate == null) {
        startDate = addDays(todayUtc(), -14);
      } else {
        startDate = syncState!.lastChangeDate!;
      }

      final endDate = todayUtc();

      if (startDate.compareTo(endDate) >= 0) {
        progress = progress.copyWith(status: 'Already up to date');
        onProgress?.call(progress);
        return progress;
      }

      final totalDays = daysBetween(startDate, endDate);
      List<List<String>> chunks;
      if (totalDays > _maxChangeWindowDays) {
        chunks = splitDateRange(startDate, endDate, _maxChangeWindowDays);
      } else {
        chunks = [
          [startDate, endDate]
        ];
      }

      for (final chunk in chunks) {
        progress = await _processChunk(chunk[0], chunk[1], progress);
      }

      // Update sync state
      final movieCount = Sqflite.firstIntValue(
              await db.rawQuery('SELECT COUNT(*) FROM movies')) ??
          0;
      final tvCount = Sqflite.firstIntValue(
              await db.rawQuery('SELECT COUNT(*) FROM tv_series')) ??
          0;

      await db.rawUpdate('''
        UPDATE sync_state SET
          last_sync_date = ?,
          last_sync_type = 'incremental',
          total_movies = ?,
          total_tv_series = ?,
          last_change_date = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      ''', [todayUtc(), movieCount, tvCount, endDate]);

      progress = progress.copyWith(status: progress.summary);
      onProgress?.call(progress);
      return progress;
    } on TmdbApiException catch (e) {
      if (e.statusCode == 401) {
        progress =
            progress.copyWith(status: 'Error: API token is invalid or expired');
      } else {
        progress = progress.copyWith(status: 'Error: ${e.message}');
      }
      onProgress?.call(progress);
      rethrow;
    } catch (e) {
      progress = progress.copyWith(status: 'Error: $e');
      onProgress?.call(progress);
      rethrow;
    } finally {
      _isSyncing = false;
    }
  }

  Future<SyncProgress> _processChunk(
      String startDate, String endDate, SyncProgress progress) async {
    // Fetch changed movie IDs
    progress = progress.copyWith(status: 'Fetching changes...');
    onProgress?.call(progress);

    final changedMovieIds = await client.getAllChangedIds(
        (page) => client.getMovieChanges(startDate, endDate, page));

    final changedTvIds = await client.getAllChangedIds(
        (page) => client.getTvChanges(startDate, endDate, page));

    // Process movies
    progress = progress.copyWith(
        status: 'Processing movies (${changedMovieIds.length} changed)...');
    onProgress?.call(progress);

    for (final tmdbId in changedMovieIds) {
      try {
        final details = await client.getMovieDetails(tmdbId);
        final genres = (details['genres'] as List<dynamic>?) ?? [];
        final isSciFi = genres
            .any((g) => (g as Map<String, dynamic>)['id'] == _sciFiMovieGenre);

        if (isSciFi) {
          final existing = await db
              .rawQuery('SELECT id FROM movies WHERE tmdb_id = ?', [tmdbId]);
          await _persistMovie(details);
          if (existing.isNotEmpty) {
            progress = progress.copyWith(updated: progress.updated + 1);
          } else {
            progress = progress.copyWith(added: progress.added + 1);
          }
        } else {
          final existing = await db
              .rawQuery('SELECT id FROM movies WHERE tmdb_id = ?', [tmdbId]);
          if (existing.isNotEmpty) {
            await _deleteMovie(tmdbId);
            progress = progress.copyWith(removed: progress.removed + 1);
          }
        }
      } on TmdbApiException catch (e) {
        if (e.statusCode == 404) continue;
        if (e.statusCode == 401) rethrow;
        progress = progress.copyWith(errors: progress.errors + 1);
      } catch (_) {
        progress = progress.copyWith(errors: progress.errors + 1);
      }
    }

    // Process TV series
    progress = progress.copyWith(
        status: 'Processing TV series (${changedTvIds.length} changed)...');
    onProgress?.call(progress);

    for (final tmdbId in changedTvIds) {
      try {
        final details = await client.getTvDetails(tmdbId);
        final genres = (details['genres'] as List<dynamic>?) ?? [];
        final isSciFi = genres
            .any((g) => (g as Map<String, dynamic>)['id'] == _sciFiTvGenre);

        if (isSciFi) {
          final existing = await db
              .rawQuery('SELECT id FROM tv_series WHERE tmdb_id = ?', [tmdbId]);
          await _persistTv(details);
          if (existing.isNotEmpty) {
            progress = progress.copyWith(updated: progress.updated + 1);
          } else {
            progress = progress.copyWith(added: progress.added + 1);
          }
        } else {
          final existing = await db
              .rawQuery('SELECT id FROM tv_series WHERE tmdb_id = ?', [tmdbId]);
          if (existing.isNotEmpty) {
            await _deleteTv(tmdbId);
            progress = progress.copyWith(removed: progress.removed + 1);
          }
        }
      } on TmdbApiException catch (e) {
        if (e.statusCode == 404) continue;
        if (e.statusCode == 401) rethrow;
        progress = progress.copyWith(errors: progress.errors + 1);
      } catch (_) {
        progress = progress.copyWith(errors: progress.errors + 1);
      }
    }

    progress = progress.copyWith(status: 'Updating database...');
    onProgress?.call(progress);
    return progress;
  }

  Future<void> _persistMovie(Map<String, dynamic> data) async {
    await db.transaction((txn) async {
      final tmdbId = data['id'] as int;

      // Upsert movie
      final spokenLangs = data['spoken_languages'] as List<dynamic>?;
      final spokenLangsJson = spokenLangs != null
          ? json.encode(spokenLangs
              .map((l) => (l as Map<String, dynamic>)['iso_639_1'])
              .toList())
          : null;

      await txn.rawInsert('''
        INSERT INTO movies(
          tmdb_id, title, original_title, overview, poster_path, backdrop_path,
          release_date, status, runtime, vote_average, vote_count, popularity,
          budget, revenue, original_language, spoken_languages, tagline,
          homepage, imdb_id, tmdb_updated_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(tmdb_id) DO UPDATE SET
          title = excluded.title, original_title = excluded.original_title,
          overview = excluded.overview, poster_path = excluded.poster_path,
          backdrop_path = excluded.backdrop_path, release_date = excluded.release_date,
          status = excluded.status, runtime = excluded.runtime,
          vote_average = excluded.vote_average, vote_count = excluded.vote_count,
          popularity = excluded.popularity, budget = excluded.budget,
          revenue = excluded.revenue, original_language = excluded.original_language,
          spoken_languages = excluded.spoken_languages, tagline = excluded.tagline,
          homepage = excluded.homepage, imdb_id = excluded.imdb_id,
          tmdb_updated_at = excluded.tmdb_updated_at, updated_at = CURRENT_TIMESTAMP
      ''', [
        tmdbId,
        data['title'],
        data['original_title'],
        data['overview'],
        data['poster_path'],
        data['backdrop_path'],
        data['release_date'],
        data['status'],
        data['runtime'],
        data['vote_average'],
        data['vote_count'],
        data['popularity'],
        data['budget'],
        data['revenue'],
        data['original_language'],
        spokenLangsJson,
        data['tagline'],
        data['homepage'],
        data['imdb_id'],
        DateTime.now().toUtc().toIso8601String(),
      ]);

      final movieRow = await txn
          .rawQuery('SELECT id FROM movies WHERE tmdb_id = ?', [tmdbId]);
      final movieId = movieRow.first['id'] as int;

      // Genres
      for (final g in (data['genres'] as List<dynamic>? ?? [])) {
        final gm = g as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR REPLACE INTO genres(id, name) VALUES (?, ?)',
            [gm['id'], gm['name']]);
      }
      await txn
          .rawDelete('DELETE FROM movie_genres WHERE movie_id = ?', [movieId]);
      for (final g in (data['genres'] as List<dynamic>? ?? [])) {
        final gm = g as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR IGNORE INTO movie_genres(movie_id, genre_id) VALUES (?, ?)',
            [movieId, gm['id']]);
      }

      // Production companies
      for (final c in (data['production_companies'] as List<dynamic>? ?? [])) {
        final cm = c as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR REPLACE INTO production_companies(id, name, logo_path, origin_country) VALUES (?, ?, ?, ?)',
            [cm['id'], cm['name'], cm['logo_path'], cm['origin_country']]);
      }
      await txn.rawDelete(
          'DELETE FROM movie_production_companies WHERE movie_id = ?',
          [movieId]);
      for (final c in (data['production_companies'] as List<dynamic>? ?? [])) {
        final cm = c as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR IGNORE INTO movie_production_companies(movie_id, company_id) VALUES (?, ?)',
            [movieId, cm['id']]);
      }

      // Keywords
      final keywordsData = data['keywords'] as Map<String, dynamic>?;
      final keywordsList = (keywordsData?['keywords'] as List<dynamic>?) ?? [];
      for (final k in keywordsList) {
        final km = k as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR REPLACE INTO keywords(id, name) VALUES (?, ?)',
            [km['id'], km['name']]);
      }
      await txn.rawDelete(
          'DELETE FROM movie_keywords WHERE movie_id = ?', [movieId]);
      for (final k in keywordsList) {
        final km = k as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR IGNORE INTO movie_keywords(movie_id, keyword_id) VALUES (?, ?)',
            [movieId, km['id']]);
      }

      // Cast (top 20)
      await txn
          .rawDelete('DELETE FROM movie_cast WHERE movie_id = ?', [movieId]);
      final credits = data['credits'] as Map<String, dynamic>?;
      final castList = (credits?['cast'] as List<dynamic>? ?? []).take(20);
      for (final person in castList) {
        final pm = person as Map<String, dynamic>;
        final personId = await _upsertPerson(txn, pm);
        await txn.rawInsert(
            'INSERT OR IGNORE INTO movie_cast(movie_id, person_id, character, display_order) VALUES (?, ?, ?, ?)',
            [movieId, personId, pm['character'], pm['order']]);
      }

      // Crew (relevant jobs only)
      await txn
          .rawDelete('DELETE FROM movie_crew WHERE movie_id = ?', [movieId]);
      final crewList = (credits?['crew'] as List<dynamic>? ?? []).where((c) =>
          _relevantMovieCrewJobs.contains((c as Map<String, dynamic>)['job']));
      for (final person in crewList) {
        final pm = person as Map<String, dynamic>;
        final personId = await _upsertPerson(txn, pm);
        await txn.rawInsert(
            'INSERT OR IGNORE INTO movie_crew(movie_id, person_id, job, department) VALUES (?, ?, ?, ?)',
            [movieId, personId, pm['job'], pm['department']]);
      }

      // Update denormalized columns
      await txn.rawUpdate('''
        UPDATE movies SET
          cast_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_cast mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = ?),
          crew_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM movie_crew mc JOIN people p ON mc.person_id = p.id WHERE mc.movie_id = ?),
          keyword_names = (SELECT GROUP_CONCAT(k.name, ', ') FROM movie_keywords mk JOIN keywords k ON mk.keyword_id = k.id WHERE mk.movie_id = ?)
        WHERE id = ?
      ''', [movieId, movieId, movieId, movieId]);

      // Update FTS
      await txn.rawDelete('DELETE FROM movies_fts WHERE rowid = ?', [movieId]);
      final updatedRow =
          await txn.rawQuery('SELECT * FROM movies WHERE id = ?', [movieId]);
      if (updatedRow.isNotEmpty) {
        final m = updatedRow.first;
        await txn.rawInsert(
            'INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              movieId,
              m['title'] ?? '',
              m['original_title'] ?? '',
              m['overview'] ?? '',
              m['tagline'] ?? '',
              m['cast_names'] ?? '',
              m['crew_names'] ?? '',
              m['keyword_names'] ?? '',
            ]);
      }
    });
  }

  Future<void> _persistTv(Map<String, dynamic> data) async {
    await db.transaction((txn) async {
      final tmdbId = data['id'] as int;

      final spokenLangs = data['spoken_languages'] as List<dynamic>?;
      final spokenLangsJson = spokenLangs != null
          ? json.encode(spokenLangs
              .map((l) => (l as Map<String, dynamic>)['iso_639_1'])
              .toList())
          : null;

      final networks = data['networks'] as List<dynamic>?;
      final networksJson = networks != null
          ? json.encode(
              networks.map((n) => (n as Map<String, dynamic>)['name']).toList())
          : null;

      final episodeRunTime = data['episode_run_time'] as List<dynamic>?;
      final episodeRunTimeJson =
          episodeRunTime != null ? json.encode(episodeRunTime) : null;

      await txn.rawInsert('''
        INSERT INTO tv_series(
          tmdb_id, name, original_name, overview, poster_path, backdrop_path,
          first_air_date, last_air_date, status, number_of_seasons, number_of_episodes,
          episode_run_time, vote_average, vote_count, popularity, original_language,
          spoken_languages, tagline, homepage, networks, tmdb_updated_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(tmdb_id) DO UPDATE SET
          name = excluded.name, original_name = excluded.original_name,
          overview = excluded.overview, poster_path = excluded.poster_path,
          backdrop_path = excluded.backdrop_path, first_air_date = excluded.first_air_date,
          last_air_date = excluded.last_air_date, status = excluded.status,
          number_of_seasons = excluded.number_of_seasons, number_of_episodes = excluded.number_of_episodes,
          episode_run_time = excluded.episode_run_time, vote_average = excluded.vote_average,
          vote_count = excluded.vote_count, popularity = excluded.popularity,
          original_language = excluded.original_language, spoken_languages = excluded.spoken_languages,
          tagline = excluded.tagline, homepage = excluded.homepage, networks = excluded.networks,
          tmdb_updated_at = excluded.tmdb_updated_at, updated_at = CURRENT_TIMESTAMP
      ''', [
        tmdbId,
        data['name'],
        data['original_name'],
        data['overview'],
        data['poster_path'],
        data['backdrop_path'],
        data['first_air_date'],
        data['last_air_date'],
        data['status'],
        data['number_of_seasons'],
        data['number_of_episodes'],
        episodeRunTimeJson,
        data['vote_average'],
        data['vote_count'],
        data['popularity'],
        data['original_language'],
        spokenLangsJson,
        data['tagline'],
        data['homepage'],
        networksJson,
        DateTime.now().toUtc().toIso8601String(),
      ]);

      final tvRow = await txn
          .rawQuery('SELECT id FROM tv_series WHERE tmdb_id = ?', [tmdbId]);
      final tvId = tvRow.first['id'] as int;

      // Genres
      for (final g in (data['genres'] as List<dynamic>? ?? [])) {
        final gm = g as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR REPLACE INTO genres(id, name) VALUES (?, ?)',
            [gm['id'], gm['name']]);
      }
      await txn.rawDelete(
          'DELETE FROM tv_series_genres WHERE tv_series_id = ?', [tvId]);
      for (final g in (data['genres'] as List<dynamic>? ?? [])) {
        final gm = g as Map<String, dynamic>;
        await txn.rawInsert(
            'INSERT OR IGNORE INTO tv_series_genres(tv_series_id, genre_id) VALUES (?, ?)',
            [tvId, gm['id']]);
      }

      // Cast (top 20)
      await txn.rawDelete(
          'DELETE FROM tv_series_cast WHERE tv_series_id = ?', [tvId]);
      final credits = data['credits'] as Map<String, dynamic>?;
      final castList = (credits?['cast'] as List<dynamic>? ?? []).take(20);
      for (final person in castList) {
        final pm = person as Map<String, dynamic>;
        final personId = await _upsertPerson(txn, pm);
        await txn.rawInsert(
            'INSERT OR IGNORE INTO tv_series_cast(tv_series_id, person_id, character, display_order) VALUES (?, ?, ?, ?)',
            [tvId, personId, pm['character'], pm['order']]);
      }

      // Crew (relevant jobs only)
      await txn.rawDelete(
          'DELETE FROM tv_series_crew WHERE tv_series_id = ?', [tvId]);
      final crewList = (credits?['crew'] as List<dynamic>? ?? []).where((c) =>
          _relevantTvCrewJobs.contains((c as Map<String, dynamic>)['job']));
      for (final person in crewList) {
        final pm = person as Map<String, dynamic>;
        final personId = await _upsertPerson(txn, pm);
        await txn.rawInsert(
            'INSERT OR IGNORE INTO tv_series_crew(tv_series_id, person_id, job, department) VALUES (?, ?, ?, ?)',
            [tvId, personId, pm['job'], pm['department']]);
      }

      // Update denormalized columns
      await txn.rawUpdate('''
        UPDATE tv_series SET
          cast_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_cast tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = ?),
          crew_names = (SELECT GROUP_CONCAT(p.name, ', ') FROM tv_series_crew tc JOIN people p ON tc.person_id = p.id WHERE tc.tv_series_id = ?)
        WHERE id = ?
      ''', [tvId, tvId, tvId]);

      // Update FTS
      await txn.rawDelete('DELETE FROM tv_series_fts WHERE rowid = ?', [tvId]);
      final updatedRow =
          await txn.rawQuery('SELECT * FROM tv_series WHERE id = ?', [tvId]);
      if (updatedRow.isNotEmpty) {
        final t = updatedRow.first;
        await txn.rawInsert(
            'INSERT INTO tv_series_fts(rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              tvId,
              t['name'] ?? '',
              t['original_name'] ?? '',
              t['overview'] ?? '',
              t['tagline'] ?? '',
              t['cast_names'] ?? '',
              t['crew_names'] ?? '',
              t['keyword_names'] ?? '',
            ]);
      }
    });
  }

  Future<int> _upsertPerson(Transaction txn, Map<String, dynamic> pm) async {
    final tmdbId = pm['id'] as int;
    await txn.rawInsert('''
      INSERT INTO people(tmdb_id, name, profile_path, known_for_department)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(tmdb_id) DO UPDATE SET
        name = excluded.name,
        profile_path = excluded.profile_path,
        known_for_department = excluded.known_for_department
    ''', [tmdbId, pm['name'], pm['profile_path'], pm['known_for_department']]);
    final row =
        await txn.rawQuery('SELECT id FROM people WHERE tmdb_id = ?', [tmdbId]);
    return row.first['id'] as int;
  }

  Future<void> _deleteMovie(int tmdbId) async {
    await db.rawDelete('DELETE FROM movies WHERE tmdb_id = ?', [tmdbId]);
  }

  Future<void> _deleteTv(int tmdbId) async {
    await db.rawDelete('DELETE FROM tv_series WHERE tmdb_id = ?', [tmdbId]);
  }
}
