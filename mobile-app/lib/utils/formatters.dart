import 'package:intl/intl.dart';

String formatCurrency(int? amount) {
  if (amount == null || amount == 0) return '';
  final formatter = NumberFormat.currency(symbol: '\$', decimalDigits: 0);
  return formatter.format(amount);
}

String formatRuntime(int? minutes) {
  if (minutes == null || minutes == 0) return '';
  final h = minutes ~/ 60;
  final m = minutes % 60;
  if (h > 0 && m > 0) return '${h}h ${m}m';
  if (h > 0) return '${h}h';
  return '${m}m';
}

String formatYear(String? date) {
  if (date == null || date.length < 4) return '';
  return date.substring(0, 4);
}

String formatVoteCount(int? count) {
  if (count == null) return '';
  if (count >= 1000) {
    return '${(count / 1000).toStringAsFixed(1)}k votes';
  }
  return '$count votes';
}

String tmdbImageUrl(String? path, {String size = 'w342'}) {
  if (path == null || path.isEmpty) return '';
  return 'https://image.tmdb.org/t/p/$size$path';
}

String tmdbMovieUrl(int tmdbId) => 'https://www.themoviedb.org/movie/$tmdbId';
String tmdbTvUrl(int tmdbId) => 'https://www.themoviedb.org/tv/$tmdbId';
String imdbMovieUrl(String imdbId) => 'https://www.imdb.com/title/$imdbId';

String languageName(String? code) {
  const map = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'hi': 'Hindi',
    'ar': 'Arabic',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'nl': 'Dutch',
    'pl': 'Polish',
    'tr': 'Turkish',
    'th': 'Thai',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'fi': 'Finnish',
    'el': 'Greek',
    'he': 'Hebrew',
    'id': 'Indonesian',
    'ms': 'Malay',
    'vi': 'Vietnamese',
    'uk': 'Ukrainian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'sr': 'Serbian',
    'ca': 'Catalan',
    'eu': 'Basque',
    'gl': 'Galician',
    'tl': 'Tagalog',
    'cn': 'Cantonese',
  };
  if (code == null) return 'Unknown';
  return map[code] ?? code.toUpperCase();
}
