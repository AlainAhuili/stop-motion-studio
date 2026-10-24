import type { Waypoint } from './motion';
import { canMove, categoryOf, type Kind, type Participant, type Vec3 } from './participants';

export type IncidentEvent =
  | { type: 'stop'; participantId: string; at: number; duration: number }
  | { type: 'vanish'; participantId: string; at: number }
  | { type: 'rain'; at: number };

export interface Storyboard {
  participants: Participant[];
  motions: Record<string, Waypoint[]>;
  events: IncidentEvent[];
}

export function emptyStoryboard(): Storyboard {
  return { participants: [], motions: {}, events: [] };
}

/** Step 1 of the process flow: put a participant somewhere in the world. */
export function place(sb: Storyboard, kind: Kind, position: Vec3): Storyboard {
  const n = sb.participants.filter((p) => p.kind === kind).length + 1;
  const participant = { id: `${kind}-${n}`, kind, category: categoryOf(kind), position: { ...position } };
  return { ...sb, participants: [...sb.participants, participant] };
}

/** Step 1 again: put an already placed participant somewhere else. Its motion is kept. */
export function reposition(sb: Storyboard, participantId: string, position: Vec3): Storyboard {
  find(sb, participantId);
  return {
    ...sb,
    participants: sb.participants.map((p) => (p.id === participantId ? { ...p, position: { ...position } } : p)),
  };
}

/** Step 2: tell a participant where to be at a given time. */
export function addWaypoint(sb: Storyboard, participantId: string, waypoint: Waypoint): Storyboard {
  const participant = find(sb, participantId);
  if (!canMove(participant.category)) {
    throw new Error(`${participantId} is ${participant.category} and cannot move`);
  }
  if (!(waypoint.time >= 0)) throw new Error(`Waypoint time must be 0 or more, got ${waypoint.time}`);
  const motion = [...(sb.motions[participantId] ?? []), waypoint];
  return { ...sb, motions: { ...sb.motions, [participantId]: motion } };
}

/** Step 3: something unexpected happens. */
export function addEvent(sb: Storyboard, event: IncidentEvent): Storyboard {
  if ('participantId' in event) find(sb, event.participantId);
  if (!(event.at >= 0)) throw new Error(`Event time must be 0 or more, got ${event.at}`);
  return { ...sb, events: [...sb.events, event] };
}

function find(sb: Storyboard, id: string): Participant {
  const participant = sb.participants.find((p) => p.id === id);
  if (!participant) throw new Error(`No participant called ${id} in this story`);
  return participant;
}
