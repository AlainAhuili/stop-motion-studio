import { core } from './core';
import type { Waypoint } from './motion';
import type { Kind, Participant, Vec3 } from './participants';

// Rules: core/src/storyboard.cpp. Every operation returns a new storyboard;
// a refused rule throws an Error whose message a child can read.

export type IncidentEvent =
  | { type: 'stop'; participantId: string; at: number; duration: number }
  | { type: 'vanish'; participantId: string; at: number }
  | { type: 'rain'; at: number };

export interface Storyboard {
  participants: Participant[];
  motions: Record<string, Waypoint[]>;
  events: IncidentEvent[];
}

export const emptyStoryboard = (): Storyboard => core.emptyStoryboard();

/** Step 1 of the process flow: put a participant somewhere in the world. */
export const place = (sb: Storyboard, kind: Kind, position: Vec3): Storyboard => core.place(sb, kind, position);

/** Step 1 again: put an already placed participant somewhere else. Its motion is kept. */
export const reposition = (sb: Storyboard, participantId: string, position: Vec3): Storyboard =>
  core.reposition(sb, participantId, position);

/** Step 2: tell a participant where to be at a given time. */
export const addWaypoint = (sb: Storyboard, participantId: string, waypoint: Waypoint): Storyboard =>
  core.addWaypoint(sb, participantId, waypoint);

/** Step 3: something unexpected happens. */
export const addEvent = (sb: Storyboard, event: IncidentEvent): Storyboard => core.addEvent(sb, event);
