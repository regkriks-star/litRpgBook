import { test, expect } from '@playwright/test';

const key = 'lazy-courage:reader-settings:v1';
const stored = { font: 130, window: 110, transparency: 45 };

test('reading settings are shared by the prologue, all chapters and chapter 8', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(({ key, stored }) => {
    localStorage.setItem(key, JSON.stringify(stored));
    localStorage.setItem('lazy-courage:view', 'chapter-one');
  }, { key, stored });
  await page.reload();
  const button = page.getByRole('button', { name: 'Настройки чтения', exact: true });
  for (const view of ['chapter-one', 'prologue', 'chapter-two', 'chapter-three', 'chapter-four', 'chapter-five']) {
    await page.evaluate(view => localStorage.setItem('lazy-courage:view', view), view);
    await page.reload();
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    const font = await page.locator('.dialogue-text').evaluate(element => getComputedStyle(element).fontSize);
    expect(parseFloat(font), view).toBeCloseTo(33.8, 1);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--reader-window-alpha').trim())).toBe('0.55');
  }
  await page.evaluate(() => localStorage.setItem('lazy-courage:view', 'episode'));
  await page.reload();
  await page.getByRole('button', { name: /^Глава 8:/ }).click();
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.getByRole('dialog', { name: 'Настройки чтения', exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(JSON.stringify(stored));
});

test('reading settings button and panel fit a 568 × 320 chapter header', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('lazy-courage:view', 'chapter-two'));
  await page.reload();
  const buttons = page.locator('.reader-toolbar > button, .chapter-header-actions > button');
  expect(await buttons.count()).toBeGreaterThanOrEqual(4);
  for (const box of await buttons.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }))) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(568);
  }
  await page.getByRole('button', { name: 'Настройки чтения', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Настройки чтения', exact: true });
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(568);
  expect(box.y + box.height).toBeLessThanOrEqual(320);
  for (const name of ['Размер шрифта', 'Высота окна с текстом', 'Прозрачность окна с текстом']) {
    const slider = (await page.getByRole('slider', { name, exact: true }).boundingBox())!;
    expect(slider.height).toBeGreaterThanOrEqual(44);
  }
  const reset = page.getByRole('button', { name: 'Сбросить настройки', exact: true });
  await reset.scrollIntoViewIfNeeded();
  await expect(reset).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
});
