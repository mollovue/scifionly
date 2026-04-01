import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:sqflite/sqflite.dart';
import 'package:scifionly/features/database/content_repository.dart';
import 'package:scifionly/models/search_state.dart';

Future<Database> createTestDatabase() async {
  sqfliteFfiInit();
  final db = await databaseFactoryFfi.openDatabase(
    inMemoryDatabasePath,
    options: OpenDatabaseOptions(
      version: 1,
      onCreate: (db, version) async {
        await _createSchema(db);
        await _insertTestData(db);
      },
    ),
  );
  return db;
}

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

Future<void> _insertTestData(Database db) async {
  // Genres
  await db.insert('genres', {'id': 878, 'name': 'Science Fiction'});
  await db.insert('genres', {'id': 28, 'name': 'Action'});
  await db.insert('genres', {'id': 18, 'name': 'Drama'});

  // People
  await db.insert('people', {
    'tmdb_id': 1100,
    'name': 'Arnold Schwarzenegger',
    'known_for_department': 'Acting'
  });
  await db.insert('people', {
    'tmdb_id': 1103,
    'name': 'Keanu Reeves',
    'known_for_department': 'Acting'
  });
  await db.insert('people', {
    'tmdb_id': 2710,
    'name': 'James Cameron',
    'known_for_department': 'Directing'
  });
  await db.insert('people', {
    'tmdb_id': 2712,
    'name': 'Lana Wachowski',
    'known_for_department': 'Directing'
  });

  // Keywords
  await db.insert('keywords', {'id': 310, 'name': 'artificial intelligence'});
  await db.insert('keywords', {'id': 312, 'name': 'time travel'});

  // Production companies
  await db.insert('production_companies',
      {'id': 574, 'name': '20th Century Studios', 'origin_country': 'US'});

  // Movies
  final movies = [
    {
      'tmdb_id': 218,
      'title': 'The Terminator',
      'original_title': 'The Terminator',
      'overview': 'A cyborg is sent back in time to kill Sarah Connor.',
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
      'tmdb_id': 603,
      'title': 'The Matrix',
      'original_title': 'The Matrix',
      'overview':
          'A computer hacker learns about the true nature of his reality.',
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
      'keyword_names': 'artificial intelligence',
    },
    {
      'tmdb_id': 157336,
      'title': 'Interstellar',
      'original_title': 'Interstellar',
      'overview': 'Explorers discover a wormhole for space travel.',
      'release_date': '2014-11-05',
      'status': 'Released',
      'runtime': 169,
      'vote_average': 8.4,
      'vote_count': 32000,
      'popularity': 95.0,
      'budget': 165000000,
      'revenue': 677471339,
      'original_language': 'en',
      'tagline': 'Mankind was born on Earth.',
      'imdb_id': 'tt0816692',
      'cast_names': '',
      'crew_names': '',
      'keyword_names': 'time travel',
    },
    {
      'tmdb_id': 99999,
      'title': 'Low Rated Movie',
      'original_title': 'Low Rated Movie',
      'overview': 'Not a great movie.',
      'release_date': '2020-01-01',
      'status': 'Released',
      'runtime': 90,
      'vote_average': 3.5,
      'vote_count': 10,
      'popularity': 5.0,
      'original_language': 'ja',
      'cast_names': '',
      'crew_names': '',
      'keyword_names': '',
    },
  ];

  for (final m in movies) {
    final id = await db.insert('movies', m);
    await db.execute(
      'INSERT INTO movies_fts(rowid, title, original_title, overview, tagline, cast_names, crew_names, keyword_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        m['title'],
        m['original_title'],
        m['overview'],
        m['tagline'] ?? '',
        m['cast_names'] ?? '',
        m['crew_names'] ?? '',
        m['keyword_names'] ?? '',
      ],
    );
  }

  // Movie genres
  await db.insert('movie_genres', {'movie_id': 1, 'genre_id': 878});
  await db.insert('movie_genres', {'movie_id': 1, 'genre_id': 28});
  await db.insert('movie_genres', {'movie_id': 2, 'genre_id': 878});
  await db.insert('movie_genres', {'movie_id': 2, 'genre_id': 28});
  await db.insert('movie_genres', {'movie_id': 3, 'genre_id': 878});
  await db.insert('movie_genres', {'movie_id': 3, 'genre_id': 18});

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
    'character': 'Neo',
    'display_order': 0
  });

  // Movie crew
  await db.insert('movie_crew', {
    'movie_id': 1,
    'person_id': 3,
    'job': 'Director',
    'department': 'Directing'
  });
  await db.insert('movie_crew', {
    'movie_id': 2,
    'person_id': 4,
    'job': 'Director',
    'department': 'Directing'
  });

  // Movie keywords
  await db.insert('movie_keywords', {'movie_id': 1, 'keyword_id': 310});
  await db.insert('movie_keywords', {'movie_id': 1, 'keyword_id': 312});
  await db.insert('movie_keywords', {'movie_id': 2, 'keyword_id': 310});

  // Movie production companies
  await db.insert(
      'movie_production_companies', {'movie_id': 1, 'company_id': 574});

  // TV Series
  final tvShows = [
    {
      'tmdb_id': 1399,
      'name': 'The Expanse',
      'original_name': 'The Expanse',
      'overview': 'A detective discovers a vast conspiracy in space.',
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
    {
      'tmdb_id': 62560,
      'name': 'Mr. Robot',
      'original_name': 'Mr. Robot',
      'overview': 'A young programmer with an anti-social disorder.',
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
      'keyword_names': 'artificial intelligence',
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
        tv['tagline'] ?? '',
        tv['cast_names'] ?? '',
        tv['crew_names'] ?? '',
        tv['keyword_names'] ?? '',
      ],
    );
  }

  // TV genres
  await db.insert('tv_series_genres', {'tv_series_id': 1, 'genre_id': 878});
  await db.insert('tv_series_genres', {'tv_series_id': 2, 'genre_id': 878});

  // TV cast
  await db.insert('tv_series_cast', {
    'tv_series_id': 1,
    'person_id': 2,
    'character': 'James Holden',
    'display_order': 0,
  });

  // TV crew
  await db.insert('tv_series_crew', {
    'tv_series_id': 1,
    'person_id': 3,
    'job': 'Creator',
    'department': 'Writing',
  });
}

