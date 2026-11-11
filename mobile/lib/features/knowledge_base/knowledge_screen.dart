import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/contrast_calculator.dart';
import '../../localization/app_localizations.dart';

class KnowledgeScreen extends StatefulWidget {
  final String currentLang;

  const KnowledgeScreen({super.key, required this.currentLang});

  @override
  State<KnowledgeScreen> createState() => _KnowledgeScreenState();
}

class _KnowledgeScreenState extends State<KnowledgeScreen> {
  final _apiClient = ApiClient();
  List<dynamic> _docs = [];
  List<dynamic> _tokens = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final docRes = await _apiClient.get(ApiConstants.guidelines);
      if (docRes is List) _docs = docRes;
    } catch (_) {}

    try {
      final tokenRes = await _apiClient.get(ApiConstants.visualTokens);
      if (tokenRes is List) _tokens = tokenRes;
    } catch (_) {}

    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations(widget.currentLang);

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
              child: const Icon(Icons.menu_book_outlined, size: 18, color: BrandColors.primaryTeal),
            ),
            const SizedBox(width: 8),
            Text(t.t('nav_knowledge')),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text(
                    'Indexed Brand Guidelines & Playbooks',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Chunked and embedded for verbatim semantic citations in Copilot and Scanner.',
                    style: TextStyle(fontSize: 12, color: BrandColors.mutedText),
                  ),
                  const SizedBox(height: 12),

                  if (_docs.isEmpty)
                    _buildPlaceholderCard('Brand Voice & Tone Playbook v3.2', 'Tone of voice, prohibited superlatives, and claims guidelines', '8 chunks indexed')
                  else
                    ..._docs.map(
                      (d) => _buildDocTile(d['title'] ?? 'Guideline Document', d['docType'] ?? 'Policy', '${d['chunkCount'] ?? 1} chunks'),
                    ),

                  const SizedBox(height: 24),
                  const Text(
                    'Approved Brand Tokens & Hex Values',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
                  ),
                  const SizedBox(height: 12),

                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _tokens.isNotEmpty
                        ? _tokens.map((tok) {
                            final hex = (tok['hex'] ?? '#0F766E').toString();
                            final name = (tok['name'] ?? tok['tokenName'] ?? 'Brand Color').toString();
                            return _buildTokenChip(name, hex, ContrastCalculator.parseHex(hex));
                          }).toList()
                        : [
                            _buildTokenChip('Shield Teal', '#0F766E', const Color(0xFF0F766E)),
                            _buildTokenChip('Accent Mint', '#14B8A6', const Color(0xFF14B8A6)),
                            _buildTokenChip('Brand Navy', '#0F172A', const Color(0xFF0F172A)),
                            _buildTokenChip('Warning Amber', '#D97706', const Color(0xFFD97706)),
                            _buildTokenChip('Critical Coral', '#DC2626', const Color(0xFFDC2626)),
                          ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDocTile(String title, String type, String chunks) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BrandColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.description_outlined, color: BrandColors.primaryTeal, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                Text('$type · $chunks', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          const Icon(Icons.check_circle, size: 16, color: BrandColors.successGreen),
        ],
      ),
    );
  }

  Widget _buildPlaceholderCard(String title, String desc, String meta) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BrandColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified, color: BrandColors.primaryTeal, size: 18),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 4),
          Text(desc, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 6),
          Text(meta, style: const TextStyle(fontSize: 10, color: BrandColors.primaryTeal, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildTokenChip(String name, String hex, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: BrandColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.black12),
            ),
          ),
          const SizedBox(width: 6),
          Text('$name ($hex)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
