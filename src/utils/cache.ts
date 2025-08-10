import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { NodeModulesInfo } from './nodeModules';

interface CacheEntry {
  path: string;
  results: NodeModulesInfo[];
  timestamp: number;
}

interface CacheData {
  [key: string]: CacheEntry;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CACHE_DIR = join(homedir(), '.cache', 'nm');
const CACHE_FILE = join(CACHE_DIR, 'cache.json');

async function ensureCacheDir(): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

async function loadCache(): Promise<CacheData> {
  try {
    const data = await readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCache(cache: CacheData): Promise<void> {
  await ensureCacheDir();
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function getCacheKey(path: string): string {
  return Buffer.from(path).toString('base64');
}

function isEntryValid(entry: CacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp < CACHE_TTL;
}

export async function getCachedResults(
  path: string
): Promise<NodeModulesInfo[] | null> {
  try {
    const cache = await loadCache();
    const key = getCacheKey(path);
    const entry = cache[key];

    if (entry && isEntryValid(entry)) {
      return entry.results;
    }
  } catch {
    // Cache read failed, continue without cache
  }

  return null;
}

export async function setCachedResults(
  path: string,
  results: NodeModulesInfo[]
): Promise<void> {
  try {
    const cache = await loadCache();
    const key = getCacheKey(path);

    cache[key] = {
      path,
      results,
      timestamp: Date.now(),
    };

    // Clean up expired entries
    for (const [cacheKey, entry] of Object.entries(cache)) {
      if (!isEntryValid(entry)) {
        delete cache[cacheKey];
      }
    }

    await saveCache(cache);
  } catch {
    // Cache write failed, continue without caching
  }
}

export async function clearCache(): Promise<void> {
  try {
    await saveCache({});
  } catch {
    // Cache clear failed, ignore
  }
}
