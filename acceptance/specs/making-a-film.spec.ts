// Layer 1: executable specifications, written as a child (or product owner) would describe them.
import { expect, test } from '../dsl/stop-motion';

test('a dog runs across the meadow in the film', async ({ toy }) => {
  await toy.place('dog', { name: 'Rex', at: [0, 0] });
  await toy.move('Rex', { to: [10, 0], by: 2 });

  const film = await toy.makeFilm({ fps: 4 });

  expect(film).toEqual({ frames: 9, duration: 2 });
  await toy.expectAt('Rex', 1, [5, 0]);
  await toy.expectAt('Rex', 2, [10, 0]);
});

test('the landscape stays put while a car drives past', async ({ toy }) => {
  await toy.place('tree', { name: 'Oak', at: [3, 3] });
  await toy.place('car', { name: 'Red car', at: [-5, 0] });
  await toy.move('Red car', { to: [5, 0], by: 4 });

  await toy.makeFilm();

  await toy.expectAt('Oak', 2, [3, 3]);
  await toy.expectAt('Red car', 2, [0, 0]);
});

test('a mountain cannot be moved', async ({ toy }) => {
  await toy.place('mountain', { name: 'Big mountain' });

  expect(await toy.tryToMove('Big mountain', { to: [5, 5], by: 1 })).toMatch(/cannot move/);
});