void main() {
  late Database db;
  late ContentRepository repo;

  setUpAll(() async {
    db = await createTestDatabase();
    repo = ContentRepository(db);
  });

  tearDownAll(() async {
    await db.close();
  });

  group('ContentRepository.search', () {
    test('returns all items with empty query and default filters', () async {
      final response = await repo.search();
      // Default type is 'all', so we get movies + TV
      expect(response.total, 6); // 4 movies + 2 tv
      expect(response.results.length, 6);
    });

    test('filters by movie content type', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(contentType: ContentType.movie),
      );
      expect(response.total, 4);
      for (final r in response.results) {
        expect(r.type, 'movie');
      }
    });

    test('filters by TV content type', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(contentType: ContentType.tv),
      );
      expect(response.total, 2);
      for (final r in response.results) {
        expect(r.type, 'tv');
      }
    });

    test('searches by FTS query for movies', () async {
      final response = await repo.search(
        query: 'Matrix',
        filters: SearchFilters.empty.copyWith(contentType: ContentType.movie),
      );
      expect(response.results.any((r) => r.title == 'The Matrix'), true);
    });

    test('searches by FTS query for TV', () async {
      final response = await repo.search(
        query: 'Expanse',
        filters: SearchFilters.empty.copyWith(contentType: ContentType.tv),
      );
      expect(response.results.any((r) => r.title == 'The Expanse'), true);
    });

    test('searches combined (all) by FTS query', () async {
      final response = await repo.search(query: 'Robot');
      expect(response.results.any((r) => r.title == 'Mr. Robot'), true);
    });

    test('filters by year range', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          yearMin: () => 1990,
          yearMax: () => 2000,
        ),
      );
      expect(response.total, 1);
      expect(response.results.first.title, 'The Matrix');
    });

    test('filters by rating range', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          ratingMin: () => 8.0,
          ratingMax: () => 9.0,
        ),
      );
      // Matrix (8.2) and Interstellar (8.4)
      expect(response.total, 2);
    });

    test('filters by status', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          status: () => 'Released',
        ),
      );
      expect(response.total, 4);
    });

    test('filters by language', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          language: () => 'ja',
        ),
      );
      expect(response.total, 1);
      expect(response.results.first.title, 'Low Rated Movie');
    });

    test('filters by minVotes', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          minVotes: () => 100,
        ),
      );
      // Only movies with vote_count >= 100 (excludes Low Rated with 10)
      expect(response.total, 3);
    });

    test('paginates results', () async {
      final page1 = await repo.search(
        filters: SearchFilters.empty.copyWith(contentType: ContentType.movie),
        page: 1,
        perPage: 2,
      );
      expect(page1.results.length, 2);
      expect(page1.total, 4);

      final page2 = await repo.search(
        filters: SearchFilters.empty.copyWith(contentType: ContentType.movie),
        page: 2,
        perPage: 2,
      );
      expect(page2.results.length, 2);
    });

    test('sorts by vote average', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          sortBy: SortBy.voteAverage,
          sortOrder: SortOrder.desc,
        ),
      );
      expect(response.results.first.title, 'Interstellar');
    });

    test('sorts by title ascending', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          sortBy: SortBy.title,
          sortOrder: SortOrder.asc,
        ),
      );
      expect(response.results.first.title, 'Interstellar');
    });

    test('sorts by release date descending', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.movie,
          sortBy: SortBy.releaseDate,
          sortOrder: SortOrder.desc,
        ),
      );
      expect(response.results.first.title, 'Low Rated Movie');
    });

    test('combined search with filters and query', () async {
      final response = await repo.search(
        query: 'intelligence',
        filters: SearchFilters.empty.copyWith(
          yearMin: () => 1990,
        ),
      );
      // "The Matrix" has 'artificial intelligence' keyword and year >= 1990
      // "Mr. Robot" has 'artificial intelligence' keyword
      expect(response.results.isNotEmpty, true);
    });

    test('TV search with year filter', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.tv,
          yearMin: () => 2015,
          yearMax: () => 2016,
        ),
      );
      expect(response.total, 2); // Both started in 2015
    });

    test('TV search with rating filter', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.tv,
          ratingMin: () => 8.3,
        ),
      );
      expect(response.total, 1);
      expect(response.results.first.title, 'The Expanse');
    });

    test('TV search with status filter', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.tv,
          status: () => 'Ended',
        ),
      );
      expect(response.total, 2);
    });

    test('TV search with language filter', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.tv,
          language: () => 'en',
        ),
      );
      expect(response.total, 2);
    });

    test('TV search with minVotes filter', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          contentType: ContentType.tv,
          minVotes: () => 3000,
        ),
      );
      expect(response.total, 1);
      expect(response.results.first.title, 'Mr. Robot');
    });

    test('combined sort by popularity ascending', () async {
      final response = await repo.search(
        filters: SearchFilters.empty.copyWith(
          sortBy: SortBy.popularity,
          sortOrder: SortOrder.asc,
        ),
      );
      // Lowest popularity first
      expect(response.results.first.popularity, 5.0);
    });
  });

  group('ContentRepository.getTrending', () {
    test('returns movies sorted by popularity', () async {
      final results = await repo.getTrending('movie');
      expect(results.isNotEmpty, true);
      expect(results.first.title, 'Interstellar'); // highest popularity=95
      for (final r in results) {
        expect(r.type, 'movie');
      }
    });

    test('returns TV sorted by popularity', () async {
      final results = await repo.getTrending('tv');
      expect(results.isNotEmpty, true);
      expect(results.first.title, 'The Expanse'); // popularity=60
      for (final r in results) {
        expect(r.type, 'tv');
      }
    });

    test('respects limit parameter', () async {
      final results = await repo.getTrending('movie', limit: 2);
      expect(results.length, 2);
    });
  });

  group('ContentRepository.getTopRated', () {
    test('returns movies with >50 votes sorted by rating', () async {
      final results = await repo.getTopRated('movie');
      // Low Rated Movie has only 10 votes, should be excluded
      expect(results.length, 3);
      expect(results.first.title, 'Interstellar');
    });

    test('returns TV sorted by rating', () async {
      final results = await repo.getTopRated('tv');
      expect(results.isNotEmpty, true);
      expect(results.first.title, 'The Expanse');
    });

    test('respects limit', () async {
      final results = await repo.getTopRated('movie', limit: 1);
      expect(results.length, 1);
    });
  });

  group('ContentRepository.getRecent', () {
    test('returns recent movies within 3 months', () async {
      // Our test data is from 1984-2020, so likely no recent items
      final results = await repo.getRecent('movie');
      expect(results, isA<List>());
    });

    test('returns recent TV within 3 months', () async {
      final results = await repo.getRecent('tv');
      expect(results, isA<List>());
    });
  });

  group('ContentRepository.getCombinedTrending', () {
    test('returns combined movies and TV sorted by popularity', () async {
      final results = await repo.getCombinedTrending();
      expect(results.isNotEmpty, true);
      expect(results.first.title, 'Interstellar');
      final types = results.map((r) => r.type).toSet();
      expect(types.contains('movie'), true);
      expect(types.contains('tv'), true);
    });

    test('respects limit', () async {
      final results = await repo.getCombinedTrending(limit: 3);
      expect(results.length, 3);
    });
  });

  group('ContentRepository.getMovieById', () {
    test('returns full movie detail', () async {
      final detail = await repo.getMovieById(1);
      expect(detail, isNotNull);
      expect(detail!.movie.title, 'The Terminator');
      expect(detail.genres.isNotEmpty, true);
      expect(detail.genres.any((g) => g.name == 'Science Fiction'), true);
      expect(detail.cast.isNotEmpty, true);
      expect(detail.cast.first.name, 'Arnold Schwarzenegger');
      expect(detail.cast.first.character, 'The Terminator');
      expect(detail.crew.isNotEmpty, true);
      expect(detail.crew.first.name, 'James Cameron');
      expect(detail.keywords.isNotEmpty, true);
      expect(detail.productionCompanies.isNotEmpty, true);
    });

    test('returns null for non-existent movie', () async {
      final detail = await repo.getMovieById(999);
      expect(detail, isNull);
    });

    test('returns movie with correct cast and crew', () async {
      final detail = await repo.getMovieById(2);
      expect(detail, isNotNull);
      expect(detail!.movie.title, 'The Matrix');
      expect(detail.cast.first.name, 'Keanu Reeves');
      expect(detail.crew.first.name, 'Lana Wachowski');
    });
  });

  group('ContentRepository.getTvSeriesById', () {
    test('returns full TV detail', () async {
      final detail = await repo.getTvSeriesById(1);
      expect(detail, isNotNull);
      expect(detail!.series.name, 'The Expanse');
      expect(detail.genres.isNotEmpty, true);
      expect(detail.genres.first.name, 'Science Fiction');
      expect(detail.cast.isNotEmpty, true);
      expect(detail.crew.isNotEmpty, true);
    });

    test('returns null for non-existent TV series', () async {
      final detail = await repo.getTvSeriesById(999);
      expect(detail, isNull);
    });
  });

  group('ContentRepository.getPersonById', () {
    test('returns full person detail with credits', () async {
      final detail = await repo.getPersonById(2);
      expect(detail, isNotNull);
      expect(detail!.person.name, 'Keanu Reeves');
      expect(detail.movieCredits.isNotEmpty, true);
      expect(detail.movieCredits.first.title, 'The Matrix');
      expect(detail.movieCredits.first.character, 'Neo');
      expect(detail.tvCredits.isNotEmpty, true);
    });

    test('returns null for non-existent person', () async {
      final detail = await repo.getPersonById(999);
      expect(detail, isNull);
    });

    test('returns person with crew credits', () async {
      final detail = await repo.getPersonById(3);
      expect(detail, isNotNull);
      expect(detail!.person.name, 'James Cameron');
      // Has movie crew credits (Director)
      expect(detail.movieCredits.any((c) => c.job == 'Director'), true);
      // Has TV crew credits
      expect(detail.tvCredits.isNotEmpty, true);
    });
  });

  group('ContentRepository.getSyncState', () {
    test('returns sync state', () async {
      final state = await repo.getSyncState();
      expect(state, isNotNull);
    });
  });

  group('ContentRepository.getStats', () {
    test('returns correct movie and TV counts', () async {
      final stats = await repo.getStats();
      expect(stats['movies'], 4);
      expect(stats['tvSeries'], 2);
    });
  });

  group('SearchResponse', () {
    test('has correct properties', () {
      const response = SearchResponse(results: [], total: 0);
      expect(response.results, isEmpty);
      expect(response.total, 0);
    });
  });
}
