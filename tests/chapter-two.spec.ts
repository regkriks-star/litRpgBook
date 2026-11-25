import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { availableMoves, chapterReducer, CHAPTER_TWO_SAVE, initialChapter, nextRequirement, type ChapterSave, type Item } from '../src/chapter-two-game';

const source: string[] = JSON.parse(execFileSync('python3', ['-c', `
import json, xml.etree.ElementTree as E
n={'f':'http://www.gribuser.ru/xml/fictionbook/2.0'}
s=next(s for s in E.parse('ленивое мужество.fb2').findall('.//f:body/f:section',n) if s.find('f:title',n) is not None and ''.join(s.find('f:title',n).itertext()).strip()=='Глава 2')
print(json.dumps([''.join(p.itertext()) for p in s.findall('f:p',n)]))
`], { encoding: 'utf8' }));

function fixture(target: number) {
  let save = initialChapter();
  while (save.current.page < target) {
    const s = save.current;
    if (!nextRequirement(s)) { save = chapterReducer(save, { type: 'next' }); continue; }
    if (s.page === 9) { save = chapterReducer(save, s.collected ? { type: 'use', item: 'leaves' } : { type: 'gather' }); continue; }
    if ([10, 64].includes(s.page)) { save = chapterReducer(save, { type: 'open-menu', menu: 'help' }); continue; }
    if (s.page === 42) { save = chapterReducer(save, { type: 'open-menu', menu: 'quests' }); continue; }
    if (s.page === 44) { save = chapterReducer(save, { type: 'open-menu', menu: 'status' }); continue; }
    if (s.page === 79) { save = chapterReducer(save, { type: 'open-menu', menu: 'inventory' }); continue; }
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
  if (page.url() === 'about:blank') await page.goto('/');
  await page.evaluate(({ save, key }) => { localStorage.setItem('lazy-courage:view', 'chapter-two'); localStorage.setItem(key, JSON.stringify(save)); }, { save: fixture(index), key: CHAPTER_TWO_SAVE });
  await page.reload();
}

async function state(page: Page) {
  return (await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), CHAPTER_TWO_SAVE) as ChapterSave).current;
}

async function interact(page: Page) {
  const s = await state(page);
  if ([10, 64].includes(s.page) && !s.menuVisits.includes(s.page)) { await page.getByRole('button', { name: 'Справка', exact: true }).click(); return; }
  if (s.page === 42 && !s.menuVisits.includes(42)) { await page.getByRole('button', { name: 'Задания', exact: true }).click(); return; }
  if (s.page === 44 && !s.menuVisits.includes(44)) { await page.getByRole('button', { name: 'Статус', exact: true }).click(); return; }
  if (s.page === 79 && !s.menuVisits.includes(79)) { await page.getByRole('button', { name: 'Инвентарь', exact: true }).click(); return; }
  const usable = page.locator('.inventory-slot[aria-label*="использовать"]');
  if (await usable.count()) { await usable.first().click(); return; }
  const close = page.getByRole('button', { name: 'Закрыть меню' });
  if (await close.count()) { await close.click(); return; }
  for (const name of ['Собрать листья цедулиса', 'Открыть инвентарь', 'Подобрать добычу', 'Поесть и отдохнуть', 'Следующий кролик', 'Передать пять кристаллов', 'Убрать пакет в инвентарь']) {
    const button = page.getByRole('button', { name, exact: true });
    if (await button.count()) { await button.click(); return; }
  }
  await page.locator('.chapter-battle-actions button:enabled').first().click();
}

