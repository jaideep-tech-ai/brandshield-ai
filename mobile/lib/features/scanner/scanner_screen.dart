import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../models/submission.dart';
import '../../services/scanner_service.dart';
import '../../shared/widgets/brand_button.dart';

class ScannerScreen extends StatefulWidget {
  final Function(int) onNavigateTab;
  final String currentLang;

  const ScannerScreen({
    super.key,
    required this.onNavigateTab,
    required this.currentLang,
  });

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final _titleController = TextEditingController(text: 'Q3 Enterprise Growth Campaign');
  final _copyController = TextEditingController(
    text: 'Guaranteed 100% safe cloud migration with the world\'s best AI intelligence.',
  );
  XFile? _selectedImage;
  Submission? _lastScanResult;

  @override
  void dispose() {
    _titleController.dispose();
    _copyController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source, maxWidth: 1200);
      if (picked != null) {
        setState(() => _selectedImage = picked);
      }
    } catch (e) {
      debugPrint('Image picker error: $e');
    }
  }

  Future<void> _runScan() async {
    if (_copyController.text.trim().isEmpty && _selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter copy text or pick a banner creative')),
      );
      return;
    }

    final scanner = context.read<ScannerService>();
    try {
      final result = await scanner.runScan(
        title: _titleController.text.trim().isNotEmpty
            ? _titleController.text.trim()
            : 'Pre-Flight Draft',
        copyText: _copyController.text.trim(),
        imageUrl: _selectedImage?.path,
      );

      setState(() => _lastScanResult = result);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Audit scan failed: $e'),
            backgroundColor: BrandColors.criticalRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations(widget.currentLang);
    final scanner = context.watch<ScannerService>();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: BrandColors.primaryTeal.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.document_scanner_outlined, size: 18, color: BrandColors.primaryTeal),
            ),
            const SizedBox(width: 8),
            Text(t.t('scanner_title')),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Info Pill
            Text(
              t.t('scanner_sub'),
              style: const TextStyle(fontSize: 12, color: BrandColors.mutedText, height: 1.4),
            ),
            const SizedBox(height: 16),

            // Title Field
            Text(
              'Campaign / Deliverable Title',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(hintText: 'e.g. Summer Launch Social Creative'),
            ),
            const SizedBox(height: 16),

            // Copy Field
            Text(
              t.t('scanner_copy_label'),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _copyController,
              minLines: 3,
              maxLines: 6,
              decoration: InputDecoration(
                hintText: t.t('scanner_copy_hint'),
              ),
            ),
            const SizedBox(height: 16),

            // Banner Image Upload Section
            Text(
              t.t('scanner_image_label'),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.border),
              ),
              child: Column(
                children: [
                  if (_selectedImage != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.image, color: BrandColors.primaryTeal, size: 24),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _selectedImage!.name,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 18, color: Colors.red),
                          onPressed: () => setState(() => _selectedImage = null),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                  ],
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      OutlinedButton.icon(
                        icon: const Icon(Icons.photo_library_outlined, size: 16),
                        label: Text(t.t('scanner_gallery')),
                        onPressed: () => _pickImage(ImageSource.gallery),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.camera_alt_outlined, size: 16),
                        label: Text(t.t('scanner_camera')),
                        onPressed: () => _pickImage(ImageSource.camera),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Audit Scan CTA
            BrandButton(
              text: t.t('scanner_run_audit'),
              onPressed: scanner.isScanning ? null : _runScan,
              isLoading: scanner.isScanning,
              icon: Icons.speed,
            ),

            if (scanner.isScanning) ...[
              const SizedBox(height: 16),
              LinearProgressIndicator(
                value: scanner.scanProgress > 0 ? scanner.scanProgress : null,
                backgroundColor: BrandColors.border,
                valueColor: const AlwaysStoppedAnimation<Color>(BrandColors.vibrantGreen),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  t.t('scanner_scanning'),
                  style: const TextStyle(fontSize: 11, color: BrandColors.mutedText),
                ),
              ),
            ],

            // Scan Results Card
            if (_lastScanResult != null) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: (_lastScanResult!.complianceScore ?? 100) >= 85
                        ? const Color(0xFFA7F3D0)
                        : const Color(0xFFFECACA),
                    width: 1.5,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          t.t('scanner_score'),
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: (_lastScanResult!.complianceScore ?? 100) >= 85
                                ? const Color(0xFFECFDF5)
                                : const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${_lastScanResult!.complianceScore ?? 85}/100',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: (_lastScanResult!.complianceScore ?? 100) >= 85
                                  ? BrandColors.successGreen
                                  : BrandColors.criticalRed,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Detected ${_lastScanResult!.findings.length} findings (${_lastScanResult!.criticalCount} critical).',
                      style: const TextStyle(fontSize: 12, color: BrandColors.mutedText),
                    ),
                    const SizedBox(height: 14),
                    BrandButton(
                      text: 'View Findings & Apply Fixes',
                      variant: BrandButtonVariant.outline,
                      icon: Icons.checklist_rtl,
                      onPressed: () => widget.onNavigateTab(3), // Jump to Findings
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
