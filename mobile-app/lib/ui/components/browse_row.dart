import 'package:flutter/material.dart';
import '../../models/search_result.dart';
import '../../ui/theme/scifi_colors.dart';
import 'content_card.dart';

class BrowseRow extends StatelessWidget {
  final String title;
  final List<SearchResult> items;
  final VoidCallback? onSeeAll;
  final Function(SearchResult) onItemTap;

  const BrowseRow({
    super.key,
    required this.title,
    required this.items,
    this.onSeeAll,
    required this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (onSeeAll != null)
                TextButton(
                  onPressed: onSeeAll,
                  child: Text(
                    'See All',
                    style: TextStyle(color: colors.primaryCyan, fontSize: 13),
                  ),
                ),
            ],
          ),
        ),
        SizedBox(
          height: 260,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return ContentCard(
                item: items[index],
                compact: true,
                onTap: () => onItemTap(items[index]),
              );
            },
          ),
        ),
      ],
    );
  }
}
