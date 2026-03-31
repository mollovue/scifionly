import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../ui/theme/scifi_colors.dart';
import '../components/tmdb_image.dart';

class PersonDetailScreen extends ConsumerWidget {
  final int personId;

  const PersonDetailScreen({super.key, required this.personId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    final detail = ref.watch(personDetailProvider(personId));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: detail.when(
        data: (data) {
          if (data == null) {
            return Center(
                child: Text('Person not found',
                    style: TextStyle(color: colors.textPrimary)));
          }
          final person = data.person;
          return SingleChildScrollView(
            child: Column(
              children: [
                // Profile header
                const SizedBox(height: 16),
                Center(
                  child: ClipOval(
                    child: TmdbImage(
                      path: person.profilePath,
                      size: 'w185',
                      imageType: ImageType.profile,
                      width: 120,
                      height: 120,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  person.name,
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                if (person.knownForDepartment != null)
                  Text(
                    person.knownForDepartment!,
                    style: TextStyle(color: colors.textMuted, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                const SizedBox(height: 24),
                // Movie credits
                if (data.movieCredits.isNotEmpty) ...[
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        Text('Movies',
                            style: TextStyle(
                                color: colors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        Text('(${data.movieCredits.length})',
                            style: TextStyle(color: colors.textMuted)),
                      ],
                    ),
                  ),
                  ...data.movieCredits.map((credit) => ListTile(
                        leading: Card(
                          clipBehavior: Clip.antiAlias,
                          child: TmdbImage(
                            path: credit.posterPath,
                            size: 'w342',
                            imageType: ImageType.poster,
                            width: 40,
                            height: 60,
                          ),
                        ),
                        title: Text(credit.title,
                            style: TextStyle(color: colors.textPrimary)),
                        subtitle: Text(
                          [
                            if (credit.character != null) credit.character!,
                            if (credit.job != null) credit.job!,
                            if (credit.year != null) credit.year!,
                          ].join(' · '),
                          style: TextStyle(color: colors.textMuted),
                        ),
                        onTap: () => context.push('/movie/${credit.contentId}'),
                      )),
                ],
                // TV credits
                if (data.tvCredits.isNotEmpty) ...[
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        Text('TV Series',
                            style: TextStyle(
                                color: colors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        Text('(${data.tvCredits.length})',
                            style: TextStyle(color: colors.textMuted)),
                      ],
                    ),
                  ),
                  ...data.tvCredits.map((credit) => ListTile(
                        leading: Card(
                          clipBehavior: Clip.antiAlias,
                          child: TmdbImage(
                            path: credit.posterPath,
                            size: 'w342',
                            imageType: ImageType.poster,
                            width: 40,
                            height: 60,
                          ),
                        ),
                        title: Text(credit.title,
                            style: TextStyle(color: colors.textPrimary)),
                        subtitle: Text(
                          [
                            if (credit.character != null) credit.character!,
                            if (credit.job != null) credit.job!,
                            if (credit.year != null) credit.year!,
                          ].join(' · '),
                          style: TextStyle(color: colors.textMuted),
                        ),
                        onTap: () => context.push('/tv/${credit.contentId}'),
                      )),
                ],
                if (data.movieCredits.isEmpty && data.tvCredits.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(32),
                    child: Text('No credits found',
                        style: TextStyle(color: colors.textMuted)),
                  ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
            child:
                Text('Error: $e', style: TextStyle(color: colors.textPrimary))),
      ),
    );
  }
}
