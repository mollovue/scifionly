class SearchResult {
  final int id;
  final int tmdbId;
  final String type; // 'movie' or 'tv'
  final String title;
  final String? originalTitle;
  final String? overview;
  final String? posterPath;
  final String? backdropPath;
  final String? releaseDate;
  final String? status;
  final double? voteAverage;
  final int? voteCount;
  final double? popularity;
  final String? originalLanguage;

  const SearchResult({
    required this.id,
    required this.tmdbId,
    required this.type,
    required this.title,
    this.originalTitle,
    this.overview,
    this.posterPath,
    this.backdropPath,
    this.releaseDate,
    this.status,
    this.voteAverage,
    this.voteCount,
    this.popularity,
    this.originalLanguage,
  });

  factory SearchResult.fromMovieMap(Map<String, dynamic> map) {
    return SearchResult(
      id: map['id'] as int,
      tmdbId: map['tmdb_id'] as int,
      type: 'movie',
      title: map['title'] as String,
      originalTitle: map['original_title'] as String?,
      overview: map['overview'] as String?,
      posterPath: map['poster_path'] as String?,
      backdropPath: map['backdrop_path'] as String?,
      releaseDate: map['release_date'] as String?,
      status: map['status'] as String?,
      voteAverage: (map['vote_average'] as num?)?.toDouble(),
      voteCount: map['vote_count'] as int?,
      popularity: (map['popularity'] as num?)?.toDouble(),
      originalLanguage: map['original_language'] as String?,
    );
  }

  factory SearchResult.fromTvMap(Map<String, dynamic> map) {
    return SearchResult(
      id: map['id'] as int,
      tmdbId: map['tmdb_id'] as int,
      type: 'tv',
      title: map['name'] as String,
      originalTitle: map['original_name'] as String?,
      overview: map['overview'] as String?,
      posterPath: map['poster_path'] as String?,
      backdropPath: map['backdrop_path'] as String?,
      releaseDate: map['first_air_date'] as String?,
      status: map['status'] as String?,
      voteAverage: (map['vote_average'] as num?)?.toDouble(),
      voteCount: map['vote_count'] as int?,
      popularity: (map['popularity'] as num?)?.toDouble(),
      originalLanguage: map['original_language'] as String?,
    );
  }

  String? get year {
    if (releaseDate == null || releaseDate!.length < 4) return null;
    return releaseDate!.substring(0, 4);
  }
}
