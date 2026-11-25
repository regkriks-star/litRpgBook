import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 568 } });

async function clickAtCenter(page: Page, target: Locator) {
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1366);
  expect(box!.y + box!.height).toBeLessThanOrEqual(568);
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

test('compact editor keeps both panels and properties accessible at the user monitor size', async ({ page }) => {
  await page.goto('/?scene-editor=1');
  const objects = page.locator('.editor-object-list');
  await expect(objects.locator('button')).not.toHaveCount(0);
  await clickAtCenter(page, objects.locator('button').first());
  await expect(page.getByLabel('Масштаб объекта')).toBeVisible();

  const left = (await page.locator('.scene-editor-objects').boundingBox())!;
  const preview = (await page.locator('.scene-editor-preview').boundingBox())!;
  const right = (await page.getByRole('complementary', { name: 'Параметры и комментарий' }).boundingBox())!;
  expect(left.width).toBe(210);
  expect(left.x + left.width).toBe(preview.x);
  expect(preview.x + preview.width).toBe(right.x);
  expect(right.width).toBe(230);
  await expect.poll(async () => (await page.locator('.editor-canvas').boundingBox())!.height).toBeGreaterThan(370);

  for (const name of ['Копировать', 'Вставить', 'Удалить', 'Отразить горизонтально', 'Отразить вертикально']) {
    const button = page.getByRole('button', { name, exact: true });
    await expect(button).toHaveAttribute('title', new RegExp(name));
    expect(await button.innerText()).toBe('');
  }
  await clickAtCenter(page, page.getByRole('button', { name: 'Отразить горизонтально', exact: true }));
  await expect(page.getByRole('button', { name: 'Отразить горизонтально', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await clickAtCenter(page, page.getByRole('button', { name: 'Отменить изменение' }));
  await expect(page.getByRole('button', { name: 'Отразить горизонтально', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await clickAtCenter(page, page.getByLabel('Комментарий к кадру'));
  await page.getByLabel('Комментарий к кадру').fill('Compact editor comment');
  await expect(page.getByLabel('Комментарий к кадру')).toHaveValue('Compact editor comment');

  const panels = await page.locator('.scene-editor-inspector').evaluateAll(elements => elements.map(element => ({ height: element.clientHeight, scrollHeight: element.scrollHeight })));
  for (const panel of panels) expect(panel.scrollHeight).toBe(panel.height);
  const scrollBefore = await objects.evaluate(element => element.scrollTop);
  const listBox = (await objects.boundingBox())!;
  await page.mouse.move(listBox.x + listBox.width / 2, listBox.y + listBox.height / 2);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => objects.evaluate(element => element.scrollTop)).toBeGreaterThan(scrollBefore);
  await page.screenshot({ path: 'output/scene-editor-1366/checked.png' });
});
