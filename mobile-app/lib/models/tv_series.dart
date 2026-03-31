class TvSeries {
  final int id;
  final int tmdbId;
  final String name;
  final String? originalName;
  final String? overview;
  final String? posterPath;
  final String? backdropPath;
  final String? firstAirDate;
  final String? lastAirDate;
  final String? status;
  final int? numberOfSeasons;
  final int? numberOfEpisodes;
  final String? episodeRunTime;
  final double? voteAverage;
  final int? voteCount;
  final double? popularity;
  final String? originalLanguage;
  final String? spokenLanguages;
  final String? tagline;
  final String? homepage;
  final String? networks;

  const TvSeries({
    required this.id,
    required this.tmdbId,
    required this.name,
    this.originalName,
    this.overview,
    this.posterPath,
    this.backdropPath,
    this.firstAirDate,
    this.lastAirDate,
    this.status,
    this.numberOfSeasons,
    this.numberOfEpisodes,
    this.episodeRunTime,
    this.voteAverage,
    this.voteCount,
    this.popularity,
    this.originalLanguage,
    this.spokenLanguages,
    this.tagline,
    this.homepage,
    this.networks,
  });

  factory TvSeries.fromMap(Map<String, dynamic> map) {
    return TvSeries(
      id: map['id'] as int,
      tmdbId: map['tmdb_id'] as int,
      name: map['name'] as String,
      originalName: map['original_name'] as String?,
      overview: map['overview'] as String?,
      posterPath: map['poster_path'] as String?,
      backdropPath: map['backdrop_path'] as String?,
      firstAirDate: map['first_air_date'] as String?,
      lastAirDate: map['last_air_date'] as String?,
      status: map['status'] as String?,
      numberOfSeasons: map['number_of_seasons'] as int?,
      numberOfEpisodes: map['number_of_episodes'] as int?,
      episodeRunTime: map['episode_run_time'] as String?,
      voteAverage: (map['vote_average'] as num?)?.toDouble(),
      voteCount: map['vote_count'] as int?,
      popularity: (map['popularity'] as num?)?.toDouble(),
      originalLanguage: map['original_language'] as String?,
      spokenLanguages: map['spoken_languages'] as String?,
      tagline: map['tagline'] as String?,
      homepage: map['homepage'] as String?,
      networks: map['networks'] as String?,
    );
  }

  String? get year {
    if (firstAirDate == null || firstAirDate!.length < 4) return null;
    return firstAirDate!.substring(0, 4);
  }
}
