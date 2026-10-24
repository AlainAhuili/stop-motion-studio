import { describe, expect, it } from 'vitest';
import { positionAt } from './motion';

const start = { x: 0, y: 0, z: 0 };

describe('positionAt', () => {
  it('stays at the start position when there are no waypoints', () => {
    expect(positionAt(start, [], 3)).toEqual(start);
  });

  it('interpolates linearly between the start and the first waypoint', () => {
    const waypoints = [{ time: 2, position: { x: 10, y: 0, z: 4 } }];
    expect(positionAt(start, waypoints, 1)).toEqual({ x: 5, y: 0, z: 2 });
  });

  it('interpolates between two waypoints', () => {
    const waypoints = [
      { time: 1, position: { x: 2, y: 0, z: 0 } },
      { time: 3, position: { x: 6, y: 0, z: 0 } },
    ];
    expect(positionAt(start, waypoints, 2)).toEqual({ x: 4, y: 0, z: 0 });
  });

  it('holds the last waypoint after the motion ends', () => {
    const waypoints = [{ time: 1, position: { x: 2, y: 1, z: 0 } }];
    expect(positionAt(start, waypoints, 99)).toEqual({ x: 2, y: 1, z: 0 });
  });

  it('does not depend on the order waypoints were added', () => {
    const waypoints = [
      { time: 3, position: { x: 6, y: 0, z: 0 } },
      { time: 1, position: { x: 2, y: 0, z: 0 } },
    ];
    expect(positionAt(start, waypoints, 2)).toEqual({ x: 4, y: 0, z: 0 });
  });
});
