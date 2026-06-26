import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

export interface DolphinTagValue {
  name: string;
  description?: string;
}

export interface DolphinTag {
  name: string;
  description?: string;
}

export interface DolphinTagsData {
  version: number;
  tags: DolphinTag[];
  valueSets: Array<{
    name: string;
    values: DolphinTagValue[];
  }>;
}

export interface MarkersData {
  [key: string]: {
    templateFile: string;
    addClasses?: string;
  };
}

export interface FetchedData {
  classes: DolphinTagValue[];
  tags: DolphinTag[];
  markers: MarkersData;
  fetchedAt: number;
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

export class DolphinFetcher {
  private cachePath: string;
  private tagsUrl: string;
  private markersUrl: string;
  private refreshHours: number;
  private _data: FetchedData | null = null;

  constructor(
    cacheDir: string,
    tagsUrl: string,
    markersUrl: string,
    refreshHours: number
  ) {
    this.cachePath = path.join(cacheDir, 'dolphin-cache.json');
    this.tagsUrl = tagsUrl;
    this.markersUrl = markersUrl;
    this.refreshHours = refreshHours;
  }

  get data(): FetchedData | null {
    return this._data;
  }

  /** Cache load गर्छ — offline को लागि */
  loadCache(): boolean {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf8');
        this._data = JSON.parse(raw) as FetchedData;
        return true;
      }
    } catch {}
    return false;
  }

  /** Cache expired भयो? */
  isCacheStale(): boolean {
    if (!this._data) return true;
    const ageMs = Date.now() - this._data.fetchedAt;
    return ageMs > this.refreshHours * 60 * 60 * 1000;
  }

  /** GitHub बाट fresh data fetch गर्छ */
  async fetchFromGitHub(): Promise<FetchedData> {
    const cacheBust = `?t=${Date.now()}`;

    const [tagsRaw, markersRaw] = await Promise.all([
      fetchText(this.tagsUrl + cacheBust),
      fetchText(this.markersUrl + cacheBust),
    ]);

    const tagsData: DolphinTagsData = JSON.parse(tagsRaw);
    const markersData: MarkersData = JSON.parse(markersRaw);

    const classes = tagsData.valueSets?.[0]?.values ?? [];
    const tags = tagsData.tags ?? [];

    this._data = {
      classes,
      tags,
      markers: markersData,
      fetchedAt: Date.now(),
    };

    // Cache save
    try {
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.cachePath, JSON.stringify(this._data, null, 2));
    } catch {}

    return this._data;
  }

  /** Load cache, stale भए GitHub fetch गर्छ */
  async ensureData(): Promise<FetchedData | null> {
    this.loadCache();
    if (!this.isCacheStale() && this._data) {
      return this._data;
    }
    try {
      return await this.fetchFromGitHub();
    } catch (err) {
      // Network fail — cache use गर्छ
      if (this._data) return this._data;
      return null;
    }
  }
}
