// Layer 3: protocol driver. The only acceptance layer that knows about the DOM and Playwright.
import { expect, type Page } from '@playwright/test';

export class WebDriver {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('./');
    await expect(this.page.getByTestId('film-status')).toHaveText('No film yet.');
  }

  /** Places a participant and returns the id the app gave it. */
  async place(kind: string, x: number, z: number): Promise<string> {
    await this.page.selectOption('#place-kind', kind);
    await this.page.fill('#place-x', String(x));
    await this.page.fill('#place-z', String(z));
    const story = this.page.getByTestId('story').locator('li');
    const before = await story.count();
    await this.page.click('#place-btn');
    await expect(story).toHaveCount(before + 1);
    return (await story.last().textContent())!.split(' ')[0];
  }

  /** Drags a participant with the mouse in the 3D view and drops it over ground spot (x, z). */
  async drag(id: string, x: number, z: number) {
    type Hook = { stopMotion: { screenPositionOf(id: string, at?: { x: number; z: number }): { x: number; y: number } } };
    const [from, to] = await this.page.evaluate(
      ([id, x, z]) => {
        const hook = (window as unknown as Hook).stopMotion;
        return [hook.screenPositionOf(id), hook.screenPositionOf(id, { x, z })];
      },
      [id, x, z] as const,
    );
    const story = this.page.getByTestId('story');
    const before = await story.textContent();
    await this.page.mouse.move(from.x, from.y);
    await this.page.mouse.down();
    await this.page.mouse.move(to.x, to.y, { steps: 10 });
    await this.page.mouse.up();
    await expect(story).not.toHaveText(before!);
  }

  async addWaypoint(id: string, time: number, x: number, y: number, z: number) {
    await this.page.selectOption('#move-who', id);
    await this.page.fill('#move-time', String(time));
    await this.page.fill('#move-x', String(x));
    await this.page.fill('#move-y', String(y));
    await this.page.fill('#move-z', String(z));
    await this.page.click('#move-btn');
  }

  async tryAddWaypoint(id: string, time: number, x: number, y: number, z: number) {
    // Landscape is not offered in the "who moves" list, so a child cannot even pick it.
    const offered = await this.page.locator('#move-who option').allTextContents();
    if (!offered.includes(id)) return `${id} cannot move`;
    await this.addWaypoint(id, time, x, y, z);
    return this.page.getByTestId('error').textContent();
  }

  async addIncident(type: string, id: string | undefined, at: number, duration: number) {
    await this.page.selectOption('#event-type', type);
    if (id) await this.page.selectOption('#event-who', id);
    await this.page.fill('#event-time', String(at));
    await this.page.fill('#event-duration', String(duration));
    await this.page.click('#event-btn');
  }

  async makeFilm(fps: number) {
    await this.page.fill('#film-fps', String(fps));
    await this.page.click('#film-btn');
    await expect(this.page.getByTestId('film-status')).toContainText('Film ready');
    const status = (await this.page.getByTestId('film-status').textContent())!;
    const [, frames, duration] = status.match(/(\d+) frames, ([\d.]+) s/)!;
    return { frames: Number(frames), duration: Number(duration) };
  }

  async goTo(time: number) {
    await this.page.fill('#seek-time', String(time));
    await this.page.click('#seek-btn');
    await expect(this.page.getByTestId('film-time')).toHaveText(String(time));
  }

  async actor(id: string) {
    const row = this.page.locator(`[data-actor="${id}"]`);
    const position = (await row.locator('[data-field="position"]').textContent())!.split(', ').map(Number);
    const visible = (await row.locator('[data-field="visibility"]').textContent()) === 'visible';
    return { position, visible };
  }

  weather() {
    return this.page.getByTestId('film-weather').textContent();
  }
}
