import { createMotion } from './motion';
import type { Kind, Vec3 } from './participants';
import type { IncidentEvent, Storyboard } from './storyboard';

export interface Actor {
  id: string;
  kind: Kind;
  position: Vec3;
  visible: boolean;
}

export interface Frame {
  index: number;
  time: number;
  actors: Actor[];
  weather: 'clear' | 'rain';
}

export interface Film {
  fps: number;
  duration: number;
  frames: Frame[];
}

type Stop = Extract<IncidentEvent, { type: 'stop' }>;

/** Generates the film: every participant's state, frame by frame. */
export function generateFilm(sb: Storyboard, { fps }: { fps: number }): Film {
  if (!(fps > 0)) throw new Error(`fps must be greater than 0, got ${fps}`);

  const stopsOf = (id: string) =>
    sb.events.filter((e): e is Stop => e.type === 'stop' && e.participantId === id);
  const vanishAt = (id: string) =>
    Math.min(...sb.events.map((e) => (e.type === 'vanish' && e.participantId === id ? e.at : Infinity)));
  const rainAt = Math.min(...sb.events.map((e) => (e.type === 'rain' ? e.at : Infinity)));

  const duration = filmDuration(sb, stopsOf);
  const count = Math.floor(duration * fps + 1e-9) + 1;
  const frames: Frame[] = [];
  // Work out each participant's motion and events once, not once per frame.
  const cast = sb.participants.map((p) => ({
    p,
    motion: createMotion(p.position, sb.motions[p.id] ?? []),
    stops: stopsOf(p.id),
    vanishAt: vanishAt(p.id),
  }));

  try {
    for (let index = 0; index < count; index++) {
      const time = Math.round((index / fps) * 1e6) / 1e6;
      frames.push({
        index,
        time,
        weather: time >= rainAt ? 'rain' : 'clear',
        actors: cast.map(({ p, motion, stops, vanishAt }) => ({
          id: p.id,
          kind: p.kind,
          position: motion.positionAt(time - frozenTime(stops, time)),
          visible: time < vanishAt,
        })),
      });
    }
  } finally {
    cast.forEach(({ motion }) => motion.dispose());
  }
  return { fps, duration, frames };
}

/** How long a participant has spent stopped up to time `t`. */
function frozenTime(stops: Stop[], t: number): number {
  return stops.reduce((sum, s) => sum + Math.min(Math.max(t - s.at, 0), s.duration), 0);
}

function filmDuration(sb: Storyboard, stopsOf: (id: string) => Stop[]): number {
  const motionEnds = sb.participants.map((p) => {
    const lastWaypoint = Math.max(0, ...(sb.motions[p.id] ?? []).map((w) => w.time));
    return lastWaypoint + stopsOf(p.id).reduce((sum, s) => sum + s.duration, 0);
  });
  const eventEnds = sb.events.map((e) => e.at + (e.type === 'stop' ? e.duration : 0));
  return Math.max(1, ...motionEnds, ...eventEnds);
}
