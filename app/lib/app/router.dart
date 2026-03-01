import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'scaffold.dart';
import '../features/auth/presentation/providers/auth_providers.dart';
import '../features/auth/presentation/screens/access_denied_screen.dart';
import '../features/auth/presentation/screens/magic_link_handler_screen.dart';
import '../features/auth/presentation/screens/welcome_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/community/presentation/screens/community_screen.dart';
import '../features/camera/presentation/screens/camera_screen.dart';
import '../features/itinerary/presentation/screens/itinerary_screen.dart';
import '../features/itinerary/presentation/screens/map_screen.dart';
import '../features/itinerary/presentation/screens/menu_screen.dart';
import '../features/directory/presentation/screens/directory_screen.dart';
import '../features/directory/presentation/screens/guest_profile_screen.dart';
import '../features/directory/presentation/screens/my_profile_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

/// Bridges Riverpod auth state changes into a GoRouter [Listenable] so that
/// the redirect fires reactively whenever the user signs in or out.
class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(this._ref) {
    _ref.listen(
      authStateProvider,
      (previous, next) => notifyListeners(),
    );
  }

  final Ref _ref;

  String? redirect(BuildContext context, GoRouterState state) {
    final authValue = _ref.read(authStateProvider);

    // Don't redirect while the auth state is still loading.
    if (authValue.isLoading) return null;

    final isLoggedIn = authValue.asData?.value != null;
    final location = state.matchedLocation;

    final isPublicRoute =
        location == '/welcome' ||
        location == '/login' ||
        location == '/access-denied';

    if (!isLoggedIn && !isPublicRoute) return '/welcome';
    if (isLoggedIn && location == '/welcome') return '/home';
    return null;
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);

  final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/home',
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      // ── Unauthenticated ──────────────────────────────────────────────────
      GoRoute(
        path: '/welcome',
        builder: (context, state) => WelcomeScreen(
          magicLinkToken: state.uri.queryParameters['token'],
        ),
      ),
      GoRoute(
        path: '/access-denied',
        builder: (context, state) => const AccessDeniedScreen(),
      ),

      // Magic link deep link: bodaentarifa.com/login?token=xyz&name=Guest
      // Extracts token and name, handles sign-out + sign-in flow.
      GoRoute(
        path: '/login',
        builder: (context, state) => MagicLinkHandlerScreen(
          token: state.uri.queryParameters['token'],
          guestName: state.uri.queryParameters['name'],
        ),
      ),

      // ── Authenticated shell — 5-tab StatefulShellRoute ───────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppScaffold(navigationShell: navigationShell),
        branches: [
          // 0 — Inicio
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),

          // 1 — Comunidad
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/community',
                builder: (context, state) => const CommunityScreen(),
              ),
            ],
          ),

          // 2 — Cámara (FAB-style tab)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/camera',
                builder: (context, state) => const CameraScreen(),
              ),
            ],
          ),

          // 3 — Agenda (with nested map and menu routes)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/itinerary',
                builder: (context, state) => const ItineraryScreen(),
                routes: [
                  GoRoute(
                    path: 'map',
                    builder: (context, state) => const MapScreen(),
                  ),
                  GoRoute(
                    path: 'menu/:id',
                    builder: (context, state) => MenuScreen(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),

          // 4 — Invitados (with nested profile routes)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/directory',
                builder: (context, state) => const DirectoryScreen(),
                routes: [
                  // /directory/me must be declared before /directory/:uid
                  // to prevent "me" being treated as a UID.
                  GoRoute(
                    path: 'me',
                    builder: (context, state) => const MyProfileScreen(),
                  ),
                  GoRoute(
                    path: ':uid',
                    builder: (context, state) => GuestProfileScreen(
                      uid: state.pathParameters['uid']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

  ref.onDispose(notifier.dispose);
  ref.onDispose(router.dispose);

  return router;
});
