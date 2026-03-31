import 'package:flutter/material.dart';
import '../../models/search_result.dart';
import '../../ui/theme/scifi_colors.dart';
import 'rating_badge.dart';
import 'tmdb_image.dart';

class ContentCard extends StatelessWidget {
  final SearchResult item;
  final VoidCallback onTap;
  final bool compact;

  const ContentCard({
    super.key,
    required this.item,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (compact) return _buildCompact(context);
    return _buildStandard(context);
  }

  Widget _buildStandard(BuildContext context) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    return GestureDetector(
      onTap: onTap,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: AspectRatio(
          aspectRatio: 2 / 3,
          child: Stack(
            fit: StackFit.expand,
            children: [
              TmdbImage(
                path: item.posterPath,
                size: 'w342',
                imageType: ImageType.poster,
              ),
              // Gradient overlay
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.8)
                      ],
                    ),
                  ),
                ),
              ),
              // Type badge
              Positioned(
                top: 6,
                left: 6,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: item.type == 'movie'
                        ? colors.primaryCyan
                        : colors.accentPurple,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    item.type == 'movie' ? 'Movie' : 'TV',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              // Rating badge
              Positioned(
                top: 6,
                right: 6,
                child: RatingBadge(rating: item.voteAverage, size: 28),
              ),
              // Title + year
              Positioned(
                bottom: 8,
                left: 8,
                right: 8,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (item.year != null)
                      Text(
                        item.year!,
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.7), fontSize: 10),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompact(BuildContext context) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 140,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              clipBehavior: Clip.antiAlias,
              child: AspectRatio(
                aspectRatio: 2 / 3,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    TmdbImage(
                      path: item.posterPath,
                      size: 'w342',
                      imageType: ImageType.poster,
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: RatingBadge(rating: item.voteAverage, size: 24),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 2),
              child: Text(
                item.title,
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (item.year != null)
              Padding(
                padding: const EdgeInsets.only(left: 2),
                child: Text(
                  item.year!,
                  style: TextStyle(color: colors.textMuted, fontSize: 10),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
