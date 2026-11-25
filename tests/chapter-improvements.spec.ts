import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

async function tap(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  expect(await locator.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), { x, y })).toBe(true);
  await page.mouse.click(x, y);
}

for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }]) {
  test(`improvements documents and controls ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // Scroll the actual contents panel; tapping itself must not auto-scroll.
    await page.locator('.contents-screen').evaluate(element => { element.scrollTop = element.scrollHeight; });
    const open = page.getByRole('button', { name: 'Улучшения глав', exact: true });
    await tap(page, open);
    const dialog = page.getByRole('dialog', { name: 'Улучшения глав' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Отложенные улучшения', exact: true })).toBeVisible();
    const select = dialog.getByRole('combobox');
    await expect(select.locator('option')).toHaveCount(5);
    const close = dialog.getByRole('button', { name: 'Закрыть', exact: true });
    const content = dialog.locator('.improvements-content');
    const table = dialog.locator('.improvements-table').first();
    await table.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await dialog.getByRole('button', { name: 'План с уровнем у каждого пункта' }).click();
    await expect(select).toHaveValue('../docs/plans/chapter-02.md');
    for (const filename of readdirSync('docs/plans').filter(name => name.endsWith('.md'))) {
      await select.selectOption('../docs/plans/' + filename);
      const source = readFileSync('docs/plans/' + filename, 'utf8');
      await expect(content.getByRole('heading').first()).toHaveText(source.split('\n')[0].replace(/^#+\s*/, ''));
      const expectedRows = source.split('\n').filter(line => line.startsWith('|') && !/^\|[\s:|\-]+$/.test(line));
      await expect(content.locator('tr')).toHaveCount(expectedRows.length);
      await content.evaluate(element => { element.scrollTop = element.scrollHeight; });
      await expect(content.locator('p, h3, .improvements-table').last()).toBeInViewport();
    }
    await select.selectOption('../docs/plans/chapter-02.md');
    await select.selectOption('../docs/plans/improvements.md');
    await expect.poll(() => content.evaluate(element => element.scrollTop)).toBe(0);
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: `test-results/chapter-improvements/${viewport.width}.png` });
    await tap(page, close);
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
    await tap(page, open);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(page.locator('.contents-screen')).toBeVisible();
  });
}

test('portrait asks to rotate the phone', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto('/');
  await page.locator('.contents-screen').evaluate(element => { element.scrollTop = element.scrollHeight; });
  await tap(page, page.getByRole('button', { name: 'Улучшения глав', exact: true }));
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.getByRole('heading', { name: 'Поверните телефон' })).toBeVisible();
  await expect(page.locator('.improvements-content')).toBeHidden();
  await page.setViewportSize({ width: 568, height: 320 });
  await expect(page.getByRole('dialog', { name: 'Улучшения глав' })).toBeVisible();
});
