import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/providers.dart';
import '../../ui/theme/scifi_colors.dart';
import '../../utils/formatters.dart';
import '../components/tmdb_image.dart';
import '../components/rating_badge.dart';
import '../components/cast_card.dart';
import 'dart:convert';

class TvDetailScreen extends ConsumerStatefulWidget {
  final int tvId;

  const TvDetailScreen({super.key, required this.tvId});

  @override
  ConsumerState<TvDetailScreen> createState() => _TvDetailScreenState();
}

class _TvDetailScreenState extends ConsumerState<TvDetailScreen> {
  final FlutterTts _tts = FlutterTts();
  bool _isSpeaking = false;

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  Future<void> _toggleTts(String? text) async {
    if (text == null || text.isEmpty) return;
    if (_isSpeaking) {
      await _tts.stop();
      setState(() => _isSpeaking = false);
    } else {
      setState(() => _isSpeaking = true);
      await _tts.speak(text);
      _tts.setCompletionHandler(() {
        if (mounted) setState(() => _isSpeaking = false);
      });
    }
  }

  List<String> _parseJsonArray(String? json) {
    if (json == null || json.isEmpty) return [];
    try {
      final parsed = jsonDecode(json);
      if (parsed is List) return parsed.cast<String>();
    } catch (_) {}
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    final detail = ref.watch(tvDetailProvider(widget.tvId));

    return Scaffold(
      body: detail.when(
        data: (data) {
          if (data == null) {
            return Center(
                child: Text('TV series not found',
                    style: TextStyle(color: colors.textPrimary)));
          }
          final series = data.series;
          final networks = _parseJsonArray(series.networks);

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Backdrop
                Stack(
                  children: [
                    TmdbImage(
                      path: series.backdropPath,
                      size: 'w780',
                      imageType: ImageType.backdrop,
                      width: double.infinity,
                      height: 280,
                    ),
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 140,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, colors.background],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      left: 8,
                      child: CircleAvatar(
                        backgroundColor: Colors.black54,
                        child: IconButton(
                          icon:
                              const Icon(Icons.arrow_back, color: Colors.white),
                          onPressed: () => context.pop(),
                        ),
                      ),
                    ),
                  ],
                ),
                // Poster + title
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Transform.translate(
                        offset: const Offset(0, -40),
                        child: Card(
                          clipBehavior: Clip.antiAlias,
                          child: TmdbImage(
                            path: series.posterPath,
                            size: 'w500',
                            imageType: ImageType.poster,
                            width: 120,
                            height: 180,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(series.name,
                                style: TextStyle(
                                    color: colors.textPrimary,
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold)),
                            if (series.originalName != null &&
                                series.originalName != series.name)
                              Text(series.originalName!,
                                  style: TextStyle(
                                      color: colors.textMuted,
                                      fontSize: 14,
                                      fontStyle: FontStyle.italic)),
                            const SizedBox(height: 4),
                            Text(
                              [
                                formatYear(series.firstAirDate),
                                if (series.numberOfEpisodes != null)
                                  '${series.numberOfEpisodes} episodes',
                                series.status,
                              ]
                                  .where((s) => s != null && s.isNotEmpty)
                                  .join(' · '),
                              style: TextStyle(
                                  color: colors.textMuted, fontSize: 12),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                RatingBadge(
                                    rating: series.voteAverage, size: 36),
                                const SizedBox(width: 8),
                                Text(formatVoteCount(series.voteCount),
                                    style: TextStyle(
                                        color: colors.textMuted, fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Tagline
                if (series.tagline != null && series.tagline!.isNotEmpty)
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Text(series.tagline!,
                        style: TextStyle(
                            color: colors.textMuted,
                            fontSize: 14,
                            fontStyle: FontStyle.italic)),
                  ),
                // Genres
                if (data.genres.isNotEmpty)
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: data.genres
                          .map((g) => Chip(
                              label: Text(g.name,
                                  style: const TextStyle(fontSize: 12))))
                          .toList(),
                    ),
                  ),
                // Series info
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          if (series.numberOfSeasons != null)
                            _infoRow(
                                colors, 'Seasons', '${series.numberOfSeasons}'),
                          if (series.numberOfEpisodes != null)
                            _infoRow(colors, 'Episodes',
                                '${series.numberOfEpisodes}'),
                          _infoRow(colors, 'Aired',
                              '${formatYear(series.firstAirDate)} - ${series.status == "Returning Series" ? "Present" : formatYear(series.lastAirDate)}'),
                          if (networks.isNotEmpty)
                            _infoRow(colors, 'Networks', networks.join(', ')),
                        ],
                      ),
                    ),
                  ),
                ),
                // Action buttons
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () {
                          Share.share(
                              '${series.name} - ${tmdbTvUrl(series.tmdbId)}');
                        },
                        icon: const Icon(Icons.share, size: 18),
                        label: const Text('Share'),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: () =>
                            launchUrl(Uri.parse(tmdbTvUrl(series.tmdbId))),
                        icon: const Icon(Icons.open_in_new, size: 18),
                        label: const Text('TMDB'),
                      ),
                    ],
                  ),
                ),
                // Overview
                if (series.overview != null && series.overview!.isNotEmpty) ...[
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        Text('Overview',
                            style: TextStyle(
                                color: colors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: Icon(_isSpeaking ? Icons.stop : Icons.volume_up,
                              color: colors.primaryCyan, size: 20),
                          onPressed: () => _toggleTts(series.overview),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(series.overview!,
                        style:
                            TextStyle(color: colors.textPrimary, fontSize: 14)),
                  ),
                ],
                // Cast
                if (data.cast.isNotEmpty) ...[
                  Padding(
                    padding:
                        const EdgeInsets.only(left: 16, top: 16, bottom: 8),
                    child: Text('Top Cast',
                        style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold)),
                  ),
                  SizedBox(
                    height: 130,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: data.cast.length > 15 ? 15 : data.cast.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final member = data.cast[index];
                        return CastCard(
                          member: member,
                          onTap: () =>
                              context.push('/person/${member.personId}'),
                        );
                      },
                    ),
                  ),
                ],
                // Crew
                if (data.crew.isNotEmpty) ...[
                  Padding(
                    padding:
                        const EdgeInsets.only(left: 16, top: 16, bottom: 8),
                    child: Text('Crew',
                        style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold)),
                  ),
                  ...data.crew
                      .where((c) => ['Creator', 'Writer', 'Executive Producer']
                          .contains(c.job))
                      .map(
                        (c) => ListTile(
                          dense: true,
                          title: Text(c.name,
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontWeight: FontWeight.w600)),
                          subtitle: Text(c.job ?? '',
                              style: TextStyle(color: colors.textMuted)),
                          onTap: () => context.push('/person/${c.personId}'),
                        ),
                      ),
                ],
                // Details
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Details',
                              style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          _infoRow(colors, 'Language',
                              languageName(series.originalLanguage)),
                        ],
                      ),
                    ),
                  ),
                ),
                // Attribution
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Data provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.',
                    style: TextStyle(color: colors.textMuted, fontSize: 11),
                    textAlign: TextAlign.center,
                  ),
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

  Widget _infoRow(SciFiColors colors, String label, String value) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 100,
              child: Text(label,
                  style: TextStyle(color: colors.textMuted, fontSize: 13))),
          Expanded(
              child: Text(value,
                  style: TextStyle(color: colors.textPrimary, fontSize: 13))),
        ],
      ),
    );
  }
}
