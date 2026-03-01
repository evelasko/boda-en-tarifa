import 'package:cloudinary_public/cloudinary_public.dart';

import 'package:boda_en_tarifa_app/core/cloudinary/cloudinary_config.dart';

/// Wraps Cloudinary unsigned uploads for the wedding feed.
class CloudinaryUploader {
  static const String _uploadFolder = 'wedding';
  static const int maxFileSizeBytes = 15 * 1024 * 1024; // 15 MB

  /// Uploads a local file to Cloudinary and returns the public ID.
  ///
  /// Throws if the upload fails or the file exceeds 15 MB.
  Future<String> upload(String filePath) async {
    final response = await cloudinary.uploadFile(
      CloudinaryFile.fromFile(
        filePath,
        folder: _uploadFolder,
        tags: ['feed_post'],
      ),
    );
    return response.publicId;
  }
}
