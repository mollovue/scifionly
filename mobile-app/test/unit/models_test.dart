import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/models/movie.dart';
import 'package:scifionly/models/tv_series.dart';
import 'package:scifionly/models/person.dart';
import 'package:scifionly/models/genre.dart';
import 'package:scifionly/models/cast_member.dart';
import 'package:scifionly/models/crew_member.dart';
import 'package:scifionly/models/keyword.dart';
import 'package:scifionly/models/production_company.dart';
import 'package:scifionly/models/search_result.dart';
import 'package:scifionly/models/person_detail.dart';

void main() {
  group('Movie', () {
    test('fromMap creates Movie correctly', () {
      final map = {
        'id': 1,
        'tmdb_id': 603,
        'title': 'The Matrix',
        'original_title': 'The Matrix',
        'overview': 'A hacker discovers reality is a simulation.',
        'poster_path': '/poster.jpg',
        'backdrop_path': '/backdrop.jpg',
        'release_date': '1999-03-31',
        'status': 'Released',
        'runtime': 136,
        'vote_average': 8.2,
        'vote_count': 24000,
        'popularity': 80.0,
        'budget': 63000000,
        'revenue': 463517383,
        'original_language': 'en',
        'spoken_languages': '["en"]',
        'tagline': 'Welcome to the Real World.',
        'homepage': null,
        'imdb_id': 'tt0133093',
      };

      final movie = Movie.fromMap(map);
      expect(movie.id, 1);
      expect(movie.tmdbId, 603);
      expect(movie.title, 'The Matrix');
      expect(movie.voteAverage, 8.2);
      expect(movie.runtime, 136);
      expect(movie.year, '1999');
    });

    test('year returns null for missing release date', () {
      const movie = Movie(id: 1, tmdbId: 1, title: 'Test');
      expect(movie.year, null);
    });

    test('year returns null for short release date', () {
      const movie = Movie(id: 1, tmdbId: 1, title: 'Test', releaseDate: '99');
      expect(movie.year, null);
    });
  });

  group('TvSeries', () {
    test('fromMap creates TvSeries correctly', () {
      final map = {
        'id': 1,
        'tmdb_id': 1399,
        'name': 'The Expanse',
        'original_name': 'The Expanse',
        'overview': 'Space drama.',
        'poster_path': null,
        'backdrop_path': null,
        'first_air_date': '2015-12-14',
        'last_air_date': '2022-01-14',
        'status': 'Ended',
        'number_of_seasons': 6,
        'number_of_episodes': 62,
        'episode_run_time': '[45]',
        'vote_average': 8.4,
        'vote_count': 2500,
        'popularity': 60.0,
        'original_language': 'en',
        'spoken_languages': null,
        'tagline': null,
        'homepage': null,
        'networks': '["Amazon"]',
      };

      final tv = TvSeries.fromMap(map);
      expect(tv.name, 'The Expanse');
      expect(tv.numberOfSeasons, 6);
      expect(tv.year, '2015');
      expect(tv.status, 'Ended');
    });

    test('year handles null first_air_date', () {
      const tv = TvSeries(id: 1, tmdbId: 1, name: 'Test');
      expect(tv.year, null);
    });
  });

  group('Person', () {
    test('fromMap creates Person correctly', () {
      final map = {
        'id': 1,
        'tmdb_id': 1103,
        'name': 'Keanu Reeves',
        'profile_path': '/profile.jpg',
        'known_for_department': 'Acting',
      };

      final person = Person.fromMap(map);
      expect(person.name, 'Keanu Reeves');
      expect(person.knownForDepartment, 'Acting');
    });
  });

  group('Genre', () {
    test('fromMap creates Genre correctly', () {
      final genre = Genre.fromMap({'id': 878, 'name': 'Science Fiction'});
      expect(genre.id, 878);
      expect(genre.name, 'Science Fiction');
    });
  });

  group('CastMember', () {
    test('fromMap creates CastMember correctly', () {
      final cast = CastMember.fromMap({
        'person_id': 1,
        'name': 'Keanu Reeves',
        'profile_path': '/p.jpg',
        'character': 'Neo',
        'display_order': 0,
      });
      expect(cast.name, 'Keanu Reeves');
      expect(cast.character, 'Neo');
    });
  });

  group('CrewMember', () {
    test('fromMap creates CrewMember correctly', () {
      final crew = CrewMember.fromMap({
        'person_id': 2,
        'name': 'Lana Wachowski',
        'profile_path': null,
        'job': 'Director',
        'department': 'Directing',
      });
      expect(crew.job, 'Director');
    });
  });

  group('Keyword', () {
    test('fromMap creates Keyword', () {
      final kw = Keyword.fromMap({'id': 310, 'name': 'ai'});
      expect(kw.name, 'ai');
    });
  });

  group('ProductionCompany', () {
    test('fromMap creates ProductionCompany', () {
      final pc = ProductionCompany.fromMap({
        'id': 79,
        'name': 'Village Roadshow',
        'logo_path': '/logo.png',
        'origin_country': 'US',
      });
      expect(pc.name, 'Village Roadshow');
      expect(pc.originCountry, 'US');
    });
  });

  group('SearchResult', () {
    test('fromMovieMap creates movie SearchResult', () {
      final result = SearchResult.fromMovieMap({
        'id': 1,
        'tmdb_id': 603,
        'title': 'The Matrix',
        'original_title': 'The Matrix',
        'overview': 'Hacker movie',
        'poster_path': '/p.jpg',
        'backdrop_path': null,
        'release_date': '1999-03-31',
        'status': 'Released',
        'vote_average': 8.2,
        'vote_count': 24000,
        'popularity': 80.0,
        'original_language': 'en',
      });
      expect(result.type, 'movie');
      expect(result.title, 'The Matrix');
      expect(result.year, '1999');
    });

    test('fromTvMap creates tv SearchResult', () {
      final result = SearchResult.fromTvMap({
        'id': 1,
        'tmdb_id': 1399,
        'name': 'The Expanse',
        'original_name': 'The Expanse',
        'overview': 'Space',
        'poster_path': null,
        'backdrop_path': null,
        'first_air_date': '2015-12-14',
        'status': 'Ended',
        'vote_average': 8.4,
        'vote_count': 2500,
        'popularity': 60.0,
        'original_language': 'en',
      });
      expect(result.type, 'tv');
      expect(result.title, 'The Expanse');
      expect(result.year, '2015');
    });
  });

  group('Credit', () {
    test('year extracts from release date', () {
      const credit = Credit(
        contentId: 1,
        tmdbId: 603,
        title: 'The Matrix',
        releaseDate: '1999-03-31',
        character: 'Neo',
        role: 'cast',
        mediaType: 'movie',
      );
      expect(credit.year, '1999');
    });

    test('year returns null for null date', () {
      const credit = Credit(
        contentId: 1,
        tmdbId: 1,
        title: 'Test',
        role: 'cast',
        mediaType: 'movie',
      );
      expect(credit.year, null);
    });
  });
}
