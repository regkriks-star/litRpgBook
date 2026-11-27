import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import paragraphs from '../src/chapter-three.json' with { type: 'json' };
import { canAttack, canStrike, CHAPTER_THREE_SAVE, chapterThreeReducer, initialChapterThree, type ChapterAction } from '../src/chapter-three-game';

const source = paragraphs.map(runs => runs.map(run => run.text).join(''));
const state = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).current, CHAPTER_THREE_SAVE);
const snapshots = [0, 9, 15, 24, 25, 26, 27, 29, 35, 55, 61, 66, 68, 70, 72, 76, 77, 78, 79, 81, 83, 92, 95];
const output = 'docs/reviews/chapter-03-followup';
test.use({ actionTimeout: 10000 });

for (const viewport of [{ width: 1440, height: 900 }, { width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }]) {
  test(`chapter 3 complete book route, interactions and saves at ${viewport.width}`, async ({ browser }) => {
    test.setTimeout(180000);
    mkdirSync(output, { recursive: true });
    const mobile = viewport.width <= 844;
    const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const click = async (name: string) => { await page.getByRole('button', { name, exact: true }).click(); };
    const directClick = async (name: string) => {
      const box = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label'), point)).toBe(name);
      if (mobile) await page.touchscreen.tap(point.x, point.y);
      else await page.mouse.click(point.x, point.y);
    };
    const open = async (name: string) => { await page.locator('.chapter-system-menu').getByRole('button', { name, exact: true }).click(); await expect(page.locator('.c3-menu')).toBeVisible(); };
    const close = async () => { if (await page.getByRole('button', { name: 'Закрыть меню', exact: true }).count()) await click('Закрыть меню'); };
    const eat = async () => {
      await open('Инвентарь'); const s = await state(page);
      const food = page.getByRole('button', { name: `Яблоко: ${s.bag.apple}`, exact: true });
      if (mobile) {
        const a = (await food.boundingBox())!, b = (await page.locator('.inventory-grid').boundingBox())!;
        expect(a.height).toBeGreaterThanOrEqual(44); expect(a.y + a.height).toBeLessThanOrEqual(b.y + b.height + 1);
        await page.touchscreen.tap(a.x + a.width / 2, a.y + a.height / 2);
      } else await food.click();
      await close();
    };
    const metrics = [];
    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'Глава 3: Рыцарь с дубинкой' }).click();
      for (let index = 0; index < source.length; index++) {
        await expect(page.getByRole('main', { name: 'Глава 3', exact: true })).toBeVisible();
        expect((await state(page)).page).toBe(index);
        if (index >= 41 && index <= 60) {
          const row = page.locator(`[data-status-page="${index}"][aria-current="true"]`);
          await expect(row).toHaveText(source[index]);
          await expect(row).toBeInViewport();
          const [a, b] = await Promise.all([row.boundingBox(), page.locator('.chapter-menu-body').boundingBox()]);
          expect(a!.y).toBeGreaterThanOrEqual(b!.y - 1); expect(a!.y + a!.height).toBeLessThanOrEqual(b!.y + b!.height + 1);
        } else await expect(page.locator('.c3-reading .dialogue-text p')).toHaveText(source[index]);
        if (index === 15) {
          await open('Инвентарь');
          const boxes = await page.locator('.inventory-slot').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { y: r.y, bottom: r.bottom, width: r.width, height: r.height }; }));
          const first = boxes.filter(box => Math.abs(box.y - boxes[0].y) < 1);
          const second = boxes.find(box => box.y > boxes[0].y + 1)!;
          expect(second.y).toBeGreaterThanOrEqual(Math.max(...first.map(box => box.bottom)));
          expect(Math.min(...boxes.map(box => box.height))).toBeGreaterThanOrEqual(44);
          await page.screenshot({ path: `${output}/${viewport.width}-p15-inventory.png` });
          await directClick('Пакет Хатико: 1'); await directClick('Похлёбка, хлеб и сыр: 1'); await close();
        }
        if (index === 16) { await open('Достижения'); await click('Извращенец · F'); await expect(page.locator('.c3-description')).toContainText(source[17]); await close(); }
        if (index === 19) { await open('Класс и умения'); await click('Описание класса'); await click('Способности'); await close(); }
        if (index === 25) { await click('Заменить черепицу'); await click('Покрасить трубу'); await expect(page.getByRole('img', { name: 'Мач красит печную трубу' })).toBeVisible(); }
        if ([35, 65, 66, 67, 68, 70].includes(index)) {
          for (let n = 0; n < 10; n++) {
            const strike = page.getByRole('button', { name: 'Разящий удар', exact: true });
            const attack = page.getByRole('button', { name: 'Удар дубинкой', exact: true });
            if (await strike.count() && await strike.isEnabled()) await strike.click();
            else if (await attack.count() && await attack.isEnabled()) await attack.click();
            else break;
          }
          const loot = page.getByRole('button', { name: 'Собрать добычу', exact: true });
          if (await loot.count()) await loot.click();
          if (index === 35) await click('Умыться у реки');
        }
        if ([36, 69, 70].includes(index)) await eat();
        if (index === 40) { await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeDisabled(); await open('Статус'); await close(); }
        if (index === 61 || index === 77) {
          await open('Статус');
          while ((await state(page)).strength < (index === 61 ? 13 : 20)) await click('Добавить очко силы');
          if (index === 77) while ((await state(page)).speed < 5) await click('Добавить очко скорости');
          await close();
        }
        if (index === 63) { await open('Класс и умения'); await click('Разящий удар'); await click('Мысли о Ней'); await close(); }
        if (index === 64) { await open('Класс и умения'); await page.locator('.c3-tabs').getByRole('button', { name: /^Разящий удар/ }).click(); await click('Изучить Разящий удар · 1 очко'); await close(); }
        if (index === 72) { await open('Достижения'); await click('Череда побед'); await close(); }
        if (index === 77) {
          await open('Класс и умения'); await page.locator('.c3-tabs').getByRole('button', { name: /^Разящий удар/ }).click(); await click('Улучшить Разящий удар · 2 ур.');
          await page.locator('.c3-tabs').getByRole('button', { name: /^Мысли о Ней/ }).click(); await click('Изучить Мысли о Ней · 1 очко'); await close();
          const s = await state(page); expect([s.strength, s.speed, s.strike, s.thoughts]).toEqual([20, 5, 2, 1]);
        }
        if (index === 79) { await open('Торговля'); await page.getByRole('button', { name: /Продать Трава санка/ }).click(); await page.getByRole('button', { name: /Продать Круглый кристалл/ }).click(); expect((await state(page)).money).toBe(310); await close(); }
        if (index === 81) { await open('Торговля'); await click('Купить ремесло Охотник'); expect((await state(page)).money).toBe(110); await close(); }
        if (index === 82) { await open('Торговля'); for (const name of ['Осмотреть: Штаны, 700 канис', 'Осмотреть: Куртка, 1500 канис', 'Осмотреть: Шапочка, 2000 канис']) await click(name); await close(); }
        if (index === 83) { await open('Торговля'); await click('Купить и съесть суп · 10 канис'); expect((await state(page)).money).toBe(100); await close(); }
        if (index === 85) { await open('Инвентарь'); await click('Грубая дубинка: 1'); await expect(page.locator('.inventory-description')).toContainText('Урон 1–2'); await close(); }
        if (index === 93) { await open('Торговля'); await click('Осмотреть самодельный нож'); await expect(page.locator('.c3-trade')).toContainText(source[94]); await close(); }
        if (index === 95) {
          await open('Торговля'); const buy = page.getByRole('button', { name: 'Купить нож · 100 канис', exact: true });
          if (mobile) await buy.tap(); else await buy.click();
          expect((await state(page)).money).toBe(0); expect((await state(page)).bag.knife).toBe(1); await close();
        }
        if ([27, 39, 66, 68, 70, 81, 95].includes(index)) { const before = await state(page); await page.reload(); expect(await state(page)).toEqual(before); }
        if (index === 81) {
          const before = await state(page); await click('Назад'); await click('Далее');
          await open('Торговля'); await click('Купить ремесло Охотник'); await close(); expect(await state(page)).toEqual(before);
        }
        if (snapshots.includes(index)) {
          await page.screenshot({ path: `${output}/${viewport.width}-p${index}.png` });
          const m = await page.locator('.c3-reading').evaluate(el => ({ windowHeight: el.clientHeight, textHeight: el.querySelector('.dialogue-text')?.clientHeight ?? 0, viewportOverflow: document.documentElement.scrollWidth > innerWidth }));
          expect(m.viewportOverflow).toBe(false);
          if (index < 41 || index > 60) expect(m.textHeight).toBeGreaterThanOrEqual(49);
          for (const name of ['Назад', index === 96 ? 'Глава 4' : 'Далее']) {
            const control = page.getByRole('button', { name, exact: true });
            const box = (await control.boundingBox())!;
            if (viewport.width <= 950) {
              expect(box.height).toBeGreaterThanOrEqual(24); expect(box.height).toBeLessThanOrEqual(30);
              expect(await control.evaluate(element => parseFloat(getComputedStyle(element, '::after').height))).toBeGreaterThanOrEqual(44);
            } else expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
          }
          if ([26, 27, 29].includes(index)) {
            await expect(page.locator('.c3-residents')).toHaveCount(4);
            for (const resident of await page.locator('.c3-residents').all()) {
              const box = (await resident.boundingBox())!;
              const window = (await page.locator('.c3-reading').boundingBox())!;
              expect(box.y).toBeGreaterThanOrEqual(44);
              expect(box.y + box.height).toBeLessThanOrEqual(window.y);
            }
          }
          metrics.push({ page: index, ...m });
        }
        if (index < source.length - 1) { await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeEnabled(); await click('Далее'); }
      }
      await open('Инвентарь'); await expect(page.locator('.inventory-slot')).toHaveCount(100); await expect(page.locator('.inventory-slot svg')).toHaveCount(0); await close();
      await click('Журнал главы 3'); expect(await page.locator('.chapter-journal p').allTextContents()).toEqual(source); await close();
      await click('Читать главу 3 сначала'); await expect(page.getByRole('dialog')).toBeVisible(); await click('Продолжить чтение'); expect((await state(page)).page).toBe(96);
      if (viewport.width === 568) {
        await click('Читать главу 3 сначала');
        await page.setViewportSize({ width: 320, height: 568 }); await expect(page.getByRole('heading', { name: 'Поверните телефон' })).toBeVisible(); await page.screenshot({ path: `${output}/portrait.png` });
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await page.setViewportSize(viewport);
      }
      await click('Глава 4'); await expect(page.getByRole('main', { name: 'Глава 4', exact: true })).toBeVisible();
      await click('Оглавление'); await expect(page.getByRole('heading', { name: 'Оглавление' })).toBeVisible();
      expect(errors).toEqual([]);
      writeFileSync(`${output}/${viewport.width}-metrics.json`, JSON.stringify({ metrics, errors }, null, 2) + '\n');
    } finally { await context.close(); }
  });
}

