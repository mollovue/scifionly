import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:sqflite/sqflite.dart';
import 'package:scifionly/features/sync/sync_engine.dart';
import 'package:scifionly/features/sync/tmdb_client.dart';
import 'package:scifionly/features/sync/sync_state.dart';

/// A fake TmdbClient that returns canned responses for testing SyncEngine.
class FakeTmdbClient extends TmdbClient {
  final Map<int, Map<String, dynamic>> movieDetails;
  final Map<int, Map<String, dynamic>> tvDetails;
  final List<int> changedMovieIds;
  final List<int> changedTvIds;
  final Map<int, int> movieErrorCodes;
  final Map<int, int> tvErrorCodes;

  FakeTmdbClient({
    this.movieDetails = const {},
    this.tvDetails = const {},
    this.changedMovieIds = const [],
    this.changedTvIds = const [],
    this.movieErrorCodes = const {},
    this.tvErrorCodes = const {},
  }) : super(apiToken: 'fake-token');

  @override
  Future<Map<String, dynamic>> getMovieChanges(
      String startDate, String endDate, int page) async {
    return {
      'results': changedMovieIds.map((id) => {'id': id}).toList(),
      'total_pages': 1,
    };
  }

  @override
  Future<Map<String, dynamic>> getTvChanges(
      String startDate, String endDate, int page) async {
    return {
      'results': changedTvIds.map((id) => {'id': id}).toList(),
      'total_pages': 1,
    };
  }

  @override
  Future<Map<String, dynamic>> getMovieDetails(int id) async {
    if (movieErrorCodes.containsKey(id)) {
      throw TmdbApiException(movieErrorCodes[id]!, 'Error for movie $id');
    }
    return movieDetails[id] ??
        {'id': id, 'title': 'Movie $id', 'genres': []};
  }

  @override
  Future<Map<String, dynamic>> getTvDetails(int id) async {
    if (tvErrorCodes.containsKey(id)) {
      throw TmdbApiException(tvErrorCodes[id]!, 'Error for tv $id');
    }
    return tvDetails[id] ??
        {'id': id, 'name': 'TV $id', 'genres': []};
  }

  @override
  Future<List<int>> getAllChangedIds(
    Future<Map<String, dynamic>> Function(int page) fetchPage,
  ) async {
    final firstPage = await fetchPage(1);
    final results = <int>[];
    for (final item in (firstPage['results'] as List<dynamic>? ?? [])) {
      results.add((item as Map<String, dynamic>)['id'] as int);
    }
    return results;
  }

  @override
  void close() {}
}

Future<Database> _createTestDb() async {
  return await databaseFactoryFfi.openDatabase(
    inMemoryDatabasePath,
    options: OpenDatabaseOptions(
      version: 1,
      onCreate: (db, version) async {
        await _createSchema(db);
      },
    ),
  );
}

