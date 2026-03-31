import 'dart:io';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseHelper {
  static Database? _database;
  static const String _dbFileName = 'scifionly.db';

  static Future<String> get _dbPath async {
    final dir = await getApplicationDocumentsDirectory();
    return p.join(dir.path, _dbFileName);
  }

  static Future<Database?> get database async => _database;

  static Future<bool> get isDatabaseLoaded async => _database != null;

  static Future<Database> openDb() async {
    if (_database != null) return _database!;
    final path = await _dbPath;
    if (!File(path).existsSync()) {
      throw Exception(
          'No database file found. Import a database from Settings.');
    }
    _database = await openDatabase(
      path,
      readOnly: false,
      singleInstance: true,
    );
    return _database!;
  }

  static Future<void> closeDb() async {
    await _database?.close();
    _database = null;
  }

  static Future<bool> importDatabase(String sourcePath) async {
    final destPath = await _dbPath;
    final sourceFile = File(sourcePath);
    if (!sourceFile.existsSync()) {
      throw Exception('Source file not found: $sourcePath');
    }

    // Close existing database
    await closeDb();

    // Copy file
    await sourceFile.copy(destPath);

    // Validate by opening and checking tables
    try {
      final db = await openDatabase(destPath, readOnly: false);
      final tables = await db.rawQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('movies', 'tv_series', 'genres', 'people')",
      );
      if (tables.length < 4) {
        await db.close();
        File(destPath).deleteSync();
        throw Exception('Invalid database: missing required tables.');
      }
      await db.close();
    } catch (e) {
      if (e.toString().contains('missing required tables')) rethrow;
      throw Exception('Invalid database file: $e');
    }

    // Reopen
    _database =
        await openDatabase(destPath, readOnly: false, singleInstance: true);
    return true;
  }

  static Future<bool> hasDatabaseFile() async {
    final path = await _dbPath;
    return File(path).existsSync();
  }

  static Future<void> createDemoDatabase() async {
    final path = await _dbPath;
    await closeDb();

    // Delete existing if present
    if (File(path).existsSync()) {
      File(path).deleteSync();
    }

    final db =
        await openDatabase(path, version: 1, onCreate: (db, version) async {
      await _createSchema(db);
      await _insertDemoData(db);
    });
    await db.close();

    _database = await openDatabase(path, readOnly: false, singleInstance: true);
  }

  static Future<void> _createSchema(Database db) async {
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
    await db.execute('''
      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        genre_id INTEGER NOT NULL REFERENCES genres(id),
        PRIMARY KEY (movie_id, genre_id)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS movie_cast (
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        person_id INTEGER NOT NULL REFERENCES people(id),
        character TEXT,
        display_order INTEGER,
        PRIMARY KEY (movie_id, person_id, character)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS movie_crew (
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        person_id INTEGER NOT NULL REFERENCES people(id),
        job TEXT,
        department TEXT,
        PRIMARY KEY (movie_id, person_id, job)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS movie_keywords (
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        keyword_id INTEGER NOT NULL REFERENCES keywords(id),
        PRIMARY KEY (movie_id, keyword_id)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS movie_production_companies (
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        company_id INTEGER NOT NULL REFERENCES production_companies(id),
        PRIMARY KEY (movie_id, company_id)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS tv_series_genres (
        tv_series_id INTEGER NOT NULL REFERENCES tv_series(id) ON DELETE CASCADE,
        genre_id INTEGER NOT NULL REFERENCES genres(id),
        PRIMARY KEY (tv_series_id, genre_id)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS tv_series_cast (
        tv_series_id INTEGER NOT NULL REFERENCES tv_series(id) ON DELETE CASCADE,
        person_id INTEGER NOT NULL REFERENCES people(id),
        character TEXT,
        display_order INTEGER,
        PRIMARY KEY (tv_series_id, person_id, character)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS tv_series_crew (
        tv_series_id INTEGER NOT NULL REFERENCES tv_series(id) ON DELETE CASCADE,
        person_id INTEGER NOT NULL REFERENCES people(id),
        job TEXT,
        department TEXT,
        PRIMARY KEY (tv_series_id, person_id, job)
      )
    ''');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS sync_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        last_sync_date TEXT,
        last_sync_type TEXT,
        total_movies INTEGER DEFAULT 0,
        total_tv_series INTEGER DEFAULT 0,
        last_change_date TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    ''');
    await db.rawInsert('INSERT OR IGNORE INTO sync_state(id) VALUES (1)');
    await db.execute('''
      CREATE TABLE IF NOT EXISTS image_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_type TEXT NOT NULL,
        media_id INTEGER NOT NULL,
        image_type TEXT NOT NULL,
        size TEXT NOT NULL,
        tmdb_path TEXT,
        image_data BLOB NOT NULL,
        content_type TEXT NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(media_type, media_id, image_type, size)
      )
    ''');
    // FTS5 tables
    await db.execute('''
      CREATE VIRTUAL TABLE IF NOT EXISTS movies_fts USING fts5(
        title, original_title, overview, tagline, cast_names, crew_names, keyword_names,
        content=movies, content_rowid=id, tokenize='porter unicode61'
      )
    ''');
    await db.execute('''
      CREATE VIRTUAL TABLE IF NOT EXISTS tv_series_fts USING fts5(
        name, original_name, overview, tagline, cast_names, crew_names, keyword_names,
        content=tv_series, content_rowid=id, tokenize='porter unicode61'
      )
    ''');
  }

  static Future<void> _insertDemoData(Database db) async {
    // Genres
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

    // People
    const people = [
      {
        'tmdb_id': 1100,
        'name': 'Arnold Schwarzenegger',
        'known_for_department': 'Acting'
      },
      {
        'tmdb_id': 1101,
        'name': 'Sigourney Weaver',
        'known_for_department': 'Acting'
      },
      {
        'tmdb_id': 1102,
        'name': 'Harrison Ford',
        'known_for_department': 'Acting'
      },
      {
        'tmdb_id': 1103,
        'name': 'Keanu Reeves',
        'known_for_department': 'Acting'
      },
      {
        'tmdb_id': 2710,
        'name': 'James Cameron',
        'known_for_department': 'Directing'
      },
      {
        'tmdb_id': 2711,
        'name': 'Ridley Scott',
        'known_for_department': 'Directing'
      },
      {
        'tmdb_id': 2712,
        'name': 'Lana Wachowski',
        'known_for_department': 'Directing'
      },
      {
        'tmdb_id': 2713,
        'name': 'Christopher Nolan',
        'known_for_department': 'Directing'
      },
      {
        'tmdb_id': 1104,
        'name': 'Tatiana Maslany',
        'known_for_department': 'Acting'
      },
      {
        'tmdb_id': 1105,
        'name': 'Bryan Cranston',
        'known_for_department': 'Acting'
      },
    ];
    for (final p in people) {
      await db.insert('people', p);
    }

    // Keywords
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

    // Production Companies
    const companies = [
      {'id': 574, 'name': '20th Century Studios', 'origin_country': 'US'},
      {'id': 923, 'name': 'Legendary Pictures', 'origin_country': 'US'},
    ];
    for (final c in companies) {
      await db.insert('production_companies', c);
    }

    // Movies
    final movies = [
      {
        'tmdb_id': 218,
        'title': 'The Terminator',
        'original_title': 'The Terminator',
        'overview':
            'In the post-apocalyptic future, reigning combative machines send an indestructible cyborg back in time to kill the mother of the future resistance leader.',
        'release_date': '1984-10-26',
        'status': 'Released',
        'runtime': 107,
        'vote_average': 7.7,
        'vote_count': 11500,
        'popularity': 55.0,
        'budget': 6400000,
        'revenue': 78371200,
        'original_language': 'en',
        'tagline': 'Your future is in his hands.',
        'imdb_id': 'tt0088247',
        'cast_names': 'Arnold Schwarzenegger',
        'crew_names': 'James Cameron',
        'keyword_names': 'artificial intelligence, time travel',
      },
      {
        'tmdb_id': 679,
        'title': 'Aliens',
        'original_title': 'Aliens',
        'overview':
            'Ripley returns to the planet where her crew encountered a hostile alien creature, this time accompanied by a unit of colonial marines.',
        'release_date': '1986-07-18',
        'status': 'Released',
        'runtime': 137,
        'vote_average': 8.0,
        'vote_count': 10200,
        'popularity': 45.0,
        'budget': 18500000,
        'revenue': 131060248,
        'original_language': 'en',
        'tagline': 'This time it\'s war.',
        'imdb_id': 'tt0090605',
        'cast_names': 'Sigourney Weaver',
        'crew_names': 'James Cameron',
        'keyword_names': 'alien, space',
      },
      {
        'tmdb_id': 78,
        'title': 'Blade Runner',
        'original_title': 'Blade Runner',
        'overview':
            'In the smog-choked dystopian Los Angeles of 2019, blade runner Rick Deckard is called out of retirement to terminate a quartet of replicants.',
        'release_date': '1982-06-25',
        'status': 'Released',
        'runtime': 117,
        'vote_average': 7.9,
        'vote_count': 12000,
        'popularity': 42.0,
        'budget': 28000000,
        'revenue': 41600000,
        'original_language': 'en',
        'tagline': 'Man has made his match... now it\'s his problem.',
        'imdb_id': 'tt0083658',
        'cast_names': 'Harrison Ford',
        'crew_names': 'Ridley Scott',
        'keyword_names': 'artificial intelligence, dystopia',
      },
      {
        'tmdb_id': 603,
        'title': 'The Matrix',
        'original_title': 'The Matrix',
        'overview':
            'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
        'release_date': '1999-03-31',
        'status': 'Released',
        'runtime': 136,
        'vote_average': 8.2,
        'vote_count': 24000,
        'popularity': 80.0,
        'budget': 63000000,
        'revenue': 463517383,
        'original_language': 'en',
        'tagline': 'Welcome to the Real World.',
        'imdb_id': 'tt0133093',
        'cast_names': 'Keanu Reeves',
        'crew_names': 'Lana Wachowski',
        'keyword_names': 'artificial intelligence, dystopia',
      },
      {
        'tmdb_id': 157336,
        'title': 'Interstellar',
        'original_title': 'Interstellar',
        'overview':
            'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
        'release_date': '2014-11-05',
        'status': 'Released',
        'runtime': 169,
        'vote_average': 8.4,
        'vote_count': 32000,
        'popularity': 95.0,
        'budget': 165000000,
        'revenue': 677471339,
        'original_language': 'en',
        'tagline': 'Mankind was born on Earth. It was never meant to die here.',
        'imdb_id': 'tt0816692',
        'cast_names': 'Matthew McConaughey',
        'crew_names': 'Christopher Nolan',
        'keyword_names': 'space, time travel',
      },
    ];

    for (final m in movies) {
      final id = await db.insert('movies', m);
      // Add to FTS
      await db.execute(
        'INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          m['title'],
          m['original_title'],
          m['overview'],
          m['tagline'],
          m['cast_names'] ?? '',
          m['crew_names'] ?? '',
          m['keyword_names'] ?? ''
        ],
      );
    }

    // Movie genres
    await db.insert('movie_genres', {'movie_id': 1, 'genre_id': 878});
    await db.insert('movie_genres', {'movie_id': 1, 'genre_id': 28});
    await db.insert('movie_genres', {'movie_id': 2, 'genre_id': 878});
    await db.insert('movie_genres', {'movie_id': 2, 'genre_id': 28});
    await db.insert('movie_genres', {'movie_id': 3, 'genre_id': 878});
    await db.insert('movie_genres', {'movie_id': 3, 'genre_id': 53});
    await db.insert('movie_genres', {'movie_id': 4, 'genre_id': 878});
    await db.insert('movie_genres', {'movie_id': 4, 'genre_id': 28});
    await db.insert('movie_genres', {'movie_id': 5, 'genre_id': 878});
    await db.insert('movie_genres', {'movie_id': 5, 'genre_id': 12});
    await db.insert('movie_genres', {'movie_id': 5, 'genre_id': 18});

    // Movie cast
    await db.insert('movie_cast', {
      'movie_id': 1,
      'person_id': 1,
      'character': 'The Terminator',
      'display_order': 0
    });
    await db.insert('movie_cast', {
      'movie_id': 2,
      'person_id': 2,
      'character': 'Ellen Ripley',
      'display_order': 0
    });
    await db.insert('movie_cast', {
      'movie_id': 3,
      'person_id': 3,
      'character': 'Rick Deckard',
      'display_order': 0
    });
    await db.insert('movie_cast', {
      'movie_id': 4,
      'person_id': 4,
      'character': 'Neo',
      'display_order': 0
    });

    // Movie crew
    await db.insert('movie_crew', {
      'movie_id': 1,
      'person_id': 5,
      'job': 'Director',
      'department': 'Directing'
    });
    await db.insert('movie_crew', {
      'movie_id': 2,
      'person_id': 5,
      'job': 'Director',
      'department': 'Directing'
    });
    await db.insert('movie_crew', {
      'movie_id': 3,
      'person_id': 6,
      'job': 'Director',
      'department': 'Directing'
    });
    await db.insert('movie_crew', {
      'movie_id': 4,
      'person_id': 7,
      'job': 'Director',
      'department': 'Directing'
    });
    await db.insert('movie_crew', {
      'movie_id': 5,
      'person_id': 8,
      'job': 'Director',
      'department': 'Directing'
    });

    // Movie keywords
    await db.insert('movie_keywords', {'movie_id': 1, 'keyword_id': 310});
    await db.insert('movie_keywords', {'movie_id': 1, 'keyword_id': 312});
    await db.insert('movie_keywords', {'movie_id': 2, 'keyword_id': 318});
    await db.insert('movie_keywords', {'movie_id': 2, 'keyword_id': 316});
    await db.insert('movie_keywords', {'movie_id': 3, 'keyword_id': 310});
    await db.insert('movie_keywords', {'movie_id': 3, 'keyword_id': 314});
    await db.insert('movie_keywords', {'movie_id': 4, 'keyword_id': 310});
    await db.insert('movie_keywords', {'movie_id': 4, 'keyword_id': 314});
    await db.insert('movie_keywords', {'movie_id': 5, 'keyword_id': 316});
    await db.insert('movie_keywords', {'movie_id': 5, 'keyword_id': 312});

    // Movie production companies
    await db.insert(
        'movie_production_companies', {'movie_id': 2, 'company_id': 574});
    await db.insert(
        'movie_production_companies', {'movie_id': 5, 'company_id': 923});

    // TV Series
    final tvShows = [
      {
        'tmdb_id': 65334,
        'name': 'Orphan Black',
        'original_name': 'Orphan Black',
        'overview':
            'A streetwise hustler is pulled into a compelling conspiracy after witnessing the suicide of a girl who looks just like her.',
        'first_air_date': '2013-03-30',
        'last_air_date': '2017-08-12',
        'status': 'Ended',
        'number_of_seasons': 5,
        'number_of_episodes': 50,
        'vote_average': 8.2,
        'vote_count': 1800,
        'popularity': 35.0,
        'original_language': 'en',
        'tagline': '',
        'networks': '["BBC America"]',
        'cast_names': 'Tatiana Maslany',
        'crew_names': '',
        'keyword_names': 'artificial intelligence',
      },
      {
        'tmdb_id': 62560,
        'name': 'Mr. Robot',
        'original_name': 'Mr. Robot',
        'overview':
            'A contemporary and culturally resonant drama about a young programmer who suffers from an anti-social disorder.',
        'first_air_date': '2015-06-24',
        'last_air_date': '2019-12-22',
        'status': 'Ended',
        'number_of_seasons': 4,
        'number_of_episodes': 45,
        'vote_average': 8.2,
        'vote_count': 3200,
        'popularity': 50.0,
        'original_language': 'en',
        'tagline': '',
        'networks': '["USA Network"]',
        'cast_names': '',
        'crew_names': '',
        'keyword_names': 'artificial intelligence, dystopia',
      },
      {
        'tmdb_id': 1399,
        'name': 'The Expanse',
        'original_name': 'The Expanse',
        'overview':
            'A police detective in the asteroid belt, the first officer of an interplanetary ice freighter, and an pointy politician on Earth discover a vast conspiracy.',
        'first_air_date': '2015-12-14',
        'last_air_date': '2022-01-14',
        'status': 'Ended',
        'number_of_seasons': 6,
        'number_of_episodes': 62,
        'vote_average': 8.4,
        'vote_count': 2500,
        'popularity': 60.0,
        'original_language': 'en',
        'tagline': '',
        'networks': '["Amazon Prime Video"]',
        'cast_names': '',
        'crew_names': '',
        'keyword_names': 'space',
      },
    ];

    for (final tv in tvShows) {
      final id = await db.insert('tv_series', tv);
      await db.execute(
        'INSERT INTO tv_series_fts(rowid, name, original_name, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          tv['name'],
          tv['original_name'],
          tv['overview'],
          tv['tagline'],
          tv['cast_names'] ?? '',
          tv['crew_names'] ?? '',
          tv['keyword_names'] ?? ''
        ],
      );
    }

    // TV genres
    await db.insert('tv_series_genres', {'tv_series_id': 1, 'genre_id': 878});
    await db.insert('tv_series_genres', {'tv_series_id': 1, 'genre_id': 18});
    await db.insert('tv_series_genres', {'tv_series_id': 2, 'genre_id': 878});
    await db.insert('tv_series_genres', {'tv_series_id': 2, 'genre_id': 53});
    await db.insert('tv_series_genres', {'tv_series_id': 3, 'genre_id': 878});

    // TV cast
    await db.insert('tv_series_cast', {
      'tv_series_id': 1,
      'person_id': 9,
      'character': 'Sarah Manning',
      'display_order': 0
    });
  }
}
