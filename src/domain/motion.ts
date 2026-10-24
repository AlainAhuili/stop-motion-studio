import type { Vec3 } from './participants';

export interface Waypoint {
  time: number;
  position: Vec3;
}

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** Where a participant is at time `t`, starting from `start` at time 0. */
export function positionAt(start: Vec3, waypoints: readonly Waypoint[], t: number): Vec3 {
  const path = [{ time: 0, position: start }, ...[...waypoints].sort((a, b) => a.time - b.time)];
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if (t <= to.time) {
      const span = to.time - from.time;
      const f = span === 0 ? 1 : Math.max(0, (t - from.time) / span);
      return {
        x: lerp(from.position.x, to.position.x, f),
        y: lerp(from.position.y, to.position.y, f),
        z: lerp(from.position.z, to.position.z, f),
      };
    }
  }
  return { ...path[path.length - 1].position };
}
