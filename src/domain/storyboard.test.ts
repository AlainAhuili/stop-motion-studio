import { describe, expect, it } from 'vitest';
import { addEvent, addWaypoint, emptyStoryboard, place } from './storyboard';

const origin = { x: 0, y: 0, z: 0 };

describe('storyboard', () => {
  it('gives each placed participant a readable, unique id', () => {
    let sb = place(emptyStoryboard(), 'dog', origin);
    sb = place(sb, 'dog', { x: 1, y: 0, z: 0 });
    sb = place(sb, 'car', origin);
    expect(sb.participants.map((p) => p.id)).toEqual(['dog-1', 'dog-2', 'car-1']);
  });

  it('records the category of each participant', () => {
    const sb = place(place(place(emptyStoryboard(), 'tree', origin), 'horse', origin), 'boat', origin);
    expect(sb.participants.map((p) => p.category)).toEqual(['landscape', 'animal', 'vehicle']);
  });

  it('does not change the storyboard it was given', () => {
    const before = emptyStoryboard();
    place(before, 'dog', origin);
    expect(before.participants).toHaveLength(0);
  });

  it('lets animals and vehicles move', () => {
    const sb = addWaypoint(place(emptyStoryboard(), 'bird', origin), 'bird-1', {
      time: 2,
      position: { x: 0, y: 5, z: 0 },
    });
    expect(sb.motions['bird-1']).toHaveLength(1);
  });

  it('refuses to move landscape: mountains stay where they are', () => {
    const sb = place(emptyStoryboard(), 'mountain', origin);
    expect(() => addWaypoint(sb, 'mountain-1', { time: 1, position: origin })).toThrow(/cannot move/);
  });

  it('refuses waypoints at negative times', () => {
    const sb = place(emptyStoryboard(), 'dog', origin);
    expect(() => addWaypoint(sb, 'dog-1', { time: -1, position: origin })).toThrow(/time/);
  });

  it('refuses events about participants that are not in the story', () => {
    expect(() =>
      addEvent(emptyStoryboard(), { type: 'stop', participantId: 'ghost-1', at: 1, duration: 1 }),
    ).toThrow(/ghost-1/);
  });

  it('accepts weather events that concern nobody in particular', () => {
    const sb = addEvent(emptyStoryboard(), { type: 'rain', at: 2 });
    expect(sb.events).toHaveLength(1);
  });
});
