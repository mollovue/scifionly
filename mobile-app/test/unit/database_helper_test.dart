import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:sqflite/sqflite.dart';

// We test the schema creation and demo data insertion logic directly
// by replicating the DatabaseHelper._createSchema and _insertDemoData methods,
// since those are private static methods and DatabaseHelper uses path_provider
// which isn't available in unit tests.

void main() {
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  group('Database schema', () {
    late Database db;

    setUp(() async {
      db = await databaseFactoryFfi.openDatabase(
        inMemoryDatabasePath,
        options: OpenDatabaseOptions(
          version: 1,
          onCreate: (db, version) async {
            await _createSchema(db);
          },
        ),
      );
    });

    tearDown(() async {
      await db.close();
    });

    test('creates all required tables', () async {
      final tables = await db.rawQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_fts%' ORDER BY name",
      );
      final tableNames = tables.map((t) => t['name'] as String).toList();

      expect(tableNames, contains('genres'));
      expect(tableNames, contains('people'));
      expect(tableNames, contains('keywords'));
      expect(tableNames, contains('production_companies'));
      expect(tableNames, contains('movies'));
      expect(tableNames, contains('tv_series'));
      expect(tableNames, contains('movie_genres'));
      expect(tableNames, contains('movie_cast'));
      expect(tableNames, contains('movie_crew'));
      expect(tableNames, contains('movie_keywords'));
      expect(tableNames, contains('movie_production_companies'));
      expect(tableNames, contains('tv_series_genres'));
      expect(tableNames, contains('tv_series_cast'));
      expect(tableNames, contains('tv_series_crew'));
      expect(tableNames, contains('sync_state'));
      expect(tableNames, contains('image_cache'));
    });

    test('creates FTS5 virtual tables', () async {
      final fts = await db.rawQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_fts%'",
      );
      final ftsNames = fts.map((t) => t['name'] as String).toSet();
      expect(ftsNames, contains('movies_fts'));
      expect(ftsNames, contains('tv_series_fts'));
    });

    test('sync_state has initial row', () async {
      final rows = await db.rawQuery('SELECT * FROM sync_state WHERE id = 1');
      expect(rows.length, 1);
    });

    test('movies table has correct columns', () async {
      final info = await db.rawQuery('PRAGMA table_info(movies)');
      final columns = info.map((r) => r['name'] as String).toSet();
      expect(columns, containsAll([
        'id', 'tmdb_id', 'title', 'original_title', 'overview',
        'poster_path', 'backdrop_path', 'release_date', 'status',
        'runtime', 'vote_average', 'vote_count', 'popularity',
        'budget', 'revenue', 'original_language', 'tagline',
        'imdb_id', 'cast_names', 'crew_names', 'keyword_names',
      ]));
    });

    test('tv_series table has correct columns', () async {
      final info = await db.rawQuery('PRAGMA table_info(tv_series)');
      final columns = info.map((r) => r['name'] as String).toSet();
      expect(columns, containsAll([
        'id', 'tmdb_id', 'name', 'original_name', 'overview',
        'poster_path', 'backdrop_path', 'first_air_date', 'last_air_date',
        'status', 'number_of_seasons', 'number_of_episodes',
        'vote_average', 'vote_count', 'popularity', 'original_language',
        'networks', 'tagline',
      ]));
    });

    test('can insert and query movies', () async {
      final id = await db.insert('movies', {
        'tmdb_id': 1,
        'title': 'Test Movie',
        'original_language': 'en',
      });
      expect(id, greaterThan(0));

      final rows = await db.rawQuery('SELECT * FROM movies WHERE id = ?', [id]);
      expect(rows.length, 1);
      expect(rows.first['title'], 'Test Movie');
    });

    test('can insert and query tv_series', () async {
      final id = await db.insert('tv_series', {
        'tmdb_id': 1,
        'name': 'Test TV',
        'original_language': 'en',
      });
      expect(id, greaterThan(0));

      final rows =
          await db.rawQuery('SELECT * FROM tv_series WHERE id = ?', [id]);
      expect(rows.length, 1);
      expect(rows.first['name'], 'Test TV');
    });

    test('can insert genre and link to movie', () async {
      await db.insert('genres', {'id': 1, 'name': 'Sci-Fi'});
      final movieId = await db.insert('movies', {
        'tmdb_id': 2,
        'title': 'Sci-Fi Movie',
        'original_language': 'en',
      });
      await db.insert('movie_genres', {'movie_id': movieId, 'genre_id': 1});

      final rows = await db.rawQuery('''
        SELECT g.name FROM genres g
        JOIN movie_genres mg ON mg.genre_id = g.id
        WHERE mg.movie_id = ?
      ''', [movieId]);
      expect(rows.length, 1);
      expect(rows.first['name'], 'Sci-Fi');
    });

    test('can insert people and movie_cast', () async {
      final personId = await db.insert('people', {
        'tmdb_id': 100,
        'name': 'Test Actor',
        'known_for_department': 'Acting',
      });
      final movieId = await db.insert('movies', {
        'tmdb_id': 3,
        'title': 'Cast Test',
        'original_language': 'en',
      });
      await db.insert('movie_cast', {
        'movie_id': movieId,
        'person_id': personId,
        'character': 'Hero',
        'display_order': 0,
      });

      final rows = await db.rawQuery('''
        SELECT p.name, mc.character FROM movie_cast mc
        JOIN people p ON p.id = mc.person_id
        WHERE mc.movie_id = ?
      ''', [movieId]);
      expect(rows.length, 1);
      expect(rows.first['name'], 'Test Actor');
      expect(rows.first['character'], 'Hero');
    });

    test('FTS search works on movies', () async {
      final movieId = await db.insert('movies', {
        'tmdb_id': 4,
        'title': 'Quantum Realm',
        'original_title': 'Quantum Realm',
        'overview': 'A journey into the quantum realm.',
        'original_language': 'en',
      });
      await db.execute(
        'INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [movieId, 'Quantum Realm', 'Quantum Realm', 'A journey into the quantum realm.', '', '', '', ''],
      );

      final ftsResults = await db.rawQuery(
        'SELECT rowid FROM movies_fts WHERE movies_fts MATCH ?',
        ['"Quantum"'],
      );
      expect(ftsResults.length, 1);
      expect(ftsResults.first['rowid'], movieId);
    });

    test('image_cache table works', () async {
      await db.insert('image_cache', {
        'media_type': 'movie',
        'media_id': 1,
        'image_type': 'poster',
        'size': 'w342',
        'tmdb_path': '/test.jpg',
        'image_data': Uint8List.fromList([1, 2, 3]),
        'content_type': 'image/jpeg',
        'file_size': 3,
      });

      final rows = await db.rawQuery('SELECT * FROM image_cache');
      expect(rows.length, 1);
      expect(rows.first['media_type'], 'movie');
    });
  });

  group('Demo data insertion', () {
    late Database db;

    setUp(() async {
      db = await databaseFactoryFfi.openDatabase(
        inMemoryDatabasePath,
        options: OpenDatabaseOptions(
          version: 1,
          onCreate: (db, version) async {
            await _createSchema(db);
            await _insertDemoData(db);
          },
        ),
      );
    });

    tearDown(() async {
      await db.close();
    });

    test('inserts genres', () async {
      final genres = await db.rawQuery('SELECT * FROM genres');
      expect(genres.length, 5);
    });

    test('inserts people', () async {
      final people = await db.rawQuery('SELECT * FROM people');
      expect(people.length, 10);
    });

    test('inserts keywords', () async {
      final keywords = await db.rawQuery('SELECT * FROM keywords');
      expect(keywords.length, 5);
    });

    test('inserts production companies', () async {
      final companies =
          await db.rawQuery('SELECT * FROM production_companies');
      expect(companies.length, 2);
    });

    test('inserts movies', () async {
      final movies = await db.rawQuery('SELECT * FROM movies');
      expect(movies.length, 5);
    });

    test('inserts TV series', () async {
      final tv = await db.rawQuery('SELECT * FROM tv_series');
      expect(tv.length, 3);
    });

    test('inserts movie genres', () async {
      final mg = await db.rawQuery('SELECT * FROM movie_genres');
      expect(mg.length, greaterThan(0));
    });

    test('inserts movie cast', () async {
      final mc = await db.rawQuery('SELECT * FROM movie_cast');
      expect(mc.length, 4);
    });

    test('inserts movie crew', () async {
      final mcr = await db.rawQuery('SELECT * FROM movie_crew');
      expect(mcr.length, 5);
    });

    test('inserts movie keywords', () async {
      final mk = await db.rawQuery('SELECT * FROM movie_keywords');
      expect(mk.length, 10);
    });

    test('inserts movie production companies', () async {
      final mpc =
          await db.rawQuery('SELECT * FROM movie_production_companies');
      expect(mpc.length, 2);
    });

    test('inserts tv genres', () async {
      final tsg = await db.rawQuery('SELECT * FROM tv_series_genres');
      expect(tsg.length, 5);
    });

    test('inserts tv cast', () async {
      final tsc = await db.rawQuery('SELECT * FROM tv_series_cast');
      expect(tsc.length, 1);
    });

    test('FTS indexes are populated for movies', () async {
      final fts = await db.rawQuery(
        'SELECT rowid FROM movies_fts WHERE movies_fts MATCH ?',
        ['"Terminator"'],
      );
      expect(fts.length, 1);
    });

    test('FTS indexes are populated for TV', () async {
      final fts = await db.rawQuery(
        'SELECT rowid FROM tv_series_fts WHERE tv_series_fts MATCH ?',
        ['"Expanse"'],
      );
      expect(fts.length, 1);
    });

    test('validates required tables exist', () async {
      final tables = await db.rawQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('movies', 'tv_series', 'genres', 'people')",
      );
      expect(tables.length, 4);
    });
  });
}

