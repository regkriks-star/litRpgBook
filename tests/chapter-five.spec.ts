import { test, expect, type Locator, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import paragraphs from '../src/chapter-five.json' with { type: 'json' };
import { CHAPTER_FIVE_SAVE, pageTasks } from '../src/chapter-five-game';

const source = paragraphs.map(runs => runs.map(run => run.text).join(''));
const output = 'docs/reviews/chapter-05';
const state = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).current, CHAPTER_FIVE_SAVE);
const viewports = [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }, { width: 1440, height: 900 }];
for (const viewport of viewports) {
  test(`chapter 5 full book route with direct taps, menus and saves at ${viewport.width}`, async ({ browser }) => {
    test.setTimeout(360000);
    mkdirSync(output, { recursive: true });
    const context = await browser.newContext({ viewport, hasTouch: viewport.width <= 844, isMobile: viewport.width <= 844, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400 && r.url().includes('/art/')) errors.push(`${r.status()} ${r.url()}`); });
    const click = async (button: Locator) => {
      await expect(button).toBeEnabled();
      await button.evaluate(el => {
        const panel = el.closest('.chapter-menu-body, .contents-screen');
        if (!panel) return;
        const a = el.getBoundingClientRect(), b = panel.getBoundingClientRect();
        if (a.top < b.top || a.bottom > b.bottom) panel.scrollBy(0, a.top - b.top);
      });
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44); expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      expect(await button.evaluate((el, p) => el.contains(document.elementFromPoint(p.x, p.y)), { x, y }), await button.textContent()).toBe(true);
      if (viewport.width <= 844) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    };
    const byName = (name: string) => page.getByRole('button', { name, exact: true });
    const open = async (name: string) => click(page.locator('.chapter-system-menu').getByRole('button', { name, exact: true }));
    const close = async () => { if (await byName('Закрыть меню').count()) await click(byName('Закрыть меню')); };
    const metrics = [];
    const shots = [0, 22, 28, 30, 32, 34, 35, 40, 44, 50, 56, 59, 61, 67, 75, 79, 82, 84, 89, 90, 91, 93];
    try {
      await page.goto('/');
      await click(page.getByRole('button', { name: 'Глава 5: Дуэль и гнев богини', exact: true }));
      await page.evaluate(() => document.fonts.ready);
      for (let index = 0; index < source.length; index++) {
        expect((await state(page)).page).toBe(index);
        await expect.poll(() => page.locator('.dialogue-text p').textContent()).toBe(source[index]);
        expect(await page.locator('.dialogue-text').evaluate(el => el.clientHeight)).toBeGreaterThanOrEqual(35);
        if ([0, 59, 93].includes(index)) {
          for (const name of ['Инвентарь', 'Статус', 'Класс и ремесла']) {
            await open(name); await page.screenshot({ path: `${output}/${viewport.width}-p${index}-${name}.png` });
            expect(await page.locator('.chapter-menu-body').evaluate(el => el.clientHeight)).toBeGreaterThan(20); await close();
          }
          await click(byName('Журнал главы 5'));
          if (index === 93) await expect(page.locator('.chapter-journal p')).toHaveCount(94);
          await close();
        }
        for (const task of pageTasks[index] ?? []) {
          await expect(byName('Далее')).toBeDisabled();
          const classTask = task.startsWith('assign-') || task === 'cancel';
          const tradeTask = /^(sell|inspect|buy|learn)-/.test(task);
          if (classTask && !(await page.locator('.menu-class').count())) await open('Класс и ремесла');
          if (tradeTask && !(await page.locator('.menu-trade').count())) await open('Торговля');
          if (!classTask && !tradeTask) await close();
          await click(page.locator(`[data-task="${task}"]`));
          await expect.poll(async () => (await state(page)).done.includes(task)).toBe(true);
          if (task === 'knee-three' || task === 'push-novice' || task === 'scaffolding') { await close(); await page.screenshot({ path: `${output}/${viewport.width}-${task}.png` }); }
        }
        await close();
        if (index === 32) {
          const log = page.locator('.c3-log summary');
          await click(log); await expect(page.locator('.c3-log [role="log"]')).toBeVisible();
          await page.screenshot({ path: `${output}/${viewport.width}-action-log.png` }); await click(log);
        }
        if ([30, 40, 56, 59, 82, 91].includes(index)) {
          const before = await state(page); await page.reload(); await expect(page.locator('[aria-label="Глава 5"]')).toBeVisible();
          expect(await state(page)).toEqual(before);
        }
        if ([35, 57, 60, 92].includes(index)) {
          const before = await state(page); await click(byName('Назад')); await click(byName('Далее')); expect(await state(page)).toEqual(before);
        }
        if (index === 40) { expect((await state(page)).money).toBe(15765); expect((await state(page)).bag.pelt).toBe(0); }
        if (index === 59) { expect((await state(page)).money).toBe(1265); expect((await state(page)).bag.axe).toBe(1); }
        if (index === 0) { await expect(page.locator('.dialogue-text .spoken-text')).toHaveCount(2); await expect(page.locator('.dialogue-text .spoken-text').last()).toHaveCSS('font-family', '"Golos Text", sans-serif'); }
        if (index === 91) await expect(page.locator('.prologue-illustration img')).toHaveAttribute('src', /tantrum-temple-outside\.webp$/);
        const data = await page.locator('.dialogue-text').evaluate(el => { el.scrollTop = el.scrollHeight; return { client: el.clientHeight, total: el.scrollHeight, bottom: el.scrollTop }; });
        metrics.push({ page: index, ...data, requirement: await byName(index === 93 ? 'К главам' : 'Далее').isDisabled() });
        if (shots.includes(index)) { await page.locator('.dialogue-text').evaluate(el => el.scrollTop = 0); await page.screenshot({ path: `${output}/${viewport.width}-p${index}.png` }); }
        if (index < 93) await click(byName('Далее'));
      }
      expect(errors).toEqual([]);
      writeFileSync(`${output}/${viewport.width}-metrics.json`, JSON.stringify({ viewport, pages: metrics, final: await state(page), errors }, null, 2));
      await click(byName('К главам')); await expect(page.getByRole('heading', { name: 'Оглавление', exact: true })).toBeVisible();
      await click(page.getByRole('button', { name: 'Глава 5: Дуэль и гнев богини', exact: true }));
      expect((await state(page)).page).toBe(93);
      await click(byName('Читать главу 5 сначала')); await click(byName('Продолжить чтение')); expect((await state(page)).page).toBe(93);
      await click(byName('Читать главу 5 сначала')); await click(byName('Начать заново')); expect((await state(page)).page).toBe(0);
    } finally { await context.close(); }
  });
}

