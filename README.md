# 🐬 DolphinCSS IntelliSense

> **Zero-friction VS Code IntelliSense for DolphinCSS** — 1,269 CSS class suggestions, 51 dolphin-* markers, full UB function argument autocomplete, and GitHub-powered auto-install.

---

## ✨ Features

### 1. 🎨 CSS Class Autocomplete
Suggests all **1,269 DolphinCSS utility classes** inside `class=""` and `className=""` attributes.

Works in: **HTML, JSX, TSX, Vue, Svelte, Astro, PHP**

```jsx
<div className="|">   {/* ← type here → 1269 suggestions */}
```

### 2. 🐬 dolphin-* Marker Autocomplete
Suggests all **51 `dolphin-*` component markers** when you type `dolphin-`:

```jsx
<div className="dolphin-|">  {/* → dolphin-card, dolphin-modal, dolphin-login ... */}
```

### 3. 🧪 UB Function Argument IntelliSense *(v0.2.0)*
Full autocomplete inside all **UB helper function calls** — no more guessing shade numbers!

```js
bg('|')           // → blue, red, green, purple, orange, pink, teal, amber, gray
bg('blue', |)     // → 0, 25, 50 ... 128 ... 200 ... 255
oklch('red', |)   // → shade 0–255

p(|)              // → 0–255 (padding)
m(|)              // → 0–255 (margin)
w(|)              // → 0–255 (width)
h(|)              // → 0–255 (height)
pl(|), pr(|), pt(|), pb(|)   // padding directions 0–255
ml(|), mr(|), mt(|), mb(|)   // margin directions 0–255

map.              // → fuel, heat, rainbow, coolWarm, shade, linear
map.fuel(|)       // → 0–255

gradient('|')           // → color names
gradient('blue', |)     // → shade 0–255
gradientAngle(|)        // → 0°, 45°, 90°, 135°...

autoLayout('|')         // → 'row', 'col', 'wrap'
autoLayout('row', '|')  // → 'left', 'center', 'between', 'around'...

rounded('|')      // → 'full', 'sm', 'md', 'lg', 'xl', '2xl'
shadow('|')       // → 'sm', 'md', 'lg', 'xl', '2xl', 'none'
opacity(|)        // → 0–100
```

### 3b. 🎯 `ub('...')` Dynamic Class Suggestions *(v0.2.1)*
Inside `ub('...')` string arguments, get full **0–255 dynamic class names**:

```js
ub('|')           // → bg-blue-128, text-red-64, p-16, m-32, w-255, gap-8 ...
ub('bg-blue-|')   // → bg-blue-0 ... bg-blue-255
ub('p-|')         // → p-0 ... p-255
```

### 4. 🔄 Auto-Sync from GitHub
Fetches the latest classes and markers from the DolphinCSS template repository every **24 hours** automatically. Click the `🐬` status bar item to refresh instantly.

### 5. ⚡ Auto-Install via `vscode-init` Marker
No need to install this extension manually! Just add the `vscode-init` marker to any component:

```jsx
<div className="vscode-init" style={{display:'none'}}></div>
```

When `npm run dev` runs, the Vite plugin will:
1. Download this extension from GitHub
2. Install it automatically via `code --install-extension`
3. Set up `.vscode/` IntelliSense config
4. Remove the marker from your file

---

## ⚙️ Configuration

Customize in VS Code `settings.json`:

| Setting | Default | Description |
|---|---|---|
| `dolphincss.tagsUrl` | GitHub raw URL | URL for CSS classes + tags JSON |
| `dolphincss.markersUrl` | GitHub raw URL | URL for dolphin-* markers JSON |
| `dolphincss.autoRefreshHours` | `24` | Auto-refresh interval in hours |
| `dolphincss.enableClassSuggestions` | `true` | Toggle CSS class suggestions |
| `dolphincss.enableMarkerSuggestions` | `true` | Toggle marker suggestions |

---

## 📦 Manual Install

**Option A — VSIX (recommended):**
```bash
code --install-extension dolphincss-intellisense-0.2.1.vsix
```

**Option B — Download from GitHub Releases:**
```bash
curl -L -o dolphincss-intellisense.vsix https://github.com/Phuyalshankar/dolphincss-vscode-/releases/download/v0.2.1/dolphincss-intellisense-0.2.1.vsix
code --install-extension dolphincss-intellisense.vsix
```

---

## 📋 Changelog

### v0.2.1
- ✨ **Dynamic 0–255 class suggestions inside `ub('...')`** — `bg-blue-128`, `p-16`, `m-32`, `w-255`, etc.
- ✨ Color range classes: `bg-*`, `text-*`, `border-color-*`, `shadow-color-*` (9 colors × 256 shades)
- ✨ Spacing/size classes: `p`, `m`, `w`, `h`, `gap`, `rounded`, `opacity`, and more

### v0.2.0
- ✨ **UB Function Argument IntelliSense** — shade 0-255, color names, map methods, layout options
- ✨ `ub('...')` string argument CSS class suggestions
- ⚡ Auto-install via `vscode-init` marker now installs v0.2.1

### v0.1.0
- 🎉 Initial release
- CSS class suggestions (1,269 classes)
- dolphin-* marker suggestions (51 markers)
- GitHub auto-sync every 24 hours

---

## License

MIT — Built with ❤️ in Nepal 🇳🇵