Future<void> _createSchema(Database db) async {
  await db.execute('CREATE TABLE IF NOT EXISTS genres (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER NOT NULL UNIQUE, name TEXT NOT NULL, profile_path TEXT, known_for_department TEXT)');
  await db.execute('CREATE TABLE IF NOT EXISTS keywords (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
  await db.execute('CREATE TABLE IF NOT EXISTS production_companies (id INTEGER PRIMARY KEY, name TEXT NOT NULL, logo_path TEXT, origin_country TEXT)');
  await db.execute('''CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL, original_title TEXT, overview TEXT,
    poster_path TEXT, backdrop_path TEXT, release_date TEXT, status TEXT,
    runtime INTEGER, vote_average REAL, vote_count INTEGER, popularity REAL,
    budget INTEGER, revenue INTEGER, original_language TEXT, spoken_languages TEXT,
    tagline TEXT, homepage TEXT, imdb_id TEXT, cast_names TEXT, crew_names TEXT,
    keyword_names TEXT, tmdb_updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)''');
  await db.execute('''CREATE TABLE IF NOT EXISTS tv_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL, original_name TEXT, overview TEXT,
    poster_path TEXT, backdrop_path TEXT, first_air_date TEXT, last_air_date TEXT,
    status TEXT, number_of_seasons INTEGER, number_of_episodes INTEGER,
    episode_run_time TEXT, vote_average REAL, vote_count INTEGER, popularity REAL,
    original_language TEXT, spoken_languages TEXT, tagline TEXT, homepage TEXT,
    networks TEXT, cast_names TEXT, crew_names TEXT, keyword_names TEXT,
    tmdb_updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)''');
  await db.execute('CREATE TABLE IF NOT EXISTS movie_genres (movie_id INTEGER NOT NULL, genre_id INTEGER NOT NULL, PRIMARY KEY (movie_id, genre_id))');
  await db.execute('CREATE TABLE IF NOT EXISTS movie_cast (movie_id INTEGER NOT NULL, person_id INTEGER NOT NULL, character TEXT, display_order INTEGER, PRIMARY KEY (movie_id, person_id, character))');
  await db.execute('CREATE TABLE IF NOT EXISTS movie_crew (movie_id INTEGER NOT NULL, person_id INTEGER NOT NULL, job TEXT, department TEXT, PRIMARY KEY (movie_id, person_id, job))');
  await db.execute('CREATE TABLE IF NOT EXISTS movie_keywords (movie_id INTEGER NOT NULL, keyword_id INTEGER NOT NULL, PRIMARY KEY (movie_id, keyword_id))');
  await db.execute('CREATE TABLE IF NOT EXISTS movie_production_companies (movie_id INTEGER NOT NULL, company_id INTEGER NOT NULL, PRIMARY KEY (movie_id, company_id))');
  await db.execute('CREATE TABLE IF NOT EXISTS tv_series_genres (tv_series_id INTEGER NOT NULL, genre_id INTEGER NOT NULL, PRIMARY KEY (tv_series_id, genre_id))');
  await db.execute('CREATE TABLE IF NOT EXISTS tv_series_cast (tv_series_id INTEGER NOT NULL, person_id INTEGER NOT NULL, character TEXT, display_order INTEGER, PRIMARY KEY (tv_series_id, person_id, character))');
  await db.execute('CREATE TABLE IF NOT EXISTS tv_series_crew (tv_series_id INTEGER NOT NULL, person_id INTEGER NOT NULL, job TEXT, department TEXT, PRIMARY KEY (tv_series_id, person_id, job))');
  await db.execute('CREATE TABLE IF NOT EXISTS sync_state (id INTEGER PRIMARY KEY DEFAULT 1, last_sync_date TEXT, last_sync_type TEXT, total_movies INTEGER DEFAULT 0, total_tv_series INTEGER DEFAULT 0, last_change_date TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
  await db.rawInsert('INSERT OR IGNORE INTO sync_state(id) VALUES (1)');
  await db.execute('CREATE TABLE IF NOT EXISTS image_cache (id INTEGER PRIMARY KEY AUTOINCREMENT, media_type TEXT NOT NULL, media_id INTEGER NOT NULL, image_type TEXT NOT NULL, size TEXT NOT NULL, tmdb_path TEXT, image_data BLOB NOT NULL, content_type TEXT NOT NULL, file_size INTEGER NOT NULL DEFAULT 0, fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(media_type, media_id, image_type, size))');
  // Use standalone FTS tables (without content= directive) for sqflite_ffi compatibility.
  // The content= directive causes "database disk image is malformed" errors in ffi.
  // This still exercises all the FTS INSERT/DELETE code paths in SyncEngine.
  await db.execute("CREATE VIRTUAL TABLE IF NOT EXISTS movies_fts USING fts5(title, original_title, overview, tagline, cast_names, crew_names, keyword_names, tokenize='porter unicode61')");
  await db.execute("CREATE VIRTUAL TABLE IF NOT EXISTS tv_series_fts USING fts5(name, original_name, overview, tagline, cast_names, crew_names, keyword_names, tokenize='porter unicode61')");
}

Map<String, dynamic> _fullSciFiMovie(int tmdbId, {String title = 'Sci-Fi Movie'}) {
  return {
    'id': tmdbId,
    'title': title,
    'original_title': title,
    'overview': 'A movie about space and aliens',
    'poster_path': '/poster.jpg',
    'backdrop_path': '/backdrop.jpg',
    'release_date': '2024-01-01',
    'status': 'Released',
    'runtime': 120,
    'vote_average': 7.5,
    'vote_count': 1000,
    'popularity': 50.0,
    'budget': 100000000,
    'revenue': 500000000,
    'original_language': 'en',
    'tagline': 'In space.',
    'homepage': 'https://example.com',
    'imdb_id': 'tt${tmdbId}00',
    'spoken_languages': [{'iso_639_1': 'en'}, {'iso_639_1': 'fr'}],
    'genres': [{'id': 878, 'name': 'Science Fiction'}],
    'production_companies': [
      {'id': 1, 'name': 'Studio', 'logo_path': '/logo.png', 'origin_country': 'US'}
    ],
    'keywords': {
      'keywords': [{'id': 100, 'name': 'space'}, {'id': 101, 'name': 'alien'}]
    },
    'credits': {
      'cast': [
        {'id': 999, 'name': 'Actor', 'profile_path': '/a.jpg', 'known_for_department': 'Acting', 'character': 'Hero', 'order': 0},
        {'id': 998, 'name': 'Actor2', 'profile_path': null, 'known_for_department': 'Acting', 'character': 'Villain', 'order': 1},
      ],
      'crew': [
        {'id': 900, 'name': 'Director', 'profile_path': '/d.jpg', 'known_for_department': 'Directing', 'job': 'Director', 'department': 'Directing'},
        {'id': 901, 'name': 'Writer', 'profile_path': null, 'known_for_department': 'Writing', 'job': 'Screenplay', 'department': 'Writing'},
        {'id': 902, 'name': 'Producer', 'profile_path': null, 'known_for_department': 'Production', 'job': 'Producer', 'department': 'Production'},
        {'id': 903, 'name': 'EP', 'profile_path': null, 'known_for_department': 'Production', 'job': 'Executive Producer', 'department': 'Production'},
        {'id': 904, 'name': 'Composer', 'profile_path': null, 'known_for_department': 'Sound', 'job': 'Music', 'department': 'Sound'},
      ]
    },
  };
}

Map<String, dynamic> _fullSciFiTv(int tmdbId, {String name = 'Sci-Fi Show'}) {
  return {
    'id': tmdbId,
    'name': name,
    'original_name': name,
    'overview': 'A TV show about the future',
    'poster_path': '/poster.jpg',
    'backdrop_path': '/backdrop.jpg',
    'first_air_date': '2024-01-01',
    'last_air_date': '2024-06-01',
    'status': 'Ended',
    'number_of_seasons': 1,
    'number_of_episodes': 10,
    'episode_run_time': [45, 50],
    'vote_average': 8.0,
    'vote_count': 500,
    'popularity': 40.0,
    'original_language': 'en',
    'tagline': 'The future is now.',
    'homepage': null,
    'spoken_languages': [{'iso_639_1': 'en'}],
    'networks': [{'name': 'Netflix'}, {'name': 'HBO'}],
    'genres': [{'id': 10765, 'name': 'Sci-Fi & Fantasy'}],
    'credits': {
      'cast': [
        {'id': 888, 'name': 'TV Actor', 'profile_path': null, 'known_for_department': 'Acting', 'character': 'Captain', 'order': 0}
      ],
      'crew': [
        {'id': 887, 'name': 'Creator', 'profile_path': null, 'known_for_department': 'Writing', 'job': 'Creator', 'department': 'Writing'},
        {'id': 886, 'name': 'Showrunner', 'profile_path': null, 'known_for_department': 'Writing', 'job': 'Showrunner', 'department': 'Writing'},
        {'id': 885, 'name': 'EP', 'profile_path': null, 'known_for_department': 'Production', 'job': 'Executive Producer', 'department': 'Production'},
        {'id': 884, 'name': 'Cameraman', 'profile_path': null, 'known_for_department': 'Camera', 'job': 'Cinematographer', 'department': 'Camera'},
      ]
    },
  };
}

void main() {
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  group('SyncEngine.runSync integration', () {
    late Database db;

    setUp(() async {
      db = await _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('isSyncing is false initially', () {
      final client = FakeTmdbClient();
      final engine = SyncEngine(db: db, client: client);
      expect(engine.isSyncing, false);
    });

    test('adds new sci-fi movie with all relations', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [42],
        movieDetails: {42: _fullSciFiMovie(42)},
      );
      final progressUpdates = <SyncProgress>[];
      final engine = SyncEngine(
        db: db,
        client: client,
        onProgress: (p) => progressUpdates.add(p),
      );

      final result = await engine.runSync();

      // Movie inserted
      final movies = await db.rawQuery('SELECT * FROM movies WHERE tmdb_id = 42');
      expect(movies.length, 1);
      expect(movies.first['title'], 'Sci-Fi Movie');
      expect(movies.first['spoken_languages'], contains('en'));

      final movieId = movies.first['id'] as int;

      // Genres
      final genres = await db.rawQuery('SELECT * FROM movie_genres WHERE movie_id = ?', [movieId]);
      expect(genres.length, 1);

      // Production companies
      final companies = await db.rawQuery('SELECT * FROM movie_production_companies WHERE movie_id = ?', [movieId]);
      expect(companies.length, 1);

      // Keywords
      final keywords = await db.rawQuery('SELECT * FROM movie_keywords WHERE movie_id = ?', [movieId]);
      expect(keywords.length, 2);

      // Cast (2 actors)
      final cast = await db.rawQuery('SELECT * FROM movie_cast WHERE movie_id = ?', [movieId]);
      expect(cast.length, 2);

      // Crew (Director, Screenplay, Producer, Executive Producer - not Music)
      final crew = await db.rawQuery('SELECT * FROM movie_crew WHERE movie_id = ?', [movieId]);
      expect(crew.length, 4);

      // Denormalized cast_names / crew_names
      final movie = (await db.rawQuery('SELECT * FROM movies WHERE id = ?', [movieId])).first;
      expect(movie['cast_names'], isNotNull);
      expect(movie['crew_names'], isNotNull);
      expect(movie['keyword_names'], isNotNull);

      // FTS populated
      final fts = await db.rawQuery("SELECT rowid FROM movies_fts WHERE movies_fts MATCH 'space'");
      expect(fts.length, 1);

      // Sync state updated
      final syncState = await db.rawQuery('SELECT * FROM sync_state WHERE id = 1');
      expect(syncState.first['last_sync_type'], 'incremental');
      expect(syncState.first['total_movies'], 1);

      expect(result.added, 1);
      expect(progressUpdates, isNotEmpty);
    });

    test('adds new sci-fi TV series with all relations', () async {
      final client = FakeTmdbClient(
        changedTvIds: [99],
        tvDetails: {99: _fullSciFiTv(99)},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();

      final tv = await db.rawQuery('SELECT * FROM tv_series WHERE tmdb_id = 99');
      expect(tv.length, 1);
      expect(tv.first['name'], 'Sci-Fi Show');
      expect(tv.first['networks'], contains('Netflix'));
      expect(tv.first['episode_run_time'], contains('45'));

      final tvId = tv.first['id'] as int;

      // Genres
      final genres = await db.rawQuery('SELECT * FROM tv_series_genres WHERE tv_series_id = ?', [tvId]);
      expect(genres.length, 1);

      // Cast
      final cast = await db.rawQuery('SELECT * FROM tv_series_cast WHERE tv_series_id = ?', [tvId]);
      expect(cast.length, 1);

      // Crew (Creator, Showrunner, Executive Producer — not Cinematographer)
      final crew = await db.rawQuery('SELECT * FROM tv_series_crew WHERE tv_series_id = ?', [tvId]);
      expect(crew.length, 3);

      // FTS
      final fts = await db.rawQuery("SELECT rowid FROM tv_series_fts WHERE tv_series_fts MATCH 'future'");
      expect(fts.length, 1);

      expect(result.added, 1);
    });

    test('updates existing sci-fi movie', () async {
      await db.insert('movies', {'tmdb_id': 60, 'title': 'Old Title', 'original_language': 'en'});

      final client = FakeTmdbClient(
        changedMovieIds: [60],
        movieDetails: {60: _fullSciFiMovie(60, title: 'New Title')},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();

      final movies = await db.rawQuery('SELECT * FROM movies WHERE tmdb_id = 60');
      expect(movies.first['title'], 'New Title');
      expect(result.updated, 1);
    });

    test('updates existing sci-fi TV series', () async {
      await db.insert('tv_series', {'tmdb_id': 70, 'name': 'Old TV', 'original_language': 'en'});

      final client = FakeTmdbClient(
        changedTvIds: [70],
        tvDetails: {70: _fullSciFiTv(70, name: 'New TV')},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();

      final tv = await db.rawQuery('SELECT * FROM tv_series WHERE tmdb_id = 70');
      expect(tv.first['name'], 'New TV');
      expect(result.updated, 1);
    });

    test('removes movie no longer sci-fi', () async {
      await db.insert('movies', {'tmdb_id': 50, 'title': 'Was SciFi', 'original_language': 'en'});

      final client = FakeTmdbClient(
        changedMovieIds: [50],
        movieDetails: {
          50: {'id': 50, 'title': 'Was SciFi', 'genres': [{'id': 28, 'name': 'Action'}]}
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();

      final movies = await db.rawQuery('SELECT * FROM movies WHERE tmdb_id = 50');
      expect(movies.length, 0);
      expect(result.removed, 1);
    });

    test('removes TV series no longer sci-fi', () async {
      await db.insert('tv_series', {'tmdb_id': 55, 'name': 'Was SciFi TV', 'original_language': 'en'});

      final client = FakeTmdbClient(
        changedTvIds: [55],
        tvDetails: {
          55: {'id': 55, 'name': 'Was SciFi TV', 'genres': [{'id': 18, 'name': 'Drama'}]}
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();

      final tv = await db.rawQuery('SELECT * FROM tv_series WHERE tmdb_id = 55');
      expect(tv.length, 0);
      expect(result.removed, 1);
    });

    test('skips non-scifi movie not in DB', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [77],
        movieDetails: {
          77: {'id': 77, 'title': 'Action', 'genres': [{'id': 28, 'name': 'Action'}]}
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.added, 0);
      expect(result.removed, 0);
    });

    test('skips non-scifi TV not in DB', () async {
      final client = FakeTmdbClient(
        changedTvIds: [77],
        tvDetails: {
          77: {'id': 77, 'name': 'Drama', 'genres': [{'id': 18, 'name': 'Drama'}]}
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.added, 0);
      expect(result.removed, 0);
    });

    test('handles 404 for movie gracefully', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [404],
        movieErrorCodes: {404: 404},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.errors, 0);
    });

    test('handles 404 for TV gracefully', () async {
      final client = FakeTmdbClient(
        changedTvIds: [404],
        tvErrorCodes: {404: 404},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.errors, 0);
    });

    test('rethrows 401 for movie', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [1],
        movieErrorCodes: {1: 401},
      );

      final progressUpdates = <SyncProgress>[];
      final engine = SyncEngine(
        db: db,
        client: client,
        onProgress: (p) => progressUpdates.add(p),
      );
      expect(() => engine.runSync(), throwsA(isA<TmdbApiException>()));
    });

    test('rethrows 401 for TV', () async {
      final client = FakeTmdbClient(
        changedTvIds: [1],
        tvErrorCodes: {1: 401},
      );

      final engine = SyncEngine(db: db, client: client);
      expect(() => engine.runSync(), throwsA(isA<TmdbApiException>()));
    });

    test('counts 500 errors for movie', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [500],
        movieErrorCodes: {500: 500},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.errors, 1);
    });

    test('counts 500 errors for TV', () async {
      final client = FakeTmdbClient(
        changedTvIds: [500],
        tvErrorCodes: {500: 500},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.errors, 1);
    });

    test('handles generic exception for movie', () async {
      final client = _ThrowingClient(movieIds: [1]);
      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.errors, 1);
    });

    test('handles generic exception for TV', () async {
      final client = _ThrowingClient(tvIds: [1]);
      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.errors, 1);
    });

    test('reports already up to date when sync state is future', () async {
      await db.rawUpdate('UPDATE sync_state SET last_change_date = ? WHERE id = 1', ['2099-12-31']);

      final client = FakeTmdbClient();
      final progressUpdates = <SyncProgress>[];
      final engine = SyncEngine(db: db, client: client, onProgress: (p) => progressUpdates.add(p));
      final result = await engine.runSync();
      expect(result.status, 'Already up to date');
    });

    test('movie with no spoken_languages or optional fields', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [80],
        movieDetails: {
          80: {
            'id': 80,
            'title': 'Minimal Movie',
            'original_title': 'Minimal Movie',
            'overview': 'Test',
            'genres': [{'id': 878, 'name': 'Science Fiction'}],
            'credits': {'cast': [], 'crew': []},
          }
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.added, 1);
    });

    test('TV with no optional fields', () async {
      final client = FakeTmdbClient(
        changedTvIds: [80],
        tvDetails: {
          80: {
            'id': 80,
            'name': 'Minimal TV',
            'original_name': 'Minimal TV',
            'overview': 'Test',
            'genres': [{'id': 10765, 'name': 'Sci-Fi & Fantasy'}],
            'credits': {'cast': [], 'crew': []},
          }
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.added, 1);
    });

    test('processes both movies and TV in one sync', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [10],
        changedTvIds: [20],
        movieDetails: {10: _fullSciFiMovie(10, title: 'Movie 10')},
        tvDetails: {20: _fullSciFiTv(20, name: 'TV 20')},
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.added, 2);

      final movies = await db.rawQuery('SELECT COUNT(*) as c FROM movies');
      expect(movies.first['c'], 1);

      final tv = await db.rawQuery('SELECT COUNT(*) as c FROM tv_series');
      expect(tv.first['c'], 1);

      final syncState = await db.rawQuery('SELECT * FROM sync_state WHERE id = 1');
      expect(syncState.first['total_movies'], 1);
      expect(syncState.first['total_tv_series'], 1);
    });

    test('large date range uses chunked processing', () async {
      // Set last_change_date far in the past to trigger chunking
      await db.rawUpdate('UPDATE sync_state SET last_change_date = ? WHERE id = 1', ['2024-01-01']);

      final client = FakeTmdbClient(
        changedMovieIds: [1],
        movieDetails: {
          1: _fullSciFiMovie(1),
        },
      );

      final engine = SyncEngine(db: db, client: client);
      // This should work without errors even with large range
      final result = await engine.runSync();
      // Movie will be added multiple times across chunks but tmdb_id is unique so only 1
      final movies = await db.rawQuery('SELECT COUNT(*) as c FROM movies');
      expect(movies.first['c'], 1);
    });

    test('upserts person on conflict', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [1, 2],
        movieDetails: {
          1: _fullSciFiMovie(1, title: 'Movie 1'),
          2: {
            ..._fullSciFiMovie(2, title: 'Movie 2'),
            'credits': {
              'cast': [
                {'id': 999, 'name': 'Updated Actor Name', 'profile_path': '/new.jpg', 'known_for_department': 'Acting', 'character': 'Hero2', 'order': 0},
              ],
              'crew': [],
            },
          },
        },
      );

      final engine = SyncEngine(db: db, client: client);
      await engine.runSync();

      // Person with tmdb_id 999 should exist once but with updated name
      final people = await db.rawQuery('SELECT * FROM people WHERE tmdb_id = 999');
      expect(people.length, 1);
      expect(people.first['name'], 'Updated Actor Name');
    });

    test('movie with no credits section', () async {
      final client = FakeTmdbClient(
        changedMovieIds: [90],
        movieDetails: {
          90: {
            'id': 90,
            'title': 'No Credits',
            'original_title': 'No Credits',
            'overview': 'Test',
            'genres': [{'id': 878, 'name': 'Science Fiction'}],
            // no 'credits' key
          }
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.added, 1);
    });

    test('TV with no credits section', () async {
      final client = FakeTmdbClient(
        changedTvIds: [90],
        tvDetails: {
          90: {
            'id': 90,
            'name': 'No Credits TV',
            'original_name': 'No Credits TV',
            'overview': 'Test',
            'genres': [{'id': 10765, 'name': 'Sci-Fi & Fantasy'}],
          }
        },
      );

      final engine = SyncEngine(db: db, client: client);
      final result = await engine.runSync();
      expect(result.added, 1);
    });
  });
}

class _ThrowingClient extends TmdbClient {
  final List<int> movieIds;
  final List<int> tvIds;

  _ThrowingClient({this.movieIds = const [], this.tvIds = const []})
      : super(apiToken: 'fake');

  @override
  Future<Map<String, dynamic>> getMovieChanges(String s, String e, int p) async {
    return {'results': movieIds.map((id) => {'id': id}).toList(), 'total_pages': 1};
  }

  @override
  Future<Map<String, dynamic>> getTvChanges(String s, String e, int p) async {
    return {'results': tvIds.map((id) => {'id': id}).toList(), 'total_pages': 1};
  }

  @override
  Future<Map<String, dynamic>> getMovieDetails(int id) async {
    throw FormatException('bad data');
  }

  @override
  Future<Map<String, dynamic>> getTvDetails(int id) async {
    throw FormatException('bad data');
  }

  @override
  Future<List<int>> getAllChangedIds(Future<Map<String, dynamic>> Function(int page) fetchPage) async {
    final firstPage = await fetchPage(1);
    return (firstPage['results'] as List<dynamic>).map((item) => (item as Map<String, dynamic>)['id'] as int).toList();
  }

  @override
  void close() {}
}