test('normal motion, rapid navigation, portrait and fourth chapter continuation', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Глава 5: Дуэль и гнев богини', exact: true }).click();
  const go = async (target: number) => {
    while ((await state(page)).page < target) {
      const s = await state(page);
      for (const task of pageTasks[s.page] ?? []) {
        if (task.startsWith('assign-') || task === 'cancel') await page.locator('.chapter-system-menu').getByRole('button', { name: 'Класс и ремесла', exact: true }).click();
        if (/^(sell|inspect|buy|learn)-/.test(task)) {
          if (!await page.locator('.menu-trade').count()) await page.locator('.chapter-system-menu').getByRole('button', { name: 'Торговля', exact: true }).click();
        }
        await page.locator(`[data-task="${task}"]`).click();
        if (task.startsWith('assign-') || task === 'cancel') await page.getByRole('button', { name: 'Закрыть меню', exact: true }).click();
      }
      if (await page.getByRole('button', { name: 'Закрыть меню', exact: true }).count()) await page.getByRole('button', { name: 'Закрыть меню', exact: true }).click();
      await page.getByRole('button', { name: 'Далее', exact: true }).click();
    }
  };
  await go(29);
  await expect(page.locator('.c5-contact .art-machMageContact')).toHaveAttribute('data-frame', '0');
  await expect(page.locator('.c5-mage')).toHaveCount(0);
  await page.screenshot({ path: `${output}/568-contact.png` });
  await page.locator('.chapter-system-menu').getByRole('button', { name: 'Класс и ремесла', exact: true }).click();
  await page.locator('[data-task="assign-mage"]').click(); await page.getByRole('button', { name: 'Закрыть меню', exact: true }).click();
  await expect(page.locator('.c5-mage')).toHaveClass(/blessed/); await page.screenshot({ path: `${output}/motion-blessing.png` });
  await page.getByRole('button', { name: 'Далее', exact: true }).click(); expect((await state(page)).page).toBe(30);
  await go(79); await expect(page.locator('.c5-hands')).toBeVisible(); await page.screenshot({ path: `${output}/motion-grasp.png` });
  await page.getByRole('button', { name: 'Далее', exact: true }).click(); expect((await state(page)).page).toBe(80);
  await page.setViewportSize({ width: 390, height: 844 }); await expect(page.getByText('Поверните телефон', { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: `${output}/portrait.png` });
  await page.setViewportSize({ width: 844, height: 390 }); await expect(page.locator('.reader-header')).toBeVisible();
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: 'Глава 4: Дама в кармане', exact: true }).click();
  await page.evaluate(() => {
    const key = 'lazy-courage:chapter-four:v1'; const save = JSON.parse(localStorage.getItem(key)!);
    const first = save.current; save.history = Array.from({ length: 107 }, (_, page) => ({ ...first, page })); save.current = { ...first, page: 107 };
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload(); await page.getByRole('button', { name: 'Глава 5', exact: true }).click();
  await expect(page.locator('[aria-label="Глава 5"]')).toBeVisible(); expect((await state(page)).page).toBe(80);
});
