import 'package:sqflite/sqflite.dart';
import '../../models/search_result.dart';
import '../../models/movie_detail.dart';
import '../../models/tv_detail.dart';
import '../../models/person_detail.dart';
import '../../models/movie.dart';
import '../../models/tv_series.dart';
import '../../models/person.dart';
import '../../models/genre.dart';
import '../../models/cast_member.dart';
import '../../models/crew_member.dart';
import '../../models/keyword.dart';
import '../../models/production_company.dart';
import '../../models/search_state.dart';

class SearchResponse {
  final List<SearchResult> results;
  final int total;

  const SearchResponse({required this.results, required this.total});
}

class ContentRepository {
  final Database db;

  ContentRepository(this.db);

  // Search
  Future<SearchResponse> search({
    String query = '',
    SearchFilters filters = SearchFilters.empty,
    int page = 1,
    int perPage = 20,
  }) async {
    final offset = (page - 1) * perPage;
    final type = filters.contentType;

    if (type == ContentType.movie || type == ContentType.all) {
      // handled below
    }

    List<SearchResult> allResults = [];
    int total = 0;

    if (type == ContentType.movie || type == ContentType.all) {
      final movieWhere = _buildMovieWhere(query, filters);
      final countSql =
          'SELECT COUNT(*) as total FROM movies m ${movieWhere.clause}';
      final countResult = await db.rawQuery(countSql, movieWhere.bindings);
      total += (countResult.first['total'] as int?) ?? 0;
    }

    if (type == ContentType.tv || type == ContentType.all) {
      final tvWhere = _buildTvWhere(query, filters);
      final countSql =
          'SELECT COUNT(*) as total FROM tv_series t ${tvWhere.clause}';
      final countResult = await db.rawQuery(countSql, tvWhere.bindings);
      total += (countResult.first['total'] as int?) ?? 0;
    }

    final sortSuffix = _buildSortSuffix(filters);

    if (type == ContentType.movie) {
      final movieWhere = _buildMovieWhere(query, filters);
      final sql = '''
        SELECT m.id, m.tmdb_id, m.title, m.original_title, m.overview,
               m.poster_path, m.backdrop_path, m.release_date, m.status,
               m.vote_average, m.vote_count, m.popularity, m.original_language,
               m.title as sort_title, m.release_date as sort_date
        FROM movies m ${movieWhere.clause}
        ORDER BY $sortSuffix
        LIMIT ? OFFSET ?
      ''';
      final rows =
          await db.rawQuery(sql, [...movieWhere.bindings, perPage, offset]);
      allResults = rows.map((r) => SearchResult.fromMovieMap(r)).toList();
    } else if (type == ContentType.tv) {
      final tvWhere = _buildTvWhere(query, filters);
      final sql = '''
        SELECT t.id, t.tmdb_id, t.name, t.original_name, t.overview,
               t.poster_path, t.backdrop_path, t.first_air_date, t.status,
               t.vote_average, t.vote_count, t.popularity, t.original_language,
               t.name as sort_title, t.first_air_date as sort_date
        FROM tv_series t ${tvWhere.clause}
        ORDER BY $sortSuffix
        LIMIT ? OFFSET ?
      ''';
      final rows =
          await db.rawQuery(sql, [...tvWhere.bindings, perPage, offset]);
      allResults = rows.map((r) => SearchResult.fromTvMap(r)).toList();
    } else {
      // Both - UNION ALL
      final movieWhere = _buildMovieWhere(query, filters);
      final tvWhere = _buildTvWhere(query, filters);

      final sql = '''
        SELECT * FROM (
          SELECT m.id, m.tmdb_id, 'movie' as type, m.title, m.original_title, m.overview,
                 m.poster_path, m.backdrop_path, m.release_date, m.status,
                 m.vote_average, m.vote_count, m.popularity, m.original_language,
                 m.title as sort_title, m.release_date as sort_date
          FROM movies m ${movieWhere.clause}
          UNION ALL
          SELECT t.id, t.tmdb_id, 'tv' as type, t.name, t.original_name, t.overview,
                 t.poster_path, t.backdrop_path, t.first_air_date, t.status,
                 t.vote_average, t.vote_count, t.popularity, t.original_language,
                 t.name as sort_title, t.first_air_date as sort_date
          FROM tv_series t ${tvWhere.clause}
        )
        ORDER BY $sortSuffix
        LIMIT ? OFFSET ?
      ''';
      final rows = await db.rawQuery(sql, [
        ...movieWhere.bindings,
        ...tvWhere.bindings,
        perPage,
        offset,
      ]);
      allResults = rows.map((r) {
        if (r['type'] == 'movie') {
          return SearchResult(
            id: r['id'] as int,
            tmdbId: r['tmdb_id'] as int,
            type: 'movie',
            title: r['title'] as String,
            originalTitle: r['original_title'] as String?,
            overview: r['overview'] as String?,
            posterPath: r['poster_path'] as String?,
            backdropPath: r['backdrop_path'] as String?,
            releaseDate: r['release_date'] as String?,
            status: r['status'] as String?,
            voteAverage: (r['vote_average'] as num?)?.toDouble(),
            voteCount: r['vote_count'] as int?,
            popularity: (r['popularity'] as num?)?.toDouble(),
            originalLanguage: r['original_language'] as String?,
          );
        } else {
          return SearchResult(
            id: r['id'] as int,
            tmdbId: r['tmdb_id'] as int,
            type: 'tv',
            title: r['title'] as String,
            originalTitle: r['original_title'] as String?,
            overview: r['overview'] as String?,
            posterPath: r['poster_path'] as String?,
            backdropPath: r['backdrop_path'] as String?,
            releaseDate: r['release_date'] as String?,
            status: r['status'] as String?,
            voteAverage: (r['vote_average'] as num?)?.toDouble(),
            voteCount: r['vote_count'] as int?,
            popularity: (r['popularity'] as num?)?.toDouble(),
            originalLanguage: r['original_language'] as String?,
          );
        }
      }).toList();
    }

    return SearchResponse(results: allResults, total: total);
  }

