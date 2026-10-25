import { core } from './core';
import type { Kind, Vec3 } from './participants';
import type { Storyboard } from './storyboard';

// Rules: core/src/film.cpp. C++ returns the film as flat arrays;
// this file only unpacks them into frames for the viewer.

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

/** Generates the film: every participant's state, frame by frame. */
export function generateFilm(sb: Storyboard, { fps }: { fps: number }): Film {
  const raw = core.generateFilm(sb, fps);
  const frames: Frame[] = Array.from(raw.times, (time, index) => ({
    index,
    time,
    weather: raw.rain[index] ? 'rain' : 'clear',
    actors: sb.participants.map((p, a) => {
      const slot = index * raw.actors + a;
      return {
        id: p.id,
        kind: p.kind,
        position: { x: raw.positions[slot * 3], y: raw.positions[slot * 3 + 1], z: raw.positions[slot * 3 + 2] },
        visible: raw.visible[slot] === 1,
      };
    }),
  }));
  return { fps: raw.fps, duration: raw.duration, frames };
}
