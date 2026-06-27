import * as vscode from 'vscode';
import { DolphinFetcher, FetchedData } from './fetcher';

// ── Dynamic class generators for ub('...') context ──────────────────────────

const UB_COLORS = ['blue', 'red', 'green', 'purple', 'orange', 'pink', 'teal', 'amber', 'gray'];

// bg-blue-0 ... bg-blue-255, text-red-128 etc. generate गर्छ
function buildColorRangeItems(): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = [];
  const prefixes = [
    { p: 'bg',           emoji: '🎨', label: 'background' },
    { p: 'text',         emoji: '✏️', label: 'text color' },
    { p: 'border-color', emoji: '🔲', label: 'border color' },
    { p: 'shadow-color', emoji: '🌫️', label: 'shadow color' },
  ];
  for (const { p, emoji, label } of prefixes) {
    for (const color of UB_COLORS) {
      for (let shade = 0; shade <= 255; shade++) {
        const name = `${p}-${color}-${shade}`;
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Color);
        item.detail = `${emoji} ${label}: ${color} shade ${shade}/255`;
        item.documentation = new vscode.MarkdownString(
          `**${name}**\n\n${emoji} \`${color}\` — shade \`${shade}\` (0=darkest, 255=lightest)\n\n*Usage:* \`ub('${name}')\``
        );
        item.sortText = `3_${p}_${color}_${String(shade).padStart(3, '0')}`;
        items.push(item);
      }
    }
  }
  return items;
}

// p-0 ... p-255, m-0...255, w, h, pl, pr, etc. generate गर्छ
function buildSpacingItems(): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = [];
  const props: Array<{ prefix: string; emoji: string; label: string }> = [
    { prefix: 'p',  emoji: '📦', label: 'padding' },
    { prefix: 'pt', emoji: '📦', label: 'padding-top' },
    { prefix: 'pb', emoji: '📦', label: 'padding-bottom' },
    { prefix: 'pl', emoji: '📦', label: 'padding-left' },
    { prefix: 'pr', emoji: '📦', label: 'padding-right' },
    { prefix: 'px', emoji: '📦', label: 'padding-x (left+right)' },
    { prefix: 'py', emoji: '📦', label: 'padding-y (top+bottom)' },
    { prefix: 'm',  emoji: '📐', label: 'margin' },
    { prefix: 'mt', emoji: '📐', label: 'margin-top' },
    { prefix: 'mb', emoji: '📐', label: 'margin-bottom' },
    { prefix: 'ml', emoji: '📐', label: 'margin-left' },
    { prefix: 'mr', emoji: '📐', label: 'margin-right' },
    { prefix: 'mx', emoji: '📐', label: 'margin-x (left+right)' },
    { prefix: 'my', emoji: '📐', label: 'margin-y (top+bottom)' },
    { prefix: 'w',  emoji: '↔️', label: 'width' },
    { prefix: 'h',  emoji: '↕️', label: 'height' },
    { prefix: 'min-w', emoji: '↔️', label: 'min-width' },
    { prefix: 'min-h', emoji: '↕️', label: 'min-height' },
    { prefix: 'max-w', emoji: '↔️', label: 'max-width' },
    { prefix: 'max-h', emoji: '↕️', label: 'max-height' },
    { prefix: 'gap',   emoji: '🔲', label: 'gap' },
    { prefix: 'gap-x', emoji: '🔲', label: 'column gap' },
    { prefix: 'gap-y', emoji: '🔲', label: 'row gap' },
    { prefix: 'rounded',  emoji: '⭕', label: 'border-radius' },
    { prefix: 'border',   emoji: '🔲', label: 'border-width' },
    { prefix: 'opacity',  emoji: '🔆', label: 'opacity (0-100)' },
    { prefix: 'z',        emoji: '📚', label: 'z-index' },
    { prefix: 'text-size',emoji: '🔤', label: 'font-size' },
  ];
  for (const { prefix, emoji, label } of props) {
    const maxVal = prefix === 'opacity' ? 100 : 255;
    for (let i = 0; i <= maxVal; i++) {
      const name = `${prefix}-${i}`;
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Value);
      item.detail = `${emoji} ${label}: ${i}`;
      item.documentation = new vscode.MarkdownString(
        `**${name}**\n\n${emoji} \`${label}\` = \`${i}\`\n\n*Usage:* \`ub('${name}')\``
      );
      item.sortText = `4_${prefix}_${String(i).padStart(3, '0')}`;
      items.push(item);
    }
  }
  return items;
}

// Cache — एकपटक generate गरेर reuse गर्छ
let _colorRangeCache: vscode.CompletionItem[] | null = null;
let _spacingCache: vscode.CompletionItem[] | null = null;

function getColorRangeItems(): vscode.CompletionItem[] {
  if (!_colorRangeCache) _colorRangeCache = buildColorRangeItems();
  return _colorRangeCache;
}

function getSpacingItems(): vscode.CompletionItem[] {
  if (!_spacingCache) _spacingCache = buildSpacingItems();
  return _spacingCache;
}

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
    // ub('...') भित्र cursor छ — static + dynamic class suggestions देखाउने
    if (ctx.inUb) {
      if (!enableClass) return [];

      // 1. Static DolphinCSS 1269 classes (highest priority)
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
        item.sortText = `1_${cls.name}`;
        items.push(item);
      }

      // 2. Dynamic bg-{color}-{0-255}, text-{color}-{0-255} etc.
      items.push(...getColorRangeItems());

      // 3. Dynamic p-{0-255}, m-{0-255}, w-{0-255}, h-{0-255} etc.
      items.push(...getSpacingItems());

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
