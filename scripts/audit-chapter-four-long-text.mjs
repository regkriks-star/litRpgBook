import { chromium, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { CHAPTER_FOUR_SAVE, initialChapterFour } from '../src/chapter-four-game.ts';

const source = JSON.parse(readFileSync('src/chapter-four.json', 'utf8'))[49].map(run => run.text).join('');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const results = [];
try {
  for (const viewport of [{ width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 1280, height: 600 }]) {
    const mobile = viewport.width <= 844;
    const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const save = initialChapterFour();
    save.current = { ...save.current, page: 49 };
    save.history = Array.from({ length: 49 }, (_, index) => ({ ...initialChapterFour().current, page: index }));
    await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: CHAPTER_FOUR_SAVE, save });
    await page.goto('http://localhost:5173/');
    await page.getByRole('button', { name: 'Глава 4: Дама в кармане' }).click();
    await page.evaluate(() => document.fonts.ready);
    const text = page.locator('.c4-reading .dialogue-text');
    await expect(text.locator('p')).toHaveText(source);
    await text.hover();
    await page.mouse.wheel(0, 2000);
    await expect.poll(() => text.evaluate(el => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop))).toBeLessThanOrEqual(1);
    const metrics = await text.evaluate(el => ({ clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, scrollTop: el.scrollTop, overflowY: getComputedStyle(el).overflowY }));
    expect(metrics.scrollTop).toBeGreaterThan(0);
    expect(metrics.overflowY).toBe('auto');
    const next = page.getByRole('button', { name: 'Далее', exact: true });
    const button = await next.boundingBox();
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(button.y + button.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: `docs/reviews/chapter-04-followup/${viewport.width}-long-text-end.png` });
    await next.click();
    await expect(page.locator('.reader-progress')).toContainText('51 / 108');
    results.push({ viewport, paragraph: 49, sourceLength: source.length, ...metrics, nextButton: button });
    await context.close();
  }
  writeFileSync('docs/reviews/chapter-04-followup/long-text-metrics.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
