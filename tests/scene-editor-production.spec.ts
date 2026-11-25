import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

test('published editor saves complete chapters, previews mobile ghosts and keeps edits when offline', async ({ page, context }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [], writes: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('__scene-editor')) writes.push(request.url()); });
  await page.goto('/episode/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const progress = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await page.getByRole('button', { name: 'Редактор сцен', exact: true }).click();
  const scene = page.frameLocator('iframe[title="Предпросмотр сцены"]');
  const select = () => page.locator('.editor-object-list button[data-scene-object-id="/ChapterOne-goddess-position-1"]').click();
  await select();
  await page.getByLabel('Смещение X', { exact: true }).fill('5');
  await page.getByLabel('Масштаб объекта').fill('1.15');
  await page.getByLabel('Комментарий к кадру').fill('Комментарий только для редактора');
  await page.getByRole('button', { name: 'Окно текста', exact: true }).click();
  const exportChapter = async () => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Сохранить главу', exact: true }).click();
    const downloaded = await pending;
    const chapter = JSON.parse(readFileSync((await downloaded.path())!, 'utf8'));
    expect(chapter.frames).toHaveLength(113);
    expect(chapter.frames[0].comment).toBe('Комментарий только для редактора');
    await expect(page.locator('.scene-editor-status')).toContainText('Сохранено для игры в этом браузере');
  };
  await exportChapter();
  mkdirSync('docs/reviews/scene-editor', { recursive: true });
  await page.screenshot({ path: 'docs/reviews/scene-editor/editor-desktop.png' });
  await page.getByRole('button', { name: 'Следующий кадр', exact: true }).click();
  await page.getByLabel('Размер предпросмотра').selectOption('4');
  await page.getByRole('button', { name: 'Предыдущие спрайты', exact: true }).click();
  await select();
  await expect(page.getByRole('button', { name: 'Примагнитить', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Примагнитить', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Отмагнитить', exact: true })).toBeVisible();
  expect(await scene.locator('html').evaluate(() => [innerWidth, innerHeight])).toEqual([568, 320]);
  await page.screenshot({ path: 'docs/reviews/scene-editor/editor-mobile-ghost.png' });
  await exportChapter();
  expect(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => !key.includes('scene-layout'))))).toEqual(progress);
  const documents = [1, 2, 3, 4, 5].map(chapter => JSON.parse(readFileSync('src/scenes/chapter-0' + chapter + '.json', 'utf8')));
  expect(await page.evaluate(documents => {
    for (const doc of documents) {
      const key = 'lazy-courage:scene-layout:' + doc.chapter + ':v1';
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(doc));
    }
    return documents.every(doc => Boolean(localStorage.getItem('lazy-courage:scene-layout:' + doc.chapter + ':v1')));
  }, documents)).toBe(true);
  await page.evaluate(() => { localStorage.setItem('lazy-courage:view', 'chapter-one'); localStorage.setItem('lazy-courage:chapter-one-page', '0'); });
  await context.setOffline(true);
  await page.goto('/episode/');
  await expect(page.locator('.story-window')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Комментарий только для редактора');
  await expect.poll(() => page.locator('.goddess-position').evaluate(node => new DOMMatrix(getComputedStyle(node).transform).e)).toBeCloseTo(72, 0);
  await page.reload();
  await expect.poll(() => page.locator('.goddess-position').evaluate(node => new DOMMatrix(getComputedStyle(node).transform).a)).toBeCloseTo(1.15, 2);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('published editor still exports JSON when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await page.goto('/episode/?scene-editor=1');
  await expect(page.locator('.editor-object-list button')).not.toHaveCount(0);
  await page.getByLabel('Комментарий к кадру').fill('Сохранить через файл');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Сохранить главу', exact: true }).click();
  const file = await pending;
  const chapter = JSON.parse(readFileSync((await file.path())!, 'utf8'));
  expect(chapter.frames[0].comment).toBe('Сохранить через файл');
  await expect(page.locator('.scene-editor-status')).toContainText('Хранилище браузера недоступно');
});
