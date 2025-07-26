#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Pattern to match console statements
const consolePattern = /console\.(log|warn|error|debug|info|trace|group|groupEnd|groupCollapsed|time|timeEnd|assert|clear|count|countReset|dir|dirxml|profile|profileEnd|table|timeLog|timeStamp)\s*\([^)]*\)[;,]?\s*\n?/g;

// Pattern to match empty watch/onMounted blocks that only contained console logs
const emptyBlockPattern = /(\w+)\s*\(\s*\(\s*\)\s*=>\s*{\s*},\s*{\s*immediate:\s*true\s*,?\s*deep:\s*true\s*}?\s*\)/g;

// Files to process
const patterns = [
  'client/src/**/*.js',
  'client/src/**/*.vue'
];

let totalRemoved = 0;
let filesProcessed = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: '/workspaces/OPHV2' });
  
  files.forEach(file => {
    const filePath = path.join('/workspaces/OPHV2', file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove console statements
    const matches = content.match(consolePattern);
    if (matches) {
      content = content.replace(consolePattern, '');
      
      // Clean up empty lines left behind
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // Remove empty watch blocks
      content = content.replace(emptyBlockPattern, '');
      
      // Clean up trailing whitespace
      content = content.replace(/[ \t]+$/gm, '');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        filesProcessed++;
        totalRemoved += matches.length;
        console.log(`✓ ${file} - removed ${matches.length} console statements`);
      }
    }
  });
});

console.log(`\n✅ Complete! Removed ${totalRemoved} console statements from ${filesProcessed} files.`);