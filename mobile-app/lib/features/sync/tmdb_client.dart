import 'dart:convert';
import 'package:http/http.dart' as http;

const String _tmdbBaseUrl = 'https://api.themoviedb.org/3';
const int _rateLimitMs = 350;
const int _maxRetries = 3;
const int _requestTimeoutMs = 30000;

class TmdbApiException implements Exception {
  final int statusCode;
  final String message;
  TmdbApiException(this.statusCode, this.message);
  @override
  String toString() => 'TmdbApiException($statusCode): $message';
}

class TmdbClient {
  final String apiToken;
  final http.Client _httpClient;
  DateTime _lastRequestAt = DateTime.fromMillisecondsSinceEpoch(0);

  TmdbClient({required this.apiToken, http.Client? httpClient})
      : _httpClient = httpClient ?? http.Client();

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $apiToken',
        'Accept': 'application/json',
      };

  Future<void> _rateLimit() async {
    final now = DateTime.now();
    final elapsed = now.difference(_lastRequestAt).inMilliseconds;
    if (elapsed < _rateLimitMs) {
      await Future.delayed(Duration(milliseconds: _rateLimitMs - elapsed));
    }
    _lastRequestAt = DateTime.now();
  }

  int calculateBackoff(int attempt) {
    final ms = 1000 * (1 << (attempt - 1)); // 1s, 2s, 4s...
    return ms > 60000 ? 60000 : ms;
  }

  Uri buildUrl(String endpoint, [Map<String, String>? params]) {
    final uri = Uri.parse('$_tmdbBaseUrl$endpoint');
    if (params != null && params.isNotEmpty) {
      return uri.replace(queryParameters: {...uri.queryParameters, ...params});
    }
    return uri;
  }

  Future<dynamic> fetch(String endpoint, [Map<String, String>? params]) async {
    final url = buildUrl(endpoint, params);
    int attempt = 0;

    while (attempt <= _maxRetries) {
      await _rateLimit();

      http.Response response;
      try {
        response = await _httpClient
            .get(url, headers: _headers)
            .timeout(const Duration(milliseconds: _requestTimeoutMs));
      } catch (e) {
        attempt++;
        if (attempt > _maxRetries) rethrow;
        await Future.delayed(Duration(milliseconds: calculateBackoff(attempt)));
        continue;
      }

      if (response.statusCode == 429) {
        attempt++;
        if (attempt > _maxRetries) {
          throw TmdbApiException(429, 'Rate limited after $attempt attempts');
        }
        final retryAfter = response.headers['retry-after'];
        final waitMs = retryAfter != null
            ? int.parse(retryAfter) * 1000
            : calculateBackoff(attempt);
        await Future.delayed(Duration(milliseconds: waitMs));
        continue;
      }

      if (response.statusCode >= 500) {
        attempt++;
        if (attempt > _maxRetries) {
          throw TmdbApiException(
              response.statusCode, 'Server error after $attempt attempts');
        }
        await Future.delayed(Duration(milliseconds: calculateBackoff(attempt)));
        continue;
      }

      if (response.statusCode == 401) {
        throw TmdbApiException(401, 'API token is invalid or expired');
      }

      if (response.statusCode == 404) {
        throw TmdbApiException(404, 'Not found: $endpoint');
      }

      if (response.statusCode != 200) {
        throw TmdbApiException(
            response.statusCode, 'HTTP ${response.statusCode} on $endpoint');
      }

      return json.decode(response.body);
    }

    throw TmdbApiException(0, 'Exhausted retries for $endpoint');
  }

  Future<bool> validateToken() async {
    try {
      await fetch('/authentication');
      return true;
    } on TmdbApiException catch (e) {
      if (e.statusCode == 401) return false;
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getMovieDetails(int id) async {
    return await fetch('/movie/$id', {'append_to_response': 'credits,keywords'})
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getTvDetails(int id) async {
    return await fetch('/tv/$id', {'append_to_response': 'credits,keywords'})
        as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getMovieChanges(
      String startDate, String endDate, int page) async {
    return await fetch('/movie/changes', {
      'start_date': startDate,
      'end_date': endDate,
      'page': page.toString(),
    }) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getTvChanges(
      String startDate, String endDate, int page) async {
    return await fetch('/tv/changes', {
      'start_date': startDate,
      'end_date': endDate,
      'page': page.toString(),
    }) as Map<String, dynamic>;
  }

  Future<List<int>> getAllChangedIds(
    Future<Map<String, dynamic>> Function(int page) fetchPage,
  ) async {
    final firstPage = await fetchPage(1);
    final totalPages = (firstPage['total_pages'] as int?) ?? 1;
    final results = <int>[];

    for (final item in (firstPage['results'] as List<dynamic>? ?? [])) {
      results.add((item as Map<String, dynamic>)['id'] as int);
    }

    for (int page = 2; page <= totalPages; page++) {
      final data = await fetchPage(page);
      for (final item in (data['results'] as List<dynamic>? ?? [])) {
        results.add((item as Map<String, dynamic>)['id'] as int);
      }
    }

    return results;
  }

  void close() {
    _httpClient.close();
  }
}
