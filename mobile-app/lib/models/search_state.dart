import 'search_result.dart';

enum ContentType { all, movie, tv }

enum SortBy { popularity, voteAverage, releaseDate, title }

enum SortOrder { desc, asc }

class SearchFilters {
  final ContentType contentType;
  final int? yearMin;
  final int? yearMax;
  final double? ratingMin;
  final double? ratingMax;
  final int? minVotes;
  final String? status;
  final String? language;
  final SortBy sortBy;
  final SortOrder sortOrder;

  const SearchFilters({
    this.contentType = ContentType.all,
    this.yearMin,
    this.yearMax,
    this.ratingMin,
    this.ratingMax,
    this.minVotes,
    this.status,
    this.language,
    this.sortBy = SortBy.popularity,
    this.sortOrder = SortOrder.desc,
  });

  SearchFilters copyWith({
    ContentType? contentType,
    int? Function()? yearMin,
    int? Function()? yearMax,
    double? Function()? ratingMin,
    double? Function()? ratingMax,
    int? Function()? minVotes,
    String? Function()? status,
    String? Function()? language,
    SortBy? sortBy,
    SortOrder? sortOrder,
  }) {
    return SearchFilters(
      contentType: contentType ?? this.contentType,
      yearMin: yearMin != null ? yearMin() : this.yearMin,
      yearMax: yearMax != null ? yearMax() : this.yearMax,
      ratingMin: ratingMin != null ? ratingMin() : this.ratingMin,
      ratingMax: ratingMax != null ? ratingMax() : this.ratingMax,
      minVotes: minVotes != null ? minVotes() : this.minVotes,
      status: status != null ? status() : this.status,
      language: language != null ? language() : this.language,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  bool get hasActiveFilters =>
      contentType != ContentType.all ||
      yearMin != null ||
      yearMax != null ||
      ratingMin != null ||
      ratingMax != null ||
      minVotes != null ||
      status != null ||
      language != null ||
      sortBy != SortBy.popularity ||
      sortOrder != SortOrder.desc;

  static const empty = SearchFilters();
}

class SearchState {
  final String query;
  final SearchFilters filters;
  final List<SearchResult> results;
  final int totalResults;
  final int currentPage;
  final bool isLoading;
  final String? error;

  const SearchState({
    this.query = '',
    this.filters = SearchFilters.empty,
    this.results = const [],
    this.totalResults = 0,
    this.currentPage = 1,
    this.isLoading = false,
    this.error,
  });

  SearchState copyWith({
    String? query,
    SearchFilters? filters,
    List<SearchResult>? results,
    int? totalResults,
    int? currentPage,
    bool? isLoading,
    String? Function()? error,
  }) {
    return SearchState(
      query: query ?? this.query,
      filters: filters ?? this.filters,
      results: results ?? this.results,
      totalResults: totalResults ?? this.totalResults,
      currentPage: currentPage ?? this.currentPage,
      isLoading: isLoading ?? this.isLoading,
      error: error != null ? error() : this.error,
    );
  }

  bool get hasSearchActive => query.isNotEmpty || filters.hasActiveFilters;
}
