import * as vscode from 'vscode';
import { DolphinFetcher, FetchedData } from './fetcher';

// class="..." वा className="..." भित्र cursor छ कि check गर्छ
function getClassContext(
  document: vscode.TextDocument,
  position: vscode.Position
): { inClass: boolean; inMarker: boolean; inUb: boolean; partial: string } {
  const lineText = document.lineAt(position).text;
  const charIndex = position.character;

  // cursor अगाडिको text
  const textBefore = lineText.substring(0, charIndex);

  // ub('...') वा ub("...") pattern detect — cursor string भित्र छ?
  // जस्तै: ub('filled primary |') वा ub("glass glow |")
  const ubMatch = textBefore.match(/\bub\s*\(\s*['"]([^'"]*?)$/);
  if (ubMatch) {
    const currentValue = ubMatch[1];
    const parts = currentValue.split(/\s+/);
    const partial = parts[parts.length - 1] ?? '';
    return { inClass: true, inMarker: false, inUb: true, partial };
  }

  // class="..." वा className="..." pattern detect
  const classMatch = textBefore.match(/(?:class|className)=[\"']([^\"']*)$/);
  if (!classMatch) {
    return { inClass: false, inMarker: false, inUb: false, partial: '' };
  }

  const currentValue = classMatch[1];
  // अन्तिम space पछिको word = partial input
  const parts = currentValue.split(/\s+/);
  const partial = parts[parts.length - 1] ?? '';

  // dolphin- बाट सुरु भएको छ?
  const inMarker = partial.startsWith('dolphin-');

  return { inClass: true, inMarker, inUb: false, partial };
}

export class DolphinCompletionProvider implements vscode.CompletionItemProvider {
  private fetcher: DolphinFetcher;
  private data: FetchedData | null = null;

  constructor(fetcher: DolphinFetcher) {
    this.fetcher = fetcher;
  }

  setData(data: FetchedData | null) {
    this.data = data;
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] {
    if (!this.data) return [];

    const config = vscode.workspace.getConfiguration('dolphincss');
    const enableClass = config.get<boolean>('enableClassSuggestions', true);
    const enableMarker = config.get<boolean>('enableMarkerSuggestions', true);

    const ctx = getClassContext(document, position);
    if (!ctx.inClass) return [];

    const items: vscode.CompletionItem[] = [];

    // ── UB string argument mode ──────────────────────────────────────────
    // ub('...') भित्र cursor छ — CSS class suggestions मात्र देखाउने
    if (ctx.inUb) {
      if (!enableClass) return [];
      for (const cls of this.data.classes) {
        const item = new vscode.CompletionItem(
          cls.name,
          vscode.CompletionItemKind.Value
        );
        item.detail = `🐬 ub() — DolphinCSS class`;
        item.documentation = new vscode.MarkdownString(
          `**${cls.name}**\n\n` +
          (cls.description ?? 'DolphinCSS utility class') + '\n\n' +
          `*Usage:* \`ub('${cls.name}')\``
        );
        item.sortText = `2_${cls.name}`;
        items.push(item);
      }
      return items;
    }

    // ── className / class attribute mode ────────────────────────────────

    // 1. dolphin-* marker suggestions
    if (enableMarker && (ctx.inMarker || ctx.partial === '')) {
      for (const [markerName, markerData] of Object.entries(this.data.markers)) {
        const item = new vscode.CompletionItem(
          markerName,
          vscode.CompletionItemKind.Module
        );
        item.detail = `🐬 DolphinCSS Marker`;
        item.documentation = new vscode.MarkdownString(
          `**${markerName}**\n\n` +
          `Injects \`${markerData.templateFile}\` template\n\n` +
          (markerData.addClasses ? `Extra classes: \`${markerData.addClasses}\`` : '')
        );
        item.filterText = markerName;
        item.sortText = `0_${markerName}`; // markers पहिले देखाउँछ
        items.push(item);
      }

      // tags (dolphin-* component tags)
      for (const tag of this.data.tags) {
        if (tag.name.startsWith('dolphin-') && !this.data.markers[tag.name]) {
          const item = new vscode.CompletionItem(
            tag.name,
            vscode.CompletionItemKind.Class
          );
          item.detail = `🐬 DolphinCSS Component`;
          item.documentation = tag.description ?? '';
          item.sortText = `1_${tag.name}`;
          items.push(item);
        }
      }
    }

    // 2. CSS class suggestions
    if (enableClass && !ctx.inMarker) {
      for (const cls of this.data.classes) {
        const item = new vscode.CompletionItem(
          cls.name,
          vscode.CompletionItemKind.Value
        );
        item.detail = `DolphinCSS`;
        item.documentation = cls.description ?? 'DolphinCSS utility class';
        item.sortText = `2_${cls.name}`;
        items.push(item);
      }
    }

    return items;
  }
}
