import 'dart:io';

import 'package:cloudinary_public/cloudinary_public.dart';

const _cloudName = 'bodaentarifa';
const _uploadPreset = 'wedding_upload';

final cloudinary = CloudinaryPublic(_cloudName, _uploadPreset);

/// Constructs a Cloudinary delivery URL with responsive sizing.
String cloudinaryUrl(String publicId, {int width = 1080}) {
  return 'https://res.cloudinary.com/$_cloudName/image/upload/'
      'w_$width,c_limit,q_auto,f_auto/$publicId';
}

/// Constructs a square-cropped thumbnail URL for grids and avatars.
String cloudinaryThumbnailUrl(String publicId, {int size = 400}) {
  return 'https://res.cloudinary.com/$_cloudName/image/upload/'
      'w_$size,h_$size,c_fill,q_auto,f_auto/$publicId';
}

/// Resolves a [photoUrl] (which may be a Cloudinary public ID or a full URL)
/// into a displayable URL with optional width constraint.
String resolvePhotoUrl(String photoUrl, {int width = 600}) {
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  return cloudinaryUrl(photoUrl, width: width);
}

/// Resolves to a thumbnail URL, handling both public IDs and full URLs.
String resolvePhotoThumbnail(String photoUrl, {int size = 200}) {
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  return cloudinaryThumbnailUrl(photoUrl, size: size);
}

/// Uploads a local image file to Cloudinary and returns the public ID.
Future<String> uploadProfilePhoto(File imageFile) async {
  final response = await cloudinary.uploadFile(
    CloudinaryFile.fromFile(
      imageFile.path,
      tags: ['guest_profile'],
    ),
  );
  return response.publicId;
}
