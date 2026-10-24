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
