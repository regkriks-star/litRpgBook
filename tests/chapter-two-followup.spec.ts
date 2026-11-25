import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { availableMoves, chapterReducer, CHAPTER_TWO_SAVE, initialChapter, nextRequirement, type ChapterSave, type Item, type Menu } from '../src/chapter-two-game';

function fixture(target: number) {
  let save = initialChapter();
  while (save.current.page < target) {
    const s = save.current;
    if (!nextRequirement(s)) { save = chapterReducer(save, { type: 'next' }); continue; }
    if (s.page === 9) { save = chapterReducer(save, s.collected ? { type: 'use', item: 'leaves' } : { type: 'gather' }); continue; }
    const menu = ({ 10: 'help', 42: 'quests', 44: 'status', 64: 'help', 79: 'inventory' } as Record<number, Menu>)[s.page];
    if (menu) { save = chapterReducer(save, { type: 'open-menu', menu }); continue; }
    if (s.page === 86) { save = chapterReducer(save, { type: 'exchange' }); continue; }
    if (s.page === 89) { save = chapterReducer(save, { type: 'store-parcel' }); continue; }
    const move = availableMoves(s)[0];
    if (move) { save = chapterReducer(save, { type: 'act', move }); continue; }
    if (s.phase === 'loot') { save = chapterReducer(save, { type: 'loot' }); continue; }
    if (s.phase === 'healing') { const item = (['carrot', 'apple', 'orange'] as Item[]).find(item => s.bag[item])!; save = chapterReducer(save, { type: 'use', item }); continue; }
    save = chapterReducer(save, { type: 'hunt' });
  }
  return save;
}

async function resume(page: Page, index: number) {
  await page.evaluate(({ save, key }) => { localStorage.setItem('lazy-courage:view', 'chapter-two'); localStorage.setItem(key, JSON.stringify(save)); }, { save: fixture(index), key: CHAPTER_TWO_SAVE });
  await page.reload();
}

async function state(page: Page) {
  return (await page.evaluate(() => JSON.parse(localStorage.getItem('lazy-courage:chapter-two:v1')!)) as ChapterSave).current;
}

for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }]) {
  test(`chapter 2 followup: required actions and map at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 1000, isMobile: viewport.width < 1000, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const directory = 'docs/reviews/chapter-02-followup';
    mkdirSync(directory, { recursive: true });
    try {
      await page.goto('/');
      for (const [index, name] of [[10, 'Справка'], [42, 'Задания'], [44, 'Статус'], [64, 'Справка'], [79, 'Инвентарь']] as const) {
        await resume(page, index);
        await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeDisabled();
        await page.getByRole('button', { name, exact: true }).click();
        await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeEnabled();
        if (index === 42) await expect(page.getByText('Заданий нет', { exact: true })).toBeVisible();
        if (index === 64) await expect(page.locator('.chapter-help')).toContainText('100 + 4 × 10 = 140 HP');
        if (index === 79) {
          const grid = await page.locator('.inventory-grid').boundingBox();
          const first = await page.locator('.inventory-slot').first().boundingBox();
          expect(first!.height).toBeGreaterThanOrEqual(44);
          expect(first!.y + first!.height).toBeLessThanOrEqual(grid!.y + grid!.height + 1);
        }
        const before = await state(page); await page.reload(); expect(await state(page)).toEqual(before);
        await page.screenshot({ path: `${directory}/${viewport.width}-p${index}.png` });
      }
      await resume(page, 17);
      await page.locator('.map-stops').getByRole('button', { name: 'Океан', exact: true }).click();
      await page.getByRole('button', { name: 'Свернуть в миникарту', exact: true }).click();
      await expect(page.locator('.chapter-map.mini')).toBeVisible();
      await expect(page.locator('.map-caption > strong')).toHaveText('Океан');
      await page.getByRole('button', { name: 'Развернуть карту', exact: true }).click();
      await expect(page.locator('.map-caption > strong')).toHaveText('Океан');
      await page.screenshot({ path: `${directory}/${viewport.width}-map-resize.png` });

      await resume(page, 78);
      const loot = page.getByRole('button', { name: 'Подобрать добычу', exact: true });
      expect(await loot.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
      await loot.focus(); await page.keyboard.press('Enter');
      expect((await state(page)).bag.crystal).toBe(1);
      await expect(loot).toHaveCount(0);
      await expect(page.locator('.chapter-system-menu button[aria-label="Инвентарь"]')).toHaveCSS('border-top-color', 'rgb(255, 240, 162)');

      await resume(page, 86);
      const exchange = page.getByRole('button', { name: 'Передать пять кристаллов', exact: true });
      const button = (await exchange.boundingBox())!;
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(await exchange.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
      await page.screenshot({ path: `${directory}/${viewport.width}-p86-before.png` });
      await exchange.click();
      expect((await state(page)).bag.crystal).toBe(0);
      expect((await state(page)).bag.parcel).toBe(0);
      await expect(page.locator('.held-parcel')).toBeVisible();
      const exchanged = await state(page); await page.reload(); expect(await state(page)).toEqual(exchanged);
      await page.screenshot({ path: `${directory}/${viewport.width}-p86-after.png` });
      await page.getByRole('button', { name: 'Назад', exact: true }).click();
      expect((await state(page)).bag.crystal).toBe(5);
      await page.getByRole('button', { name: 'Далее', exact: true }).click();
      await exchange.click(); expect((await state(page)).bag.crystal).toBe(0);

      await resume(page, 89);
      await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeDisabled();
      await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-gates.webp$/);
      await page.getByRole('button', { name: 'Убрать пакет в инвентарь', exact: true }).click();
      expect((await state(page)).bag.parcel).toBe(1);
      await expect(page.locator('.held-parcel')).toHaveCount(0);
      await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-hill.webp$/);
    } finally { await context.close(); }
  });
  test(`chapter 2 followup: staged results at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const directory = 'docs/reviews/chapter-02-followup';
    mkdirSync(directory, { recursive: true });
    const metrics: unknown[] = [];
    try {
      await page.goto('/');
      for (const index of [0, 1, 3, 9, 24, 27, 33, 38, 53, 54, 70, 78, 80, 91, 92, 93, 95, 97]) {
        await resume(page, index);
        await page.screenshot({ path: `${directory}/${viewport.width}-p${index}.png` });
        const boxes = await page.locator('.reader-controls,.chapter-two-text,.chapter-menu,.chapter-system-menu').evaluateAll(els => els.map(el => ({ className: el.className, ...el.getBoundingClientRect().toJSON() })));
        metrics.push({ page: index, boxes });
        for (const box of boxes) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(viewport.width); expect(box.bottom).toBeLessThanOrEqual(viewport.height); }
        if (![53, 54].includes(index)) expect(await page.locator('.chapter-two-text').evaluate(el => el.clientHeight)).toBeGreaterThanOrEqual(40);
        if (index === 80) {
          const result = (await page.locator('.training-result').boundingBox())!;
          const speaker = (await page.locator('.chapter-two-reading > h2').boundingBox())!;
          expect(result.y + result.height).toBeLessThanOrEqual(speaker.y);
        }
      }
      writeFileSync(`${directory}/${viewport.width}-metrics.json`, JSON.stringify(metrics, null, 2));
    } finally { await context.close(); }
  });
}

