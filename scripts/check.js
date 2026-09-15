// "Build" step: there is no bundler, so just syntax-check every JS file.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const dirs = ['api', 'lib', 'public/src', 'scripts'];
const files = ['server.js'];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.js')) files.push(full);
  }
}
dirs.forEach(walk);

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    failed++;
    console.error(`✗ ${file}\n${err.stderr.toString()}`);
  }
}
console.log(`Checked ${files.length} files, ${failed} failed.`);
process.exit(failed ? 1 : 0);
