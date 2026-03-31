import 'person.dart';

class Credit {
  final int contentId;
  final int tmdbId;
  final String title;
  final String? posterPath;
  final String? releaseDate;
  final String? character;
  final String? job;
  final String role; // 'cast' or 'crew'
  final String mediaType; // 'movie' or 'tv'

  const Credit({
    required this.contentId,
    required this.tmdbId,
    required this.title,
    this.posterPath,
    this.releaseDate,
    this.character,
    this.job,
    required this.role,
    required this.mediaType,
  });

  String? get year {
    if (releaseDate == null || releaseDate!.length < 4) return null;
    return releaseDate!.substring(0, 4);
  }
}

class PersonDetail {
  final Person person;
  final List<Credit> movieCredits;
  final List<Credit> tvCredits;

  const PersonDetail({
    required this.person,
    required this.movieCredits,
    required this.tvCredits,
  });
}
