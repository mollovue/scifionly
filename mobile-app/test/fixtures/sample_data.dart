import 'package:scifionly/models/movie.dart';
import 'package:scifionly/models/tv_series.dart';
import 'package:scifionly/models/person.dart';
import 'package:scifionly/models/genre.dart';
import 'package:scifionly/models/cast_member.dart';
import 'package:scifionly/models/crew_member.dart';
import 'package:scifionly/models/keyword.dart';
import 'package:scifionly/models/production_company.dart';
import 'package:scifionly/models/search_result.dart';
import 'package:scifionly/models/movie_detail.dart';
import 'package:scifionly/models/tv_detail.dart';
import 'package:scifionly/models/person_detail.dart';

const sampleMovie = Movie(
  id: 1,
  tmdbId: 603,
  title: 'The Matrix',
  originalTitle: 'The Matrix',
  overview:
      'A computer hacker learns from mysterious rebels about the true nature of his reality.',
  posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  backdropPath: '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
  releaseDate: '1999-03-31',
  status: 'Released',
  runtime: 136,
  voteAverage: 8.2,
  voteCount: 24000,
  popularity: 80.0,
  budget: 63000000,
  revenue: 463517383,
  originalLanguage: 'en',
  tagline: 'Welcome to the Real World.',
  imdbId: 'tt0133093',
);

const sampleTvSeries = TvSeries(
  id: 1,
  tmdbId: 1399,
  name: 'The Expanse',
  originalName: 'The Expanse',
  overview:
      'A police detective in the asteroid belt discovers a vast conspiracy.',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  firstAirDate: '2015-12-14',
  lastAirDate: '2022-01-14',
  status: 'Ended',
  numberOfSeasons: 6,
  numberOfEpisodes: 62,
  voteAverage: 8.4,
  voteCount: 2500,
  popularity: 60.0,
  originalLanguage: 'en',
  networks: '["Amazon Prime Video"]',
);

const samplePerson = Person(
  id: 1,
  tmdbId: 1103,
  name: 'Keanu Reeves',
  profilePath: '/profile.jpg',
  knownForDepartment: 'Acting',
);

const sampleGenre = Genre(id: 878, name: 'Science Fiction');
const sampleGenre2 = Genre(id: 28, name: 'Action');

const sampleCastMember = CastMember(
  personId: 1,
  name: 'Keanu Reeves',
  profilePath: '/profile.jpg',
  character: 'Neo',
  displayOrder: 0,
);

const sampleCrewMember = CrewMember(
  personId: 2,
  name: 'Lana Wachowski',
  profilePath: null,
  job: 'Director',
  department: 'Directing',
);

const sampleKeyword = Keyword(id: 310, name: 'artificial intelligence');

const sampleCompany = ProductionCompany(
  id: 79,
  name: 'Village Roadshow Pictures',
  logoPath: '/logo.png',
  originCountry: 'US',
);

const sampleMovieDetail = MovieDetail(
  movie: sampleMovie,
  genres: [sampleGenre, sampleGenre2],
  cast: [sampleCastMember],
  crew: [sampleCrewMember],
  keywords: [sampleKeyword],
  productionCompanies: [sampleCompany],
);

const sampleTvDetail = TvDetail(
  series: sampleTvSeries,
  genres: [sampleGenre],
  cast: [sampleCastMember],
  crew: [sampleCrewMember],
);

const sampleSearchResult = SearchResult(
  id: 1,
  tmdbId: 603,
  type: 'movie',
  title: 'The Matrix',
  originalTitle: 'The Matrix',
  overview: 'A computer hacker learns about reality.',
  posterPath: '/poster.jpg',
  releaseDate: '1999-03-31',
  voteAverage: 8.2,
  voteCount: 24000,
  popularity: 80.0,
);

const sampleTvSearchResult = SearchResult(
  id: 1,
  tmdbId: 1399,
  type: 'tv',
  title: 'The Expanse',
  releaseDate: '2015-12-14',
  voteAverage: 8.4,
  voteCount: 2500,
  popularity: 60.0,
);

const samplePersonDetail = PersonDetail(
  person: samplePerson,
  movieCredits: [
    Credit(
      contentId: 1,
      tmdbId: 603,
      title: 'The Matrix',
      posterPath: '/poster.jpg',
      releaseDate: '1999-03-31',
      character: 'Neo',
      role: 'cast',
      mediaType: 'movie',
    ),
  ],
  tvCredits: [],
);
