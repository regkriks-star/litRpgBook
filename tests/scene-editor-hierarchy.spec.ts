import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 568 } });

test('object list shows nested poses and keeps copied groups together', async ({ page }) => {
  await page.goto('/?scene-editor=1');
  const list = page.locator('.editor-object-list');
  const group = list.locator('button[data-scene-object-id="/ChapterOne-goddess-position-1"]');
  const pose = list.locator('button[data-scene-object-id="/ChapterOne-goddess-position-1/ChapterOne-goddess-sprite-1"]');
  await expect(group).toBeVisible();
  await expect(group.locator('small')).toHaveText('Группа');
  const children = group.locator('..').getByRole('list', { name: 'Внутри: Датарис и трон' });
  await expect(children.locator('button')).toHaveCount(1);
  await expect(children.locator('button')).toHaveAttribute('data-scene-object-id', /goddess-sprite-1$/);
  const groupBox = (await group.boundingBox())!;
  const poseBox = (await pose.boundingBox())!;
  expect(poseBox.x - groupBox.x).toBeGreaterThanOrEqual(16);
  expect(poseBox.y).toBeGreaterThan(groupBox.y + groupBox.height);
  await page.mouse.click(poseBox.x + poseBox.width / 2, poseBox.y + poseBox.height / 2);
  await expect(pose).toHaveAttribute('aria-pressed', 'true');
  await expect(group).toHaveAttribute('aria-pressed', 'false');
  await page.mouse.click(groupBox.x + groupBox.width / 2, groupBox.y + groupBox.height / 2);
  await expect(group).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Копировать', exact: true }).click();
  await page.getByRole('button', { name: 'Вставить', exact: true }).click();
  const copy = list.locator('button[data-scene-object-id^="copy-"]').filter({ hasText: 'Датарис и трон' });
  await expect(copy).toHaveCount(1);
  await expect(copy.locator('..').getByRole('list').locator('button')).toHaveCount(1);
  await page.screenshot({ path: 'output/scene-editor-hierarchy/after.png' });
});
