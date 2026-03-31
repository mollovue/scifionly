import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/search_state.dart';
import '../../providers/providers.dart';
import '../../ui/theme/scifi_colors.dart';
import '../components/content_card.dart';
import '../components/browse_row.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _debounce;
  bool _showFilters = false;
  bool _showScrollToTop = false;

  // Filter controllers
  final _yearMinController = TextEditingController();
  final _yearMaxController = TextEditingController();
  final _minVotesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _yearMinController.dispose();
    _yearMaxController.dispose();
    _minVotesController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onScroll() {
    final show = _scrollController.offset > 300;
    if (show != _showScrollToTop) {
      setState(() => _showScrollToTop = show);
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      ref.read(searchProvider.notifier).setQuery(value);
    });
  }

  void _navigateToDetail(dynamic item) {
    if (item.type == 'movie') {
      context.push('/movie/${item.id}');
    } else {
      context.push('/tv/${item.id}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    final searchState = ref.watch(searchProvider);
    final stats = ref.watch(statsProvider);
    final dbState = ref.watch(databaseProvider);

    return Scaffold(
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: CustomScrollView(
          controller: _scrollController,
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          slivers: [
            // Hero
            SliverToBoxAdapter(child: _buildHero(colors, stats)),
            // Search bar
            SliverToBoxAdapter(child: _buildSearchBar(colors)),
            // Filter toggle + chips
            SliverToBoxAdapter(child: _buildFilterSection(colors, searchState)),
            // Content
            if (dbState.value == null)
              SliverFillRemaining(child: _buildNoDatabaseState(colors))
            else if (!searchState.hasSearchActive)
              SliverToBoxAdapter(child: _buildTrendingSection())
            else ...[
              // Results count
              SliverToBoxAdapter(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Text(
                    '${searchState.totalResults} results',
                    style: TextStyle(color: colors.textMuted, fontSize: 13),
                  ),
                ),
              ),
              // Results grid
              _buildResultsGrid(searchState, colors),
              // Load more
              if (searchState.results.length < searchState.totalResults)
                SliverToBoxAdapter(child: _buildLoadMore(searchState, colors)),
              // No results
              if (!searchState.isLoading &&
                  searchState.results.isEmpty &&
                  searchState.hasSearchActive)
                SliverFillRemaining(child: _buildNoResults(colors)),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
      floatingActionButton: _showScrollToTop
          ? FloatingActionButton.small(
              onPressed: () => _scrollController.animateTo(0,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut),
              child: const Icon(Icons.arrow_upward),
            )
          : null,
    );
  }

  Widget _buildHero(SciFiColors colors, AsyncValue<Map<String, int>> stats) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        bottom: 16,
        left: 16,
        right: 16,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [colors.surface, colors.background],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SciFi Only',
            style: TextStyle(
              color: colors.primaryCyan,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Explore the Sci-Fi Universe',
            style: TextStyle(color: colors.textMuted, fontSize: 16),
          ),
          const SizedBox(height: 12),
          stats.when(
            data: (data) => Row(
              children: [
                _statChip(colors, '${data['movies']} Movies'),
                const SizedBox(width: 8),
                _statChip(colors, '${data['tvSeries']} TV Series'),
              ],
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _statChip(SciFiColors colors, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.primaryCyan.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.primaryCyan.withOpacity(0.3)),
      ),
      child: Text(label,
          style: TextStyle(
              color: colors.primaryCyan,
              fontSize: 12,
              fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildSearchBar(SciFiColors colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Search movies, TV shows, cast, crew...',
          prefixIcon: Icon(Icons.search, color: colors.textMuted),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.clear, color: colors.textMuted),
                  onPressed: () {
                    _searchController.clear();
                    ref.read(searchProvider.notifier).setQuery('');
                  },
                )
              : null,
        ),
      ),
    );
  }

  Widget _buildFilterSection(SciFiColors colors, SearchState searchState) {
    return Column(
      children: [
        // Active filter chips
        if (searchState.filters.hasActiveFilters)
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                ..._buildFilterChips(colors, searchState.filters),
                ActionChip(
                  label: Text('Clear all',
                      style:
                          TextStyle(color: colors.primaryCyan, fontSize: 12)),
                  onPressed: () =>
                      ref.read(searchProvider.notifier).clearFilters(),
                ),
              ],
            ),
          ),
        // Toggle
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextButton.icon(
            onPressed: () => setState(() => _showFilters = !_showFilters),
            icon: Icon(
              _showFilters ? Icons.expand_less : Icons.expand_more,
              color: colors.primaryCyan,
            ),
            label: Text('Advanced Filters',
                style: TextStyle(color: colors.primaryCyan)),
          ),
        ),
        if (_showFilters) _buildFiltersPanel(colors, searchState.filters),
      ],
    );
  }

  List<Widget> _buildFilterChips(SciFiColors colors, SearchFilters filters) {
    final chips = <Widget>[];
    if (filters.contentType != ContentType.all) {
      chips.add(Padding(
        padding: const EdgeInsets.only(right: 6),
        child: Chip(
          label: Text(
              filters.contentType == ContentType.movie ? 'Movies' : 'TV',
              style: const TextStyle(fontSize: 11)),
          onDeleted: () {
            ref
                .read(searchProvider.notifier)
                .setFilters(filters.copyWith(contentType: ContentType.all));
          },
        ),
      ));
    }
    if (filters.yearMin != null || filters.yearMax != null) {
      final label =
          'Year: ${filters.yearMin ?? '...'}-${filters.yearMax ?? '...'}';
      chips.add(Padding(
        padding: const EdgeInsets.only(right: 6),
        child: Chip(
          label: Text(label, style: const TextStyle(fontSize: 11)),
          onDeleted: () {
            ref.read(searchProvider.notifier).setFilters(
                filters.copyWith(yearMin: () => null, yearMax: () => null));
          },
        ),
      ));
    }
    if (filters.ratingMin != null || filters.ratingMax != null) {
      final label =
          'Rating: ${filters.ratingMin?.toStringAsFixed(1) ?? '0'}-${filters.ratingMax?.toStringAsFixed(1) ?? '10'}';
      chips.add(Padding(
        padding: const EdgeInsets.only(right: 6),
        child: Chip(
          label: Text(label, style: const TextStyle(fontSize: 11)),
          onDeleted: () {
            ref.read(searchProvider.notifier).setFilters(
                filters.copyWith(ratingMin: () => null, ratingMax: () => null));
          },
        ),
      ));
    }
    if (filters.status != null) {
      chips.add(Padding(
        padding: const EdgeInsets.only(right: 6),
        child: Chip(
          label: Text(filters.status!, style: const TextStyle(fontSize: 11)),
          onDeleted: () {
            ref
                .read(searchProvider.notifier)
                .setFilters(filters.copyWith(status: () => null));
          },
        ),
      ));
    }
    return chips;
  }

  Widget _buildFiltersPanel(SciFiColors colors, SearchFilters filters) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Content Type
              Text('Content Type',
                  style: TextStyle(
                      color: colors.textMuted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              SegmentedButton<ContentType>(
                segments: const [
                  ButtonSegment(value: ContentType.all, label: Text('All')),
                  ButtonSegment(
                      value: ContentType.movie, label: Text('Movies')),
                  ButtonSegment(value: ContentType.tv, label: Text('TV')),
                ],
                selected: {filters.contentType},
                onSelectionChanged: (v) {
                  ref
                      .read(searchProvider.notifier)
                      .setFilters(filters.copyWith(contentType: v.first));
                },
              ),
              const SizedBox(height: 16),
              // Year range
              Text('Year Range',
                  style: TextStyle(
                      color: colors.textMuted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                      child: TextField(
                    controller: _yearMinController,
                    keyboardType: TextInputType.number,
                    decoration:
                        const InputDecoration(hintText: 'From', isDense: true),
                  )),
                  const SizedBox(width: 12),
                  Expanded(
                      child: TextField(
                    controller: _yearMaxController,
                    keyboardType: TextInputType.number,
                    decoration:
                        const InputDecoration(hintText: 'To', isDense: true),
                  )),
                ],
              ),
              const SizedBox(height: 16),
              // Sort
              Text('Sort By',
                  style: TextStyle(
                      color: colors.textMuted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              DropdownButtonFormField<SortBy>(
                value: filters.sortBy,
                decoration: const InputDecoration(isDense: true),
                items: const [
                  DropdownMenuItem(
                      value: SortBy.popularity, child: Text('Popularity')),
                  DropdownMenuItem(
                      value: SortBy.voteAverage, child: Text('Rating')),
                  DropdownMenuItem(
                      value: SortBy.releaseDate, child: Text('Release Date')),
                  DropdownMenuItem(value: SortBy.title, child: Text('Title')),
                ],
                onChanged: (v) {
                  if (v != null) {
                    ref
                        .read(searchProvider.notifier)
                        .setFilters(filters.copyWith(sortBy: v));
                  }
                },
              ),
              const SizedBox(height: 16),
              // Sort order
              SegmentedButton<SortOrder>(
                segments: const [
                  ButtonSegment(value: SortOrder.desc, label: Text('Desc')),
                  ButtonSegment(value: SortOrder.asc, label: Text('Asc')),
                ],
                selected: {filters.sortOrder},
                onSelectionChanged: (v) {
                  ref
                      .read(searchProvider.notifier)
                      .setFilters(filters.copyWith(sortOrder: v.first));
                },
              ),
              const SizedBox(height: 16),
              // Apply / Reset
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        final yearMin = int.tryParse(_yearMinController.text);
                        final yearMax = int.tryParse(_yearMaxController.text);
                        ref.read(searchProvider.notifier).setFilters(
                              filters.copyWith(
                                yearMin: () => yearMin,
                                yearMax: () => yearMax,
                              ),
                            );
                        setState(() => _showFilters = false);
                      },
                      child: const Text('Apply'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      _yearMinController.clear();
                      _yearMaxController.clear();
                      _minVotesController.clear();
                      ref.read(searchProvider.notifier).clearFilters();
                    },
                    child: const Text('Reset'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrendingSection() {
    final trending = ref.watch(combinedTrendingProvider);
    return trending.when(
      data: (items) => BrowseRow(
        title: 'Trending Now',
        items: items,
        onItemTap: (item) => _navigateToDetail(item),
      ),
      loading: () => const Center(
          child: Padding(
              padding: EdgeInsets.all(32), child: CircularProgressIndicator())),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildResultsGrid(SearchState searchState, SciFiColors colors) {
    final width = MediaQuery.of(context).size.width;
    final crossAxisCount = width >= 600 ? 3 : 2;
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      sliver: SliverGrid(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          childAspectRatio: 0.55,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final item = searchState.results[index];
            return ContentCard(
              item: item,
              onTap: () => _navigateToDetail(item),
            );
          },
          childCount: searchState.results.length,
        ),
      ),
    );
  }

  Widget _buildLoadMore(SearchState searchState, SciFiColors colors) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: searchState.isLoading
            ? const CircularProgressIndicator()
            : OutlinedButton(
                onPressed: () => ref.read(searchProvider.notifier).loadMore(),
                child: const Text('Load More'),
              ),
      ),
    );
  }

  Widget _buildNoResults(SciFiColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: colors.textMuted),
          const SizedBox(height: 16),
          Text('No results found',
              style: TextStyle(color: colors.textPrimary, fontSize: 18)),
          const SizedBox(height: 8),
          Text('Try adjusting your filters.',
              style: TextStyle(color: colors.textMuted)),
        ],
      ),
    );
  }

  Widget _buildNoDatabaseState(SciFiColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.storage, size: 64, color: colors.textMuted),
          const SizedBox(height: 16),
          Text('No database loaded',
              style: TextStyle(color: colors.textPrimary, fontSize: 18)),
          const SizedBox(height: 8),
          Text('Import a database from Settings.',
              style: TextStyle(color: colors.textMuted)),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => context.go('/settings'),
            icon: const Icon(Icons.settings),
            label: const Text('Go to Settings'),
          ),
        ],
      ),
    );
  }
}