  // Trending
  Future<List<SearchResult>> getTrending(String type, {int limit = 20}) async {
    if (type == 'movie') {
      final rows = await db.rawQuery('''
        SELECT id, tmdb_id, title, original_title, overview, poster_path, backdrop_path,
               release_date, status, vote_average, vote_count, popularity, original_language
        FROM movies ORDER BY popularity DESC LIMIT ?
      ''', [limit]);
      return rows.map((r) => SearchResult.fromMovieMap(r)).toList();
    } else {
      final rows = await db.rawQuery('''
        SELECT id, tmdb_id, name, original_name, overview, poster_path, backdrop_path,
               first_air_date, status, vote_average, vote_count, popularity, original_language
        FROM tv_series ORDER BY popularity DESC LIMIT ?
      ''', [limit]);
      return rows.map((r) => SearchResult.fromTvMap(r)).toList();
    }
  }

  // Top Rated
  Future<List<SearchResult>> getTopRated(String type, {int limit = 20}) async {
    if (type == 'movie') {
      final rows = await db.rawQuery('''
        SELECT id, tmdb_id, title, original_title, overview, poster_path, backdrop_path,
               release_date, status, vote_average, vote_count, popularity, original_language
        FROM movies WHERE vote_count > 50
        ORDER BY vote_average DESC, vote_count DESC LIMIT ?
      ''', [limit]);
      return rows.map((r) => SearchResult.fromMovieMap(r)).toList();
    } else {
      final rows = await db.rawQuery('''
        SELECT id, tmdb_id, name, original_name, overview, poster_path, backdrop_path,
               first_air_date, status, vote_average, vote_count, popularity, original_language
        FROM tv_series WHERE vote_count > 50
        ORDER BY vote_average DESC, vote_count DESC LIMIT ?
      ''', [limit]);
      return rows.map((r) => SearchResult.fromTvMap(r)).toList();
    }
  }

  // Recent
  Future<List<SearchResult>> getRecent(String type, {int limit = 20}) async {
    final now = DateTime.now();
    final threeMonthsAgo = DateTime(now.year, now.month - 3, now.day);
    final cutoff =
        '${threeMonthsAgo.year}-${threeMonthsAgo.month.toString().padLeft(2, '0')}-${threeMonthsAgo.day.toString().padLeft(2, '0')}';
    final today =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

    if (type == 'movie') {
      final rows = await db.rawQuery('''
        SELECT id, tmdb_id, title, original_title, overview, poster_path, backdrop_path,
               release_date, status, vote_average, vote_count, popularity, original_language
        FROM movies WHERE release_date >= ? AND release_date <= ?
        ORDER BY release_date DESC LIMIT ?
      ''', [cutoff, today, limit]);
      return rows.map((r) => SearchResult.fromMovieMap(r)).toList();
    } else {
      final rows = await db.rawQuery('''
        SELECT id, tmdb_id, name, original_name, overview, poster_path, backdrop_path,
               first_air_date, status, vote_average, vote_count, popularity, original_language
        FROM tv_series WHERE first_air_date >= ? AND first_air_date <= ?
        ORDER BY first_air_date DESC LIMIT ?
      ''', [cutoff, today, limit]);
      return rows.map((r) => SearchResult.fromTvMap(r)).toList();
    }
  }