for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }, { width: 1440, height: 1000 }]) {
  test(`chapter 2 preserves every paragraph and plays five fights, loot and meals without duplicate rewards at ${viewport.width}`, async ({ browser }) => {
    test.setTimeout(300000);
    const mobile = viewport.width <= 844;
    const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const metrics: unknown[] = [];
    const directory = 'docs/reviews/chapter-02-followup';
    mkdirSync(directory, { recursive: true });
    try {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
      await resume(page, 0);
      for (let index = 0; index < source.length; index++) {
        const statusListing = index >= 45 && index <= 63;
        const bookLine = statusListing ? page.locator('[data-status-page][aria-current="true"]') : page.locator('.chapter-two-text p');
        expect(await bookLine.textContent()).toBe(source[index]);
        if (statusListing) { await expect(bookLine).toBeInViewport(); await expect(page.locator('.chapter-two-text')).toHaveCount(0); }
        if (index === 23) {
          await expect(page.getByLabel('Ичиро Кока, Крестьянин, 24 уровень')).toBeVisible();
          await expect(page.locator('.chapter-two-text .spoken-text')).toHaveCount(2);
          await expect(page.locator('.chapter-two-text .narration-text')).toHaveCount(1);
        }
        if (index === 51) await expect(page.locator('[data-status-page="51"] em')).toHaveText('ХП — 140 МП — 20');
        if (index === 78) { expect((await state(page)).hp).toBe(64); expect((await state(page)).xp).toBe(12); }
        if (index === 84) {
          const s = await state(page);
          expect(s.bag.crystal).toBe(5); expect(s.fight).toBe(5); expect(s.hp).toBe(140);
          expect(s.log.filter(e => e.kind === 'heal')).toHaveLength(5);
        }
        if (index === 86) { expect((await state(page)).bag.crystal).toBe(5); expect((await state(page)).bag.parcel).toBe(0); }
        const dimensions = await page.locator('.reader-controls,.chapter-two-text,.chapter-menu').evaluateAll(els => els.map(el => ({ className: el.className, ...el.getBoundingClientRect().toJSON() })));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        expect(overflow).toBe(false);
        for (const rect of dimensions) {
          expect(rect.x).toBeGreaterThanOrEqual(0);
          expect(rect.y).toBeGreaterThanOrEqual(0);
          expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
          expect(rect.bottom).toBeLessThanOrEqual(viewport.height + 1);
        }
        for (const control of await page.locator('.reader-controls button').all()) {
          const box = (await control.boundingBox())!;
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
        metrics.push({ page: index, sourceMatches: true, dimensions, overflow });
        if (index === 23) {
          await page.locator('.chapter-two-text').evaluate(el => { el.scrollTop = el.scrollHeight; });
          await page.screenshot({ path: `${directory}/${viewport.width}-full-p23.png` });
        }
        if (index === source.length - 1) break;
        const next = page.getByRole('button', { name: 'Далее', exact: true });
        for (let guard = 0; await next.isDisabled() && guard < 60; guard++) {
          await interact(page);
          if (index === 76 && guard === 1 || index === 78 && guard === 0) {
            const before = await state(page); await page.reload(); expect(await state(page)).toEqual(before);
          }
        }
        await expect(next).toBeEnabled();
        const box = (await next.boundingBox())!;
        expect(await next.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
        })).toBe(true);
        if (mobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
      const final = await state(page); await page.reload(); expect(await state(page)).toEqual(final);
      await page.getByRole('button', { name: 'Назад', exact: true }).click();
      expect(await page.locator('.chapter-two-text p').textContent()).toBe(source[source.length - 2]);
      await page.getByRole('button', { name: 'Далее', exact: true }).click();
      expect(await page.locator('.chapter-two-text p').textContent()).toBe(source[source.length - 1]);
      await page.screenshot({ path: `${directory}/${viewport.width}-full-final.png` });
      await page.getByRole('button', { name: 'Глава 3', exact: true }).click();
      await expect(page.getByRole('main', { name: 'Глава 3', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Глава 2: Пять кроликов до Тантрума' })).toBeVisible();
      expect(errors).toEqual([]);
      writeFileSync(`${directory}/${viewport.width}-full-route.json`, JSON.stringify({ viewport, paragraphs: source.length, metrics, errors, reload: true, back: true, rawNextClicks: true, complete: true }, null, 2) + '\n');
    } finally { await context.close(); }
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 600 }, { width: 1024, height: 600 }, { width: 844, height: 390 }, { width: 568, height: 320 }]) {
  test(`chapter 2 menus, sprites, damage and reading fit ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await resume(page, 9);
    await page.getByRole('button', { name: 'Собрать листья цедулиса' }).click();
    await page.getByRole('button', { name: 'Открыть инвентарь', exact: true }).click();
    await expect(page.locator('.chapter-menu .chapter-two-censor')).toBeVisible();
    await expect(page.locator('.inventory-slot')).toHaveCount(100);
    await page.getByRole('button', { name: 'Листья цедулиса: 1, использовать' }).click();
    await expect(page.locator('.chapter-menu .meadow-hero.clothed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeEnabled();
    for (const index of [17, 49, 70, 79]) {
      await resume(page, index);
      if (index === 79) await page.getByRole('button', { name: 'Инвентарь', exact: true }).click();
      const bounds = await page.locator('.chapter-menu,.chapter-two-text,.reader-controls,.chapter-system-menu').evaluateAll(els => els.map(el => {
        const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
      }));
      for (const box of bounds) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(viewport.width); expect(box.bottom).toBeLessThanOrEqual(viewport.height); expect(box.top).toBeGreaterThanOrEqual(0); }
      if (index !== 49) expect(await page.locator('.chapter-two-text').evaluate(el => el.clientHeight)).toBeGreaterThanOrEqual(40);
      else await expect(page.locator('[data-status-page="49"][aria-current="true"]')).toBeInViewport();
      if (index === 17) {
        await expect(page.locator('.map-marker.front')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('button', { name: 'Закрыть меню' })).toHaveCount(0);
        await page.keyboard.press('Escape'); await expect(page.getByRole('region', { name: 'Карта — по сюжету' })).toBeVisible();
        await page.getByRole('button', { name: 'Инвентарь', exact: true }).click();
        await page.getByRole('button', { name: 'Закрыть меню' }).click();
        await expect(page.getByRole('region', { name: 'Карта — по сюжету' })).toBeVisible();
      }
      if (index === 70) {
        for (const selector of ['.chapter-hero-position .meadow-hero', '.chapter-rabbit-position .meadow-sprite']) {
          const rect = await page.locator(selector).boundingBox(); expect(rect!.height).toBeGreaterThan(30); expect(rect!.width).toBeGreaterThan(25);
        }
        await page.getByRole('button', { name: 'Пинок', exact: true }).click();
        await expect(page.locator('.chapter-combat-log summary')).toContainText('наносит вам 7 ед. урона');
        await expect(page.getByRole('log')).toBeHidden();
        await page.getByLabel('История сообщений', { exact: true }).click();
        await expect(page.getByRole('log')).toContainText('наносите рогатому кролику 1-го уровня 4');
        await expect(page.getByRole('meter', { name: 'HP Мача', exact: true })).toHaveAttribute('aria-valuenow', '133');
        expect(await page.locator('.combat-log-lines').evaluate(el => el.clientHeight)).toBeGreaterThan(40);
      }
    }
    await page.setViewportSize({ width: 320, height: 568 });
    await expect(page.getByRole('heading', { name: 'Поверните телефон' })).toBeVisible();
    await expect(page.getByRole('main', { name: 'Глава 2' })).toBeHidden();
  });
}

test('achievement warning fades, students fight automatically, and a saved combat restores its exact turn', async ({ page }) => {
  await resume(page, 26);
  await expect(page.locator('.game-notice.achievement')).toContainText('Извращенец');
  await expect(page.locator('.game-notice.achievement')).toContainText('предупреждает');
  await expect(page.locator('.game-notice.achievement')).toHaveCount(0, { timeout: 8000 });
  await resume(page, 28);
  await expect(page.getByLabel('Показательный бой — автоматически')).toBeVisible();
  await expect(page.getByText('Кролик повержен. Ученики продолжают тренировку.')).toBeVisible({ timeout: 8000 });
  await resume(page, 73);
  await page.getByRole('button', { name: 'Уклонение', exact: true }).click();
  await expect(page.locator('.chapter-combat-log summary')).toContainText('наносит вам 6');
  await page.getByLabel('История сообщений', { exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Уклониться не получилось');
  expect((await state(page)).hp).toBe(127);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Удар рукой', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Уклонение', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Удар рукой', exact: true }).click();
  expect((await state(page)).hp).toBe(120);
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  expect((await state(page)).hp).toBe(133);
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Уклонение', exact: true })).toBeEnabled();
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 568, height: 320 }]) {
  test(`chapter 2 shows the journey, gate actions and status fields at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await resume(page, 16);
    await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-road.webp$/);
    await expect(page.getByRole('img', { name: /Мач сидит рядом с Ичиро/ })).toBeVisible();
    await expect(page.locator('.chapter-hero-position')).toHaveCount(0);
    expect(await page.locator('.prologue-illustration img').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    for (const index of [33, 38, 39, 86, 88]) {
      await resume(page, index);
      await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-gates.webp$/);
      await expect(page.locator('.guard-poses')).toBeVisible();
      if (index === 38 || index === 39) await expect(page.locator('.guard-poses')).toHaveAttribute('aria-label', /скрестили копья/);
      if (index === 86) { await expect(page.getByRole('img', { name: 'Мач протягивает Хатико пять кристаллов' })).toBeVisible(); await page.getByRole('button', { name: 'Передать пять кристаллов', exact: true }).click(); await expect(page.locator('.held-parcel')).toBeVisible(); }
    }
    await resume(page, 45);
    for (let index = 45; index <= 63; index++) {
      const field = page.locator(`[data-status-page="${index}"][aria-current="true"]`);
      await expect(field).toHaveText(source[index]);
      await expect(field).toBeInViewport();
      const [row, menu] = await Promise.all([field.boundingBox(), page.locator('.chapter-menu-body').boundingBox()]);
      if (index > 45) { expect(row!.y).toBeGreaterThanOrEqual(menu!.y - 1); expect(row!.y + row!.height).toBeLessThanOrEqual(menu!.y + menu!.height + 1); }
      await expect(page.locator('.chapter-two-text')).toHaveCount(0);
      await page.getByRole('button', { name: 'Далее', exact: true }).click();
    }
    await expect(page.locator('.chapter-two-text p')).toHaveText(source[64]);
    await page.getByRole('button', { name: 'Журнал главы 2' }).click();
    expect(await page.locator('.chapter-journal p').allTextContents()).toEqual(source.slice(0, 65));
    await resume(page, 93);
    await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-river.webp$/);
    await expect(page.getByRole('img', { name: 'Мач бежит к реке' })).toBeVisible();
    await expect(page.locator('.river-crowd')).toBeVisible();
  });
}

test('cart journey and crossed spears show events without delaying navigation', async ({ page }) => {
  await resume(page, 16);
  expect(await page.locator('.prologue-illustration img').evaluate(el => getComputedStyle(el).animationName)).toBe('road-travel');
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  expect((await state(page)).page).toBe(17);
  await resume(page, 38);
  await expect(page.locator('.guard-poses')).toHaveAttribute('aria-label', /скрестили копья/);
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  expect((await state(page)).page).toBe(39);
});

for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }]) {
  test(`chapter 2 mobile inventory accepts direct touch and keeps a complete row at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await resume(page, 78);
      await page.getByRole('button', { name: 'Подобрать добычу', exact: true }).tap();
      await page.getByRole('button', { name: 'Поесть и отдохнуть', exact: true }).tap();
      for (const [fight, food] of [[1, 'Морковь'], [4, 'Апельсин'], [5, 'Яблоко']] as const) {
        if (fight > 1) {
          let save = fixture(83);
          while (save.current.fight < fight) {
            if (save.current.phase === 'rested') save = chapterReducer(save, { type: 'hunt' });
            else if (save.current.phase === 'combat') save = chapterReducer(save, { type: 'act', move: availableMoves(save.current)[0] });
            else if (save.current.phase === 'loot') save = chapterReducer(save, { type: 'loot' });
            else save = chapterReducer(save, { type: 'use', item: (['carrot', 'apple', 'orange'] as Item[]).find(item => save.current.bag[item])! });
          }
          while (save.current.phase === 'combat') save = chapterReducer(save, { type: 'act', move: availableMoves(save.current)[0] });
          save = chapterReducer(save, { type: 'loot' });
          await page.evaluate(({ save, key }) => localStorage.setItem(key, JSON.stringify(save)), { save, key: CHAPTER_TWO_SAVE });
          await page.reload();
          await page.getByRole('button', { name: 'Инвентарь', exact: true }).tap();
        }
        const slot = page.getByRole('button', { name: `${food}: 1, использовать`, exact: true });
        const [cell, grid] = await Promise.all([slot.boundingBox(), page.locator('.inventory-grid').boundingBox()]);
        expect(cell!.height).toBeGreaterThanOrEqual(44);
        const icon = await slot.locator('.item-icon').boundingBox();
        expect(icon!.width).toBeGreaterThanOrEqual(32); expect(icon!.height).toBeGreaterThanOrEqual(32);
        expect(cell!.y).toBeGreaterThanOrEqual(grid!.y);
        expect(cell!.y + cell!.height).toBeLessThanOrEqual(grid!.y + grid!.height + 1);
        // A coordinate tap deliberately avoids Playwright's automatic element scrolling.
        await page.touchscreen.tap(cell!.x + cell!.width / 2, cell!.y + cell!.height / 2);
        expect((await state(page)).hp).toBe(140);
        await expect(page.locator('.chapter-menu')).toBeVisible();
        await expect(page.locator('.inventory-slot')).toHaveCount(100);
        await expect(page.locator('.inventory-slot .item-icon')).not.toHaveCount(0);
        expect(await page.locator('.inventory-slot svg').count()).toBe(0);
        await page.locator('.inventory-grid').evaluate(el => el.scrollTop = el.scrollHeight);
        await expect(page.locator('.inventory-slot').last()).toBeInViewport();
        const healed = await state(page); await page.reload(); expect(await state(page)).toEqual(healed);
      }
      await resume(page, 70);
      expect(await page.locator('.chapter-two-text').evaluate(el => el.clientHeight)).toBeGreaterThanOrEqual(49);
      for (const name of ['Пинок', 'Удар рукой', 'Уклонение', 'Далее']) {
        expect((await page.getByRole('button', { name, exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(40);
      }
      await context.close();
    } finally { if (context.pages().length) await context.close(); }
  });
}

test('chapter 2 registers cart labels, gestures, hunter and river passage', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resume(page, 22);
  const before = await page.locator('.cart-ride').boundingBox();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  const after = await page.locator('.cart-ride').boundingBox();
  expect(after!.width).toBeCloseTo(before!.width, 1); expect(after!.height).toBeCloseTo(before!.height, 1);
  for (const [index, frame] of [[24, '2'], [26, '3'], [38, '0']] as const) {
    await resume(page, index); await expect(page.locator('.cart-ride')).toHaveAttribute('data-cart-frame', frame);
  }
  await expect(page.getByRole('img', { name: 'Повозка Ичиро без Мача въезжает в ворота Тантрума' })).toBeVisible();
  await resume(page, 86);
  for (const label of await page.locator('.guard-labels .character-label').all()) {
    const box = (await label.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(44); expect(box.x + box.width).toBeLessThanOrEqual(568);
  }
  await resume(page, 80);
  await expect(page.locator('.training-result')).toHaveText('Кролик повержен. Юный охотник продолжает охоту.');
  expect((await page.locator('.training-actors .person-6').boundingBox())!.height).toBeGreaterThan(60);
  await resume(page, 0); await expect(page.getByRole('img', { name: /Мач мягко приземлился и лежит/ })).toBeVisible();
  await resume(page, 17);
  for (const name of ['Хелис', 'Куратан', 'Войска Князя Тьмы', 'Тантрум', 'Деревни и леса', 'Океан']) {
    const choice = page.locator('.map-stops').getByRole('button', { name, exact: true });
    expect((await choice.boundingBox())!.height).toBeGreaterThanOrEqual(40);
    await choice.click(); await expect(page.locator('.map-caption > strong')).toHaveText(name);
  }
  await resume(page, 91); await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-hill.webp$/);
  await resume(page, 93); await expect(page.locator('.river-person')).toHaveCount(3);
  const standing = await page.locator('.river-person').evaluateAll(els => els.map(el => ({ x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y, bg: getComputedStyle(el).backgroundPosition })));
  await page.getByRole('button', { name: 'Далее', exact: true }).click(); await page.getByRole('button', { name: 'Далее', exact: true }).click();
  const parted = await page.locator('.river-person').evaluateAll(els => els.map(el => ({ x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y, bg: getComputedStyle(el).backgroundPosition })));
  expect(parted[0].x).toBeLessThan(standing[0].x); expect(parted[1].x).toBeGreaterThan(standing[1].x);
  expect(parted.map(p => p.bg)).not.toEqual(standing.map(p => p.bg));
});
