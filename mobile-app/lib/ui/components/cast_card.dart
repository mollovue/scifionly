import 'package:flutter/material.dart';
import '../../models/cast_member.dart';
import '../../ui/theme/scifi_colors.dart';
import 'tmdb_image.dart';

class CastCard extends StatelessWidget {
  final CastMember member;
  final VoidCallback onTap;

  const CastCard({super.key, required this.member, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 100,
        child: Column(
          children: [
            ClipOval(
              child: TmdbImage(
                path: member.profilePath,
                size: 'w185',
                imageType: ImageType.profile,
                width: 64,
                height: 64,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              member.name,
              style: TextStyle(
                color: colors.textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            if (member.character != null)
              Text(
                member.character!,
                style: TextStyle(
                  color: colors.textMuted,
                  fontSize: 11,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
          ],
        ),
      ),
    );
  }
}
