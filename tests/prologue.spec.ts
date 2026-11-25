import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { SAVE_KEY } from '../src/game';

// Compare rendered text with the book, independently of the app's generated JSON.
const source: string[] = JSON.parse(execFileSync('python3', ['-c', `
import json, xml.etree.ElementTree as ET
ns = {'f': 'http://www.gribuser.ru/xml/fictionbook/2.0'}
root = ET.parse('ленивое мужество.fb2').getroot()
section = next(s for s in root.findall('.//f:body/f:section', ns) if s.find('f:title', ns) is not None and ''.join(s.find('f:title', ns).itertext()).strip() == 'Пролог')
print(json.dumps([''.join(p.itertext()) for p in section.findall('f:p', ns)]))
`], { encoding: 'utf8' }));

test('the entire prologue matches FB2 and uses eight working illustrations', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('/');
  await expect(page.locator('.chapter-entry')).toHaveCount(7);
  await page.getByRole('button', { name: /^Пролог:/ }).click();
  const actual: string[] = [];
  const images = new Set<string>();
  for (let i = 0; i < 12; i++) {
    actual.push(...await page.locator('.prologue-text p').allTextContents());
    const image = page.locator('.prologue-illustration img');
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    images.add((await image.getAttribute('src'))!);
    if (i === 1) await expect(page.locator('.prologue-text em')).toHaveText('том самом главном месте, ');
    if (i < 11) await page.getByRole('button', { name: 'Далее', exact: true }).click();
  }
  expect(actual).toEqual(source);
  expect(images.size).toBe(8);
  await page.getByRole('button', { name: 'К главе 1' }).click();
  await expect(page.locator('.chapter-one-text')).toContainText('О, душа, внемли моим словам!');
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 1280, height: 600 }, { width: 1024, height: 600 }, { width: 844, height: 390 }, { width: 568, height: 320 }]) {
  test(`prologue ${viewport.width}: controls, scroll, keyboard and resume`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.screenshot({ path: `test-results/contents-${viewport.width}.png` });
    await page.getByRole('button', { name: /^Пролог:/ }).click();
    const text = page.locator('.prologue-text');
    await expect(page.getByRole('button', { name: 'Назад', exact: true })).toBeDisabled();
    await text.focus();
    await page.keyboard.press('ArrowRight');
    await expect(text).toContainText('Итак, подруга.');
    await page.reload();
    await expect(text).toContainText('Итак, подруга.');
    await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
    await page.getByRole('button', { name: /^Пролог:/ }).click();
    await expect(text).toContainText('Итак, подруга.');
    await page.screenshot({ path: `test-results/prologue-${viewport.width}.png` });
    await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Оглавление', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    if (viewport.width === 568) {
      expect(await text.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
      await text.focus();
      await page.keyboard.press('End');
      await expect.poll(() => text.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    expect(await text.evaluate(el => el.scrollTop)).toBe(0);
    await page.getByRole('button', { name: 'Читать пролог сначала' }).click();
    await expect(text).toContainText('Ооцука Кэтсуо свято верил');
  });
}

test('visiting prologue preserves chapter 8 battle progress', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Глава 8:/ }).click();
  await expect(page.locator('.speech-bubble')).toContainText('ЧТО?!');
  const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Пролог:/ }).click();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Глава 8:/ }).click();
  await expect(page.locator('.speech-bubble')).toContainText('ЧТО?!');
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(before);
});

test('friend scene and apartment summoning show separate results without changing pages or text', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('lazy-courage:view', 'prologue');
    localStorage.setItem('lazy-courage:prologue-page', '2');
  });
  await page.reload();
  await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /friend\.webp$/);
  expect(await page.locator('.prologue-text').textContent()).toBe(source[2]);
  for (let i = 2; i < 8; i++) await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await expect(page.locator('.apartment-soul')).toHaveCSS('opacity', '1');
  const room = await page.locator('.prologue-illustration img').getAttribute('src');
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.locator('.apartment-event').evaluate(el => {
    for (const animation of el.getAnimations({ subtree: true })) {
      animation.pause(); animation.currentTime = 1200;
    }
  });
  await expect(page.locator('.apartment-seal')).toHaveCSS('opacity', '1');
  await expect(page.locator('.apartment-soul')).toHaveCSS('opacity', '1');
  await page.locator('.apartment-event').evaluate(el => {
    for (const animation of el.getAnimations({ subtree: true })) animation.currentTime = 2400;
  });
  await expect(page.locator('.apartment-soul')).toHaveCSS('opacity', '0');
  await expect(page.locator('.apartment-seal')).toHaveCSS('opacity', '0');
  expect(await page.locator('.prologue-illustration img').getAttribute('src')).toBe(room);
  expect(await page.locator('.prologue-text').textContent()).toBe(source[12]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.apartment-soul')).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.locator('.apartment-soul')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'docs/reviews/chapters-01-04/after-prologue-568-discovery.png' });
});