test('chapter 2 followup: knife, landing, short rabbit fall and unchanged miss trajectory', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 568, height: 320 });
  await resume(page, 80);
  await expect(page.getByRole('img', { name: /низкий удар изогнутым ножом/ })).toBeVisible({ timeout: 3000 });
  await resume(page, 73);
  await page.getByRole('button', { name: 'Уклонение', exact: true }).click();
  await page.locator('.chapter-rabbit-position').evaluate(el => {
    const frames: string[] = [];
    const observer = new MutationObserver(() => { frames.push(el.className); el.setAttribute('data-observed-frames', JSON.stringify(frames)); });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    window.setTimeout(() => observer.disconnect(), 2000);
  });
  await page.getByRole('button', { name: 'Удар рукой', exact: true }).click();
  await expect(page.locator('.chapter-rabbit-position')).toHaveAttribute('data-observed-frames', /frame-3/);
  await expect(page.locator('.chapter-rabbit-position')).toHaveAttribute('data-observed-frames', /frame-1/);
  await resume(page, 76);
  await page.getByRole('button', { name: 'Пинок', exact: true }).click();
  await expect(page.locator('.chapter-rabbit-position.frame-2')).toBeVisible();
  await page.getByLabel('История сообщений', { exact: true }).click();
  await expect(page.getByRole('log')).toContainText('по той же траектории');
});

test('chapter 2 hunter label and result leave the action and reading clear on low screens', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }]) {
    await page.setViewportSize(viewport);
    await resume(page, 80);
    const label = (await page.locator('.training-actors .character-label').boundingBox())!;
    const actor = (await page.locator('.hunter-pose').boundingBox())!;
    const result = (await page.locator('.training-result').boundingBox())!;
    const speaker = (await page.locator('.chapter-two-reading > h2').boundingBox())!;
    expect(label.x).toBeGreaterThanOrEqual(actor.x + actor.width - 1);
    expect(label.x + label.width).toBeLessThanOrEqual(viewport.width);
    expect(result.y + result.height).toBeLessThanOrEqual(speaker.y);
    await page.screenshot({ path: `docs/reviews/chapter-02-followup/${viewport.width}-p80.png` });
  }
});
