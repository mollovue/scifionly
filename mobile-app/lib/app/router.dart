import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../ui/screens/search_screen.dart';
import '../ui/screens/browse_screen.dart';
import '../ui/screens/settings_screen.dart';
import '../ui/screens/movie_detail_screen.dart';
import '../ui/screens/tv_detail_screen.dart';
import '../ui/screens/person_detail_screen.dart';
import 'shell_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ShellScreen(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const SearchScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/browse',
              builder: (context, state) => const BrowseScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      parentNavigatorKey: _rootNavigatorKey,
      path: '/movie/:id',
      builder: (context, state) {
        final id = int.parse(state.pathParameters['id']!);
        return MovieDetailScreen(movieId: id);
      },
    ),
    GoRoute(
      parentNavigatorKey: _rootNavigatorKey,
      path: '/tv/:id',
      builder: (context, state) {
        final id = int.parse(state.pathParameters['id']!);
        return TvDetailScreen(tvId: id);
      },
    ),
    GoRoute(
      parentNavigatorKey: _rootNavigatorKey,
      path: '/person/:id',
      builder: (context, state) {
        final id = int.parse(state.pathParameters['id']!);
        return PersonDetailScreen(personId: id);
      },
    ),
  ],
);