  // Combined trending (movies + TV)
  Future<List<SearchResult>> getCombinedTrending({int limit = 20}) async {
    final rows = await db.rawQuery('''
      SELECT * FROM (
        SELECT id, tmdb_id, 'movie' as type, title, original_title, overview,
               poster_path, backdrop_path, release_date, status,
               vote_average, vote_count, popularity, original_language
        FROM movies
        UNION ALL
        SELECT id, tmdb_id, 'tv' as type, name, original_name, overview,
               poster_path, backdrop_path, first_air_date, status,
               vote_average, vote_count, popularity, original_language
        FROM tv_series
      ) ORDER BY popularity DESC LIMIT ?
    ''', [limit]);

    return rows.map((r) {
      return SearchResult(
        id: r['id'] as int,
        tmdbId: r['tmdb_id'] as int,
        type: r['type'] as String,
        title: r['title'] as String,
        originalTitle: r['original_title'] as String?,
        overview: r['overview'] as String?,
        posterPath: r['poster_path'] as String?,
        backdropPath: r['backdrop_path'] as String?,
        releaseDate: r['release_date'] as String?,
        status: r['status'] as String?,
        voteAverage: (r['vote_average'] as num?)?.toDouble(),
        voteCount: r['vote_count'] as int?,
        popularity: (r['popularity'] as num?)?.toDouble(),
        originalLanguage: r['original_language'] as String?,
      );
    }).toList();
  }

  // Movie detail
  Future<MovieDetail?> getMovieById(int id) async {
    final movieRows =
        await db.rawQuery('SELECT * FROM movies WHERE id = ?', [id]);
    if (movieRows.isEmpty) return null;
    final movie = Movie.fromMap(movieRows.first);

    final genreRows = await db.rawQuery('''
      SELECT g.id, g.name FROM genres g
      JOIN movie_genres mg ON mg.genre_id = g.id
      WHERE mg.movie_id = ?
    ''', [id]);
    final genres = genreRows.map((r) => Genre.fromMap(r)).toList();

    final castRows = await db.rawQuery('''
      SELECT mc.person_id, p.name, p.profile_path, mc.character, mc.display_order
      FROM movie_cast mc JOIN people p ON p.id = mc.person_id
      WHERE mc.movie_id = ? ORDER BY mc.display_order ASC
    ''', [id]);
    final cast = castRows.map((r) => CastMember.fromMap(r)).toList();

    final crewRows = await db.rawQuery('''
      SELECT mcr.person_id, p.name, p.profile_path, mcr.job, mcr.department
      FROM movie_crew mcr JOIN people p ON p.id = mcr.person_id
      WHERE mcr.movie_id = ? ORDER BY mcr.department ASC
    ''', [id]);
    final crew = crewRows.map((r) => CrewMember.fromMap(r)).toList();

    final keywordRows = await db.rawQuery('''
      SELECT k.id, k.name FROM keywords k
      JOIN movie_keywords mk ON mk.keyword_id = k.id
      WHERE mk.movie_id = ?
    ''', [id]);
    final keywords = keywordRows.map((r) => Keyword.fromMap(r)).toList();

    final companyRows = await db.rawQuery('''
      SELECT pc.id, pc.name, pc.logo_path, pc.origin_country
      FROM production_companies pc
      JOIN movie_production_companies mpc ON mpc.company_id = pc.id
      WHERE mpc.movie_id = ?
    ''', [id]);
    final companies =
        companyRows.map((r) => ProductionCompany.fromMap(r)).toList();

    return MovieDetail(
      movie: movie,
      genres: genres,
      cast: cast,
      crew: crew,
      keywords: keywords,
      productionCompanies: companies,
    );
  }

