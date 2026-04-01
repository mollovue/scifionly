import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart' as http_testing;
import 'package:scifionly/features/sync/tmdb_client.dart';

void main() {
  group('TmdbClient.fetch', () {
    test('sends correct headers', () async {
      late Uri capturedUrl;
      late Map<String, String> capturedHeaders;

      final mockClient = http_testing.MockClient((request) async {
        capturedUrl = request.url;
        capturedHeaders = request.headers;
        return http.Response('{"success": true}', 200);
      });

      final client = TmdbClient(apiToken: 'test-token-123', httpClient: mockClient);
      await client.fetch('/authentication');

      expect(capturedHeaders['Authorization'], 'Bearer test-token-123');
      expect(capturedHeaders['Accept'], 'application/json');
      expect(capturedUrl.toString(), contains('/authentication'));
      client.close();
    });

    test('returns parsed JSON on success', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('{"id": 42, "title": "Test"}', 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.fetch('/movie/42');

      expect(result['id'], 42);
      expect(result['title'], 'Test');
      client.close();
    });

    test('throws TmdbApiException on 401', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('{"status_message": "Invalid API key"}', 401);
      });

      final client = TmdbClient(apiToken: 'bad-token', httpClient: mockClient);
      expect(
        () => client.fetch('/authentication'),
        throwsA(isA<TmdbApiException>().having((e) => e.statusCode, 'statusCode', 401)),
      );
      client.close();
    });

    test('throws TmdbApiException on 404', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('{"status_message": "Not found"}', 404);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      expect(
        () => client.fetch('/movie/999999'),
        throwsA(isA<TmdbApiException>().having((e) => e.statusCode, 'statusCode', 404)),
      );
      client.close();
    });

    test('throws TmdbApiException on unknown status code', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('{"error": "bad request"}', 400);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      expect(
        () => client.fetch('/bad'),
        throwsA(isA<TmdbApiException>().having((e) => e.statusCode, 'statusCode', 400)),
      );
      client.close();
    });

    test('retries on 429 with retry-after header', () async {
      int attempt = 0;
      final mockClient = http_testing.MockClient((request) async {
        attempt++;
        if (attempt == 1) {
          return http.Response('{}', 429, headers: {'retry-after': '1'});
        }
        return http.Response('{"ok": true}', 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.fetch('/rate-limited');
      expect(result['ok'], true);
      expect(attempt, 2);
      client.close();
    });

    test('retries on 429 without retry-after header', () async {
      int attempt = 0;
      final mockClient = http_testing.MockClient((request) async {
        attempt++;
        if (attempt == 1) {
          return http.Response('{}', 429);
        }
        return http.Response('{"ok": true}', 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.fetch('/rate-limited');
      expect(result['ok'], true);
      client.close();
    });

    test('throws after max retries on 429', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('{}', 429);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      expect(
        () => client.fetch('/always-rate-limited'),
        throwsA(isA<TmdbApiException>().having((e) => e.statusCode, 'statusCode', 429)),
      );
      client.close();
    });

    test('retries on 500 server error', () async {
      int attempt = 0;
      final mockClient = http_testing.MockClient((request) async {
        attempt++;
        if (attempt == 1) {
          return http.Response('Server Error', 500);
        }
        return http.Response('{"ok": true}', 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.fetch('/server-error');
      expect(result['ok'], true);
      client.close();
    });

    test('throws after max retries on 500', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('Server Error', 503);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      expect(
        () => client.fetch('/always-failing'),
        throwsA(isA<TmdbApiException>().having((e) => e.statusCode, 'statusCode', 503)),
      );
      client.close();
    });

    test('retries on network exception', () async {
      int attempt = 0;
      final mockClient = http_testing.MockClient((request) async {
        attempt++;
        if (attempt <= 1) {
          throw Exception('Connection refused');
        }
        return http.Response('{"ok": true}', 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.fetch('/flaky');
      expect(result['ok'], true);
      client.close();
    });

    test('rethrows after max retries on network exception', () async {
      final mockClient = http_testing.MockClient((request) async {
        throw Exception('Connection refused');
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      expect(() => client.fetch('/down'), throwsA(isA<Exception>()));
      client.close();
    });
  });

  group('TmdbClient.validateToken', () {
    test('returns true for valid token', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('{"success": true}', 200);
      });

      final client = TmdbClient(apiToken: 'valid', httpClient: mockClient);
      expect(await client.validateToken(), true);
      client.close();
    });

    test('returns false for invalid token', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('{"status_message": "Invalid"}', 401);
      });

      final client = TmdbClient(apiToken: 'invalid', httpClient: mockClient);
      expect(await client.validateToken(), false);
      client.close();
    });

    test('rethrows non-401 exceptions', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response('Server Error', 503);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      expect(() => client.validateToken(), throwsA(isA<TmdbApiException>()));
      client.close();
    });
  });

  group('TmdbClient convenience methods', () {
    test('getMovieDetails calls correct endpoint', () async {
      final mockClient = http_testing.MockClient((request) async {
        expect(request.url.path, '/3/movie/603');
        expect(request.url.queryParameters['append_to_response'], 'credits,keywords');
        return http.Response(json.encode({
          'id': 603,
          'title': 'The Matrix',
          'genres': [{'id': 878, 'name': 'Sci-Fi'}],
        }), 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.getMovieDetails(603);
      expect(result['id'], 603);
      client.close();
    });

    test('getTvDetails calls correct endpoint', () async {
      final mockClient = http_testing.MockClient((request) async {
        expect(request.url.path, '/3/tv/1399');
        expect(request.url.queryParameters['append_to_response'], 'credits,keywords');
        return http.Response(json.encode({
          'id': 1399,
          'name': 'The Expanse',
        }), 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.getTvDetails(1399);
      expect(result['id'], 1399);
      client.close();
    });

    test('getMovieChanges calls correct endpoint with params', () async {
      final mockClient = http_testing.MockClient((request) async {
        expect(request.url.path, '/3/movie/changes');
        expect(request.url.queryParameters['start_date'], '2024-01-01');
        expect(request.url.queryParameters['end_date'], '2024-01-14');
        expect(request.url.queryParameters['page'], '1');
        return http.Response(json.encode({
          'results': [{'id': 1}],
          'total_pages': 1,
        }), 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.getMovieChanges('2024-01-01', '2024-01-14', 1);
      expect(result['total_pages'], 1);
      client.close();
    });

    test('getTvChanges calls correct endpoint with params', () async {
      final mockClient = http_testing.MockClient((request) async {
        expect(request.url.path, '/3/tv/changes');
        return http.Response(json.encode({
          'results': [{'id': 2}],
          'total_pages': 1,
        }), 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final result = await client.getTvChanges('2024-01-01', '2024-01-14', 1);
      expect(result['total_pages'], 1);
      client.close();
    });
  });

  group('TmdbClient.getAllChangedIds', () {
    test('collects IDs from single page', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response(json.encode({
          'results': [{'id': 1}, {'id': 2}, {'id': 3}],
          'total_pages': 1,
        }), 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final ids = await client.getAllChangedIds(
        (page) => client.getMovieChanges('2024-01-01', '2024-01-14', page),
      );
      expect(ids, [1, 2, 3]);
      client.close();
    });

    test('collects IDs from multiple pages', () async {
      final mockClient = http_testing.MockClient((request) async {
        final page = request.url.queryParameters['page'];
        if (page == '1') {
          return http.Response(json.encode({
            'results': [{'id': 1}, {'id': 2}],
            'total_pages': 2,
          }), 200);
        } else {
          return http.Response(json.encode({
            'results': [{'id': 3}, {'id': 4}],
            'total_pages': 2,
          }), 200);
        }
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final ids = await client.getAllChangedIds(
        (page) => client.getMovieChanges('2024-01-01', '2024-01-14', page),
      );
      expect(ids, [1, 2, 3, 4]);
      client.close();
    });

    test('handles empty results', () async {
      final mockClient = http_testing.MockClient((request) async {
        return http.Response(json.encode({
          'results': [],
          'total_pages': 1,
        }), 200);
      });

      final client = TmdbClient(apiToken: 'token', httpClient: mockClient);
      final ids = await client.getAllChangedIds(
        (page) => client.getMovieChanges('2024-01-01', '2024-01-14', page),
      );
      expect(ids, isEmpty);
      client.close();
    });
  });
}
