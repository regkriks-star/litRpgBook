import { expect, test } from '@playwright/test';
import { CHAPTER_FIVE_SAVE, chapterFiveReducer, initialChapterFive, pageTasks } from '../src/chapter-five-game';

test('temple hands exclude the neighbouring boot on every screen and after offline reload', async ({ page, context }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let save = initialChapterFive();
  while (save.current.page < 79) {
    for (const task of pageTasks[save.current.page] ?? []) save = chapterFiveReducer(save, { type: 'do', task });
    save = chapterFiveReducer(save, { type: 'next' });
  }
  await page.goto('/episode/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  const original = save;
  for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    save = original;
    for (const target of [79, 84, 90, 91]) {
      while (save.current.page < target) {
        for (const task of pageTasks[save.current.page] ?? []) save = chapterFiveReducer(save, { type: 'do', task });
        save = chapterFiveReducer(save, { type: 'next' });
      }
      if (target === 84) save = chapterFiveReducer(save, { type: 'do', task: 'doors' });
      await page.evaluate(({ key, save }) => { localStorage.setItem(key, JSON.stringify(save)); localStorage.setItem('lazy-courage:view', 'chapter-five'); }, { key: CHAPTER_FIVE_SAVE, save });
      await page.reload();
      await expect(page.locator('[aria-label="Глава 5"]')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).current, CHAPTER_FIVE_SAVE)).toEqual(save.current);
      const hands = page.locator('.c5-hands');
      const box = (await hands.locator('.five-sprite > div').boundingBox())!;
      // This point belongs to the neighbouring boot, never to the drawn hands.
      const clip = { x: Math.floor(box.x + box.width * .12), y: Math.floor(box.y + box.height * .62), width: 2, height: 2 };
      const visible = await page.screenshot({ clip });
      await hands.evaluate(el => el.style.visibility = 'hidden');
      const background = await page.screenshot({ clip });
      expect(visible.equals(background)).toBe(true);
      await hands.evaluate(el => el.style.visibility = '');
      await page.screenshot({ path: `docs/reviews/chapter-05/${viewport.width}-final-p${target}.png` });
    }
  }
});
