import { describe, expect, it } from 'vitest';
import { generateFilm } from './film';
import { addEvent, addWaypoint, emptyStoryboard, place } from './storyboard';

const origin = { x: 0, y: 0, z: 0 };

function dogRunningTenMetresInTwoSeconds() {
  const sb = place(emptyStoryboard(), 'dog', origin);
  return addWaypoint(sb, 'dog-1', { time: 2, position: { x: 10, y: 0, z: 0 } });
}

describe('generateFilm', () => {
  it('produces one frame per tick, including the first and last', () => {
    const film = generateFilm(dogRunningTenMetresInTwoSeconds(), { fps: 4 });
    expect(film.frames).toHaveLength(9);
    expect(film.frames.at(-1)!.time).toBe(2);
  });

  it('lasts until the last motion ends, and at least one second', () => {
    expect(generateFilm(dogRunningTenMetresInTwoSeconds(), { fps: 1 }).duration).toBe(2);
    expect(generateFilm(emptyStoryboard(), { fps: 1 }).duration).toBe(1);
  });

  it('places every participant in every frame', () => {
    const sb = place(dogRunningTenMetresInTwoSeconds(), 'tree', { x: 3, y: 0, z: 3 });
    const film = generateFilm(sb, { fps: 2 });
    const middle = film.frames[2];
    expect(middle.actors).toEqual([
      { id: 'dog-1', kind: 'dog', position: { x: 5, y: 0, z: 0 }, visible: true },
      { id: 'tree-1', kind: 'tree', position: { x: 3, y: 0, z: 3 }, visible: true },
    ]);
  });

  it('a stop event freezes a participant, which then carries on from where it stopped', () => {
    const sb = addEvent(dogRunningTenMetresInTwoSeconds(), {
      type: 'stop',
      participantId: 'dog-1',
      at: 1,
      duration: 1,
    });
    const film = generateFilm(sb, { fps: 2 });
    const xAt = (t: number) => film.frames.find((f) => f.time === t)!.actors[0].position.x;

    expect(film.duration).toBe(3);
    expect([xAt(0.5), xAt(1), xAt(1.5), xAt(2), xAt(2.5), xAt(3)]).toEqual([2.5, 5, 5, 5, 7.5, 10]);
  });

  it('a vanish event hides a participant from then on', () => {
    const sb = addEvent(dogRunningTenMetresInTwoSeconds(), { type: 'vanish', participantId: 'dog-1', at: 1 });
    const film = generateFilm(sb, { fps: 2 });
    expect(film.frames.map((f) => f.actors[0].visible)).toEqual([true, true, false, false, false]);
  });

  it('a rain event changes the weather from then on', () => {
    const sb = addEvent(dogRunningTenMetresInTwoSeconds(), { type: 'rain', at: 1.5 });
    const film = generateFilm(sb, { fps: 2 });
    expect(film.frames.map((f) => f.weather)).toEqual(['clear', 'clear', 'clear', 'rain', 'rain']);
  });

  it('refuses a frame rate a film cannot have', () => {
    expect(() => generateFilm(emptyStoryboard(), { fps: 0 })).toThrow(/fps/);
  });
});
