import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import paragraphs from '../src/chapter-four.json' with { type: 'json' };
import { CHAPTER_FOUR_SAVE } from '../src/chapter-four-game';

const source = paragraphs.map(runs => runs.map(run => run.text).join(''));
const output = 'docs/reviews/chapter-04';
const state = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).current, CHAPTER_FOUR_SAVE);
test.use({ actionTimeout: 10000 });
for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }, { width: 1440, height: 900 }]) {
  test(`chapter 4 complete route, actions, source text and saves at ${viewport.width}`, async ({ browser }) => {
    // The full route includes 108 pages, UI actions, reloads and review screenshots.
    test.setTimeout(600000);
    mkdirSync(output, { recursive: true });
    const mobile = viewport.width <= 844;
    const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', r => { if (r.status() >= 400 && r.url().includes('/art/')) errors.push(`${r.status()} ${r.url()}`); });
    const click = async (name: string, toolbar = false) => {
      const scope = toolbar ? page.locator('.chapter-system-menu') : page;
      const button = scope.getByRole('button', { name, exact: true });
      // Explicitly scroll the menu's own panel, then use ordinary coordinates.
      await button.evaluate(el => {
        const panel = el.closest('.chapter-menu-body');
        if (!panel) return;
        const bounds = el.getBoundingClientRect(), area = panel.getBoundingClientRect();
        if (bounds.top < area.top || bounds.bottom > area.bottom) panel.scrollBy(0, bounds.top - area.top);
      });
      const box = (await button.boundingBox())!;
      expect(box.height, name).toBeGreaterThanOrEqual(44);
      expect(box.width, name).toBeGreaterThanOrEqual(44);
      expect(box.y, name).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height, name).toBeLessThanOrEqual(viewport.height + 1);
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      expect(await button.evaluate((el, point) => el.contains(document.elementFromPoint(point.x, point.y)), { x, y }), name).toBe(true);
      if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    };
    const open = async (name: string) => { await click(name, true); await expect(page.locator('.c4-menu')).toBeVisible(); };
    const close = async () => { if (await page.getByRole('button', { name: 'Закрыть меню', exact: true }).count()) await click('Закрыть меню'); };
    const screenshots = [1, 5, 7, 9, 12, 16, 17, 20, 22, 23, 24, 25, 27, 29, 30, 33, 38, 43, 46, 48, 49, 50, 65, 72, 75, 78, 84, 85, 87, 95, 98, 102, 103, 107];
    const metrics = [];
    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'Глава 4: Дама в кармане' }).click();
      for (let index = 0; index < source.length; index++) {
        expect((await state(page)).page).toBe(index);
        if (index >= 26 && index <= 38) await expect(page.locator('.c4-rabbit')).toHaveCount(1);
        if (index >= 51 && index <= 71) {
          const row = page.locator(`[data-status-page="${index}"][aria-current="true"]`);
          await expect(row).toHaveText(source[index]);
          await expect(row).toBeInViewport();
          const a = (await row.boundingBox())!, b = (await page.locator('.chapter-menu-body').boundingBox())!;
          expect(a.y).toBeGreaterThanOrEqual(b.y - 1); expect(a.y + a.height).toBeLessThanOrEqual(b.y + b.height + 1);
        } else await expect(page.locator('.c4-reading .dialogue-text p')).toHaveText(source[index]);
        if (index === 1) {
          await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeDisabled();
          await open('Инвентарь');
          for (const name of ['Очистить яблоко ножом', 'Нарезать морковь ножом', 'Проверить нож на себе · −3 HP']) await click(name);
          expect((await state(page)).hp).toBe(157); await close();
          await click('Атаковать кролика ножом'); await expect(page.locator('.c4-knife-return')).toContainText('возвращён в инвентарь');
          expect((await state(page)).bag.knife).toBe(1);
        }
        if (index === 12) await click('Отойти от ворот');
        if (index === 16) {
          await click('Снять Ичиро со столба'); await expect(page.getByRole('img', { name: 'Мач несёт спящего Ичиро на руках', exact: true })).toBeVisible();
          await page.screenshot({ path: `${output}/${viewport.width}-carry.png` });
          await click('Положить Ичиро в повозку');
        }
        if (index === 17) await click('Взять вожжи · ехать к деревне');
        if (index === 20 || index === 22) await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /ichiro-village-road\.webp$/);
        if (index === 23) await click('Отнести Ичиро в дом');
        if (index === 24) { await click('Поужинать у Оомы'); await open('Класс и ремесла'); await click('Изучить Кулинарию у Оомы'); await close(); await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /ichiro-hayloft\.webp$/); await expect(page.locator('.c4-npc')).toHaveCount(0); }
        if (index === 25) { await click('Щелбан коту · перехватить мышь'); await click('Посадить мышь в карман'); expect((await state(page)).mouse).toBe('pocket'); }
        if (index === 27) { await open('Класс и ремесла'); await click('Назначить даму · мышь'); expect((await state(page)).lady).toBe(true); await close(); }
        if (index === 29 || index === 50) { await open('Статус'); if (index === 29) { await expect(page.locator('.c4-buff-note')).toContainText('×2'); await page.screenshot({ path: `${output}/${viewport.width}-buff.png` }); } await close(); }
        if (index === 30) await click('Разящий удар');
        if (index === 32 || index === 35) await click('Собрать добычу');
        if (index === 33) await click('Удар дубинкой');
        if (index === 33) await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-day-meadow\.webp$/);
        if (index === 38) {
          for (let n = 1; n <= 3; n++) {
            await expect(page.getByRole('img', { name: 'Рогатый кролик справа от Мача', exact: true })).toBeVisible();
            if (n === 2) {
              const target = (await page.locator('.c4-rabbit').boundingBox())!;
              const action = (await page.getByRole('button', { name: `Продолжить охоту · ${n} / 3`, exact: true }).boundingBox())!;
              expect(target.x).toBeGreaterThan(action.x + action.width + 8);
            }
            await page.screenshot({ path: `${output}/${viewport.width}-hunt${n}-target.png` });
            await click(`Продолжить охоту · ${n} / 3`);
            await expect(page.locator('.c4-rabbit')).toHaveAttribute('data-encounter', String(Math.min(n, 2)));
            await page.screenshot({ path: `${output}/${viewport.width}-hunt${n}.png` });
          }
          await click('Завершить дневную охоту'); await open('Статус');
          for (const name of ['Сила', 'Выносливость', 'Скорость', 'Интеллект']) await click(`Развить: ${name}`);
          expect((await state(page)).freePoints).toBe(0); await close();
        }
        if (index === 43) {
          await open('Торговля'); await click('Продать 2247 пучков санки · 8988 канис'); await click('Продать 2247 ядер · 2247 канис'); expect((await state(page)).money).toBe(11235); await close();
        }
        if (index === 46) { await open('Торговля'); await expect(page.getByRole('button', { name: 'Продать все шкуры · денег у охотника не хватает', exact: true })).toBeDisabled(); await click('Продать 30 шкурок · 1500 канис'); expect((await state(page)).bag.pelt).toBe(280); await close(); }
        if (index === 47) { await open('Торговля'); await click('Продать партию мяса · 2800 канис'); await close(); }
        if (index === 48) {
          await open('Торговля'); await click('Заказать ужин и три кружки пива · 70 канис'); await close();
          await open('Инвентарь'); await click('Сытная похлёбка: 1'); await click('Жареная нога: 1');
          for (let n = 3; n > 0; n--) await click(`Кружка пива: ${n}`);
          expect((await state(page)).money).toBe(15465); await close();
        }
        if (index === 72) { await open('Класс и ремесла'); await click('Отказаться от дамы'); await close(); }
        if (index === 102) await expect(page.locator('.c4-hero .art-machBlessing')).toBeVisible();
        if (index === 84) { await open('Торговля'); await click('Оплатить пирушку и чаевые · 5300 канис'); expect((await state(page)).money).toBe(10165); await close(); }
        if ([48, 49, 50, 75, 78, 84].includes(index)) {
          await expect(page.locator('.c4-innkeeper.serving > .four-sprite')).toBeVisible();
          await expect(page.locator('.c4-service-pour')).toBeHidden();
          await expect(page.locator('.c4-patrons > div')).toHaveCount(2);
          await expect(page.locator('.c4-patrons')).toHaveClass(index >= 75 ? /adult-guests/ : /young-guests/);
        }
        if ([16, 27, 33, 46, 84, 103].includes(index)) { const before = await state(page); await page.reload(); expect(await state(page)).toEqual(before); }
        if ([27, 46, 84].includes(index)) {
          const before = await state(page); await click('Назад'); await click('Далее');
          if (index === 27) { await open('Класс и ремесла'); await click('Назначить даму · мышь'); await close(); }
          if (index === 46 || index === 84) { await open('Торговля'); await click(index === 46 ? 'Продать 30 шкурок · 1500 канис' : 'Оплатить пирушку и чаевые · 5300 канис'); await close(); }
          expect(await state(page)).toEqual(before);
        }
        if (screenshots.includes(index)) {
          for (const style of await page.locator('.four-sprite > div').evaluateAll(nodes => nodes.map(el => (el as HTMLElement).style.backgroundPosition))) expect(style).not.toBe('');
          await page.screenshot({ path: `${output}/${viewport.width}-p${index}.png` });
          const m = await page.locator('.c4-reading').evaluate(el => ({ textHeight: el.querySelector('.dialogue-text')?.clientHeight ?? 0, viewportOverflow: document.documentElement.scrollWidth > innerWidth }));
          expect(m.viewportOverflow).toBe(false);
          if (index < 51 || index > 71) expect(m.textHeight).toBeGreaterThanOrEqual(49);
          for (const name of ['Назад', index === 107 ? 'Глава 5' : 'Далее']) {
            const box = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
            expect(box.height).toBeGreaterThanOrEqual(44); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
          }
          metrics.push({ page: index, ...m });
        }
        if (index < 107) { await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeEnabled(); await click('Далее'); }
      }
      await open('Инвентарь'); await expect(page.locator('.inventory-slot')).toHaveCount(100); await expect(page.locator('.inventory-slot svg')).toHaveCount(0); await close();
      await click('Журнал главы 4'); expect(await page.locator('.chapter-journal p').allTextContents()).toEqual(source); await close();
      await click('Читать главу 4 сначала'); await expect(page.getByRole('dialog')).toBeVisible(); await click('Продолжить чтение');
      if (mobile) {
        await click('Читать главу 4 сначала'); await page.setViewportSize({ width: 320, height: 568 }); await expect(page.getByRole('heading', { name: 'Поверните телефон' })).toBeVisible(); await expect(page.getByRole('dialog')).toHaveCount(0); await page.screenshot({ path: `${output}/portrait.png` }); await page.setViewportSize(viewport);
      }
      await click('Глава 5'); await expect(page.getByRole('main', { name: 'Глава 5', exact: true })).toBeVisible();
      await click('Оглавление'); await expect(page.getByRole('heading', { name: 'Оглавление' })).toBeVisible();
      await page.getByRole('button', { name: 'Глава 4: Дама в кармане' }).click(); expect((await state(page)).page).toBe(107);
      expect(errors).toEqual([]);
      writeFileSync(`${output}/${viewport.width}-metrics.json`, JSON.stringify({ metrics, errors }, null, 2) + '\n');
    } finally { await context.close(); }
  });
}
test('motion conveys the actions while navigation never waits for animation', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Глава 4: Дама в кармане' }).click();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.locator('.chapter-system-menu').getByRole('button', { name: 'Инвентарь', exact: true }).click();
  for (const name of ['Очистить яблоко ножом', 'Нарезать морковь ножом', 'Проверить нож на себе · −3 HP']) await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Закрыть меню', exact: true }).click();
  await page.getByRole('button', { name: 'Атаковать кролика ножом', exact: true }).click();
  expect(await page.locator('.c4-knife-return .item-icon').evaluate(el => getComputedStyle(el).animationName)).toBe('c4-knife-back');
  await page.getByRole('button', { name: 'Далее', exact: true }).click(); expect((await state(page)).page).toBe(2);
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' }); expect(await page.locator('.c4-knife-return .item-icon').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
