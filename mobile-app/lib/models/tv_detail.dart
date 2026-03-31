import 'tv_series.dart';
import 'genre.dart';
import 'cast_member.dart';
import 'crew_member.dart';

class TvDetail {
  final TvSeries series;
  final List<Genre> genres;
  final List<CastMember> cast;
  final List<CrewMember> crew;

  const TvDetail({
    required this.series,
    required this.genres,
    required this.cast,
    required this.crew,
  });
}
