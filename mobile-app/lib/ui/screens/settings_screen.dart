import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/providers.dart';
import '../../ui/theme/scifi_colors.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    final themeMode = ref.watch(themeModeProvider);
    final stats = ref.watch(statsProvider);
    final dbState = ref.watch(databaseProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // Database section
          _sectionHeader(colors, 'Database'),
          ListTile(
            leading: Icon(Icons.storage, color: colors.primaryCyan),
            title: Text('Database Status',
                style: TextStyle(color: colors.textPrimary)),
            subtitle: stats.when(
              data: (data) => dbState.value != null
                  ? Text(
                      'Loaded — ${data['movies']} movies, ${data['tvSeries']} TV series',
                      style: TextStyle(color: colors.textMuted))
                  : Text('No database loaded',
                      style: TextStyle(color: colors.textMuted)),
              loading: () =>
                  Text('Loading...', style: TextStyle(color: colors.textMuted)),
              error: (_, __) => Text('Error loading stats',
                  style: TextStyle(color: colors.textMuted)),
            ),
          ),
          ListTile(
            leading: Icon(Icons.file_upload, color: colors.primaryCyan),
            title: Text('Import Database',
                style: TextStyle(color: colors.textPrimary)),
            subtitle: Text('Select a .db or .sqlite file',
                style: TextStyle(color: colors.textMuted)),
            onTap: () => _importDatabase(context, ref),
          ),
          if (dbState.value == null)
            ListTile(
              leading: Icon(Icons.play_arrow, color: colors.accentPurple),
              title: Text('Load Demo Data',
                  style: TextStyle(color: colors.textPrimary)),
              subtitle: Text('Create a sample database for testing',
                  style: TextStyle(color: colors.textMuted)),
              onTap: () => _loadDemo(context, ref),
            ),
          const Divider(),
          // Appearance section
          _sectionHeader(colors, 'Appearance'),
          SwitchListTile(
            secondary: Icon(Icons.dark_mode, color: colors.primaryCyan),
            title:
                Text('Dark Mode', style: TextStyle(color: colors.textPrimary)),
            value: themeMode == ThemeMode.dark,
            onChanged: (value) {
              ref.read(themeModeProvider.notifier).state =
                  value ? ThemeMode.dark : ThemeMode.light;
            },
            activeColor: colors.primaryCyan,
          ),
          const Divider(),
          // About section
          _sectionHeader(colors, 'About'),
          ListTile(
            leading: Icon(Icons.info_outline, color: colors.primaryCyan),
            title:
                Text('SciFi Only', style: TextStyle(color: colors.textPrimary)),
            subtitle: Text('Version 1.0.0',
                style: TextStyle(color: colors.textMuted)),
          ),
          ListTile(
            leading: Icon(Icons.movie, color: colors.primaryCyan),
            title: Text('TMDB Attribution',
                style: TextStyle(color: colors.textPrimary)),
            subtitle: Text(
              'This product uses the TMDB API but is not endorsed or certified by TMDB.',
              style: TextStyle(color: colors.textMuted, fontSize: 12),
            ),
          ),
          ListTile(
            leading: Icon(Icons.open_in_new, color: colors.primaryCyan),
            title:
                Text('Visit TMDB', style: TextStyle(color: colors.textPrimary)),
            onTap: () => launchUrl(Uri.parse('https://www.themoviedb.org')),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _sectionHeader(SciFiColors colors, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 16, bottom: 4),
      child: Text(
        title,
        style: TextStyle(
            color: colors.primaryCyan,
            fontSize: 14,
            fontWeight: FontWeight.bold),
      ),
    );
  }

  Future<void> _importDatabase(BuildContext context, WidgetRef ref) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.any,
      );
      if (result == null || result.files.isEmpty) return;
      final path = result.files.single.path;
      if (path == null) return;

      await ref.read(databaseProvider.notifier).importDatabase(path);
      ref.invalidate(statsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Database imported successfully!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Import failed: $e')),
        );
      }
    }
  }

  Future<void> _loadDemo(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(databaseProvider.notifier).loadDemoData();
      ref.invalidate(statsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Demo data loaded!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }
}
