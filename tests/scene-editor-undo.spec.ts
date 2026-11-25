import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 568 } });

test('Ctrl+C copies the selected object, Ctrl+Z undoes and text copying stays native', async ({ page }) => {
  await page.goto('/?scene-editor=1');
  const object = page.locator('.editor-object-list button').first();
  await object.click();
  const undo = page.getByRole('button', { name: 'Отменить изменение', exact: true });
  const flip = page.getByRole('button', { name: 'Отразить горизонтально', exact: true });
  const x = page.getByLabel('Смещение X', { exact: true });
  await expect(undo).toBeDisabled();
  await expect(undo).toHaveAttribute('title', /Ctrl\+Z/);
  await expect(undo).not.toHaveAttribute('title', /Ctrl\+C/);

  await x.fill('7');
  await flip.click();
  await page.keyboard.press('Control+z');
  await expect(flip).toHaveAttribute('aria-pressed', 'false');
  await expect(x).toHaveValue('7');
  await page.keyboard.press('Control+Shift+z');
  await expect(flip).toHaveAttribute('aria-pressed', 'true');

  // Ctrl+C copies, it does not undo.
  await page.keyboard.press('Control+c');
  await expect(flip).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Вставить', exact: true })).toBeEnabled();
  await page.keyboard.press('Control+v');
  await expect(page.locator('.editor-object-list button[data-scene-object-id^="copy-"]')).not.toHaveCount(0);

  // Repeated Ctrl+C must not remove the pasted copy.
  await page.keyboard.press('Control+c');
  await expect(page.locator('.editor-object-list button[data-scene-object-id^="copy-"]')).not.toHaveCount(0);

  // Undo removes the paste; text copying inside a field is left to the browser.
  await undo.click();
  await expect(page.locator('.editor-object-list button[data-scene-object-id^="copy-"]')).toHaveCount(0);
  const comment = page.getByLabel('Комментарий к кадру');
  await comment.fill('Текст для копирования');
  await comment.press('Control+a');
  await comment.press('Control+c');
  await expect(comment).toHaveValue('Текст для копирования');

  const box = (await undo.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(568);
  await page.screenshot({ path: 'output/scene-editor-undo/after.png' });
});
