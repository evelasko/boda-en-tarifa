import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../domain/entities/app_user.dart';

abstract class AuthRemoteDataSource {
  Future<AppUser> signInWithCustomToken(String token);
  Future<AppUser> signInWithGoogle();
  Future<AppUser> signInWithApple();
  Future<void> signOut();
  Future<AppUser?> getCurrentUser();
  Stream<AppUser?> onAuthStateChange();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;

  AuthRemoteDataSourceImpl({
    required FirebaseAuth firebaseAuth,
    required FirebaseFirestore firestore,
  })  : _firebaseAuth = firebaseAuth,
        _firestore = firestore;

  @override
  Future<AppUser> signInWithCustomToken(String token) async {
    final credential = await _firebaseAuth.signInWithCustomToken(token);
    return _fetchGuestProfile(credential.user!.uid);
  }

  @override
  Future<AppUser> signInWithGoogle() async {
    final googleAccount = await GoogleSignIn.instance.authenticate();

    final idToken = googleAccount.authentication.idToken;
    final credential = GoogleAuthProvider.credential(idToken: idToken);

    final userCredential =
        await _firebaseAuth.signInWithCredential(credential);
    return _fetchGuestProfile(userCredential.user!.uid);
  }

  @override
  Future<AppUser> signInWithApple() async {
    final appleCredential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );

    final oauthCredential = OAuthProvider('apple.com').credential(
      idToken: appleCredential.identityToken,
      accessToken: appleCredential.authorizationCode,
    );

    final userCredential =
        await _firebaseAuth.signInWithCredential(oauthCredential);
    return _fetchGuestProfile(userCredential.user!.uid);
  }

  @override
  Future<void> signOut() async {
    await Future.wait([
      _firebaseAuth.signOut(),
      GoogleSignIn.instance.signOut(),
    ]);
  }

  @override
  Future<AppUser?> getCurrentUser() async {
    final user = _firebaseAuth.currentUser;
    if (user == null) return null;
    return _fetchGuestProfile(user.uid);
  }

  @override
  Stream<AppUser?> onAuthStateChange() {
    return _firebaseAuth.authStateChanges().asyncMap((user) async {
      if (user == null) return null;
      return _fetchGuestProfile(user.uid);
    });
  }

  Future<AppUser> _fetchGuestProfile(String uid) async {
    final doc = await _firestore.collection('guests').doc(uid).get();

    if (!doc.exists) {
      throw FirebaseAuthException(
        code: 'guest-not-found',
        message:
            'No hemos encontrado tu invitación. Contacta con Enrique o Manuel para obtener acceso.',
      );
    }

    return AppUser.fromJson({...doc.data()!, 'uid': uid});
  }
}
