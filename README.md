# Node Modules Manager (nm)

A fast and interactive CLI tool for managing `node_modules` directories across your development projects. Find, analyze, and safely remove `node_modules` with an intuitive interface.

## Features

- **Fast scanning** - Recursively finds all `node_modules` directories
- **Interactive selection** - Checkbox interface for safe removal
- **Size calculation** - Shows disk usage similar to `du -sh`
- **Progress indicators** - Loading spinners and progress bars
- **Safety confirmations** - Multi-step confirmation process
- **Error handling** - Graceful handling of permission issues

## Dependencies

Here is a list of dependencies used for the project:

### Runtime Requirements
- Node.js >= 18.x
- npm >= 8.x

### Project Dependencies
- Commander.js - CLI argument parsing
- Inquirer.js - Interactive prompts
- Ora - Loading spinners
- TypeScript - Type safety

## Installation

Install the package globally using npm:

```sh
npm install -g @bluenex/nm
```

Or use npx to run without installing:

```sh
npx @bluenex/nm ls .
```

For development, clone and install dependencies:

```sh
git clone https://github.com/bluenex/nm.git
cd nm
npm install
npm run build
npm link
```

## Usage

The CLI provides two main commands for managing `node_modules` directories.

### List Command

Find and display all `node_modules` directories with their sizes:

```sh
# List in current directory
npx @bluenex/nm ls .

# List in specific path
npx @bluenex/nm ls ~/Dev

# List with full path
npx @bluenex/nm ls /Users/username/projects
```

Example output:
```
228M    /path/to/project1/node_modules
156M    /path/to/project2/node_modules
89M     /path/to/project3/node_modules

473M    TOTAL
```

### Remove Command

Interactively select and remove `node_modules` directories:

```sh
# Interactive removal in current directory
npx @bluenex/nm rm .

# Interactive removal in specific path
npx @bluenex/nm rm ~/Dev
```

The removal process includes:
1. **Scanning** - Finds all `node_modules` directories
2. **Selection** - Interactive checkbox interface
3. **Summary** - Shows total space to be freed
4. **Confirmation** - Multiple safety confirmations
5. **Progress** - Real-time removal progress

Example workflow:
```
? Select directories to remove: (Press <space> to select)
❯◯ 228M  /path/to/project1/node_modules
 ◉ 156M  /path/to/project2/node_modules
 ◯ 89M   /path/to/project3/node_modules

Selected: 156M (1 of 3)

? What would you like to do?
❯ Continue with removal
  Cancel

? Are you sure you want to delete these directories?
  Selected for removal:
  • 156M   /path/to/project2/node_modules

  Total space to be freed: 156M
❯ Yes, delete selected directories
  Cancel

⠋ Removing directories... (1/1)
✓ Successfully removed 1 directory, freed 156M
```

## Publishing

### Prerequisites

```sh
# Create npm account (if you don't have one)
npm adduser

# Login to npm
npm login
```

### Publishing Steps

```sh
# 1. Build the project
npm run build

# 2. Test the package locally (optional but recommended)
npm pack
# This creates a .tgz file you can inspect

# 3. Publish to npm (--access public required for scoped packages)
npm publish --access public

# 4. Verify the publication works
npx @bluenex/nm --help
```

### Version Management

```sh
# For bug fixes (1.0.0 -> 1.0.1)
npm version patch
npm publish --access public

# For new features (1.0.0 -> 1.1.0)
npm version minor
npm publish --access public

# For breaking changes (1.0.0 -> 2.0.0)
npm version major
npm publish --access public
```

For GitHub releases, push to the repository and create a new release tag.

## Safety Features

- **Multi-step confirmation** prevents accidental deletions
- **Read-only scanning** - listing never modifies files
- **Progress feedback** during long operations
- **Error handling** for permission and access issues
- **Validation** prevents empty selections

> **Note:** Always review the selected directories before confirming removal. The deletion process cannot be undone.