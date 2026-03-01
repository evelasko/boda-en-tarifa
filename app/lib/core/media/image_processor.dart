import 'dart:io';
import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Prepares images for upload: strips EXIF, resizes, and compresses to JPEG.
class ImageProcessor {
  static const int _maxDimension = 2048;
  static const int _jpegQuality = 85;

  /// Processes an image file: strips EXIF, resizes to max 2048px on longest
  /// edge, and re-encodes as JPEG at 85% quality.
  ///
  /// Returns the path to the processed file in a temporary directory.
  Future<String> process(String sourcePath) async {
    final bytes = await File(sourcePath).readAsBytes();
    var image = img.decodeImage(bytes);
    if (image == null) {
      throw const FormatException('Unable to decode image');
    }

    // Strip EXIF by decoding (metadata is already dropped by decodeImage
    // when we re-encode below — no extra step needed).

    // Resize if either dimension exceeds the max.
    if (image.width > _maxDimension || image.height > _maxDimension) {
      if (image.width >= image.height) {
        image = img.copyResize(image, width: _maxDimension);
      } else {
        image = img.copyResize(image, height: _maxDimension);
      }
    }

    // Re-encode as JPEG (strips all EXIF in the process).
    final jpegBytes = Uint8List.fromList(
      img.encodeJpg(image, quality: _jpegQuality),
    );

    // Write to a temp file.
    final tempDir = await getTemporaryDirectory();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final fileName = '${p.basenameWithoutExtension(sourcePath)}_$timestamp.jpg';
    final outFile = File(p.join(tempDir.path, fileName));
    await outFile.writeAsBytes(jpegBytes);

    return outFile.path;
  }
}