// Replication of DatabaseHelper._createSchema for testing
Future<void> _createSchema(Database db) async {
  await db.execute('''
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  ''');
  await db.execute('''
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      profile_path TEXT,
      known_for_department TEXT
    )
  ''');
  await db.execute('''
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  ''');
  await db.execute('''
    CREATE TABLE IF NOT EXISTS production_companies (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      logo_path TEXT,
      origin_country TEXT
    )
  ''');
  await db.execute('''
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      original_title TEXT,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      status TEXT,
      runtime INTEGER,
      vote_average REAL,
      vote_count INTEGER,
      popularity REAL,
      budget INTEGER,
      revenue INTEGER,
      original_language TEXT,
      spoken_languages TEXT,
      tagline TEXT,
      homepage TEXT,
      imdb_id TEXT,
      cast_names TEXT,
      crew_names TEXT,
      keyword_names TEXT,
      tmdb_updated_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  ''');
  await db.execute('''
    CREATE TABLE IF NOT EXISTS tv_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      original_name TEXT,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      first_air_date TEXT,
      last_air_date TEXT,
      status TEXT,
      number_of_seasons INTEGER,
      number_of_episodes INTEGER,
      episode_run_time TEXT,
      vote_average REAL,
      vote_count INTEGER,
      popularity REAL,
      original_language TEXT,
      spoken_languages TEXT,
      tagline TEXT,
      homepage TEXT,
      networks TEXT,
      cast_names TEXT,
      crew_names TEXT,
      keyword_names TEXT,
      tmdb_updated_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  ''');
  await db.execute('''CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER NOT NULL, genre_id INTEGER NOT NULL, PRIMARY KEY (movie_id, genre_id))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS movie_cast (
    movie_id INTEGER NOT NULL, person_id INTEGER NOT NULL, character TEXT, display_order INTEGER,
    PRIMARY KEY (movie_id, person_id, character))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS movie_crew (
    movie_id INTEGER NOT NULL, person_id INTEGER NOT NULL, job TEXT, department TEXT,
    PRIMARY KEY (movie_id, person_id, job))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS movie_keywords (
    movie_id INTEGER NOT NULL, keyword_id INTEGER NOT NULL, PRIMARY KEY (movie_id, keyword_id))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS movie_production_companies (
    movie_id INTEGER NOT NULL, company_id INTEGER NOT NULL, PRIMARY KEY (movie_id, company_id))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS tv_series_genres (
    tv_series_id INTEGER NOT NULL, genre_id INTEGER NOT NULL, PRIMARY KEY (tv_series_id, genre_id))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS tv_series_cast (
    tv_series_id INTEGER NOT NULL, person_id INTEGER NOT NULL, character TEXT, display_order INTEGER,
    PRIMARY KEY (tv_series_id, person_id, character))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS tv_series_crew (
    tv_series_id INTEGER NOT NULL, person_id INTEGER NOT NULL, job TEXT, department TEXT,
    PRIMARY KEY (tv_series_id, person_id, job))''');
  await db.execute('''CREATE TABLE IF NOT EXISTS sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1, last_sync_date TEXT, last_sync_type TEXT,
    total_movies INTEGER DEFAULT 0, total_tv_series INTEGER DEFAULT 0,
    last_change_date TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)''');
  await db.rawInsert('INSERT OR IGNORE INTO sync_state(id) VALUES (1)');
  await db.execute('''CREATE TABLE IF NOT EXISTS image_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT, media_type TEXT NOT NULL, media_id INTEGER NOT NULL,
    image_type TEXT NOT NULL, size TEXT NOT NULL, tmdb_path TEXT, image_data BLOB NOT NULL,
    content_type TEXT NOT NULL, file_size INTEGER NOT NULL DEFAULT 0,
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(media_type, media_id, image_type, size))''');
  await db.execute('''CREATE VIRTUAL TABLE IF NOT EXISTS movies_fts USING fts5(
    title, original_title, overview, tagline, cast_names, crew_names, keyword_names,
    content=movies, content_rowid=id, tokenize='porter unicode61')''');
  await db.execute('''CREATE VIRTUAL TABLE IF NOT EXISTS tv_series_fts USING fts5(
    name, original_name, overview, tagline, cast_names, crew_names, keyword_names,
    content=tv_series, content_rowid=id, tokenize='porter unicode61')''');
}

