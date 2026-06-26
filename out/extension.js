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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fetcher_1 = require("./fetcher");
const provider_1 = require("./provider");
let statusBarItem;
let fetcher;
let provider;
// Extension activate हुँदा चल्छ
async function activate(context) {
    const config = vscode.workspace.getConfiguration('dolphincss');
    const tagsUrl = config.get('tagsUrl', 'https://raw.githubusercontent.com/Phuyalshankar/dolphincss-template/main/config/dolphin-tags.json');
    const markersUrl = config.get('markersUrl', 'https://raw.githubusercontent.com/Phuyalshankar/dolphincss-template/main/config/markers.json');
    const refreshHours = config.get('autoRefreshHours', 24);
    // Cache directory — extension global storage मा
    const cacheDir = path.join(context.globalStorageUri.fsPath, 'cache');
    fetcher = new fetcher_1.DolphinFetcher(cacheDir, tagsUrl, markersUrl, refreshHours);
    provider = new provider_1.DolphinCompletionProvider(fetcher);
    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'dolphincss.refresh';
    statusBarItem.text = '🐬 DolphinCSS';
    statusBarItem.tooltip = 'DolphinCSS IntelliSense — Click to refresh';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // HTML, JSX, TSX, Vue, Svelte, PHP, Astro सबैमा suggestions
    const supportedLanguages = [
        'html', 'javascriptreact', 'typescriptreact',
        'javascript', 'typescript', 'vue', 'svelte', 'astro', 'php'
    ];
    const triggerChars = ['"', "'", ' '];
    for (const lang of supportedLanguages) {
        const disposable = vscode.languages.registerCompletionItemProvider({ language: lang }, provider, ...triggerChars);
        context.subscriptions.push(disposable);
    }
    // Refresh command
    const refreshCmd = vscode.commands.registerCommand('dolphincss.refresh', async () => {
        await refreshData(true);
    });
    context.subscriptions.push(refreshCmd);
    // Startup मा data load
    await refreshData(false);
    // Config change हुँदा auto-reload
    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('dolphincss')) {
            await refreshData(true);
        }
    });
    // Auto-refresh timer (background)
    const refreshMs = refreshHours * 60 * 60 * 1000;
    const timer = setInterval(() => refreshData(false), refreshMs);
    context.subscriptions.push({ dispose: () => clearInterval(timer) });
    console.log('🐬 DolphinCSS IntelliSense activated!');
}
async function refreshData(forceGitHub) {
    statusBarItem.text = '🐬 $(sync~spin) Syncing...';
    try {
        let data;
        if (forceGitHub) {
            data = await fetcher.fetchFromGitHub();
            vscode.window.showInformationMessage(`🐬 DolphinCSS: ${data.classes.length} classes + ${Object.keys(data.markers).length} markers synced from GitHub!`);
        }
        else {
            data = await fetcher.ensureData();
        }
        provider.setData(data);
        if (data) {
            const classCount = data.classes.length;
            const markerCount = Object.keys(data.markers).length;
            statusBarItem.text = `🐬 ${classCount}cls`;
            statusBarItem.tooltip =
                `DolphinCSS IntelliSense\n` +
                    `📦 ${classCount} CSS classes\n` +
                    `🏷️  ${markerCount} markers\n` +
                    `🕐 Updated: ${new Date(data.fetchedAt).toLocaleTimeString()}\n` +
                    `Click to refresh from GitHub`;
        }
        else {
            statusBarItem.text = '🐬 Offline';
            statusBarItem.tooltip = 'DolphinCSS: No data — Click to retry';
        }
    }
    catch (err) {
        statusBarItem.text = '🐬 ⚠️';
        statusBarItem.tooltip = `DolphinCSS Error: ${err.message}`;
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map