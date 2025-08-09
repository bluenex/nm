import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';

export async function lsCommand(targetPath: string): Promise<void> {
  try {
    const resolvedPath = resolve(targetPath);
    const nodeModulesPaths = await findNodeModules(resolvedPath);
    
    if (nodeModulesPaths.length === 0) {
      console.log('No node_modules directories found.');
      return;
    }
    
    nodeModulesPaths.forEach(path => console.log(path));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function findNodeModules(dir: string, isInsideNodeModules = false): Promise<string[]> {
  const results: string[] = [];
  
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
            results.push(fullPath);
          } else if (!isInsideNodeModules) {
            const subResults = await findNodeModules(fullPath, false);
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