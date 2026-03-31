import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/utils/formatters.dart';

void main() {
  group('formatCurrency', () {
    test('formats large numbers', () {
      expect(formatCurrency(200000000), '\$200,000,000');
    });

    test('returns empty for null', () {
      expect(formatCurrency(null), '');
    });

    test('returns empty for zero', () {
      expect(formatCurrency(0), '');
    });
  });

  group('formatRuntime', () {
    test('formats hours and minutes', () {
      expect(formatRuntime(136), '2h 16m');
    });

    test('formats hours only', () {
      expect(formatRuntime(120), '2h');
    });

    test('formats minutes only', () {
      expect(formatRuntime(45), '45m');
    });

    test('returns empty for null', () {
      expect(formatRuntime(null), '');
    });

    test('returns empty for zero', () {
      expect(formatRuntime(0), '');
    });
  });

  group('formatYear', () {
    test('extracts year from date', () {
      expect(formatYear('1999-03-31'), '1999');
    });

    test('returns empty for null', () {
      expect(formatYear(null), '');
    });

    test('returns empty for short string', () {
      expect(formatYear('99'), '');
    });
  });

  group('formatVoteCount', () {
    test('formats thousands with k', () {
      expect(formatVoteCount(24000), '24.0k votes');
    });

    test('formats small numbers', () {
      expect(formatVoteCount(500), '500 votes');
    });

    test('returns empty for null', () {
      expect(formatVoteCount(null), '');
    });
  });

  group('tmdbImageUrl', () {
    test('constructs URL with path and size', () {
      expect(
        tmdbImageUrl('/abc.jpg', size: 'w342'),
        'https://image.tmdb.org/t/p/w342/abc.jpg',
      );
    });

    test('returns empty for null path', () {
      expect(tmdbImageUrl(null), '');
    });

    test('returns empty for empty path', () {
      expect(tmdbImageUrl(''), '');
    });
  });

  group('URL helpers', () {
    test('tmdbMovieUrl constructs correct URL', () {
      expect(tmdbMovieUrl(603), 'https://www.themoviedb.org/movie/603');
    });

    test('tmdbTvUrl constructs correct URL', () {
      expect(tmdbTvUrl(1399), 'https://www.themoviedb.org/tv/1399');
    });

    test('imdbMovieUrl constructs correct URL', () {
      expect(imdbMovieUrl('tt0133093'), 'https://www.imdb.com/title/tt0133093');
    });
  });

  group('languageName', () {
    test('maps known codes', () {
      expect(languageName('en'), 'English');
      expect(languageName('ja'), 'Japanese');
      expect(languageName('ko'), 'Korean');
    });

    test('returns uppercase for unknown codes', () {
      expect(languageName('xx'), 'XX');
    });

    test('returns Unknown for null', () {
      expect(languageName(null), 'Unknown');
    });
  });
}
