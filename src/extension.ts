import * as vscode from 'vscode';
import * as path from 'path';
import { DolphinFetcher } from './fetcher';
import { DolphinCompletionProvider } from './provider';

let statusBarItem: vscode.StatusBarItem;
let fetcher: DolphinFetcher;
let provider: DolphinCompletionProvider;

// Extension activate हुँदा चल्छ
export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('dolphincss');

  const tagsUrl = config.get<string>(
    'tagsUrl',
    'https://raw.githubusercontent.com/Phuyalshankar/dolphincss-template/main/config/dolphin-tags.json'
  );
  const markersUrl = config.get<string>(
    'markersUrl',
    'https://raw.githubusercontent.com/Phuyalshankar/dolphincss-template/main/config/markers.json'
  );
  const refreshHours = config.get<number>('autoRefreshHours', 24);

  // Cache directory — extension global storage मा
  const cacheDir = path.join(context.globalStorageUri.fsPath, 'cache');

  fetcher = new DolphinFetcher(cacheDir, tagsUrl, markersUrl, refreshHours);
  provider = new DolphinCompletionProvider(fetcher);

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

  const triggerChars = ['"', "'", ' ', '('];

  for (const lang of supportedLanguages) {
    const disposable = vscode.languages.registerCompletionItemProvider(
      { language: lang },
      provider,
      ...triggerChars
    );
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

async function refreshData(forceGitHub: boolean) {
  statusBarItem.text = '🐬 $(sync~spin) Syncing...';

  try {
    let data;
    if (forceGitHub) {
      data = await fetcher.fetchFromGitHub();
      vscode.window.showInformationMessage(
        `🐬 DolphinCSS: ${data.classes.length} classes + ${Object.keys(data.markers).length} markers synced from GitHub!`
      );
    } else {
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
    } else {
      statusBarItem.text = '🐬 Offline';
      statusBarItem.tooltip = 'DolphinCSS: No data — Click to retry';
    }
  } catch (err: any) {
    statusBarItem.text = '🐬 ⚠️';
    statusBarItem.tooltip = `DolphinCSS Error: ${err.message}`;
  }
}

export function deactivate() {}
