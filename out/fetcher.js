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
exports.DolphinFetcher = void 0;
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchText(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}
class DolphinFetcher {
    constructor(cacheDir, tagsUrl, markersUrl, refreshHours) {
        this._data = null;
        this.cachePath = path.join(cacheDir, 'dolphin-cache.json');
        this.tagsUrl = tagsUrl;
        this.markersUrl = markersUrl;
        this.refreshHours = refreshHours;
    }
    get data() {
        return this._data;
    }
    /** Cache load गर्छ — offline को लागि */
    loadCache() {
        try {
            if (fs.existsSync(this.cachePath)) {
                const raw = fs.readFileSync(this.cachePath, 'utf8');
                this._data = JSON.parse(raw);
                return true;
            }
        }
        catch { }
        return false;
    }
    /** Cache expired भयो? */
    isCacheStale() {
        if (!this._data)
            return true;
        const ageMs = Date.now() - this._data.fetchedAt;
        return ageMs > this.refreshHours * 60 * 60 * 1000;
    }
    /** GitHub बाट fresh data fetch गर्छ */
    async fetchFromGitHub() {
        const cacheBust = `?t=${Date.now()}`;
        const [tagsRaw, markersRaw] = await Promise.all([
            fetchText(this.tagsUrl + cacheBust),
            fetchText(this.markersUrl + cacheBust),
        ]);
        const tagsData = JSON.parse(tagsRaw);
        const markersData = JSON.parse(markersRaw);
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
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.cachePath, JSON.stringify(this._data, null, 2));
        }
        catch { }
        return this._data;
    }
    /** Load cache, stale भए GitHub fetch गर्छ */
    async ensureData() {
        this.loadCache();
        if (!this.isCacheStale() && this._data) {
            return this._data;
        }
        try {
            return await this.fetchFromGitHub();
        }
        catch (err) {
            // Network fail — cache use गर्छ
            if (this._data)
                return this._data;
            return null;
        }
    }
}
exports.DolphinFetcher = DolphinFetcher;
//# sourceMappingURL=fetcher.js.map