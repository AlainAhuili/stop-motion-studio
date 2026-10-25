import type { Vec3 } from './participants';
import createCore from './wasm/core.js';

// The motion rules live in C++ (core/src/motion.cpp), compiled to WebAssembly.
// This file only adapts them to the TypeScript domain API.
const core = await createCore();

export interface Waypoint {
  time: number;
  position: Vec3;
}

/** A participant's path, held in WebAssembly memory. Call dispose() when done with it. */
export interface Motion {
  positionAt(t: number): Vec3;
  dispose(): void;
}

export function createMotion(start: Vec3, waypoints: readonly Waypoint[]): Motion {
  const list = new core.WaypointList();
  for (const w of waypoints) list.push_back(w);
  const motion = new core.Motion(start, list);
  list.delete();
  return { positionAt: (t) => motion.positionAt(t), dispose: () => motion.delete() };
}

/** Where a participant is at time `t`, starting from `start` at time 0. */
export function positionAt(start: Vec3, waypoints: readonly Waypoint[], t: number): Vec3 {
  const motion = createMotion(start, waypoints);
  try {
    return motion.positionAt(t);
  } finally {
    motion.dispose();
  }
}