  // TV detail
  Future<TvDetail?> getTvSeriesById(int id) async {
    final rows =
        await db.rawQuery('SELECT * FROM tv_series WHERE id = ?', [id]);
    if (rows.isEmpty) return null;
    final series = TvSeries.fromMap(rows.first);

    final genreRows = await db.rawQuery('''
      SELECT g.id, g.name FROM genres g
      JOIN tv_series_genres tsg ON tsg.genre_id = g.id
      WHERE tsg.tv_series_id = ?
    ''', [id]);
    final genres = genreRows.map((r) => Genre.fromMap(r)).toList();

    final castRows = await db.rawQuery('''
      SELECT tsc.person_id, p.name, p.profile_path, tsc.character, tsc.display_order
      FROM tv_series_cast tsc JOIN people p ON p.id = tsc.person_id
      WHERE tsc.tv_series_id = ? ORDER BY tsc.display_order ASC
    ''', [id]);
    final cast = castRows.map((r) => CastMember.fromMap(r)).toList();

    final crewRows = await db.rawQuery('''
      SELECT tscr.person_id, p.name, p.profile_path, tscr.job, tscr.department
      FROM tv_series_crew tscr JOIN people p ON p.id = tscr.person_id
      WHERE tscr.tv_series_id = ? ORDER BY tscr.department ASC
    ''', [id]);
    final crew = crewRows.map((r) => CrewMember.fromMap(r)).toList();

    return TvDetail(series: series, genres: genres, cast: cast, crew: crew);
  }

  // Person detail
  Future<PersonDetail?> getPersonById(int id) async {
    final rows = await db.rawQuery('SELECT * FROM people WHERE id = ?', [id]);
    if (rows.isEmpty) return null;
    final person = Person.fromMap(rows.first);

    final movieCreditRows = await db.rawQuery('''
      SELECT mc.movie_id as content_id, m.tmdb_id, m.title, m.poster_path, m.release_date,
             mc.character, NULL AS job, 'cast' AS role
      FROM movie_cast mc JOIN movies m ON m.id = mc.movie_id
      WHERE mc.person_id = ?
      UNION ALL
      SELECT mcr.movie_id as content_id, m.tmdb_id, m.title, m.poster_path, m.release_date,
             NULL AS character, mcr.job, 'crew' AS role
      FROM movie_crew mcr JOIN movies m ON m.id = mcr.movie_id
      WHERE mcr.person_id = ?
      ORDER BY release_date DESC
    ''', [id, id]);

    final movieCredits = movieCreditRows
        .map((r) => Credit(
              contentId: r['content_id'] as int,
              tmdbId: r['tmdb_id'] as int,
              title: r['title'] as String,
              posterPath: r['poster_path'] as String?,
              releaseDate: r['release_date'] as String?,
              character: r['character'] as String?,
              job: r['job'] as String?,
              role: r['role'] as String,
              mediaType: 'movie',
            ))
        .toList();

    final tvCreditRows = await db.rawQuery('''
      SELECT tsc.tv_series_id as content_id, t.tmdb_id, t.name as title, t.poster_path, t.first_air_date as release_date,
             tsc.character, NULL AS job, 'cast' AS role
      FROM tv_series_cast tsc JOIN tv_series t ON t.id = tsc.tv_series_id
      WHERE tsc.person_id = ?
      UNION ALL
      SELECT tscr.tv_series_id as content_id, t.tmdb_id, t.name as title, t.poster_path, t.first_air_date as release_date,
             NULL AS character, tscr.job, 'crew' AS role
      FROM tv_series_crew tscr JOIN tv_series t ON t.id = tscr.tv_series_id
      WHERE tscr.person_id = ?
      ORDER BY release_date DESC
    ''', [id, id]);

    final tvCredits = tvCreditRows
        .map((r) => Credit(
              contentId: r['content_id'] as int,
              tmdbId: r['tmdb_id'] as int,
              title: r['title'] as String,
              posterPath: r['poster_path'] as String?,
              releaseDate: r['release_date'] as String?,
              character: r['character'] as String?,
              job: r['job'] as String?,
              role: r['role'] as String,
              mediaType: 'tv',
            ))
        .toList();

    return PersonDetail(
        person: person, movieCredits: movieCredits, tvCredits: tvCredits);
  }

  // Sync state
  Future<Map<String, dynamic>?> getSyncState() async {
    final rows = await db.rawQuery('SELECT * FROM sync_state WHERE id = 1');
    if (rows.isEmpty) return null;
    return rows.first;
  }

