import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';

interface NodeModulesInfo {
  path: string;
  size: number;
}

export async function lsCommand(targetPath: string): Promise<void> {
  try {
    const resolvedPath = resolve(targetPath);
    const nodeModulesInfos = await findNodeModulesWithSizes(resolvedPath);
    
    if (nodeModulesInfos.length === 0) {
      console.log('No node_modules directories found.');
      return;
    }
    
    let totalSize = 0;
    for (const info of nodeModulesInfos) {
      console.log(`${formatBytes(info.size)}\t${info.path}`);
      totalSize += info.size;
    }
    
    console.log('');
    console.log(`${formatBytes(totalSize)}\tTOTAL`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function findNodeModulesWithSizes(dir: string, isInsideNodeModules = false): Promise<NodeModulesInfo[]> {
  const results: NodeModulesInfo[] = [];
  
  try {
    const dirStat = await stat(dir);
    if (!dirStat.isDirectory()) {
      return results;
    }
    
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      
      try {
        const entryStat = await stat(fullPath);
        
        if (entryStat.isDirectory()) {
          if (entry === 'node_modules') {
            const size = await getDirectorySize(fullPath);
            results.push({ path: fullPath, size });
          } else if (!isInsideNodeModules) {
            const subResults = await findNodeModulesWithSizes(fullPath, false);
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

async function getDirectorySize(dirPath: string): Promise<number> {
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
          totalSize += await getDirectorySize(fullPath);
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

function formatBytes(bytes: number): string {
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