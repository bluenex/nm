#!/usr/bin/env node

import { Command } from 'commander';
import { lsCommand } from './commands/ls';
import { rmCommand } from './commands/rm';

const program = new Command();

program
  .name('nm')
  .description('Node modules management CLI')
  .version('1.0.0');

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

program.parse();