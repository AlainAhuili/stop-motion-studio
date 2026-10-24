// Refuses to deploy a release candidate whose files differ from what the commit stage built.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'artifact';
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
for (const [file, expected] of Object.entries(manifest.files)) {
  const actual = createHash('sha256').update(readFileSync(join(dir, 'site', file))).digest('hex');
  if (actual !== expected) {
    console.error(`Artifact tampered or rebuilt: ${file}`);
    process.exit(1);
  }
}
console.log(manifest.version);
