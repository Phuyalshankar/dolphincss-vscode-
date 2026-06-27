import * as vscode from 'vscode';

// DolphinCSS UB function को लागि color names
const UB_COLORS = [
  { name: 'red',    desc: '🔴 Red — oklch based' },
  { name: 'blue',   desc: '🔵 Blue — oklch based' },
  { name: 'green',  desc: '🟢 Green — oklch based' },
  { name: 'purple', desc: '🟣 Purple — oklch based' },
  { name: 'orange', desc: '🟠 Orange — oklch based' },
  { name: 'pink',   desc: '🩷 Pink — oklch based' },
  { name: 'teal',   desc: '🩵 Teal — oklch based' },
  { name: 'amber',  desc: '🟡 Amber — oklch based' },
  { name: 'gray',   desc: '⚫ Gray — oklch based' },
];

// Shade 0-255 generate गर्छ
function makeShades(): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = [];
  const highlights = new Set([0, 25, 50, 75, 100, 128, 150, 175, 200, 225, 255]);
  for (let i = 0; i <= 255; i++) {
    const item = new vscode.CompletionItem(String(i), vscode.CompletionItemKind.Value);
    item.detail = `🎨 shade ${i}/255`;
    item.documentation = highlights.has(i)
      ? new vscode.MarkdownString(`**Common shade:** \`${i}\`  \nRange: 0 (darkest) → 255 (lightest)`)
      : new vscode.MarkdownString(`Shade \`${i}\` — oklch lightness scale`);
    item.sortText = highlights.has(i)
      ? `0_${String(i).padStart(3, '0')}`
      : `1_${String(i).padStart(3, '0')}`;
    items.push(item);
  }
  return items;
}

// 0-255 numeric values generate गर्छ
function makeNumeric(label: string): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = [];
  const common = new Set([0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96, 128, 160, 192, 224, 255]);
  for (let i = 0; i <= 255; i++) {
    const item = new vscode.CompletionItem(String(i), vscode.CompletionItemKind.Value);
    item.detail = `📐 ${label}(${i})`;
    item.sortText = common.has(i)
      ? `0_${String(i).padStart(3, '0')}`
      : `1_${String(i).padStart(3, '0')}`;
    items.push(item);
  }
  return items;
}

// Cache — हरपल generate नगरोस्
const SHADES = makeShades();
const NUMERIC = makeNumeric('val');

