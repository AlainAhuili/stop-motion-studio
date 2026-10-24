import { loadConfig } from '../config';
import { generateFilm, type Film, type Frame } from '../domain/film';
import { CATALOGUE, canMove, type Kind } from '../domain/participants';
import { addEvent, addWaypoint, emptyStoryboard, place, reposition, type IncidentEvent, type Storyboard } from '../domain/storyboard';
import { World } from './world';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const num = (id: string) => Number($<HTMLInputElement>(id).value);
const fmt = (n: number) => n.toFixed(1);

let story: Storyboard = emptyStoryboard();
let film: Film | undefined;
let playing = 0;

const world = new World($('stage'));
world.onDragEnd = (id, position) => change(() => reposition(story, id, position));
// Lets browser automation (the acceptance tests) find participants on screen to drag them.
Object.assign(window, { stopMotion: { screenPositionOf: world.screenPositionOf.bind(world) } });

loadConfig().then((config) => {
  if (config.environment !== 'production') $('env-badge').textContent = config.environment;
});

$<HTMLSelectElement>('place-kind').innerHTML = Object.entries(CATALOGUE)
  .map(([category, kinds]) => `<optgroup label="${category}">${kinds.map((k) => `<option>${k}</option>`).join('')}</optgroup>`)
  .join('');

/** Runs a change to the story, showing domain rule violations to the child instead of crashing. */
function change(update: () => Storyboard) {
  try {
    story = update();
    film = undefined;
    $('error').textContent = '';
    $<HTMLButtonElement>('play-btn').disabled = true;
    $<HTMLButtonElement>('seek-btn').disabled = true;
    $('film-status').textContent = 'Story changed: make the film again.';
    refresh();
  } catch (e) {
    $('error').textContent = (e as Error).message;
  }
}

function refresh() {
  const options = (ids: string[]) => ids.map((id) => `<option>${id}</option>`).join('');
  $('move-who').innerHTML = options(story.participants.filter((p) => canMove(p.category)).map((p) => p.id));
  $('event-who').innerHTML = options(story.participants.map((p) => p.id));
  $('story').innerHTML = story.participants
    .map((p) => `<li>${p.id} at (${fmt(p.position.x)}, ${fmt(p.position.z)}), ${(story.motions[p.id] ?? []).length} waypoints</li>`)
    .join('');
  world.showParticipants(story.participants);
}

function show(frame: Frame) {
  world.showFrame(frame);
  $('film-time').textContent = String(frame.time);
  $('film-weather').textContent = frame.weather;
  $('inspector').innerHTML = frame.actors
    .map(
      (a) => `<tr data-actor="${a.id}"><td>${a.id}</td>` +
        `<td data-field="position">${fmt(a.position.x)}, ${fmt(a.position.y)}, ${fmt(a.position.z)}</td>` +
        `<td data-field="visibility">${a.visible ? 'visible' : 'hidden'}</td></tr>`,
    )
    .join('');
}

$('place-btn').onclick = () =>
  change(() => place(story, $<HTMLSelectElement>('place-kind').value as Kind, { x: num('place-x'), y: 0, z: num('place-z') }));

$('move-btn').onclick = () =>
  change(() =>
    addWaypoint(story, $<HTMLSelectElement>('move-who').value, {
      time: num('move-time'),
      position: { x: num('move-x'), y: num('move-y'), z: num('move-z') },
    }),
  );

$('event-btn').onclick = () => {
  const type = $<HTMLSelectElement>('event-type').value as IncidentEvent['type'];
  const participantId = $<HTMLSelectElement>('event-who').value;
  const at = num('event-time');
  const event: IncidentEvent =
    type === 'stop' ? { type, participantId, at, duration: num('event-duration') }
    : type === 'vanish' ? { type, participantId, at }
    : { type, at };
  change(() => addEvent(story, event));
};

$('film-btn').onclick = () => {
  try {
    const started = performance.now();
    film = generateFilm(story, { fps: num('film-fps') });
    const ms = Math.round(performance.now() - started);
    $('film-status').textContent = `Film ready: ${film.frames.length} frames, ${film.duration} s at ${film.fps} fps (made in ${ms} ms)`;
    $<HTMLButtonElement>('play-btn').disabled = false;
    $<HTMLButtonElement>('seek-btn').disabled = false;
    show(film.frames[0]);
  } catch (e) {
    $('error').textContent = (e as Error).message;
  }
};

$('seek-btn').onclick = () => {
  if (!film) return;
  const index = Math.min(film.frames.length - 1, Math.max(0, Math.round(num('seek-time') * film.fps)));
  show(film.frames[index]);
};

$('play-btn').onclick = () => {
  if (!film) return;
  const current = film;
  const run = ++playing;
  const started = performance.now();
  const tick = (now: number) => {
    if (run !== playing || film !== current) return;
    const index = Math.floor(((now - started) / 1000) * current.fps);
    show(current.frames[Math.min(index, current.frames.length - 1)]);
    if (index < current.frames.length - 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

refresh();
