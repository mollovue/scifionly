import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../features/sync/sync_state.dart';
import '../../features/sync/tmdb_client.dart';
import '../../providers/providers.dart';
import '../../providers/sync_providers.dart';
import '../../ui/theme/scifi_colors.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _tokenController = TextEditingController();
  bool _obscureToken = true;
  bool _isValidating = false;
  bool? _tokenValid;

  @override
  void initState() {
    super.initState();
    final token = ref.read(tmdbTokenProvider);
    if (token != null) {
      _tokenController.text = token;
    }
  }

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<SciFiColors>()!;
    final themeMode = ref.watch(themeModeProvider);
    final stats = ref.watch(statsProvider);
    final dbState = ref.watch(databaseProvider);
    final token = ref.watch(tmdbTokenProvider);
    final syncEnabled = ref.watch(syncEnabledProvider);
    final syncUiState = ref.watch(syncUiStateProvider);
    final syncStateAsync = ref.watch(syncStateDataProvider);

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

          // TMDB Sync section
          _sectionHeader(colors, 'TMDB Sync'),
          // API Token field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _tokenController,
              obscureText: _obscureToken,
              decoration: InputDecoration(
                labelText: 'API Read Access Token',
                hintText: 'Paste your TMDB token here',
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(
                          _obscureToken
                              ? Icons.visibility
                              : Icons.visibility_off,
                          color: colors.textMuted),
                      onPressed: () =>
                          setState(() => _obscureToken = !_obscureToken),
                    ),
                    if (_tokenValid == true)
                      const Icon(Icons.check_circle,
                          color: Colors.green, size: 20),
                    if (_tokenValid == false)
                      const Icon(Icons.error, color: Colors.red, size: 20),
                  ],
                ),
              ),
            ),
          ),
          // Validate / Clear buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                OutlinedButton(
                  onPressed:
                      _isValidating ? null : () => _validateToken(colors),
                  child: _isValidating
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Validate & Save'),
                ),
                const SizedBox(width: 8),
                if (token != null && token.isNotEmpty)
                  TextButton(
                    onPressed: () {
                      _tokenController.clear();
                      ref.read(tmdbTokenProvider.notifier).clearToken();
                      ref.read(syncEnabledProvider.notifier).setEnabled(false);
                      setState(() => _tokenValid = null);
                    },
                    child: Text('Clear',
                        style: TextStyle(color: colors.textMuted)),
                  ),
              ],
            ),
          ),
          if (_tokenValid == true)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text('Token valid',
                  style: TextStyle(color: Colors.green, fontSize: 12)),
            ),
          if (_tokenValid == false)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text('Token invalid or failed to validate',
                  style: TextStyle(color: Colors.red, fontSize: 12)),
            ),
          const SizedBox(height: 8),
          // Enable Daily Sync toggle
          SwitchListTile(
            secondary: Icon(Icons.sync, color: colors.primaryCyan),
            title: Text('Enable Daily Sync',
                style: TextStyle(color: colors.textPrimary)),
            subtitle: Text(
              _formatLastSyncDate(syncStateAsync),
              style: TextStyle(color: colors.textMuted, fontSize: 12),
            ),
            value: syncEnabled,
            onChanged: (token != null && token.isNotEmpty)
                ? (value) async {
                    await ref
                        .read(syncEnabledProvider.notifier)
                        .setEnabled(value);
                    if (value && dbState.value != null) {
                      await runIncrementalSync(ref);
                    }
                  }
                : null,
            activeColor: colors.primaryCyan,
          ),
          // Sync Now button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: OutlinedButton.icon(
              onPressed: (token != null &&
                      token.isNotEmpty &&
                      dbState.value != null &&
                      syncUiState.status != SyncStatus.syncing)
                  ? () => runIncrementalSync(ref)
                  : null,
              icon: syncUiState.status == SyncStatus.syncing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.sync),
              label: Text(syncUiState.status == SyncStatus.syncing
                  ? 'Syncing...'
                  : 'Sync Now'),
            ),
          ),
          // Sync status indicator
          if (syncUiState.status == SyncStatus.syncing) ...[
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: LinearProgressIndicator(),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text(
                syncUiState.progress.status,
                style: TextStyle(color: colors.textMuted, fontSize: 12),
              ),
            ),
          ],
          if (syncUiState.status == SyncStatus.completed)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text(
                syncUiState.progress.summary,
                style: const TextStyle(color: Colors.green, fontSize: 12),
              ),
            ),
          if (syncUiState.status == SyncStatus.error)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text(
                syncUiState.errorMessage ?? 'Sync failed',
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
          // How to get your API token
          ExpansionTile(
            leading: Icon(Icons.help_outline, color: colors.primaryCyan),
            title: Text('How to get your API token',
                style: TextStyle(color: colors.textPrimary, fontSize: 14)),
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _instructionStep(colors, '1',
                        'Go to themoviedb.org and create a free account (or log in)'),
                    _instructionStep(
                        colors, '2', 'Navigate to Profile > Settings > API'),
                    _instructionStep(colors, '3',
                        'Click "Request an API Key" > "click here"'),
                    _instructionStep(colors, '4',
                        'Select "Developer" and accept the terms of use'),
                    _instructionStep(colors, '5',
                        'Fill in the application details (any name/URL works)'),
                    _instructionStep(colors, '6',
                        'Copy the "API Read Access Token" (the long string)'),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => launchUrl(
                          Uri.parse('https://www.themoviedb.org/settings/api')),
                      icon: const Icon(Icons.open_in_new, size: 16),
                      label: const Text('Open TMDB API Settings'),
                    ),
                  ],
                ),
              ),
            ],
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

  Widget _instructionStep(SciFiColors colors, String number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$number. ',
              style: TextStyle(
                  color: colors.primaryCyan, fontWeight: FontWeight.bold)),
          Expanded(
              child: Text(text,
                  style: TextStyle(color: colors.textMuted, fontSize: 13))),
        ],
      ),
    );
  }

  String _formatLastSyncDate(AsyncValue<SyncStateData?> syncStateAsync) {
    return syncStateAsync.when(
      data: (data) {
        if (data?.lastSyncDate == null) return 'Never synced';
        return 'Last synced: ${data!.lastSyncDate}';
      },
      loading: () => 'Loading...',
      error: (_, __) => 'Never synced',
    );
  }

  Future<void> _validateToken(SciFiColors colors) async {
    final tokenText = _tokenController.text.trim();
    if (tokenText.isEmpty) {
      setState(() => _tokenValid = false);
      return;
    }

    setState(() {
      _isValidating = true;
      _tokenValid = null;
    });

    final client = TmdbClient(apiToken: tokenText);
    try {
      final valid = await client.validateToken();
      if (valid) {
        await ref.read(tmdbTokenProvider.notifier).setToken(tokenText);
      }
      setState(() => _tokenValid = valid);
    } catch (_) {
      setState(() => _tokenValid = false);
    } finally {
      client.close();
      setState(() => _isValidating = false);
    }
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
      ref.invalidate(syncStateDataProvider);
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
      ref.invalidate(syncStateDataProvider);
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
