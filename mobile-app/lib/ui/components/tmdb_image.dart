import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../utils/formatters.dart';

enum ImageType { poster, backdrop, profile }

class TmdbImage extends StatelessWidget {
  final String? path;
  final String size;
  final ImageType imageType;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const TmdbImage({
    super.key,
    required this.path,
    this.size = 'w342',
    this.imageType = ImageType.poster,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  IconData get _placeholderIcon {
    switch (imageType) {
      case ImageType.poster:
        return Icons.movie;
      case ImageType.backdrop:
        return Icons.landscape;
      case ImageType.profile:
        return Icons.person;
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = tmdbImageUrl(path, size: size);
    if (url.isEmpty) {
      return _placeholder(context);
    }

    Widget image = CachedNetworkImage(
      imageUrl: url,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => _shimmer(context),
      errorWidget: (context, url, error) => _placeholder(context),
    );

    if (borderRadius != null) {
      image = ClipRRect(borderRadius: borderRadius!, child: image);
    }

    return image;
  }

  Widget _placeholder(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: borderRadius,
      ),
      child: Icon(_placeholderIcon,
          color: colors.onSurface.withOpacity(0.3), size: 40),
    );
  }

  Widget _shimmer(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: borderRadius,
      ),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: colors.primary.withOpacity(0.5),
          ),
        ),
      ),
    );
  }
}
