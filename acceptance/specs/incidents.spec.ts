import { expect, test } from '../dsl/stop-motion';

test('a dog that stops to sniff carries on from where it stopped', async ({ toy }) => {
  await toy.place('dog', { name: 'Rex' });
  await toy.move('Rex', { to: [10, 0], by: 2 });
  await toy.stop('Rex', { at: 1, for: 1 });

  const film = await toy.makeFilm({ fps: 2 });

  expect(film.duration).toBe(3);
  await toy.expectAt('Rex', 1.5, [5, 0]);
  await toy.expectAt('Rex', 3, [10, 0]);
});

test('a bird flies away and vanishes', async ({ toy }) => {
  await toy.place('bird', { name: 'Tweety' });
  await toy.move('Tweety', { to: [0, 0], by: 2 });
  await toy.vanish('Tweety', { at: 1 });

  await toy.makeFilm({ fps: 2 });

  await toy.expectVisible('Tweety', 0.5, true);
  await toy.expectVisible('Tweety', 1.5, false);
});

test('it starts to rain in the middle of the film', async ({ toy }) => {
  await toy.place('horse', { name: 'Jolly' });
  await toy.rain({ at: 1 });

  await toy.makeFilm({ fps: 2 });

  await toy.expectWeather(0.5, 'clear');
  await toy.expectWeather(1, 'rain');
});
