"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DolphinCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
// class="..." वा className="..." भित्र cursor छ कि check गर्छ
function getClassContext(document, position) {
    const lineText = document.lineAt(position).text;
    const charIndex = position.character;
    // cursor अगाडिको text
    const textBefore = lineText.substring(0, charIndex);
    // class="..." वा className="..." pattern detect
    const classMatch = textBefore.match(/(?:class|className)=["']([^"']*)$/);
    if (!classMatch) {
        return { inClass: false, inMarker: false, partial: '' };
    }
    const currentValue = classMatch[1];
    // अन्तिम space पछिको word = partial input
    const parts = currentValue.split(/\s+/);
    const partial = parts[parts.length - 1] ?? '';
    // dolphin- बाट सुरु भएको छ?
    const inMarker = partial.startsWith('dolphin-');
    return { inClass: true, inMarker, partial };
}
class DolphinCompletionProvider {
    constructor(fetcher) {
        this.data = null;
        this.fetcher = fetcher;
    }
    setData(data) {
        this.data = data;
    }
    provideCompletionItems(document, position, _token, _context) {
        if (!this.data)
            return [];
        const config = vscode.workspace.getConfiguration('dolphincss');
        const enableClass = config.get('enableClassSuggestions', true);
        const enableMarker = config.get('enableMarkerSuggestions', true);
        const ctx = getClassContext(document, position);
        if (!ctx.inClass)
            return [];
        const items = [];
        // 1. dolphin-* marker suggestions
        if (enableMarker && (ctx.inMarker || ctx.partial === '')) {
            for (const [markerName, markerData] of Object.entries(this.data.markers)) {
                const item = new vscode.CompletionItem(markerName, vscode.CompletionItemKind.Module);
                item.detail = `🐬 DolphinCSS Marker`;
                item.documentation = new vscode.MarkdownString(`**${markerName}**\n\n` +
                    `Injects \`${markerData.templateFile}\` template\n\n` +
                    (markerData.addClasses ? `Extra classes: \`${markerData.addClasses}\`` : ''));
                item.filterText = markerName;
                item.sortText = `0_${markerName}`; // markers पहिले देखाउँछ
                items.push(item);
            }
            // tags (dolphin-* component tags)
            for (const tag of this.data.tags) {
                if (tag.name.startsWith('dolphin-') && !this.data.markers[tag.name]) {
                    const item = new vscode.CompletionItem(tag.name, vscode.CompletionItemKind.Class);
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
                const item = new vscode.CompletionItem(cls.name, vscode.CompletionItemKind.Value);
                item.detail = `DolphinCSS`;
                item.documentation = cls.description ?? 'DolphinCSS utility class';
                item.sortText = `2_${cls.name}`;
                items.push(item);
            }
        }
        return items;
    }
}
exports.DolphinCompletionProvider = DolphinCompletionProvider;
//# sourceMappingURL=provider.js.map