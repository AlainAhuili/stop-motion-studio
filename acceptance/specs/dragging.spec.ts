import { test } from '../dsl/stop-motion';

test('a dog can be dragged with the mouse to a new starting place', async ({ toy }) => {
  await toy.place('dog', { name: 'Rex', at: [0, 0] });

  await toy.drag('Rex', { to: [4, -3] });
  await toy.makeFilm();

  await toy.expectAt('Rex', 0, [4, -3]);
});

test('a dragged dog still runs to where it was told to go', async ({ toy }) => {
  await toy.place('dog', { name: 'Rex', at: [0, 0] });
  await toy.move('Rex', { to: [6, 0], by: 2 });

  await toy.drag('Rex', { to: [-2, 0] });
  await toy.makeFilm({ fps: 2 });

  await toy.expectAt('Rex', 1, [2, 0]);
  await toy.expectAt('Rex', 2, [6, 0]);
});

test('even a tree can be dragged somewhere else', async ({ toy }) => {
  await toy.place('tree', { name: 'Oak', at: [2, 2] });

  await toy.drag('Oak', { to: [-3, 1] });
  await toy.makeFilm();

  await toy.expectAt('Oak', 0, [-3, 1]);
});
