import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/app_user.dart';
import '../providers/auth_providers.dart';
import '../providers/onboarding_providers.dart';
import '../widgets/communication_step.dart';
import '../widgets/permissions_step.dart';
import '../widgets/privacy_step.dart';

/// 3-step onboarding wizard shown once after first authentication.
/// Collects communication preference, privacy settings, and device permissions.
class OnboardingWizardScreen extends ConsumerStatefulWidget {
  const OnboardingWizardScreen({super.key});

  @override
  ConsumerState<OnboardingWizardScreen> createState() =>
      _OnboardingWizardScreenState();
}

class _OnboardingWizardScreenState
    extends ConsumerState<OnboardingWizardScreen> {
  final _pageController = PageController();
  int _currentStep = 0;
  static const _totalSteps = 3;

  // Step 1: Communication
  String? _communicationPreference;
  final _whatsappController = TextEditingController();

  // Step 2: Privacy
  bool _isDirectoryVisible = false;
  final _funFactController = TextEditingController();
  RelationshipStatus _relationshipStatus = RelationshipStatus.soltero;

  @override
  void dispose() {
    _pageController.dispose();
    _whatsappController.dispose();
    _funFactController.dispose();
    super.dispose();
  }

  void _goToStep(int step) {
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
    setState(() => _currentStep = step);
  }

  void _next() {
    if (_currentStep < _totalSteps - 1) {
      _goToStep(_currentStep + 1);
    } else {
      _finish();
    }
  }

  Future<void> _skip() async {
    // Skipping sets all remaining settings to defaults and completes
    await _finish();
  }

  Future<void> _finish() async {
    final user = ref.read(authStateProvider).asData?.value;
    if (user == null) return;

    final controller = ref.read(onboardingControllerProvider.notifier);

    final success = await controller.completeOnboarding(
      uid: user.uid,
      whatsappNumber: _communicationPreference == 'whatsapp'
          ? _whatsappController.text
          : null,
      isDirectoryVisible: _isDirectoryVisible,
      funFact: _funFactController.text.isNotEmpty
          ? _funFactController.text
          : null,
      relationshipStatus: _relationshipStatus,
    );

    if (!mounted) return;

    if (success) {
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error al guardar. Inténtalo de nuevo.'),
        ),
      );
    }
  }

  /// Pre-fill form fields from existing user data (if the couple
  /// pre-registered defaults).
  void _initFromUser(AppUser user) {
    if (_whatsappController.text.isEmpty && user.whatsappNumber != null) {
      _whatsappController.text = user.whatsappNumber!;
      _communicationPreference = 'whatsapp';
    }
    if (_funFactController.text.isEmpty && user.funFact != null) {
      _funFactController.text = user.funFact!;
    }
    _relationshipStatus = user.relationshipStatus;
    _isDirectoryVisible = user.isDirectoryVisible;
  }

  bool _initialized = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authStateProvider);
    final controllerState = ref.watch(onboardingControllerProvider);
    final isSubmitting = controllerState.isLoading;

    // Pre-fill from user data once
    final user = authState.asData?.value;
    if (user != null && !_initialized) {
      _initFromUser(user);
      _initialized = true;
    }

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Step indicator
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                children: [
                  for (int i = 0; i < _totalSteps; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        height: 4,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(2),
                          color: i <= _currentStep
                              ? theme.colorScheme.primary
                              : theme.colorScheme.outlineVariant,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Step label
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Paso ${_currentStep + 1} de $_totalSteps',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),

            // Pages
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (i) => setState(() => _currentStep = i),
                children: [
                  CommunicationStep(
                    preference: _communicationPreference,
                    onPreferenceChanged: (v) =>
                        setState(() => _communicationPreference = v),
                    whatsappController: _whatsappController,
                  ),
                  PrivacyStep(
                    isDirectoryVisible: _isDirectoryVisible,
                    onDirectoryVisibleChanged: (v) =>
                        setState(() => _isDirectoryVisible = v),
                    funFactController: _funFactController,
                    relationshipStatus: _relationshipStatus,
                    onRelationshipStatusChanged: (v) =>
                        setState(() => _relationshipStatus = v),
                  ),
                  const PermissionsStep(),
                ],
              ),
            ),

            // Bottom navigation buttons
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                children: [
                  // Skip button
                  TextButton(
                    onPressed: isSubmitting ? null : _skip,
                    child: const Text('Saltar'),
                  ),
                  const Spacer(),
                  // Next / Finish button
                  FilledButton(
                    onPressed: isSubmitting ? null : _next,
                    child: isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(_currentStep < _totalSteps - 1
                            ? 'Siguiente'
                            : 'Empezar'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
