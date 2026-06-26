# DolphinCSS IntelliSense

Tailwind-like autocomplete and helper tools for **DolphinCSS** in VS Code.

## Features

- **CSS Class Autocomplete**: Automatically suggests utility classes from DolphinCSS.
- **dolphin-\* Marker Autocomplete**: Suggests DolphinCSS markers (`dolphin-tag`, `dolphin-component`, etc.) inside your HTML, JSX, TSX, Vue, and Svelte templates.
- **Auto-Sync**: Automatically fetches the latest classes and markers from your repository (defaults to the standard templates) every 24 hours, or you can trigger it manually.
- **Hover Previews**: Hover over a class to see its description and usage.

## Configuration

You can customize the extension behavior by updating these settings in your VS Code `settings.json`:

- `dolphincss.tagsUrl`: The URL to fetch classes and tags from (defaults to Phuyalshankar's template).
- `dolphincss.markersUrl`: The URL to fetch markers from.
- `dolphincss.autoRefreshHours`: Time interval to check for new classes/markers (default: `24` hours).
- `dolphincss.enableClassSuggestions`: Set to `false` to disable class suggestions.
- `dolphincss.enableMarkerSuggestions`: Set to `false` to disable marker suggestions.

## License

MIT
