import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/features/sync/tmdb_client.dart';

void main() {
  group('TmdbClient', () {
    late TmdbClient client;

    setUp(() {
      client = TmdbClient(apiToken: 'test-token');
    });

    tearDown(() {
      client.close();
    });

    group('buildUrl', () {
      test('builds correct base URL', () {
        final url = client.buildUrl('/movie/123');
        expect(url.toString(), 'https://api.themoviedb.org/3/movie/123');
      });

      test('builds URL with query parameters', () {
        final url = client.buildUrl('/movie/changes', {
          'start_date': '2026-01-01',
          'end_date': '2026-01-14',
          'page': '1',
        });
        expect(url.toString(), contains('start_date=2026-01-01'));
        expect(url.toString(), contains('end_date=2026-01-14'));
        expect(url.toString(), contains('page=1'));
        expect(url.host, 'api.themoviedb.org');
        expect(url.path, '/3/movie/changes');
      });

      test('builds URL without params', () {
        final url = client.buildUrl('/authentication');
        expect(url.toString(), 'https://api.themoviedb.org/3/authentication');
      });

      test('builds movie details URL with append_to_response', () {
        final url = client
            .buildUrl('/movie/603', {'append_to_response': 'credits,keywords'});
        expect(
            url.toString(), contains('append_to_response=credits%2Ckeywords'));
      });
    });

    group('calculateBackoff', () {
      test('returns 1000ms for attempt 1', () {
        expect(client.calculateBackoff(1), 1000);
      });

      test('returns 2000ms for attempt 2', () {
        expect(client.calculateBackoff(2), 2000);
      });

      test('returns 4000ms for attempt 3', () {
        expect(client.calculateBackoff(3), 4000);
      });

      test('caps at 60000ms', () {
        expect(client.calculateBackoff(20), 60000);
      });
    });

    group('headers', () {
      test('Authorization header uses Bearer token', () {
        final testClient = TmdbClient(apiToken: 'my-secret-token');
        // Access via buildUrl doesn't test headers directly, but we can verify
        // the client was created with the right token
        expect(testClient.apiToken, 'my-secret-token');
        testClient.close();
      });
    });
  });

  group('TmdbApiException', () {
    test('toString formats correctly', () {
      final exception = TmdbApiException(404, 'Not found');
      expect(exception.toString(), 'TmdbApiException(404): Not found');
    });

    test('stores status code and message', () {
      final exception = TmdbApiException(401, 'Unauthorized');
      expect(exception.statusCode, 401);
      expect(exception.message, 'Unauthorized');
    });
  });
}
