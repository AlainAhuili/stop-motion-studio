// Layer 2: domain-specific language. Speaks the toy's language, hides ids and defaults.
import { expect, test as base } from '@playwright/test';
import { WebDriver } from '../drivers/web-driver';

type Where = [x: number, z: number];

export class StopMotion {
  private ids = new Map<string, string>();

  constructor(private driver: WebDriver) {}

  /** Places a participant under a story name, e.g. place('dog', { name: 'Rex', at: [0, 0] }). */
  async place(kind: string, { name = kind, at = [0, 0] as Where } = {}) {
    this.ids.set(name, await this.driver.place(kind, at[0], at[1]));
  }

  async move(name: string, { to, by, height = 0 }: { to: Where; by: number; height?: number }) {
    await this.driver.addWaypoint(this.id(name), by, to[0], height, to[1]);
  }

  async tryToMove(name: string, { to, by }: { to: Where; by: number }) {
    return this.driver.tryAddWaypoint(this.id(name), by, to[0], 0, to[1]);
  }

  async stop(name: string, { at, for: duration }: { at: number; for: number }) {
    await this.driver.addIncident('stop', this.id(name), at, duration);
  }

  async vanish(name: string, { at }: { at: number }) {
    await this.driver.addIncident('vanish', this.id(name), at, 0);
  }

  async rain({ at }: { at: number }) {
    await this.driver.addIncident('rain', undefined, at, 0);
  }

  async makeFilm({ fps = 12 } = {}) {
    return this.driver.makeFilm(fps);
  }

  async expectAt(name: string, time: number, where: Where) {
    await this.driver.goTo(time);
    const { position } = await this.driver.actor(this.id(name));
    expect([position[0], position[2]]).toEqual(where);
  }

  async expectVisible(name: string, time: number, visible: boolean) {
    await this.driver.goTo(time);
    expect((await this.driver.actor(this.id(name))).visible).toBe(visible);
  }

  async expectWeather(time: number, weather: 'clear' | 'rain') {
    await this.driver.goTo(time);
    expect(await this.driver.weather()).toBe(weather);
  }

  private id(name: string) {
    const id = this.ids.get(name);
    if (!id) throw new Error(`Nobody called ${name} was placed in this test`);
    return id;
  }
}

export const test = base.extend<{ toy: StopMotion }>({
  toy: async ({ page }, use) => {
    const driver = new WebDriver(page);
    await driver.open();
    await use(new StopMotion(driver));
  },
});
export { expect };
