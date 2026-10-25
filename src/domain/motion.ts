import { core } from './core';
import type { Vec3 } from './participants';

// Rules: core/src/motion.cpp.

export interface Waypoint {
  time: number;
  position: Vec3;
}

/** Where a participant is at time `t`, starting from `start` at time 0. */
export const positionAt = (start: Vec3, waypoints: readonly Waypoint[], t: number): Vec3 =>
  core.positionAt(start, waypoints, t);
