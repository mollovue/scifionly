import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/models/search_state.dart';

void main() {
  group('SearchFilters', () {
    test('empty filters have no active filters', () {
      const filters = SearchFilters.empty;
      expect(filters.hasActiveFilters, false);
    });

    test('contentType change makes filters active', () {
      const filters = SearchFilters(contentType: ContentType.movie);
      expect(filters.hasActiveFilters, true);
    });

    test('yearMin makes filters active', () {
      const filters = SearchFilters(yearMin: 2000);
      expect(filters.hasActiveFilters, true);
    });

    test('ratingMin makes filters active', () {
      const filters = SearchFilters(ratingMin: 7.0);
      expect(filters.hasActiveFilters, true);
    });

    test('status makes filters active', () {
      const filters = SearchFilters(status: 'Released');
      expect(filters.hasActiveFilters, true);
    });

    test('sortBy change makes filters active', () {
      const filters = SearchFilters(sortBy: SortBy.voteAverage);
      expect(filters.hasActiveFilters, true);
    });

    test('copyWith preserves values', () {
      const original = SearchFilters(
        contentType: ContentType.movie,
        yearMin: 2000,
        yearMax: 2024,
      );
      final copied = original.copyWith(yearMin: () => 2010);
      expect(copied.contentType, ContentType.movie);
      expect(copied.yearMin, 2010);
      expect(copied.yearMax, 2024);
    });

    test('copyWith can set nullable to null', () {
      const original = SearchFilters(yearMin: 2000);
      final copied = original.copyWith(yearMin: () => null);
      expect(copied.yearMin, null);
    });
  });

  group('SearchState', () {
    test('initial state has no active search', () {
      const state = SearchState();
      expect(state.hasSearchActive, false);
    });

    test('query makes search active', () {
      const state = SearchState(query: 'matrix');
      expect(state.hasSearchActive, true);
    });

    test('filters make search active', () {
      const state = SearchState(
        filters: SearchFilters(contentType: ContentType.movie),
      );
      expect(state.hasSearchActive, true);
    });

    test('copyWith works correctly', () {
      const state = SearchState(query: 'test', totalResults: 10);
      final updated = state.copyWith(query: 'new', totalResults: 20);
      expect(updated.query, 'new');
      expect(updated.totalResults, 20);
    });
  });
}
