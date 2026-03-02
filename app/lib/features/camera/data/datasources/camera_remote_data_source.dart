import 'dart:io';

import 'package:cloudinary_public/cloudinary_public.dart';

import 'package:boda_en_tarifa_app/core/cloudinary/cloudinary_config.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/media/image_processor.dart';

abstract class CameraRemoteDataSource {
  /// Uploads a processed image to the private camera folder on Cloudinary.
  /// Returns the Cloudinary public ID on success.
  Future<String> uploadExposure({
    required String filePath,
    required String userUid,
  });
}

class CameraRemoteDataSourceImpl implements CameraRemoteDataSource {
  final ImageProcessor _imageProcessor;

  CameraRemoteDataSourceImpl({required ImageProcessor imageProcessor})
      : _imageProcessor = imageProcessor;

  @override
  Future<String> uploadExposure({
    required String filePath,
    required String userUid,
  }) async {
    try {
      final processedPath = await _imageProcessor.process(filePath);

      final response = await cloudinary.uploadFile(
        CloudinaryFile.fromFile(
          processedPath,
          folder: 'wedding/private/$userUid',
          tags: ['exposure_backup'],
        ),
      );

      // Clean up processed temp file
      final processedFile = File(processedPath);
      if (await processedFile.exists()) await processedFile.delete();

      return response.publicId;
    } catch (e) {
      throw ServerException('Error al subir exposición: $e');
    }
  }
}
