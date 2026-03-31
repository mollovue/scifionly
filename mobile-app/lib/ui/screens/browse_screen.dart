import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../ui/theme/scifi_colors.dart';
import '../components/browse_row.dart';

class BrowseScreen extends ConsumerWidget {
  const BrowseScreen({super.key});

  void _navigateToDetail(BuildContext context, dynamic item) {
    if (item.type == 'movie') {
      context.push('/movie/${item.id}');
    } else {
      context.push('/tv/${item.id}');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    final dbState = ref.watch(databaseProvider);

    if (dbState.value == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Browse')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.storage, size: 64, color: colors.textMuted),
              const SizedBox(height: 16),
              Text('No database loaded',
                  style: TextStyle(color: colors.textPrimary, fontSize: 18)),
              const SizedBox(height: 8),
              FilledButton.icon(
                onPressed: () => context.go('/settings'),
                icon: const Icon(Icons.settings),
                label: const Text('Go to Settings'),
              ),
            ],
          ),
        ),
      );
    }

    final trendingMovies = ref.watch(trendingMoviesProvider);
    final topRatedMovies = ref.watch(topRatedMoviesProvider);
    final recentMovies = ref.watch(recentMoviesProvider);
    final trendingTv = ref.watch(trendingTvProvider);
    final topRatedTv = ref.watch(topRatedTvProvider);
    final recentTv = ref.watch(recentTvProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Browse')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(trendingMoviesProvider);
          ref.invalidate(topRatedMoviesProvider);
          ref.invalidate(recentMoviesProvider);
          ref.invalidate(trendingTvProvider);
          ref.invalidate(topRatedTvProvider);
          ref.invalidate(recentTvProvider);
        },
        child: ListView(
          children: [
            // Movies section header
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 16, bottom: 4),
              child: Text('Movies',
                  style: TextStyle(
                      color: colors.primaryCyan,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
            ),
            trendingMovies.when(
              data: (items) => BrowseRow(
                title: 'Trending Movies',
                items: items,
                onItemTap: (item) => _navigateToDetail(context, item),
              ),
              loading: () => const _LoadingRow(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            topRatedMovies.when(
              data: (items) => BrowseRow(
                title: 'Top Rated Movies',
                items: items,
                onItemTap: (item) => _navigateToDetail(context, item),
              ),
              loading: () => const _LoadingRow(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            recentMovies.when(
              data: (items) => BrowseRow(
                title: 'Recently Released',
                items: items,
                onItemTap: (item) => _navigateToDetail(context, item),
              ),
              loading: () => const _LoadingRow(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            // TV section header
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 24, bottom: 4),
              child: Text('TV Series',
                  style: TextStyle(
                      color: colors.accentPurple,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
            ),
            trendingTv.when(
              data: (items) => BrowseRow(
                title: 'Trending TV Series',
                items: items,
                onItemTap: (item) => _navigateToDetail(context, item),
              ),
              loading: () => const _LoadingRow(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            topRatedTv.when(
              data: (items) => BrowseRow(
                title: 'Top Rated TV Series',
                items: items,
                onItemTap: (item) => _navigateToDetail(context, item),
              ),
              loading: () => const _LoadingRow(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            recentTv.when(
              data: (items) => BrowseRow(
                title: 'Recently Aired',
                items: items,
                onItemTap: (item) => _navigateToDetail(context, item),
              ),
              loading: () => const _LoadingRow(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}

class _LoadingRow extends StatelessWidget {
  const _LoadingRow();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(24),
      child: Center(child: CircularProgressIndicator()),
    );
  }
}
