import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'app.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/community/presentation/screens/community_screen.dart';
import '../features/camera/presentation/screens/camera_screen.dart';
import '../features/itinerary/presentation/screens/itinerary_screen.dart';
import '../features/directory/presentation/screens/directory_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/home',
  // TODO: Add auth redirect when authentication is implemented
  // redirect: (context, state) { ... },
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return AppScaffold(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/community',
              builder: (context, state) => const CommunityScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/camera',
              builder: (context, state) => const CameraScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/itinerary',
              builder: (context, state) => const ItineraryScreen(),
              // TODO: Add nested routes for map and menu
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/directory',
              builder: (context, state) => const DirectoryScreen(),
              // TODO: Add nested route for guest profile
            ),
          ],
        ),
      ],
    ),
  ],
);
