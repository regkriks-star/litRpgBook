import { SAVE_KEY } from '../src/game';
import { expect, test } from '@playwright/test';
import { assets } from '../src/assets';
import { CHAPTER_FIVE_SAVE } from '../src/chapter-five-game';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

test('new versions are offered on entry, resume and reconnect; applying an update preserves offline saves', async ({ page, context, request, baseURL }) => {
  test.setTimeout(180000);
  const worker = await (await request.get('/episode/sw.js')).text();
  let version = 1;
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url!, baseURL);
      if (url.pathname === '/episode/sw.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'max-age=86400' });
        res.end(worker.replace("const CACHE = PREFIX + '", `const CACHE = PREFIX + 'test-${version}-`));
        return;
      }
      const response = await fetch(url);
      let body = Buffer.from(await response.arrayBuffer());
      if (response.headers.get('content-type')?.includes('text/html')) {
        body = Buffer.from(body.toString().replace('<html', `<html data-pwa-test-version="${version}"`));
      }
      res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end();
    }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/episode/`;
  const notice = page.getByRole('status', { name: 'Обновление игры' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto(url);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.waitForLoadState('networkidle');
    await expect(notice).toBeHidden();
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.updateViaCache)).toBe('none');
    await page.getByRole('button', { name: /^Пролог:/ }).click();
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await expect(page.locator('.prologue-text')).toContainText('Итак, подруга.');

    version = 2;
    await page.reload();
    await expect(notice).toBeVisible({ timeout: 30000 });
    await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', '1');
    await expect(page.locator('.prologue-text')).toContainText('Итак, подруга.');
    const bounds = await notice.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(568);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(320);
    for (const button of await notice.getByRole('button').all()) {
      const bounds = await button.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: test.info().outputPath('update-568.png') });
    await notice.getByRole('button', { name: 'Позже', exact: true }).click();
    await expect(notice).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', '1');
    await page.reload();
    await expect(notice).toBeVisible({ timeout: 30000 });

    await context.setOffline(true);
    await notice.getByRole('button', { name: 'Обновить', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', '2');
    await expect(page.locator('.prologue-text')).toContainText('Итак, подруга.');
    await expect(notice).toBeHidden();
    await context.setOffline(false);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(async () => (await caches.keys()).filter(key => key.startsWith('lazy-courage:')))).toHaveLength(1);

    version = 3;
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(notice).toBeHidden();
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(notice).toBeVisible({ timeout: 30000 });
    await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', '2');
    await notice.getByRole('button', { name: 'Позже', exact: true }).click();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await expect(notice).toBeVisible({ timeout: 30000 });
    await notice.getByRole('button', { name: 'Обновить', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', '3');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);
    version = 4;
    await context.setOffline(false);
    await expect(notice).toBeVisible({ timeout: 30000 });
    await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', '3');
    await notice.getByRole('button', { name: 'Обновить', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-pwa-test-version', '4');
    await expect(page.locator('.prologue-text')).toContainText('Итак, подруга.');
    await expect(notice).toBeHidden();
    expect(errors).toEqual([]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('installable manifest, local assets and saved game work offline under a nested path', async ({ page, context, request }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const response = await request.get('/episode/manifest.webmanifest');
  const manifest = await response.json();
  expect(manifest.orientation).toBe('any');
  expect(manifest.start_url).toBe('./');
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(['192x192', '512x512']);
  await page.goto('/episode/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find(key => key.startsWith('lazy-courage:'))!);
    return (await cache.keys()).map(req => req.url);
  });
  for (const file of ['manifest.webmanifest', 'index.html', ...Object.values(assets).map(asset => `art/${asset.path}`)]) expect(cached.some(url => url.endsWith(file))).toBe(true);
  expect(cached.some(url => url.endsWith('.woff2'))).toBe(true);
  await page.getByRole('button', { name: 'Глава 8: Плохой день для электрика' }).click();
  await expect(page.locator('.speech-bubble')).toContainText('ЧТО?!');
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').value, SAVE_KEY)).toBe('playerDialogue');
  for (const sprite of await page.locator('.sprite').all()) {
    const url = await sprite.evaluate(el => getComputedStyle(el).backgroundImage.slice(5, -2));
    const response = await request.get(url);
    expect(response.headers()['content-type']).toContain('image/webp');
  }
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.speech-bubble')).toContainText('ЧТО?!');
  await expect(page.getByRole('meter', { name: 'HP Мача', exact: true })).toHaveAttribute('aria-valuenow', '128');
  await page.getByRole('button', { name: 'Продолжить бой' }).click();
  await expect(page.locator('.speech-bubble')).toContainText('ААА!!! САЯКА!!!');
  expect(await page.locator('.landscape').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(async () => {
    const urls = ['art/characters/mach/battle.webp', 'art/characters/sayaka/battle.webp', 'art/characters/scorpion/battle.webp', 'art/locations/guild.webp', 'icons/icon-192.png'];
    return (await Promise.all(urls.map(async url => (await fetch(url)).ok))).every(Boolean);
  })).toBe(true);
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Пролог:/ }).click();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.reload();
  await expect(page.locator('.prologue-text')).toContainText('Итак, подруга.');
  expect(await page.locator('.prologue-illustration img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Глава 1:/ }).click();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.reload();
  await expect(page.locator('.chapter-one-text')).toContainText('Сложно не поверить');
  expect(await page.locator('.chapter-one-background img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const goddessUrl = await page.locator('.goddess-frame').first().evaluate(el => getComputedStyle(el).backgroundImage.slice(5, -2));
  expect(goddessUrl).toContain('/episode/art/characters/dataris/audience.webp');
  expect(await page.evaluate(async url => (await fetch(url)).ok, goddessUrl)).toBe(true);
  await page.evaluate(() => localStorage.setItem('lazy-courage:chapter-one-page', '88'));
  await page.reload();
  await expect(page.locator('.gift-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Выбрать «Череда побед»' }).click({ position: {x:10, y:10} });
  await expect(page.locator('.card-reaction')).toContainText('это по мне');
  await page.getByRole('button', { name: 'Закрыть карту' }).click();
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Глава 2:/ }).click();
  for (let index = 0; index < 9; index++) await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.getByRole('button', { name: 'Собрать листья цедулиса' }).click();
  await page.getByRole('button', { name: 'Открыть инвентарь', exact: true }).click();
  await page.getByRole('button', { name: 'Листья цедулиса: 1, использовать' }).click();
  await page.reload();
  await expect(page.locator('.chapter-two-text')).toContainText('У одной из рощиц');
  await expect(page.locator('.meadow-hero.clothed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeEnabled();
  expect(await page.evaluate(async () => (await Promise.all(['locations/tantrum.webp', 'characters/mach/leaves.webp', 'characters/mach/travel.webp', 'characters/rabbit/meadow.webp', 'characters/tantrum/cast.webp'].map(path => fetch(`art/${path}`).then(response => response.ok)))).every(Boolean))).toBe(true);
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Глава 3:/ }).click();
  for (let index = 0; index < 15; index++) await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.locator('.chapter-system-menu').getByRole('button', { name: 'Инвентарь', exact: true }).click();
  await page.getByRole('button', { name: 'Пакет Хатико: 1', exact: true }).click();
  await page.getByRole('button', { name: 'Похлёбка, хлеб и сыр: 1', exact: true }).click();
  await page.reload();
  await expect(page.locator('.c3-reading .dialogue-text')).toContainText('На красоты города полюбоваться я не смог');
  expect(await page.locator('.prologue-illustration img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(async () => (await Promise.all(['locations/tantrum-cell.webp', 'characters/mach/town.webp', 'characters/mach/town-actions.webp', 'characters/tantrum/authorities.webp', 'items/town.webp', 'objects/tantrum-roof-repairs.webp'].map(path => fetch(`art/${path}`).then(response => response.ok)))).every(Boolean))).toBe(true);
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Глава 4:/ }).click();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.locator('.chapter-system-menu').getByRole('button', { name: 'Инвентарь', exact: true }).click();
  await page.getByRole('button', { name: 'Очистить яблоко ножом', exact: true }).click();
  await page.reload();
  await expect(page.locator('.c4-reading .dialogue-text')).toContainText('Яблоко этим самым ножом чистилось прекрасно');
  await page.locator('.chapter-system-menu').getByRole('button', { name: 'Инвентарь', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Очищенное яблоко: 1', exact: true })).toBeVisible();
  expect(await page.evaluate(async () => (await Promise.all(['locations/ichiro-farm.webp', 'locations/ichiro-hayloft.webp', 'locations/tantrum-tavern.webp', 'characters/mach/lady-mouse.webp', 'characters/mach/blessing.webp', 'characters/tantrum/ichiro-family-v2.webp', 'characters/tantrum/tavern-cast.webp', 'characters/tantrum/gate-reactions.webp', 'characters/tantrum/drinking.webp', 'items/hunt-and-tavern.webp'].map(path => fetch(`art/${path}`).then(response => response.ok)))).every(Boolean))).toBe(true);
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: /^Глава 5:/ }).click();
  for (let index = 0; index < 28; index++) await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.locator('[data-task="touch-mage"]').click();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.locator('.chapter-system-menu').getByRole('button', { name: 'Класс и ремесла', exact: true }).click();
  await page.locator('[data-task="assign-mage"]').click();
  await page.reload();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).current.lady, CHAPTER_FIVE_SAVE)).toBe('mage');
  await expect(page.locator('.c5-strength')).toContainText('Сила 68');
  const chapterFivePaths = [assets.chapterFiveDuel, assets.chapterFiveCast, assets.machTemple, assets.chapterFiveClose, assets.machMageContact, assets.tantrumTempleInside, assets.tantrumTempleOutside, assets.travelItems].map(asset => `art/${asset.path}`);
  expect(await page.evaluate(async urls => (await Promise.all(urls.map(url => fetch(url).then(response => response.ok)))).every(Boolean), chapterFivePaths)).toBe(true);
  expect(errors).toEqual([]);
});