// Replication of DatabaseHelper._insertDemoData for testing
Future<void> _insertDemoData(Database db) async {
  const genres = [
    {'id': 878, 'name': 'Science Fiction'},
    {'id': 28, 'name': 'Action'},
    {'id': 12, 'name': 'Adventure'},
    {'id': 18, 'name': 'Drama'},
    {'id': 53, 'name': 'Thriller'},
  ];
  for (final g in genres) {
    await db.insert('genres', g);
  }

  const people = [
    {'tmdb_id': 1100, 'name': 'Arnold Schwarzenegger', 'known_for_department': 'Acting'},
    {'tmdb_id': 1101, 'name': 'Sigourney Weaver', 'known_for_department': 'Acting'},
    {'tmdb_id': 1102, 'name': 'Harrison Ford', 'known_for_department': 'Acting'},
    {'tmdb_id': 1103, 'name': 'Keanu Reeves', 'known_for_department': 'Acting'},
    {'tmdb_id': 2710, 'name': 'James Cameron', 'known_for_department': 'Directing'},
    {'tmdb_id': 2711, 'name': 'Ridley Scott', 'known_for_department': 'Directing'},
    {'tmdb_id': 2712, 'name': 'Lana Wachowski', 'known_for_department': 'Directing'},
    {'tmdb_id': 2713, 'name': 'Christopher Nolan', 'known_for_department': 'Directing'},
    {'tmdb_id': 1104, 'name': 'Tatiana Maslany', 'known_for_department': 'Acting'},
    {'tmdb_id': 1105, 'name': 'Bryan Cranston', 'known_for_department': 'Acting'},
  ];
  for (final p in people) {
    await db.insert('people', p);
  }

  const kws = [
    {'id': 310, 'name': 'artificial intelligence'},
    {'id': 312, 'name': 'time travel'},
    {'id': 314, 'name': 'dystopia'},
    {'id': 316, 'name': 'space'},
    {'id': 318, 'name': 'alien'},
  ];
  for (final k in kws) {
    await db.insert('keywords', k);
  }

  const companies = [
    {'id': 574, 'name': '20th Century Studios', 'origin_country': 'US'},
    {'id': 923, 'name': 'Legendary Pictures', 'origin_country': 'US'},
  ];
  for (final c in companies) {
    await db.insert('production_companies', c);
  }

  final movies = [
    {'tmdb_id': 218, 'title': 'The Terminator', 'original_title': 'The Terminator', 'overview': 'A cyborg from the future.', 'release_date': '1984-10-26', 'status': 'Released', 'runtime': 107, 'vote_average': 7.7, 'vote_count': 11500, 'popularity': 55.0, 'budget': 6400000, 'revenue': 78371200, 'original_language': 'en', 'tagline': 'Your future is in his hands.', 'imdb_id': 'tt0088247', 'cast_names': 'Arnold Schwarzenegger', 'crew_names': 'James Cameron', 'keyword_names': 'artificial intelligence, time travel'},
    {'tmdb_id': 679, 'title': 'Aliens', 'original_title': 'Aliens', 'overview': 'Ripley returns to LV-426.', 'release_date': '1986-07-18', 'status': 'Released', 'runtime': 137, 'vote_average': 8.0, 'vote_count': 10200, 'popularity': 45.0, 'budget': 18500000, 'revenue': 131060248, 'original_language': 'en', 'tagline': "This time it's war.", 'imdb_id': 'tt0090605', 'cast_names': 'Sigourney Weaver', 'crew_names': 'James Cameron', 'keyword_names': 'alien, space'},
    {'tmdb_id': 78, 'title': 'Blade Runner', 'original_title': 'Blade Runner', 'overview': 'Blade runner hunts replicants.', 'release_date': '1982-06-25', 'status': 'Released', 'runtime': 117, 'vote_average': 7.9, 'vote_count': 12000, 'popularity': 42.0, 'budget': 28000000, 'revenue': 41600000, 'original_language': 'en', 'tagline': 'Man has made his match.', 'imdb_id': 'tt0083658', 'cast_names': 'Harrison Ford', 'crew_names': 'Ridley Scott', 'keyword_names': 'artificial intelligence, dystopia'},
    {'tmdb_id': 603, 'title': 'The Matrix', 'original_title': 'The Matrix', 'overview': 'A hacker learns the truth.', 'release_date': '1999-03-31', 'status': 'Released', 'runtime': 136, 'vote_average': 8.2, 'vote_count': 24000, 'popularity': 80.0, 'budget': 63000000, 'revenue': 463517383, 'original_language': 'en', 'tagline': 'Welcome to the Real World.', 'imdb_id': 'tt0133093', 'cast_names': 'Keanu Reeves', 'crew_names': 'Lana Wachowski', 'keyword_names': 'artificial intelligence, dystopia'},
    {'tmdb_id': 157336, 'title': 'Interstellar', 'original_title': 'Interstellar', 'overview': 'Explorers use a wormhole.', 'release_date': '2014-11-05', 'status': 'Released', 'runtime': 169, 'vote_average': 8.4, 'vote_count': 32000, 'popularity': 95.0, 'budget': 165000000, 'revenue': 677471339, 'original_language': 'en', 'tagline': 'Born on Earth.', 'imdb_id': 'tt0816692', 'cast_names': 'Matthew McConaughey', 'crew_names': 'Christopher Nolan', 'keyword_names': 'space, time travel'},
  ];
  for (final m in movies) {
    final id = await db.insert('movies', m);
    await db.execute(
      'INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, m['title'], m['original_title'], m['overview'], m['tagline'], m['cast_names'] ?? '', m['crew_names'] ?? '', m['keyword_names'] ?? ''],
    );
  }

  // Movie genres
  for (final mg in [
    {'movie_id': 1, 'genre_id': 878}, {'movie_id': 1, 'genre_id': 28},
    {'movie_id': 2, 'genre_id': 878}, {'movie_id': 2, 'genre_id': 28},
    {'movie_id': 3, 'genre_id': 878}, {'movie_id': 3, 'genre_id': 53},
    {'movie_id': 4, 'genre_id': 878}, {'movie_id': 4, 'genre_id': 28},
    {'movie_id': 5, 'genre_id': 878}, {'movie_id': 5, 'genre_id': 12}, {'movie_id': 5, 'genre_id': 18},
  ]) {
    await db.insert('movie_genres', mg);
  }

  // Movie cast
  await db.insert('movie_cast', {'movie_id': 1, 'person_id': 1, 'character': 'The Terminator', 'display_order': 0});
  await db.insert('movie_cast', {'movie_id': 2, 'person_id': 2, 'character': 'Ellen Ripley', 'display_order': 0});
  await db.insert('movie_cast', {'movie_id': 3, 'person_id': 3, 'character': 'Rick Deckard', 'display_order': 0});
  await db.insert('movie_cast', {'movie_id': 4, 'person_id': 4, 'character': 'Neo', 'display_order': 0});

  // Movie crew
  await db.insert('movie_crew', {'movie_id': 1, 'person_id': 5, 'job': 'Director', 'department': 'Directing'});
  await db.insert('movie_crew', {'movie_id': 2, 'person_id': 5, 'job': 'Director', 'department': 'Directing'});
  await db.insert('movie_crew', {'movie_id': 3, 'person_id': 6, 'job': 'Director', 'department': 'Directing'});
  await db.insert('movie_crew', {'movie_id': 4, 'person_id': 7, 'job': 'Director', 'department': 'Directing'});
  await db.insert('movie_crew', {'movie_id': 5, 'person_id': 8, 'job': 'Director', 'department': 'Directing'});

  // Movie keywords
  for (final mk in [
    {'movie_id': 1, 'keyword_id': 310}, {'movie_id': 1, 'keyword_id': 312},
    {'movie_id': 2, 'keyword_id': 318}, {'movie_id': 2, 'keyword_id': 316},
    {'movie_id': 3, 'keyword_id': 310}, {'movie_id': 3, 'keyword_id': 314},
    {'movie_id': 4, 'keyword_id': 310}, {'movie_id': 4, 'keyword_id': 314},
    {'movie_id': 5, 'keyword_id': 316}, {'movie_id': 5, 'keyword_id': 312},
  ]) {
    await db.insert('movie_keywords', mk);
  }

  // Movie production companies
  await db.insert('movie_production_companies', {'movie_id': 2, 'company_id': 574});
  await db.insert('movie_production_companies', {'movie_id': 5, 'company_id': 923});

  // TV Series
  final tvShows = [
    {'tmdb_id': 65334, 'name': 'Orphan Black', 'original_name': 'Orphan Black', 'overview': 'A hustler witnesses a suicide.', 'first_air_date': '2013-03-30', 'last_air_date': '2017-08-12', 'status': 'Ended', 'number_of_seasons': 5, 'number_of_episodes': 50, 'vote_average': 8.2, 'vote_count': 1800, 'popularity': 35.0, 'original_language': 'en', 'tagline': '', 'networks': '["BBC America"]', 'cast_names': 'Tatiana Maslany', 'crew_names': '', 'keyword_names': 'artificial intelligence'},
    {'tmdb_id': 62560, 'name': 'Mr. Robot', 'original_name': 'Mr. Robot', 'overview': 'A programmer with a disorder.', 'first_air_date': '2015-06-24', 'last_air_date': '2019-12-22', 'status': 'Ended', 'number_of_seasons': 4, 'number_of_episodes': 45, 'vote_average': 8.2, 'vote_count': 3200, 'popularity': 50.0, 'original_language': 'en', 'tagline': '', 'networks': '["USA Network"]', 'cast_names': '', 'crew_names': '', 'keyword_names': 'artificial intelligence, dystopia'},
    {'tmdb_id': 1399, 'name': 'The Expanse', 'original_name': 'The Expanse', 'overview': 'A conspiracy in space.', 'first_air_date': '2015-12-14', 'last_air_date': '2022-01-14', 'status': 'Ended', 'number_of_seasons': 6, 'number_of_episodes': 62, 'vote_average': 8.4, 'vote_count': 2500, 'popularity': 60.0, 'original_language': 'en', 'tagline': '', 'networks': '["Amazon Prime Video"]', 'cast_names': '', 'crew_names': '', 'keyword_names': 'space'},
  ];
  for (final tv in tvShows) {
    final id = await db.insert('tv_series', tv);
    await db.execute(
      'INSERT INTO tv_series_fts(rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, tv['name'], tv['original_name'], tv['overview'], tv['tagline'] ?? '', tv['cast_names'] ?? '', tv['crew_names'] ?? '', tv['keyword_names'] ?? ''],
    );
  }

  await db.insert('tv_series_genres', {'tv_series_id': 1, 'genre_id': 878});
  await db.insert('tv_series_genres', {'tv_series_id': 1, 'genre_id': 18});
  await db.insert('tv_series_genres', {'tv_series_id': 2, 'genre_id': 878});
  await db.insert('tv_series_genres', {'tv_series_id': 2, 'genre_id': 53});
  await db.insert('tv_series_genres', {'tv_series_id': 3, 'genre_id': 878});

  await db.insert('tv_series_cast', {'tv_series_id': 1, 'person_id': 9, 'character': 'Sarah Manning', 'display_order': 0});
}
