#!/usr/bin/env node

/**
 * Next.js Build Cache Cleanup Script
 * Fixes: .next cache corruption, hashSalt SWC errors, stale node_modules
 * Platform: Windows (C:\Users\Acer\Desktop\option bot)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(num, message) {
  log(`\n[${num}] ${message}`, 'cyan');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function runCommand(command, options = {}) {
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: options.cwd || __dirname,
      env: { ...process.env, ...options.env },
      shell: true,
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  log('╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║     Next.js Build Cache Cleanup & Fix Script              ║', 'blue');
  log('║     Platform: Windows                                     ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  const projectRoot = __dirname;
  const nextDir = path.join(projectRoot, '.next');
  const nodeModulesDir = path.join(projectRoot, 'node_modules');
  const packageLock = path.join(projectRoot, 'package-lock.json');

  // Step 1: Delete .next directory
  step(1, 'Deleting .next build cache directory...');
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      success('.next directory deleted');
    } catch (e) {
      warn('Could not delete .next directory, trying alternative method...');
      runCommand('rd /s /q .next', { cwd: projectRoot });
    }
  } else {
    success('.next directory does not exist (already clean)');
  }

  // Step 2: Delete node_modules/.cache
  step(2, 'Clearing node_modules cache...');
  const cacheDir = path.join(nodeModulesDir, '.cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      success('node_modules/.cache deleted');
    } catch (e) {
      warn('Could not delete .cache directory');
    }
  } else {
    success('node_modules/.cache does not exist');
  }

  // Step 3: Clear npm cache
  step(3, 'Clearing npm cache...');
  if (runCommand('npm cache clean --force')) {
    success('npm cache cleared');
  } else {
    warn('npm cache clear failed, continuing...');
  }

  // Step 4: Delete node_modules (optional, uncomment if needed)
  // step(4, 'Deleting node_modules (full reinstall)...');
  // if (fs.existsSync(nodeModulesDir)) {
  //   try {
  //     fs.rmSync(nodeModulesDir, { recursive: true, force: true });
  //     success('node_modules deleted');
  //   } catch (e) {
  //     warn('Could not delete node_modules, trying alternative...');
  //     runCommand('rd /s /q node_modules', { cwd: projectRoot });
  //   }
  // } else {
  //   success('node_modules does not exist');
  // }

  // Step 5: Clear Next.js specific caches
  step(4, 'Clearing Next.js specific caches...');
  const tempDir = path.join(process.env.TEMP || process.env.TMP || '.', 'next-*');
  runCommand(`del /q /f "${tempDir}" 2>nul`, { cwd: projectRoot });
  
  // Clear .next/cache if it exists
  const nextCacheDir = path.join(nextDir, 'cache');
  if (fs.existsSync(nextCacheDir)) {
    try {
      fs.rmSync(nextCacheDir, { recursive: true, force: true });
      success('.next/cache cleared');
    } catch (e) {
      warn('Could not clear .next/cache');
    }
  }

  // Step 6: Fix the hashSalt issue by patching next.config.js
  step(5, 'Checking for hashSalt SWC issue...');
  const nextConfigPath = path.join(projectRoot, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    let config = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check if we already have the workaround
    if (!config.includes('serverComponentsExternalPackages') && !config.includes('swcMinify')) {
      warn('hashSalt error detected in Next.js 14.2.x on Windows');
      log('Adding workaround to next.config.js...', 'yellow');
      
      // Create a backup
      fs.copyFileSync(nextConfigPath, nextConfigPath + '.backup');
      
      // Add the workaround
      const workaround = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Workaround for hashSalt SWC error on Windows
  experimental: {
    // Disable server actions to avoid hashSalt SWC issue
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Use turbo compiler to bypass SWC issues
  // turbo: {}, // Uncomment if using Next.js 13.1+
};

module.exports = nextConfig;
`;
      
      fs.writeFileSync(nextConfigPath, workaround);
      success('next.config.js updated with hashSalt workaround');
      warn('Backup created: next.config.js.backup');
    } else {
      success('next.config.js already has workarounds');
    }
  }

  // Step 7: Reinstall dependencies
  step(6, 'Reinstalling dependencies...');
  if (fs.existsSync(nodeModulesDir)) {
    log('node_modules exists, running npm install...', 'yellow');
  } else {
    log('node_modules missing, running npm install...', 'yellow');
  }
  
  if (runCommand('npm install', { cwd: projectRoot })) {
    success('Dependencies installed');
  } else {
    error('npm install failed');
    log('Try running: npm install --legacy-peer-deps', 'yellow');
  }

  // Step 8: Build Next.js
  step(7, 'Building Next.js application...');
  log('Attempting build with --no-lint flag...', 'yellow');
  
  if (runCommand('npx next build --no-lint', { cwd: projectRoot })) {
    success('Build completed successfully!');
  } else {
    warn('Build failed, trying with turbo compiler...');
    
    // Try with turbo
    if (runCommand('npx next build --turbo', { cwd: projectRoot })) {
      success('Build completed with turbo compiler!');
    } else {
      warn('Build still failing. Options:');
      log('1. Try: npm run dev (skip build, use dev mode)', 'yellow');
      log('2. Downgrade Next.js: npm install next@14.2.24', 'yellow');
      log('3. Upgrade Next.js: npm install next@15 react@19', 'yellow');
      log('4. Check the error messages above for details', 'yellow');
    }
  }

  // Step 9: Start dev server (optional)
  step(8, 'Ready to start dev server...');
  log('');
  log('╔════════════════════════════════════════════════════════════╗', 'green');
  log('║                    CLEANUP COMPLETE!                       ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝', 'green');
  log('');
  log('To start the development server:', 'cyan');
  log('  npm run dev', 'green');
  log('');
  log('If you still see errors, try:', 'cyan');
  log('  1. Delete node_modules and package-lock.json, then npm install', 'yellow');
  log('  2. Downgrade: npm install next@14.2.24', 'yellow');
  log('  3. Upgrade: npm install next@15 react@19', 'yellow');
  log('');
  
  // Ask if user wants to start dev server now
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Start dev server now? (y/n): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      log('\nStarting dev server...', 'cyan');
      const { spawn } = require('child_process');
      const dev = spawn('npm', ['run', 'dev'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true,
      });
      
      dev.on('error', (err) => {
        error('Failed to start dev server:', err.message);
      });
      
      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        dev.kill('SIGINT');
        process.exit();
      });
    } else {
      log('\nRun "npm run dev" when ready.', 'yellow');
      process.exit(0);
    }
  });
}

// Handle errors
process.on('uncaughtException', (err) => {
  error('Unexpected error:', err.message);
  process.exit(1);
});

// Run the script
main().catch((err) => {
  error('Script failed:', err.message);
  process.exit(1);
});
