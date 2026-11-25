import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { CHAPTER_FOUR_SAVE, initialChapterFour } from '../src/chapter-four-game';

const output = 'docs/reviews/chapter-04-followup';

for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }]) {
  test(`all three live hunt targets stay clear of the action at ${viewport.width}`, async ({ browser }) => {
    mkdirSync(output, { recursive: true });
    const mobile = viewport.width <= 844;
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch: mobile, isMobile: mobile });
    const page = await context.newPage();
    const save = initialChapterFour();
    save.current = { ...save.current, page: 38, lady: true, mouse: 'pocket' };
    save.history = Array.from({ length: 38 }, (_, index) => ({ ...initialChapterFour().current, page: index }));
    await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: CHAPTER_FOUR_SAVE, save });
    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'Глава 4: Дама в кармане' }).click();
      for (let n = 1; n <= 3; n++) {
        const target = page.getByRole('img', { name: 'Рогатый кролик справа от Мача', exact: true });
        await expect(target).toBeVisible();
        await expect(page.locator('.c4-rabbit')).toHaveCount(1);
        const rabbit = (await page.locator('.c4-rabbit').boundingBox())!;
        const button = page.getByRole('button', { name: `Продолжить охоту · ${n} / 3`, exact: true });
        const action = (await button.boundingBox())!;
        await page.screenshot({ path: `${output}/${viewport.width}-hunt${n}-target-final.png` });
        const overlapX = Math.max(0, Math.min(rabbit.x + rabbit.width, action.x + action.width) - Math.max(rabbit.x, action.x));
        const overlapY = Math.max(0, Math.min(rabbit.y + rabbit.height, action.y + action.height) - Math.max(rabbit.y, action.y));
        // Allow one pixel for fractional layout rounding at the transparent canvas edge.
        expect(Math.min(overlapX, overlapY), JSON.stringify({ rabbit, action })).toBeLessThanOrEqual(1);
        expect(action.width).toBeGreaterThanOrEqual(44);
        expect(action.height).toBeGreaterThanOrEqual(44);
        const point = { x: action.x + action.width / 2, y: action.y + action.height / 2 };
        expect(await button.evaluate((el, p) => el.contains(document.elementFromPoint(p.x, p.y)), point)).toBe(true);
        if (mobile) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
      }
      await expect(page.getByRole('img', { name: 'Кролик побеждён ударом дубинки', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Завершить дневную охоту', exact: true })).toBeEnabled();
    } finally { await context.close(); }
  });

  test(`tavern pours and serves separate poses at ${viewport.width}, reduced motion shows the served mug`, async ({ browser }) => {
    mkdirSync(output, { recursive: true });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    // A valid save selects the scene; the complete-route test verifies its gameplay state.
    const seed = initialChapterFour();
    seed.current = { ...seed.current, page: 75 };
    seed.history = Array.from({ length: 75 }, (_, index) => ({ ...initialChapterFour().current, page: index }));
    await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: CHAPTER_FOUR_SAVE, save: seed });
    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'Глава 4: Дама в кармане' }).click();
      const serving = page.locator('.c4-innkeeper.serving > .four-sprite');
      const pouring = page.locator('.c4-service-pour');
      const setPhase = async (time: number) => page.locator('.c4-innkeeper').evaluate((element, phase) => {
        for (const animation of element.getAnimations({ subtree: true })) {
          animation.pause();
          animation.currentTime = phase;
        }
      }, time);
      await setPhase(0);
      await expect(pouring).toHaveCSS('opacity', '1');
      await expect(serving).toHaveCSS('opacity', '0');
      await page.screenshot({ path: `${output}/${viewport.width}-pour.png` });
      await setPhase(4000);
      await expect(pouring).toHaveCSS('opacity', '0');
      await expect(serving).toHaveCSS('opacity', '1');
      await page.screenshot({ path: `${output}/${viewport.width}-serve.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(pouring).toBeHidden();
      await expect(serving).toHaveCSS('opacity', '1');
      for (const guest of await page.locator('.c4-patrons > div').all()) {
        await expect(guest).toHaveCSS('animation-name', 'none');
        await expect(guest).toHaveCSS('opacity', '1');
      }
      await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeEnabled();
      await page.getByRole('button', { name: 'Далее', exact: true }).click();
      await expect(page.locator('.reader-progress')).toContainText('77 / 108');
    } finally { await context.close(); }
  });
}