// Cursor context detect गर्छ — कुन UB function को कुन argument मा छ?
function detectUbArgContext(line: string, charIndex: number): string | null {
  const before = line.substring(0, charIndex);

  // map.  →  map methods suggest
  if (/\bmap\.$/.test(before)) return 'map.methods';

  // map.method(  →  numeric value
  if (/\bmap\.\w+\s*\(\s*$/.test(before)) return 'numeric';

  // oklch('  →  color
  if (/\boklch\s*\(\s*['"]([^'"]*)?$/.test(before)) return 'color';
  // oklch('blue',  →  shade
  if (/\boklch\s*\(\s*['"][^'"]+['"]\s*,\s*$/.test(before)) return 'shade';

  // bg('  →  color
  if (/\bbg\s*\(\s*['"]([^'"]*)?$/.test(before)) return 'color';
  // bg('blue',  →  shade
  if (/\bbg\s*\(\s*['"][^'"]+['"]\s*,\s*$/.test(before)) return 'shade';
  // bg('blue', 128,  →  opacity 0-100
  if (/\bbg\s*\(\s*['"][^'"]+['"]\s*,\s*\d+\s*,\s*$/.test(before)) return 'opacity';

  // text('  →  color
  if (/\btext\s*\(\s*['"]([^'"]*)?$/.test(before)) return 'color';
  // text('blue',  →  shade
  if (/\btext\s*\(\s*['"][^'"]+['"]\s*,\s*$/.test(before)) return 'shade';
  // text('blue', 128,  →  opacity
  if (/\btext\s*\(\s*['"][^'"]+['"]\s*,\s*\d+\s*,\s*$/.test(before)) return 'opacity';

  // gradient functions — first color arg
  if (/\bgradient(?:Vertical|Horizontal|Radial|Triple|Angle)?\s*\(\s*['"]([^'"]*)?$/.test(before)) return 'color';
  // gradient second arg (fromShade)
  if (/\bgradient(?:Vertical|Horizontal|Radial|Triple|Angle)?\s*\(\s*['"][^'"]+['"]\s*,\s*$/.test(before)) return 'shade';
  // gradient third arg (toColor)
  if (/\bgradient(?:Vertical|Horizontal|Radial|Triple|Angle)?\s*\(\s*['"][^'"]+['"]\s*,\s*\d+\s*,\s*['"]([^'"]*)?$/.test(before)) return 'color';
  // gradient fourth arg (toShade)
  if (/\bgradient(?:Vertical|Horizontal|Radial|Triple|Angle)?\s*\(\s*['"][^'"]+['"]\s*,\s*\d+\s*,\s*['"][^'"]+['"]\s*,\s*$/.test(before)) return 'shade';

  // gradientAngle first arg (angle)
  if (/\bgradientAngle\s*\(\s*$/.test(before)) return 'angle';

  // bgFill(direction
  if (/\bbgFill\s*\(\s*['"]([^'"]*)?$/.test(before)) return 'direction';
  // bgFill('left', color
  if (/\bbgFill\s*\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]*)?$/.test(before)) return 'color';
  // bgFill('left', 'blue', shade
  if (/\bbgFill\s*\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*,\s*$/.test(before)) return 'shade';

  // p(, m(, w(, h(, pl(, pr(, pt(, pb(, ml(, mr(, mt(, mb(, px(, py(, mx(, my(
  if (/\b(?:p|m|pl|pr|pt|pb|px|py|ml|mr|mt|mb|mx|my|w|h|scale|span|row)\s*\(\s*$/.test(before)) return 'numeric';

  // border functions
  if (/\bborder[TRBLXYtrblxy]?\s*\(\s*$/.test(before)) return 'numeric';

  // opacity(
  if (/\bopacity\s*\(\s*$/.test(before)) return 'opacity';

  // shadow(
  if (/\bshadow\s*\(\s*['"]?$/.test(before)) return 'shadow';

  // rounded(
  if (/\brounded\s*\(\s*['"]?$/.test(before)) return 'rounded';

  // autoLayout(direction
  if (/\bautoLayout\s*\(\s*['"]([^'"]*)?$/.test(before)) return 'layout-direction';
  // autoLayout('row', alignment
  if (/\bautoLayout\s*\(\s*['"][^'"]*['"]\s*,\s*['"]([^'"]*)?$/.test(before)) return 'layout-alignment';
  // autoLayout('row', 'center', gap
  if (/\bautoLayout\s*\(\s*['"][^'"]*['"]\s*,\s*['"][^'"]*['"]\s*,\s*$/.test(before)) return 'numeric';

  // autoGrid(minWidth, gap
  if (/\bautoGrid\s*\(\s*$/.test(before)) return 'numeric';
  if (/\bautoGrid\s*\(\s*\d+\s*,\s*$/.test(before)) return 'numeric';

  // animate / widthAnim / heightAnim etc.
  if (/\b(?:animate|widthAnim|heightAnim|paddingAnim|marginAnim|opacityAnim|roundedAnim|scaleAnim|infiniteAnim|clickAnim)\s*\(\s*$/.test(before)) return 'anim-prop';

  return null;
}

export class UBCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const line = document.lineAt(position).text;
    const ctx = detectUbArgContext(line, position.character);
    if (!ctx) return [];

    // ── map methods ─────────────────────────────────────────────────────
    if (ctx === 'map.methods') {
      return [
        { n: 'fuel',     d: '⛽ 0=empty(red) → 100=full(green)',  e: 'fuel(value, min?, max?)' },
        { n: 'heat',     d: '🌡️ cold(blue) → hot(red)',            e: 'heat(value, min?, max?)' },
        { n: 'rainbow',  d: '🌈 rainbow spectrum color',           e: 'rainbow(value, min?, max?)' },
        { n: 'coolWarm', d: '❄️🔥 blue → red cool-warm scale',     e: 'coolWarm(value, min?, max?)' },
        { n: 'shade',    d: '🎨 light→dark shade of a color',      e: 'shade(value, min, max, color, sMin?, sMax?)' },
        { n: 'linear',   d: '📐 linear color interpolation',       e: 'linear(v, min, max, startColor, startShade, endColor, endShade)' },
      ].map(({ n, d, e }) => {
        const item = new vscode.CompletionItem(n, vscode.CompletionItemKind.Method);
        item.detail = `🐬 map.${n}()`;
        item.documentation = new vscode.MarkdownString(`${d}\n\n\`map.${e}\``);
        return item;
      });
    }

    // ── color names ─────────────────────────────────────────────────────
    if (ctx === 'color') {
      return UB_COLORS.map(({ name, desc }) => {
        const item = new vscode.CompletionItem(`'${name}'`, vscode.CompletionItemKind.Color);
        item.insertText = name;
        item.detail = desc;
        item.documentation = new vscode.MarkdownString(`oklch color: **${name}**\n\nShade range: 0 (dark) → 255 (light)`);
        item.sortText = `0_${name}`;
        return item;
      });
    }

    // ── shade 0-255 ──────────────────────────────────────────────────────
    if (ctx === 'shade') return SHADES;

    // ── opacity 0-100 ───────────────────────────────────────────────────
    if (ctx === 'opacity') {
      return Array.from({ length: 101 }, (_, i) => {
        const item = new vscode.CompletionItem(String(i), vscode.CompletionItemKind.Value);
        item.detail = `🔆 opacity: ${i}%`;
        item.sortText = String(i).padStart(3, '0');
        return item;
      });
    }

    // ── numeric 0-255 ────────────────────────────────────────────────────
    if (ctx === 'numeric') return NUMERIC;

    // ── shadow values ────────────────────────────────────────────────────
    if (ctx === 'shadow') {
      const named = ['sm', 'md', 'lg', 'xl', '2xl', 'none', 'inner'].map((v) => {
        const item = new vscode.CompletionItem(`'${v}'`, vscode.CompletionItemKind.Value);
        item.insertText = v;
        item.detail = `🌫️ shadow-${v}`;
        item.sortText = `0_${v}`;
        return item;
      });
      return [...named, ...NUMERIC];
    }

    // ── rounded values ───────────────────────────────────────────────────
    if (ctx === 'rounded') {
      return ['full', 'none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((v) => {
        const item = new vscode.CompletionItem(`'${v}'`, vscode.CompletionItemKind.Value);
        item.insertText = v;
        item.detail = `⭕ rounded-${v}`;
        return item;
      });
    }

    // ── direction values ─────────────────────────────────────────────────
    if (ctx === 'direction') {
      return ['left', 'right', 'top', 'bottom'].map((v) => {
        const item = new vscode.CompletionItem(`'${v}'`, vscode.CompletionItemKind.Enum);
        item.insertText = v;
        item.detail = `↔️ direction: ${v}`;
        return item;
      });
    }

    // ── angle values ─────────────────────────────────────────────────────
    if (ctx === 'angle') {
      return ['0', '45', '90', '135', '180', '225', '270', '315'].map((v) => {
        const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Value);
        item.detail = `📐 ${v}°`;
        return item;
      });
    }

    // ── autoLayout direction ─────────────────────────────────────────────
    if (ctx === 'layout-direction') {
      return [
        { v: 'row',  d: '→ Horizontal flex row' },
        { v: 'col',  d: '↓ Vertical flex column' },
        { v: 'wrap', d: '↩ Flex wrap' },
      ].map(({ v, d }) => {
        const item = new vscode.CompletionItem(`'${v}'`, vscode.CompletionItemKind.Enum);
        item.insertText = v;
        item.detail = d;
        return item;
      });
    }

    // ── autoLayout alignment ─────────────────────────────────────────────
    if (ctx === 'layout-alignment') {
      return [
        { v: 'left',    d: 'justify-start / align-start' },
        { v: 'right',   d: 'justify-end / align-end' },
        { v: 'center',  d: 'justify-center / align-center' },
        { v: 'between', d: 'justify-between / space-between' },
        { v: 'around',  d: 'justify-around / space-around' },
        { v: 'evenly',  d: 'justify-evenly / space-evenly' },
        { v: 'start',   d: 'align-items: start' },
        { v: 'end',     d: 'align-items: end' },
        { v: 'stretch', d: 'align-items: stretch' },
      ].map(({ v, d }) => {
        const item = new vscode.CompletionItem(`'${v}'`, vscode.CompletionItemKind.Enum);
        item.insertText = v;
        item.detail = d;
        return item;
      });
    }

    // ── animate prop name ────────────────────────────────────────────────
    if (ctx === 'anim-prop') {
      return ['width', 'height', 'padding', 'margin', 'opacity', 'borderRadius', 'scale', 'fontSize'].map((v) => {
        const item = new vscode.CompletionItem(`'${v}'`, vscode.CompletionItemKind.Property);
        item.insertText = v;
        item.detail = `🎬 animate property: ${v}`;
        return item;
      });
    }

    return [];
  }
}
