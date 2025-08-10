import { resolve } from 'path';
import { getCachedResults, setCachedResults } from '../utils/cache';
import { findNodeModulesWithSizes, formatBytes } from '../utils/nodeModules';

export async function lsCommand(targetPath: string): Promise<void> {
  try {
    const resolvedPath = resolve(targetPath);

    // Try to get cached results first
    let nodeModulesInfos = await getCachedResults(resolvedPath);

    if (nodeModulesInfos) {
      console.log('Using cached results...');
    } else {
      // Scan and cache results
      nodeModulesInfos = await findNodeModulesWithSizes(targetPath);
      await setCachedResults(resolvedPath, nodeModulesInfos);
    }

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
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}
