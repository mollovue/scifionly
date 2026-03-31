import 'movie.dart';
import 'genre.dart';
import 'cast_member.dart';
import 'crew_member.dart';
import 'keyword.dart';
import 'production_company.dart';

class MovieDetail {
  final Movie movie;
  final List<Genre> genres;
  final List<CastMember> cast;
  final List<CrewMember> crew;
  final List<Keyword> keywords;
  final List<ProductionCompany> productionCompanies;

  const MovieDetail({
    required this.movie,
    required this.genres,
    required this.cast,
    required this.crew,
    required this.keywords,
    required this.productionCompanies,
  });
}
