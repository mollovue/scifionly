class Movie {
  final int id;
  final int tmdbId;
  final String title;
  final String? originalTitle;
  final String? overview;
  final String? posterPath;
  final String? backdropPath;
  final String? releaseDate;
  final String? status;
  final int? runtime;
  final double? voteAverage;
  final int? voteCount;
  final double? popularity;
  final int? budget;
  final int? revenue;
  final String? originalLanguage;
  final String? spokenLanguages;
  final String? tagline;
  final String? homepage;
  final String? imdbId;

  const Movie({
    required this.id,
    required this.tmdbId,
    required this.title,
    this.originalTitle,
    this.overview,
    this.posterPath,
    this.backdropPath,
    this.releaseDate,
    this.status,
    this.runtime,
    this.voteAverage,
    this.voteCount,
    this.popularity,
    this.budget,
    this.revenue,
    this.originalLanguage,
    this.spokenLanguages,
    this.tagline,
    this.homepage,
    this.imdbId,
  });

  factory Movie.fromMap(Map<String, dynamic> map) {
    return Movie(
      id: map['id'] as int,
      tmdbId: map['tmdb_id'] as int,
      title: map['title'] as String,
      originalTitle: map['original_title'] as String?,
      overview: map['overview'] as String?,
      posterPath: map['poster_path'] as String?,
      backdropPath: map['backdrop_path'] as String?,
      releaseDate: map['release_date'] as String?,
      status: map['status'] as String?,
      runtime: map['runtime'] as int?,
      voteAverage: (map['vote_average'] as num?)?.toDouble(),
      voteCount: map['vote_count'] as int?,
      popularity: (map['popularity'] as num?)?.toDouble(),
      budget: map['budget'] as int?,
      revenue: map['revenue'] as int?,
      originalLanguage: map['original_language'] as String?,
      spokenLanguages: map['spoken_languages'] as String?,
      tagline: map['tagline'] as String?,
      homepage: map['homepage'] as String?,
      imdbId: map['imdb_id'] as String?,
    );
  }

  String? get year {
    if (releaseDate == null || releaseDate!.length < 4) return null;
    return releaseDate!.substring(0, 4);
  }
}
