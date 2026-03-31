import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app/router.dart';
import 'providers/providers.dart';
import 'providers/sync_providers.dart';
import 'ui/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  runApp(ProviderScope(
    overrides: [
      sharedPreferencesProvider.overrideWithValue(prefs),
    ],
    child: const SciFiOnlyApp(),
  ));
}

class SciFiOnlyApp extends ConsumerStatefulWidget {
  const SciFiOnlyApp({super.key});

  @override
  ConsumerState<SciFiOnlyApp> createState() => _SciFiOnlyAppState();
}

class _SciFiOnlyAppState extends ConsumerState<SciFiOnlyApp>
    with WidgetsBindingObserver {
  bool _autoSyncChecked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _tryAutoSync();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _autoSyncChecked = false;
      _tryAutoSync();
    }
  }

  void _tryAutoSync() {
    if (_autoSyncChecked) return;
    _autoSyncChecked = true;
    Future.microtask(() => checkAndRunAutoSync(ref));
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    return MaterialApp.router(
      title: 'SciFi Only',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
