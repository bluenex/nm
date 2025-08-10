import inquirer from 'inquirer';
import { rm } from 'fs/promises';
import ora from 'ora';
import {
  findNodeModulesWithSizes,
  formatBytes,
  NodeModulesInfo,
} from '../utils/nodeModules';

interface CheckboxChoice {
  name: string;
  value: NodeModulesInfo;
  checked: boolean;
}

export async function rmCommand(targetPath: string): Promise<void> {
  try {
    // Step 1: Find all node_modules directories
    const nodeModulesInfos = await findNodeModulesWithSizes(targetPath);

    if (nodeModulesInfos.length === 0) {
      console.log('No node_modules directories found.');
      return;
    }

    console.log(
      `\nFound ${nodeModulesInfos.length} node_modules directories:\n`
    );

    // Step 2: Create checkbox choices
    const choices: CheckboxChoice[] = nodeModulesInfos.map((info) => ({
      name: `${formatBytes(info.size).padStart(6)} ${info.path}`,
      value: info,
      checked: false,
    }));

    // Step 3: Interactive checkbox selection
    const selectionAnswers = await inquirer.prompt({
      type: 'checkbox',
      name: 'selectedDirs',
      message: 'Select directories to remove:',
      choices,
      pageSize: 15,
      validate: (answer: unknown) => {
        const selectedItems = answer as NodeModulesInfo[];
        if (selectedItems.length === 0) {
          return 'You must choose at least one directory to remove.';
        }
        return true;
      },
    });

    const selectedDirs: NodeModulesInfo[] = selectionAnswers.selectedDirs;

    // Step 4: Show selection summary
    const totalSelectedSize = selectedDirs.reduce(
      (sum, dir) => sum + dir.size,
      0
    );

    console.log(`\nSelected ${selectedDirs.length} directories for removal:`);
    selectedDirs.forEach((dir) => {
      console.log(`  • ${formatBytes(dir.size).padStart(6)} ${dir.path}`);
    });
    console.log(`\nTotal space to be freed: ${formatBytes(totalSelectedSize)}`);

    // Step 5: Continue/Cancel action
    const actionAnswers = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Continue with removal', value: 'continue' },
        { name: 'Cancel', value: 'cancel' },
      ],
    });

    if (actionAnswers.action === 'cancel') {
      console.log('Operation cancelled.');
      return;
    }

    // Step 6: Final confirmation
    const confirmAnswers = await inquirer.prompt({
      type: 'confirm',
      name: 'confirmed',
      message: `Are you sure you want to delete these ${selectedDirs.length} directories? This cannot be undone.`,
      default: false,
    });

    if (!confirmAnswers.confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Step 7: Remove directories with progress
    await removeDirectories(selectedDirs);

    console.log(
      `\n✓ Successfully removed ${selectedDirs.length} directories, freed ${formatBytes(totalSelectedSize)}`
    );
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}

async function removeDirectories(
  directories: NodeModulesInfo[]
): Promise<void> {
  const spinner = ora().start();

  for (let i = 0; i < directories.length; i++) {
    const dir = directories[i];
    const shortPath =
      dir.path.length > 50 ? '...' + dir.path.slice(-47) : dir.path;

    spinner.text = `Removing directories... (${i + 1}/${directories.length}) ${shortPath}`;

    try {
      await rm(dir.path, { recursive: true, force: true });
    } catch (error) {
      spinner.stop();
      throw new Error(
        `Failed to remove ${dir.path}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  spinner.stop();
}
