const fs = require('fs-extra');
const path = require('path');

const sourceDir = path.join(__dirname, '..');
const distDir = path.join(__dirname, '..', 'dist');

// Files to copy (must include every page and its assets for GitHub Pages)
const filesToCopy = [
  'index.html',
  'inventory.html',
  'pos.html',
  'events.html',
  'sales-log.html',
  'event-discovery.html',
  'analytics.html',
  'backup.html',
  'styles.css',
  'pos-styles.css',
  'common.js',
  'app.js',
  'home.js',
  'pos.js',
  'events.js',
  'sales-log.js',
  'event-discovery.js',
  'analytics.js',
  'backup.js',
  '.nojekyll'
];

async function copyFiles() {
  try {
    // Create dist directory if it doesn't exist
    await fs.ensureDir(distDir);

    // Copy files
    for (const file of filesToCopy) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(distDir, file);
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath);
        console.log(`✓ Copied ${file}`);
      } else {
        console.warn(`⚠ File not found: ${file}`);
      }
    }

    console.log('\n✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

copyFiles();
