import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import ora, { Ora } from 'ora';

export interface NodeModulesInfo {
  path: string;
  size: number;
}

interface ScanProgress {
  foundCount: number;
  currentPath: string;
}

export async function findNodeModulesWithSizes(
  targetPath: string,
  showProgress = true
): Promise<NodeModulesInfo[]> {
  const spinner = showProgress ? ora('Scanning for node_modules directories...').start() : null;
  
  try {
    const resolvedPath = resolve(targetPath);
    const progress: ScanProgress = { foundCount: 0, currentPath: '' };
    
    const nodeModulesInfos = await scanDirectory(resolvedPath, false, progress, spinner || undefined);
    
    if (spinner) spinner.stop();
    
    return nodeModulesInfos;
  } catch (error) {
    if (spinner) spinner.stop();
    throw error;
  }
}

async function scanDirectory(
  dir: string, 
  isInsideNodeModules = false, 
  progress?: ScanProgress,
  spinner?: Ora
): Promise<NodeModulesInfo[]> {
  const results: NodeModulesInfo[] = [];
  
  try {
    const dirStat = await stat(dir);
    if (!dirStat.isDirectory()) {
      return results;
    }
    
    // Update progress
    if (progress && spinner) {
      progress.currentPath = dir;
      const shortPath = dir.length > 50 ? '...' + dir.slice(-47) : dir;
      spinner.text = `Scanning: ${shortPath} (found ${progress.foundCount})`;
    }
    
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      
      try {
        const entryStat = await stat(fullPath);
        
        if (entryStat.isDirectory()) {
          if (entry === 'node_modules') {
            if (progress && spinner) {
              progress.foundCount++;
              spinner.text = `Calculating size of node_modules #${progress.foundCount}...`;
            }
            
            const size = await getDirectorySize(fullPath, spinner);
            results.push({ path: fullPath, size });
            
            if (progress && spinner) {
              spinner.text = `Found ${progress.foundCount} node_modules directories...`;
            }
          } else if (!isInsideNodeModules) {
            const subResults = await scanDirectory(fullPath, false, progress, spinner);
            results.push(...subResults);
          }
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    throw new Error(`Cannot access directory: ${dir}`);
  }
  
  return results;
}

export async function getDirectorySize(dirPath: string, spinner?: Ora): Promise<number> {
  let totalSize = 0;
  
  try {
    const entries = await readdir(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isFile()) {
          // Use blocks * 512 to match du behavior more closely
          totalSize += stats.blocks ? stats.blocks * 512 : stats.size;
        } else if (stats.isDirectory()) {
          totalSize += await getDirectorySize(fullPath, spinner);
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return totalSize;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0B';
  
  const k = 1024;
  const sizes = ['B', 'K', 'M', 'G', 'T'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = bytes / Math.pow(k, i);
  
  // Format similar to du -sh: no decimal for bytes, 1 decimal for others
  if (i === 0) {
    return `${Math.round(size)}${sizes[i]}`;
  } else {
    return `${Math.round(size)}${sizes[i]}`;
  }
}