test('roof actions show distinct poses with motion and never delay reading', async ({ page }) => {
  let save = initialChapterThree();
  const send = (action: ChapterAction) => { save = chapterThreeReducer(save, action); };
  while (save.current.page < 25) {
    if (save.current.page === 15) { send({ type: 'use', item: 'parcel' }); send({ type: 'use', item: 'ration' }); }
    if (save.current.page === 16) send({ type: 'inspect', id: 'pervert' });
    if (save.current.page === 19) { send({ type: 'inspect', id: 'class' }); send({ type: 'inspect', id: 'abilities' }); }
    send({ type: 'next' });
  }
  await page.goto('/');
  await page.evaluate(({ save, key }) => { localStorage.setItem(key, JSON.stringify(save)); localStorage.setItem('lazy-courage:view', 'chapter-three'); }, { save, key: CHAPTER_THREE_SAVE });
  await page.reload();
  await page.getByRole('button', { name: 'Заменить черепицу', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Мач заменяет черепицу', exact: true })).toBeVisible();
  expect(await page.locator('.c3-tile .c3-prop-art').evaluate(el => getComputedStyle(el).animationName)).toBe('tile-fit');
  await page.getByRole('button', { name: 'Покрасить трубу', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Мач красит печную трубу', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  expect((await state(page)).page).toBe(26);
  await expect(page.locator('.c3-residents')).toHaveCount(4);
  expect(await page.locator('.city-children').evaluate(el => getComputedStyle(el).animationName)).toBe('c3-children-route');
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Труба покрашена ✓', exact: true })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.c3-chimney .c3-prop-art').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});

test('critical exchanges and town routes remain clear with motion, back and reload', async ({ browser }) => {
  test.setTimeout(120000);
  let save = initialChapterThree();
  const send = (action: ChapterAction) => { save = chapterThreeReducer(save, action); };
  while (save.current.page < 68) {
    const p = save.current.page;
    if (p === 15) { send({ type: 'use', item: 'parcel' }); send({ type: 'use', item: 'ration' }); }
    for (const id of ({ 16: ['pervert'], 19: ['class', 'abilities'], 35: ['wash'], 63: ['strike', 'thoughts'] } as Record<number, string[]>)[p] ?? []) send({ type: 'inspect', id });
    if (p === 25) { send({ type: 'roof' }); send({ type: 'chimney' }); }
    if ([35, 65, 66, 67].includes(p)) {
      for (let n = 0; n < 10; n++) {
        if (canStrike(save.current)) send({ type: 'strike' });
        else if (canAttack(save.current)) send({ type: 'attack' });
        else break;
      }
      if (save.current.phase === 'loot') send({ type: 'loot' });
    }
    if (p === 36) send({ type: 'use', item: 'apple' });
    if (p === 40) send({ type: 'open', menu: 'status' });
    if (p === 61) while (save.current.strength < 13) send({ type: 'allocate', stat: 'strength' });
    if (p === 64) send({ type: 'learn-strike' });
    send({ type: 'next' });
  }
  for (const viewport of [{ width: 568, height: 320 }, { width: 1280, height: 600 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    try {
      await page.goto('/');
      await page.evaluate(({ save, key }) => { localStorage.setItem(key, JSON.stringify(save)); localStorage.setItem('lazy-courage:view', 'chapter-three'); }, { save, key: CHAPTER_THREE_SAVE });
      await page.reload();
      await page.getByRole('button', { name: 'Удар дубинкой', exact: true }).click();
      await expect(page.locator('.c3-hit-result')).toHaveText('Критический удар · −16 HP');
      await expect(page.locator('.c3-reply-result')).toHaveText('Критический удар рогом · −9 HP');
      const wounded = await state(page);
      expect(wounded.rabbitHp).toBe(14);
      await page.reload();
      expect(await state(page)).toEqual(wounded);
      await page.getByRole('button', { name: 'Разящий удар', exact: true }).click();
      await expect(page.locator('.c3-victory')).toHaveText('Кролик побеждён · добыча');
      expect(await page.locator('.c3-rabbit-remains').evaluate(el => getComputedStyle(el).animationName)).toBe('c3-rabbit-dissolve');
      await page.getByRole('button', { name: 'Собрать добычу', exact: true }).click();
      await page.getByRole('button', { name: 'Далее', exact: true }).click();
      expect((await state(page)).page).toBe(69);
      await page.getByRole('button', { name: 'Назад', exact: true }).click();
      expect((await state(page)).phase).toBe('rest');
      await page.screenshot({ path: `${output}/${viewport.width}-p68-motion.png` });
      const citySave = { ...save, current: save.history[27], history: save.history.slice(0, 27) };
      await page.evaluate(({ save, key }) => localStorage.setItem(key, JSON.stringify(save)), { save: citySave, key: CHAPTER_THREE_SAVE });
      await page.reload();
      await expect(page.locator('.c3-residents')).toHaveCount(4);
      await page.screenshot({ path: `${output}/${viewport.width}-p27-motion.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(await page.locator('.city-children').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
      const positions = await page.locator('.c3-residents').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
      await page.getByRole('button', { name: 'Далее', exact: true }).click();
      await page.getByRole('button', { name: 'Назад', exact: true }).click();
      await page.reload();
      expect(await page.locator('.c3-residents').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }))).toEqual(positions);
    } finally { await context.close(); }
  }
});
