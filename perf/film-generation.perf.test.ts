import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { generateFilm } from '../src/domain/film';
import { addEvent, addWaypoint, emptyStoryboard, place } from '../src/domain/storyboard';

it('makes a 2-minute film with 100 participants at 24 fps in under 1.5 s', () => {
  let sb = emptyStoryboard();
  for (let i = 1; i <= 100; i++) {
    sb = place(sb, 'horse', { x: i, y: 0, z: 0 });
    for (let t = 10; t <= 120; t += 10) sb = addWaypoint(sb, `horse-${i}`, { time: t, position: { x: i, y: 0, z: t } });
    sb = addEvent(sb, { type: 'stop', participantId: `horse-${i}`, at: 30, duration: 0 });
  }

  const started = performance.now();
  const film = generateFilm(sb, { fps: 24 });
  const elapsed = performance.now() - started;

  expect(film.frames).toHaveLength(2881);
  expect(elapsed).toBeLessThan(1500);
});

it('keeps the shipped JavaScript under 200 kB gzipped', async () => {
  const { gzipSync } = await import('node:zlib');
  const assets = join('artifact', 'site', 'assets');
  const total = readdirSync(assets)
    .filter((f) => f.endsWith('.js'))
    .reduce((sum, f) => sum + gzipSync(readFileSync(join(assets, f))).length, 0);
  expect(total).toBeLessThan(200 * 1024);
});
