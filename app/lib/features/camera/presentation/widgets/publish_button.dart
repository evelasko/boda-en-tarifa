import 'package:flutter/material.dart';

class PublishButton extends StatelessWidget {
  const PublishButton({
    super.key,
    required this.selectedCount,
    required this.isLoading,
    required this.onPublish,
  });

  final int selectedCount;
  final bool isLoading;
  final VoidCallback? onPublish;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: FilledButton.icon(
          onPressed: onPublish,
          icon: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.black,
                  ),
                )
              : const Icon(Icons.publish),
          label: Text(
            selectedCount == 0
                ? 'Selecciona fotos para publicar'
                : 'Publicar $selectedCount foto(s) al feed',
          ),
          style: FilledButton.styleFrom(
            minimumSize: const Size(double.infinity, 56),
            backgroundColor:
                onPublish != null ? Colors.amber : Colors.grey.shade800,
            foregroundColor: Colors.black,
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
