import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../models/chat_message.dart';
import '../../services/copilot_service.dart';
import '../../shared/widgets/citation_chip.dart';

class CopilotScreen extends StatefulWidget {
  final String currentLang;

  const CopilotScreen({super.key, required this.currentLang});

  @override
  State<CopilotScreen> createState() => _CopilotScreenState();
}

class _CopilotScreenState extends State<CopilotScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _send([String? presetText]) {
    final text = presetText ?? _inputController.text;
    if (text.trim().isEmpty) return;
    _inputController.clear();
    context.read<CopilotService>().sendMessage(text, lang: widget.currentLang);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations(widget.currentLang);
    final copilot = context.watch<CopilotService>();

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
              child: const Icon(Icons.auto_awesome, size: 18, color: BrandColors.primaryTeal),
            ),
            const SizedBox(width: 8),
            Text(t.t('copilot_title')),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Reset Conversation',
            onPressed: () => copilot.reset(),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Header Info Bar
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFFF0FDFA),
              child: Row(
                children: [
                  const Icon(Icons.verified_outlined, size: 14, color: BrandColors.primaryTeal),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      t.t('copilot_sub'),
                      style: const TextStyle(
                        fontSize: 11,
                        color: BrandColors.primaryDark,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            // Messages List
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                itemCount: copilot.messages.length + (copilot.isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == copilot.messages.length && copilot.isLoading) {
                    return _buildLoadingBubble();
                  }
                  final msg = copilot.messages[index];
                  return _buildMessageBubble(msg);
                },
              ),
            ),

            // Suggested Prompts Row
            if (copilot.messages.length <= 2)
              Container(
                height: 38,
                margin: const EdgeInsets.only(bottom: 6),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _buildPromptChip(t.t('copilot_prompt_1')),
                    const SizedBox(width: 8),
                    _buildPromptChip(t.t('copilot_prompt_2')),
                    const SizedBox(width: 8),
                    _buildPromptChip(t.t('copilot_prompt_3')),
                  ],
                ),
              ),

            // Chat Input Box
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: BrandColors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: t.t('copilot_placeholder'),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(
                      color: BrandColors.vibrantGreen,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                      onPressed: copilot.isLoading ? null : () => _send(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPromptChip(String prompt) {
    return ActionChip(
      label: Text(
        prompt,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: BrandColors.primaryDark),
      ),
      backgroundColor: Colors.white,
      side: const BorderSide(color: Color(0xFF99F6E4)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onPressed: () => _send(prompt),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    final isUser = msg.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: BrandColors.primaryTeal.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.shield_outlined, size: 16, color: BrandColors.primaryTeal),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? BrandColors.primaryTeal : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                border: Border.all(
                  color: isUser ? Colors.transparent : BrandColors.border,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isUser)
                    Text(
                      msg.text,
                      style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                    )
                  else
                    MarkdownBody(
                      data: msg.text,
                      styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                        p: const TextStyle(fontSize: 13, height: 1.4, color: BrandColors.darkSlate),
                        h1: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
                        h2: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
                        h3: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
                        code: const TextStyle(
                          backgroundColor: Color(0xFFF1F5F9),
                          fontFamily: 'monospace',
                          fontSize: 12,
                          color: Color(0xFF0F766E),
                        ),
                      ),
                    ),
                  if (msg.citations.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    const Divider(height: 1),
                    const SizedBox(height: 8),
                    const Text(
                      'VERIFIED POLICY CITATIONS:',
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        color: BrandColors.mutedText,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: msg.citations
                          .map(
                            (c) => CitationChip(
                              documentTitle: c.documentTitle,
                              pageNumber: c.pageNumber,
                              ruleTag: c.ruleTag,
                              onTap: () => _showCitationDetail(c),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildLoadingBubble() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: BrandColors.primaryTeal.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shield_outlined, size: 16, color: BrandColors.primaryTeal),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: BrandColors.border),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: BrandColors.primaryTeal),
                ),
                SizedBox(width: 8),
                Text(
                  'Synthesizing policy guidance...',
                  style: TextStyle(fontSize: 12, color: BrandColors.mutedText),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCitationDetail(Citation c) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.verified, color: BrandColors.primaryTeal, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    c.documentTitle,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: BrandColors.border),
              ),
              child: Text(
                c.textSnippet,
                style: const TextStyle(fontSize: 13, height: 1.4, color: BrandColors.darkSlate),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'Page: ${c.pageNumber}${c.ruleTag != null ? ' · Rule Tag: ${c.ruleTag}' : ''}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: BrandColors.mutedText),
            ),
          ],
        ),
      ),
    );
  }
}
