import { expect, test } from '@playwright/test';

test('the toy is ready to play within 3 seconds', async ({ page }) => {
  const started = Date.now();
  await page.goto('./');
  await expect(page.getByTestId('film-status')).toHaveText('No film yet.');
  expect(Date.now() - started).toBeLessThan(3000);
});
