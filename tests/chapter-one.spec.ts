import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { SAVE_KEY } from '../src/game';
import { datarisPoses, datarisGestures } from '../src/dataris-poses';

const source: string[] = JSON.parse(execFileSync('python3', ['-c', `
import json, xml.etree.ElementTree as ET
ns = {'f': 'http://www.gribuser.ru/xml/fictionbook/2.0'}
root = ET.parse('ленивое мужество.fb2').getroot()
section = next(s for s in root.findall('.//f:body/f:section', ns) if s.find('f:title', ns) is not None and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 1')
print(json.dumps([''.join(p.itertext()) for p in section.findall('f:p', ns)]))
`], { encoding: 'utf8' }));

async function resume(page: import('@playwright/test').Page, index: number) {
  if (page.url() === 'about:blank') await page.goto('/');
  await page.evaluate(index => {
    localStorage.setItem('lazy-courage:view', 'chapter-one');
    localStorage.setItem('lazy-courage:chapter-one-page', String(index));
  }, index);
  await page.reload();
}

test('whole first chapter preserves FB2 text, typography, emphasis and existing saves', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await resume(page, 0);
  for (let i = 0; i < source.length; i++) {
    expect(await page.locator('.chapter-one-text p').textContent()).toBe(source[i]);
    if (i === 13) {
      await expect(page.locator('.chapter-one-text .spoken-text')).toHaveCount(2);
      await expect(page.locator('.chapter-one-text .spoken-text').first()).toHaveCSS('font-family', '"Golos Text", sans-serif');
      await expect(page.locator('.chapter-one-text .narration-text')).toHaveCSS('font-family', 'Alegreya, Georgia, serif');
    }
    if (i === 51) await expect(page.locator('.chapter-one-text strong')).toHaveText('предостережение.');
    if ([27, 39, 61, 85, 86, 87, 91].includes(i)) await expect(page.locator('.chapter-one-text em')).toHaveCount(1);
    if (i < source.length - 1) await page.getByRole('button', { name: 'Далее', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'К главам', exact: true })).toBeVisible();
  await page.reload();
  expect(await page.locator('.chapter-one-text p').textContent()).toBe(source.at(-1));
  await page.getByRole('button', { name: 'К главам', exact: true }).click();
  await expect(page.locator('.chapter-entry')).toHaveCount(7);
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 1280, height: 600 }, { width: 1024, height: 600 }, { width: 844, height: 390 }, { width: 568, height: 320 }]) {
  test(`cards, readable text and scene controls at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await resume(page, 25);
    await expect(page.locator('.scattered-card:not(.vanished)')).toHaveCount(72);
    await page.getByRole('button', { name: 'Открыть карту 72', exact: true }).click();
    await expect(page.locator('.revealed-card')).toContainText('Боевой алхимик');
    expect(await page.locator('.chapter-one-text').textContent()).toBe(source[26]);
    await page.getByRole('button', { name: 'Прочитать карту «Боевой алхимик»' }).click();
    await expect(page.getByRole('dialog')).toContainText('собственноручно изготовленных');
    await page.getByRole('button', { name: 'Закрыть карту' }).click();
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await expect(page.locator('.revealed-card')).toHaveCSS('opacity', '0');
    await resume(page, 36);
    await expect(page.locator('.scattered-card:not(.vanished)')).toHaveCount(12);
    await resume(page, 38);
    await expect(page.locator('.scattered-card:not(.vanished)')).toHaveCount(1);
    await expect(page.locator('.revealed-card')).toContainText('Рыцарь крови');
    await resume(page, 69);
    await expect(page.locator('.card-amendment')).toContainText('Невозможность сменить даму');
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await expect(page.locator('.card-amendment')).toContainText('Теперь даму можно менять');
    await page.reload();
    await expect(page.locator('.card-amendment')).toContainText('Теперь даму можно менять');
    await resume(page, 88);
    await expect(page.locator('.gift-card')).toHaveCount(3);
    for (const [title, reaction] of [['Океан опыта', 'упорство'], ['Гений', 'другой план'], ['Череда побед', 'это по мне']]) {
      await page.getByRole('button', { name: `Выбрать «${title}»` }).click({ position: { x: 10, y: 10 } });
      await expect(page.locator('.card-reaction')).toContainText(reaction);
      await expect(page.getByRole('button', { name: 'Закрыть карту' })).toBeInViewport();
      await page.getByRole('button', { name: 'Вернуться к истории' }).click();
      expect(await page.locator('.chapter-one-text').textContent()).toBe(source[88]);
    }
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    await expect(page.locator('.chosen-gift')).toContainText('Череда побед');
    await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Оглавление', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    const field = (await page.locator('.class-field').boundingBox())!;
    const window = (await page.locator('.story-window').boundingBox())!;
    expect(field.y + field.height).toBeLessThan(window.y);
    await page.screenshot({ path: `test-results/chapter-one-gifts-${viewport.width}.png` });
    await resume(page, 13);
    const text = page.locator('.chapter-one-text');
    await text.focus();
    await page.keyboard.press('End');
    expect(await text.evaluate(el => el.scrollHeight >= el.clientHeight)).toBe(true);
    await page.keyboard.press('ArrowRight');
    expect(await text.textContent()).toBe(source[14]);
    await page.keyboard.press('ArrowLeft');
    expect(await text.textContent()).toBe(source[13]);
  });
}

test('appearance, blank name, timed typing, rebirth and reduced motion follow the book', async ({ page }) => {
  await resume(page, 93);
  await expect(page.locator('.appearance-portrait')).toHaveClass(/appearance-changing/);
  await page.locator('.appearance-portrait').evaluate(el => {
    const animation = el.getAnimations()[0]; animation.pause(); animation.currentTime = 1000;
  });
  expect(await page.locator('.appearance-portrait').evaluate(el => getComputedStyle(el).getPropertyValue('--appearance').trim())).toBe('0');
  await page.locator('.appearance-portrait').evaluate(el => { el.getAnimations()[0].currentTime = 4000; });
  expect(await page.locator('.appearance-portrait').evaluate(el => getComputedStyle(el).getPropertyValue('--appearance').trim())).toBe('1');
  await resume(page, 97);
  await expect(page.getByLabel('Имя героя', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Имя героя', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await expect(page.getByLabel('Имя героя', { exact: true })).toHaveValue('Мач Крайм');
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByLabel('Имя героя', { exact: true })).toHaveValue('');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await expect(page.getByLabel('Имя героя', { exact: true })).toHaveValue('Мач Крайм');
  for (const index of [101, 104, 106, 109, 111, 112]) {
    await resume(page, index);
    await expect(page.locator('.reborn-hero')).toBeVisible();
    await expect(page.locator('.mosaic-censor')).toBeVisible();
    await expect(page.locator('.soul')).toHaveCount(0);
  }
  await resume(page, 70);
  await expect(page.locator('.card-amendment')).toContainText('Теперь даму можно менять');
  await expect(page.locator('.card-amendment')).toHaveCSS('animation-name', 'none');
});

test('throne anchors remain fixed in all original poses and new standing gestures', async ({ page }) => {
  test.setTimeout(120_000);
  await resume(page, 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const anchors = () => page.locator('.goddess-sprite').evaluate((sprite, data) => {
    const extra = sprite.querySelector<HTMLElement>('.goddess-extra-frame');
    let frame: Element, anchor: readonly number[], width: number, sourceWidth: number, sourceHeight: number;
    if (extra) {
      const pose = data.gestures.find(p => p.name === extra.dataset.pose)!;
      frame = extra; anchor = pose.anchor; width = pose.throneWidth;
      sourceWidth = pose.rect[2]; sourceHeight = pose.rect[3];
    } else {
      const strip = sprite.querySelector('.goddess-poses')!;
      const index = Number(getComputedStyle(strip).getPropertyValue('--pose'));
      frame = strip.querySelectorAll('.goddess-frame')[index];
      const pose = data.poses[index]; anchor = pose.anchor; width = pose.throneWidth;
      sourceWidth = sourceHeight = 512;
    }
    const rect = frame.getBoundingClientRect();
    return [rect.x + anchor[0] / sourceWidth * rect.width, rect.y + anchor[1] / sourceHeight * rect.height, width / sourceWidth * rect.width];
  }, { poses: datarisPoses, gestures: datarisGestures });
  for (const viewport of [{width:1440,height:1000}, {width:568,height:320}]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Читать главу 1 сначала' }).click();
    const reference = await anchors();
    let current = 0;
    for (const index of [9, 12, 15, 19, 25, 28, 49, 63, 69, 70, 92, 107, 111]) {
      while (current < index) {
        await page.getByRole('button', { name: 'Далее', exact: true }).click();
        current++;
      }
      (await anchors()).forEach((value, i) => expect(Math.abs(value - reference[i])).toBeLessThan(.2));
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Читать главу 1 сначала' }).click();
  const reference = await anchors();
  for (let index = 0; index <= 25; index++) {
    if ([9, 12, 15, 19, 25].includes(index)) {
      for (const progress of [.2, .5, .9]) {
        await page.locator('.goddess-poses').evaluate((strip, progress) => {
          for (const animation of strip.getAnimations()) {
            animation.pause();
            animation.currentTime = Number(animation.effect!.getTiming().duration) * progress;
          }
        }, progress);
        (await anchors()).forEach((value, i) => expect(Math.abs(value - reference[i])).toBeLessThan(.2));
      }
    }
    if (index < 25) await page.getByRole('button', { name: 'Далее', exact: true }).click();
  }
});

test('portrait phones ask to rotate in chapter one, prologue and battle', async ({ page }) => {
  await resume(page, 25);
  for (const view of ['chapter-one', 'prologue', 'episode']) {
    await page.setViewportSize({width:568,height:320});
    await page.evaluate(view => localStorage.setItem('lazy-courage:view', view), view);
    await page.reload();
    if (view === 'episode') {
      const start = page.getByRole('button', { name: /^Глава 8:/ });
      if (await start.count()) await start.click();
    }
    await page.setViewportSize({width:390,height:844});
    await expect(page.getByRole('heading', {name:'Поверните телефон'}).filter({visible:true})).toBeVisible();
    await expect(page.locator('.stage')).toBeHidden();
  }
});

test('chapter one keeps battle progress and works when storage is unavailable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Глава 8:/ }).click();
  await expect(page.locator('.speech-bubble')).toContainText('ЧТО?!');
  const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('lazy-courage:chapter-one-page', '900'));
  await page.getByRole('button', { name: /^Глава 1:/ }).click();
  expect(await page.locator('.chapter-one-text').textContent()).toBe(source[0]);
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(before);
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Blocked'); };
    Storage.prototype.setItem = () => { throw new Error('Blocked'); };
  });
  await page.reload();
  await page.getByRole('button', { name: /^Глава 1:/ }).click();
  await expect(page.locator('.reader-progress')).toContainText('Сохранение недоступно');
});

test('small landscape keeps touch controls, appearance text and direct card taps usable', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resume(page, 93);
  const properties = page.getByLabel('Параметры создаваемого героя');
  expect(await properties.evaluate(el => {
    const parent = el.parentElement!.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return box.bottom <= parent.bottom && box.top >= parent.top && getComputedStyle(el).overflowY === 'auto';
  })).toBe(true);
  await properties.focus();
  await page.keyboard.press('End');
  await expect.poll(() => properties.evaluate(el => el.scrollTop + el.clientHeight >= el.scrollHeight - 1)).toBe(true);
  // The phone footer is compact by request: roughly half the previous height.
  expect((await page.locator('.reader-controls').boundingBox())!.height).toBeLessThanOrEqual(30);
  for (const button of await page.locator('.reader-controls button').all()) {
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeLessThanOrEqual(30);
    expect(box.width).toBeGreaterThanOrEqual(44);
    // The transparent hit area keeps the 44 px touch target despite the compact look.
    expect(await button.evaluate(element => parseFloat(getComputedStyle(element, '::after').height))).toBeGreaterThanOrEqual(44);
  }
  await resume(page, 25);
  const target = (await page.getByRole('button', { name: 'Открыть карту 72', exact: true }).boundingBox())!;
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(target.height).toBeGreaterThanOrEqual(44);
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
  await expect(page.locator('.revealed-card')).toContainText('Боевой алхимик');
  const inspect = page.getByRole('button', { name: 'Прочитать карту «Боевой алхимик»' });
  const box = (await inspect.boundingBox())!;
  expect(box.width).toBe(44);
  expect(box.height).toBe(44);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('reader settings change text size, window height and transparency and persist', async ({ page }) => {
  await resume(page, 0);
  const settings = page.getByRole('button', { name: 'Настройки чтения', exact: true });
  const contents = await page.getByRole('button', { name: 'Оглавление', exact: true }).boundingBox();
  const button = await settings.boundingBox();
  expect(button!.width).toBe(contents!.width);
  expect(button!.height).toBe(contents!.height);
  await settings.click();
  const panel = page.getByRole('dialog', { name: 'Настройки чтения', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('slider')).toHaveCount(3);
  const setRange = (name: string, value: number) => page.getByRole('slider', { name, exact: true }).evaluate((element, next) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(element, String(next));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  const metrics = () => page.evaluate(() => {
    const window = document.querySelector('.story-window')!.getBoundingClientRect();
    const main = document.querySelector('main.chapter-one')!;
    return {
      width: Math.round(window.width), height: Math.round(window.height),
      font: getComputedStyle(document.querySelector('.chapter-one-text')!).fontSize,
      alpha: getComputedStyle(main).getPropertyValue('--reader-window-alpha').trim(),
    };
  });
  const before = await metrics();
  await setRange('Размер шрифта', 130);
  await setRange('Высота окна с текстом', 110);
  await setRange('Прозрачность окна с текстом', 50);
  const changed = await metrics();
  expect(parseFloat(changed.font)).toBeCloseTo(33.8, 1);
  expect(changed.width).toBe(before.width);
  expect(changed.height).toBeGreaterThan(before.height);
  expect(changed.alpha).toBe('0.5');
  await page.reload();
  const restored = await metrics();
  expect(parseFloat(restored.font)).toBeCloseTo(33.8, 1);
  expect(restored.width).toBe(before.width);
  expect(restored.height).toBe(changed.height);
  await page.getByRole('button', { name: 'Настройки чтения', exact: true }).click();
  await page.getByRole('button', { name: 'Сбросить настройки', exact: true }).click();
  const reset = await metrics();
  expect(reset.font).toBe('26px');
  expect(reset.width).toBe(before.width);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
});

test('reader settings stay usable and inside a 568 × 320 screen', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await resume(page, 0);
  await page.getByRole('button', { name: 'Настройки чтения', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Настройки чтения', exact: true });
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(568);
  expect(box.y + box.height).toBeLessThanOrEqual(320);
  for (const name of ['Размер шрифта', 'Высота окна с текстом', 'Прозрачность окна с текстом']) {
    const slider = (await page.getByRole('slider', { name, exact: true }).boundingBox())!;
    expect(slider.height).toBeGreaterThanOrEqual(44);
    expect(slider.width).toBeGreaterThanOrEqual(44);
  }
  const setRange = (name: string, value: number) => page.getByRole('slider', { name, exact: true }).evaluate((element, next) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(element, String(next));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await setRange('Размер шрифта', 140);
  await setRange('Высота окна с текстом', 120);
  await setRange('Прозрачность окна с текстом', 35);
  const bounds = await page.evaluate(() => {
    const window = document.querySelector('.story-window')!.getBoundingClientRect();
    return { left: window.left, right: window.right, top: window.top, bottom: window.bottom, width: innerWidth, height: innerHeight };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1);
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height + 1);
  const reset = page.getByRole('button', { name: 'Сбросить настройки', exact: true });
  await reset.scrollIntoViewIfNeeded();
  await expect(reset).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeVisible();
});