  // Stats
  Future<Map<String, int>> getStats() async {
    final movieCount = Sqflite.firstIntValue(
          await db.rawQuery('SELECT COUNT(*) FROM movies'),
        ) ??
        0;
    final tvCount = Sqflite.firstIntValue(
          await db.rawQuery('SELECT COUNT(*) FROM tv_series'),
        ) ??
        0;
    return {'movies': movieCount, 'tvSeries': tvCount};
  }

  // Private helpers

  _WhereClause _buildMovieWhere(String query, SearchFilters filters) {
    final conditions = <String>[];
    final bindings = <Object>[];

    if (query.isNotEmpty) {
      final terms = query
          .trim()
          .split(RegExp(r'\s+'))
          .map((w) => '"${w.replaceAll('"', '""')}"')
          .join(' OR ');
      conditions.add(
          'm.id IN (SELECT rowid FROM movies_fts WHERE movies_fts MATCH ?)');
      bindings.add(terms);
    }

    if (filters.yearMin != null) {
      conditions.add('CAST(substr(m.release_date, 1, 4) AS INTEGER) >= ?');
      bindings.add(filters.yearMin!);
    }
    if (filters.yearMax != null) {
      conditions.add('CAST(substr(m.release_date, 1, 4) AS INTEGER) <= ?');
      bindings.add(filters.yearMax!);
    }
    if (filters.status != null) {
      conditions.add('m.status = ?');
      bindings.add(filters.status!);
    }
    if (filters.language != null) {
      conditions.add('m.original_language = ?');
      bindings.add(filters.language!);
    }
    if (filters.ratingMin != null) {
      conditions.add('m.vote_average >= ?');
      bindings.add(filters.ratingMin!);
    }
    if (filters.ratingMax != null) {
      conditions.add('m.vote_average <= ?');
      bindings.add(filters.ratingMax!);
    }
    if (filters.minVotes != null) {
      conditions.add('m.vote_count >= ?');
      bindings.add(filters.minVotes!);
    }

    final clause =
        conditions.isNotEmpty ? 'WHERE ${conditions.join(' AND ')}' : '';
    return _WhereClause(clause, bindings);
  }

  _WhereClause _buildTvWhere(String query, SearchFilters filters) {
    final conditions = <String>[];
    final bindings = <Object>[];

    if (query.isNotEmpty) {
      final terms = query
          .trim()
          .split(RegExp(r'\s+'))
          .map((w) => '"${w.replaceAll('"', '""')}"')
          .join(' OR ');
      conditions.add(
          't.id IN (SELECT rowid FROM tv_series_fts WHERE tv_series_fts MATCH ?)');
      bindings.add(terms);
    }

    if (filters.yearMin != null) {
      conditions.add('CAST(substr(t.first_air_date, 1, 4) AS INTEGER) >= ?');
      bindings.add(filters.yearMin!);
    }
    if (filters.yearMax != null) {
      conditions.add('CAST(substr(t.first_air_date, 1, 4) AS INTEGER) <= ?');
      bindings.add(filters.yearMax!);
    }
    if (filters.status != null) {
      conditions.add('t.status = ?');
      bindings.add(filters.status!);
    }
    if (filters.language != null) {
      conditions.add('t.original_language = ?');
      bindings.add(filters.language!);
    }
    if (filters.ratingMin != null) {
      conditions.add('t.vote_average >= ?');
      bindings.add(filters.ratingMin!);
    }
    if (filters.ratingMax != null) {
      conditions.add('t.vote_average <= ?');
      bindings.add(filters.ratingMax!);
    }
    if (filters.minVotes != null) {
      conditions.add('t.vote_count >= ?');
      bindings.add(filters.minVotes!);
    }

    final clause =
        conditions.isNotEmpty ? 'WHERE ${conditions.join(' AND ')}' : '';
    return _WhereClause(clause, bindings);
  }

  String _buildSortSuffix(SearchFilters filters) {
    final dir = filters.sortOrder == SortOrder.asc ? 'ASC' : 'DESC';
    switch (filters.sortBy) {
      case SortBy.voteAverage:
        return 'vote_average $dir, vote_count DESC';
      case SortBy.releaseDate:
        return 'sort_date $dir';
      case SortBy.title:
        return 'sort_title $dir';
      case SortBy.popularity:
      default:
        return 'popularity $dir';
    }
  }
}

class _WhereClause {
  final String clause;
  final List<Object> bindings;
  const _WhereClause(this.clause, this.bindings);
}
