#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { lsCommand } from './commands/ls';
import { rmCommand } from './commands/rm';
import { clearCache } from './utils/cache';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8')
);
const program = new Command();

program
  .name('nm')
  .description('Node modules management CLI')
  .version(packageJson.version);

program
  .command('ls')
  .description('List all node_modules directories')
  .argument('<path>', 'Directory path to search')
  .action(lsCommand);

program
  .command('rm')
  .description('Remove selected node_modules directories')
  .argument('<path>', 'Directory path to search')
  .action(rmCommand);

program
  .command('clear-cache')
  .description('Clear cached scan results')
  .action(async () => {
    await clearCache();
    console.log('Cache cleared successfully.');
  });

program.parse();
