// Commit stage, last step: turn dist/ into the one immutable release candidate.
// Later stages deploy artifact/ as it is and never rebuild it.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const out = 'artifact';
rmSync(out, { recursive: true, force: true });
cpSync('dist', join(out, 'site'), { recursive: true });

const files = {};
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files[relative(join(out, 'site'), path).replaceAll('\\', '/')] =
      createHash('sha256').update(readFileSync(path)).digest('hex');
  }
};
walk(join(out, 'site'));

const gitHead = () => {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'uncommitted';
  }
};
const version = process.env.GITHUB_SHA ?? gitHead();
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ version, builtAt: new Date().toISOString(), files }, null, 2));
console.log(`Packaged release candidate ${version} (${Object.keys(files).length} files)`);
