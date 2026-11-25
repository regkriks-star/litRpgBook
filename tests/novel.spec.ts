import { expect, test, type Page } from '@playwright/test';
import { createActor } from 'xstate';
import { execFileSync } from 'node:child_process';
import { freshContext, gameMachine, SAVE_KEY, type GameContext } from '../src/game';
import { endings } from '../src/story';

const source: string[] = JSON.parse(execFileSync('python3', ['-c', `
import json, xml.etree.ElementTree as ET
ns = {'f': 'http://www.gribuser.ru/xml/fictionbook/2.0'}
root = ET.parse('ленивое мужество.fb2').getroot()
chapter = next(s for s in root.findall('.//f:body/f:section', ns) if s.find('f:title', ns) is not None and ''.join(s.find('f:title', ns).itertext()).strip() == 'Глава 8')
print(json.dumps([''.join(p.itertext()) for p in chapter.findall('f:p', ns)[:26]]))
`], { encoding: 'utf8' }));

async function settle(page: Page) {
  for (let i = 0; i < 40; i++) {
    await expect(page.locator('.stage')).not.toHaveClass(/\b(chapter|hit|enemy)\b/);
    const next = page.getByRole('button', { name: 'Продолжить бой', exact: true });
    if (!await next.count()) return;
    await next.click();
  }
  throw new Error('The battle did not settle');
}
async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Глава 8: Плохой день для электрика' }).click();
  await settle(page);
}
async function act(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  await settle(page);
}
async function loadBattle(page: Page, context: Partial<GameContext>, value = 'player') {
  const actor = createActor(gameMachine).start();
  const snapshot = { ...actor.getPersistedSnapshot(), value, context: { ...freshContext(), witchMp: 0, ...context } };
  actor.stop();
  await page.goto('/');
  await page.evaluate(({ key, snapshot }) => localStorage.setItem(key, JSON.stringify(snapshot)), { key: SAVE_KEY, snapshot });
  await page.reload();
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 568, height: 320 }]) {
  test(`whole dialogue ${viewport.width}: author interjections, fonts, scroll and journal`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await loadBattle(page, { battleLines: ['p3-0-0', 'p4-0-0'], history: ['p2-0-0', 'p3-0-0'] }, 'enemyDialogue');
    const speech = page.locator('.speech-bubble p');
    expect(await speech.textContent()).toBe(source[3]);
    await expect(speech.locator('.spoken-text')).toHaveCount(2);
    await expect(speech.locator('.spoken-text').first()).toHaveCSS('font-family', '"Golos Text", sans-serif');
    await expect(speech.locator('.narration-text')).toHaveCSS('font-family', 'Alegreya, Georgia, serif');
    await expect(speech.locator('.narration-text')).toContainText('верещала');
    await page.getByRole('button', { name: 'Настройки', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Крупный текст' }).check();
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    const bubble = await page.locator('.speech-bubble').boundingBox();
    expect(bubble!.y).toBeGreaterThanOrEqual(0);
    expect(bubble!.x).toBeGreaterThanOrEqual(0);
    expect(bubble!.x + bubble!.width).toBeLessThanOrEqual(viewport.width);
    if (viewport.width === 568) {
      expect(await speech.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
      await speech.focus();
      await page.keyboard.press('End');
      await expect.poll(() => speech.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: `test-results/whole-dialogue-${viewport.width}.png` });
    await page.getByRole('button', { name: 'Журнал', exact: true }).click();
    const entries = page.locator('.journal-line p');
    await expect(entries).toHaveCount(2);
    expect(await entries.nth(1).textContent()).toBe(source[3]);
    await expect(entries.nth(0)).toHaveCSS('font-family', 'Alegreya, serif');
    await expect(entries.nth(1).locator('.spoken-text').first()).toHaveCSS('font-family', '"Golos Text", sans-serif');
    await expect(entries.nth(1).locator('.narration-text')).toHaveCSS('font-family', 'Alegreya, Georgia, serif');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Продолжить бой', exact: true }).click();
    expect(await speech.textContent()).toBe(source[4]);
    await loadBattle(page, { endingLine: endings.indexOf('p23-0-0') }, 'ending');
    expect(await page.locator('.dialogue-text').textContent()).toBe(source[23]);
    await expect(page.locator('.dialogue-text .spoken-text')).toHaveCSS('font-family', '"Golos Text", sans-serif');
    await expect(page.locator('.dialogue-text .narration-text')).toHaveCSS('font-family', 'Alegreya, Georgia, serif');
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
    expect(await page.locator('.dialogue-text').textContent()).toBe(source[24]);
  });
}

test('speech bubbles grow to fit and keep their sprite anchor after resize and camera movement', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 844, height: 390 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(viewport);
    for (const wave of [1, 2]) {
      await loadBattle(page, { wave, battleLines: ['p9-0-0', 'p3-0-0', 'p8-0-0'] }, 'enemyDialogue');
      const bubble = page.locator('.speech-bubble');
      const shortWidth = (await bubble.boundingBox())!.width;
      await page.getByRole('button', { name: 'Продолжить бой', exact: true }).click();
      expect((await bubble.boundingBox())!.width).toBeGreaterThan(shortWidth);
      for (let speaker = 0; speaker < 2; speaker++) {
        await expect.poll(() => bubble.evaluate(el => {
          const box = el.getBoundingClientRect();
          const sprite = el.parentElement!.querySelector('.sprite')!.getBoundingClientRect();
          const header = document.querySelector('.game-header')!.getBoundingClientRect();
          const tail = getComputedStyle(el, '::before');
          const text = el.querySelector('p')!;
          return box.left >= 0 && box.right <= innerWidth && box.top >= header.bottom + 7
            && Math.abs(box.bottom + 14 - sprite.top) < 1
            && Math.abs(box.left + 2 + parseFloat(tail.left) - (sprite.left + sprite.width / 2)) < 1
            && (text.scrollHeight <= text.clientHeight + 1 || box.width >= innerWidth - 25);
        })).toBe(true);
        if (speaker === 0) await page.getByRole('button', { name: 'Продолжить бой', exact: true }).click();
      }
      await page.setViewportSize({ width: viewport.width - 20, height: viewport.height });
      await expect.poll(async () => (await bubble.boundingBox())!.x + (await bubble.boundingBox())!.width).toBeLessThanOrEqual(viewport.width - 20);
      await page.setViewportSize(viewport);
    }
  }
});

test('v2 browser save resumes at the complete dialogue and persists as v3', async ({ page }) => {
  const actor = createActor(gameMachine).start();
  const snapshot = { ...actor.getPersistedSnapshot(), value: 'ending', context: {
    ...freshContext(), hp: 45, witchHp: 48, endingLine: 20,
    history: ['p24-0-0', 'p24-1-0'],
  } };
  actor.stop();
  await page.goto('/');
  await page.evaluate(({ key, snapshot }) => {
    localStorage.removeItem(key);
    localStorage.setItem('lazy-courage.save.v2', JSON.stringify(snapshot));
  }, { key: SAVE_KEY, snapshot });
  await page.reload();
  expect(await page.locator('.dialogue-text').textContent()).toBe(source[24]);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).context.hp, SAVE_KEY)).toBe(45);
  await page.reload();
  expect(await page.locator('.dialogue-text').textContent()).toBe(source[24]);
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  expect(await page.locator('.dialogue-text').textContent()).toBe(source[25]);
});

test('a broken v3 save falls back to the valid v2 save', async ({ page }) => {
  const actor = createActor(gameMachine).start();
  const snapshot = { ...actor.getPersistedSnapshot(), value: 'ending', context: {
    ...freshContext(), hp: 45, witchHp: 48, endingLine: 20,
    history: ['p24-0-0', 'p24-1-0'],
  } };
  actor.stop();
  await page.goto('/');
  await page.evaluate(({ key, snapshot }) => {
    localStorage.setItem('lazy-courage.save.v2', JSON.stringify(snapshot));
    localStorage.setItem(key, '{broken json');
  }, { key: SAVE_KEY, snapshot });
  await page.reload();
  expect(await page.locator('.dialogue-text').textContent()).toBe(source[24]);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).context.hp, SAVE_KEY)).toBe(45);
});

 test('full episode: both fights, saved speech bubbles, complete ending and journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await page.screenshot({ path: 'test-results/desktop-title.png' });
  await page.getByRole('button', { name: 'Глава 8: Плохой день для электрика' }).click();
  await expect(page.locator('.speech-bubble')).toContainText('ЧТО?! Нет! Нет-нет-нет…');
  await page.reload();
  await expect(page.locator('.speech-bubble')).toContainText('ЧТО?! Нет! Нет-нет-нет…');
  await expect(page.getByRole('meter', { name: 'HP Мача', exact: true })).toHaveAttribute('aria-valuenow', '128');
  await page.screenshot({ path: 'test-results/desktop-bubble.png' });
  await settle(page);
  await page.screenshot({ path: 'test-results/desktop-battle.png' });
  for (let i = 0; i < 3; i++) await act(page, 'Атака топором');
  await expect(page.getByText('Скорпион 2 / 2')).toBeVisible();
  await expect(page.getByRole('meter', { name: 'HP Саяки', exact: true })).toHaveAttribute('aria-valuenow', '76');
  await page.reload();
  await expect(page.getByText('Скорпион 2 / 2')).toBeVisible();
  await page.screenshot({ path: 'test-results/desktop-second-battle.png' });
  for (const name of ['Выждать', 'Прикрыть Саяку', 'Атака топором', 'Атака топором', 'Атака топором']) await act(page, name);
  await expect(page.getByRole('heading', { name: 'Оба скорпиона повержены' })).toBeVisible();
  await expect(page.locator('.outcome')).toContainText('Мач: 45 HP. Саяка: 48 HP.');
  await page.getByRole('button', { name: 'После боя', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('А сейчас-то ты чего уселась?');
  await page.screenshot({ path: 'test-results/desktop-novel.png' });
  await page.reload();
  await expect(page.locator('.dialogue-text')).toContainText('А сейчас-то ты чего уселась?');
  for (let i = 0; i < endings.length; i++) {
    if (i === endings.indexOf('p23-0-0')) {
      await expect.poll(() => page.locator('.landscape').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && img.src.endsWith('guild.webp'))).toBe(true);
      await page.screenshot({ path: 'test-results/desktop-guild.png' });
    }
    await page.getByRole('button', { name: 'Далее', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Продолжение следует' })).toBeVisible();
  await page.getByRole('button', { name: 'Журнал', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Запишите нас, пожалуйста,');
  await expect(page.getByRole('dialog')).toContainText('Х… хорошо…');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Пройти ещё раз' }).click();
  await expect(page.getByRole('button', { name: 'Глава 8: Плохой день для электрика' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 568, height: 320 }]) {
  test(`ambush ${viewport.width}: camera pans left, heroes turn and the dead scorpion disappears`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await loadBattle(page, { enemyHp: 39 });
    const landscape = page.locator('.landscape');
    const sayaka = page.locator('.combatant.sayaka');
    const backgroundBefore = await landscape.boundingBox();
    const sayakaBefore = await sayaka.boundingBox();
    await page.getByRole('button', { name: /^Атака топором/ }).click();
    await expect(page.locator('.combatant.scorpion')).toHaveCount(0);
    await expect(page.locator('.stage')).toHaveClass(/playerDialogue/);
    while (!await page.locator('.stage.second-wave').count()) {
      await page.getByRole('button', { name: 'Продолжить бой', exact: true }).click();
    }
    await expect(landscape).toHaveCSS('translate', `${viewport.width * .38}px`);
    const backgroundAfter = await landscape.boundingBox();
    const sayakaAfter = await sayaka.boundingBox();
    expect(sayakaAfter!.x - sayakaBefore!.x).toBeCloseTo(viewport.width * .38, 1);
    expect(backgroundAfter!.x - backgroundBefore!.x).toBeCloseTo(viewport.width * .38, 1);
    expect(backgroundAfter!.x).toBeLessThanOrEqual(1);
    expect(backgroundAfter!.x + backgroundAfter!.width).toBeGreaterThanOrEqual(viewport.width);
    const scorpion = await page.locator('.combatant.scorpion').boundingBox();
    expect(scorpion!.x + scorpion!.width).toBeLessThan(sayakaAfter!.x);
    await expect(page.locator('.fallen-scorpion')).toHaveCount(0);
    for (const sprite of await page.locator('.sprite-motion').all()) {
      await expect(sprite).toHaveCSS('scale', '-1 1');
    }
    for (const bar of await page.locator('.fighter-status').all()) {
      const bounds = await bar.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    }
    const bubble = await page.locator('.speech-bubble').boundingBox();
    const header = await page.locator('.game-header').boundingBox();
    expect(bubble!.y).toBeGreaterThan(header!.y + header!.height);
    await page.screenshot({ path: `test-results/ambush-${viewport.width}.png` });
    await page.reload();
    await expect(page.locator('.stage')).toHaveClass(/second-wave/);
    await expect(landscape).toHaveCSS('translate', `${viewport.width * .38}px`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(landscape).toHaveCSS('transition-duration', '0s');
    await expect(page.locator('.sayaka .sprite-motion')).toHaveCSS('scale', '-1 1');
  });
}

for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 568, height: 320 }]) {
  test(`landscape ${viewport.width}: character health, bubbles, commands, dialogue and inventory fit`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await start(page);
    await page.screenshot({ path: `test-results/landscape-${viewport.width}-battle.png` });
    const controls = await page.locator('.battle-controls').boundingBox();
    for (const bar of await page.locator('.fighter-status').all()) {
      const r = await bar.boundingBox();
      expect(r!.y + r!.height).toBeLessThan(controls!.y);
    }
    const bounds = await page.locator('.fighter-status, .action-button').evaluateAll(elements => elements.map(element => {
      const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }));
    for (const r of bounds) { expect(r.left).toBeGreaterThanOrEqual(0); expect(r.right).toBeLessThanOrEqual(viewport.width); expect(r.top).toBeGreaterThanOrEqual(0); expect(r.bottom).toBeLessThanOrEqual(viewport.height); }
    await loadBattle(page, { wave: 2, hp: 60, witchHp: 45, witchPoison: 2, turn: 2 });
    await page.getByRole('button', { name: /^Предметы/ }).click();
    await page.getByRole('radio', { name: 'Саяка Такамацури' }).check();
    await page.getByRole('button', { name: 'Съесть' }).click();
    await settle(page);
    await expect(page.getByRole('meter', { name: 'HP Саяки', exact: true })).toHaveAttribute('aria-valuenow', '71');
    await loadBattle(page, { wave: 2, battleLines: ['p8-0-0'] }, 'arrivalDialogue');
    await expect(page.locator('[data-character="mach"] .speech-bubble')).toContainText('У него попроси!');
    await page.screenshot({ path: `test-results/landscape-${viewport.width}-bubble.png` });
    const bubble = await page.locator('.speech-bubble').boundingBox();
    expect(bubble!.x).toBeGreaterThanOrEqual(0); expect(bubble!.y).toBeGreaterThanOrEqual(0);
    expect(bubble!.x + bubble!.width).toBeLessThanOrEqual(viewport.width);
    await loadBattle(page, { endingLine: 0 }, 'ending');
    await page.getByRole('button', { name: 'Настройки' }).click();
    await page.getByRole('checkbox', { name: 'Крупный текст' }).check();
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await page.screenshot({ path: `test-results/landscape-${viewport.width}-novel.png` });
    await expect(page.getByRole('button', { name: 'Далее', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  });
}

test('long narration stays complete and can scroll with enlarged text on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await loadBattle(page, { endingLine: endings.indexOf('p18-0-1') }, 'ending');
  await page.getByRole('button', { name: 'Настройки' }).click();
  await page.getByRole('checkbox', { name: 'Крупный текст' }).check();
  await page.getByRole('button', { name: 'Закрыть' }).click();
  const text = page.locator('.dialogue-text');
  await expect(text).toContainText('на всем континенте Хелис');
  await expect(text).toContainText('дефицита уровней.');
  expect(await text.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await text.focus();
  await page.keyboard.press('End');
  await expect.poll(() => text.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/long-narration-mobile.png' });
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  expect(await text.evaluate(el => el.scrollTop)).toBe(0);
});

test('contents work in portrait; reading and playable scenes request rotation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Оглавление' })).toBeVisible();
  await page.getByRole('button', { name: 'Пролог: История одного призыва' }).click();
  await expect(page.getByRole('heading', { name: 'Поверните телефон' })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await page.getByRole('button', { name: 'Глава 8: Плохой день для электрика' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Поверните телефон' })).toBeVisible();
  await page.screenshot({ path: 'test-results/portrait-rotation.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('button', { name: 'Настройки' })).toBeVisible();
  await page.getByRole('button', { name: 'Настройки' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Развернуть игру' })).toBeVisible();
});

test('the attack uses drawn frames for all three combatants and honours reduced motion', async ({ page }) => {
  await page.goto('/');
  await page.clock.install();
  await page.getByRole('button', { name: 'Глава 8: Плохой день для электрика' }).click();
  await expect(page.getByRole('heading', { name: 'Глава 8', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Команды боя' })).toHaveCount(0);
  await page.clock.fastForward(2000);
  await expect(page.locator('.sayaka.attacking .sprite')).toHaveCSS('animation-name', 'attack-frames');
  await page.clock.fastForward(720);
  await page.getByRole('button', { name: 'Продолжить бой' }).click();
  await expect(page.locator('.scorpion.attacking .sprite')).toHaveCSS('animation-name', 'attack-frames');
  await page.clock.fastForward(850);
  await settle(page);
  await page.getByRole('button', { name: /^Атака топором/ }).click();
  await expect(page.locator('.mach.attacking .sprite')).toHaveCSS('animation-name', 'attack-frames');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.mach .sprite')).toHaveCSS('animation-name', 'none');
});

test('defeat of Sayaka can be retried; invalid saves safely start a new game', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(key => localStorage.setItem(key, '{"broken":true}'), SAVE_KEY);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Глава 8: Плохой день для электрика' })).toBeVisible();
  await loadBattle(page, { wave: 2, witchHp: 1 });
  await act(page, 'Выждать');
  await expect(page.getByRole('heading', { name: 'Нужен другой план' })).toBeVisible();
  await expect(page.locator('.outcome')).toContainText('Саяка больше не может сражаться');
  await page.getByRole('button', { name: 'Повторить оба боя' }).click();
  await settle(page);
  await expect(page.getByText('Скорпион 1 / 2')).toBeVisible();
});

test('combat sounds follow attacks, enemy turn types and the mute setting', async ({ page }) => {
  await page.addInitScript(() => {
    const pitches: number[] = [];
    Object.assign(window, { soundPitches: pitches });
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      oscillator.frequency.setValueAtTime = (value, time) => {
        pitches.push(value);
        return set(value, time);
      };
      return oscillator;
    };
  });
  const pitches = () => page.evaluate(() => (window as Window & { soundPitches?: number[] }).soundPitches);
  for (const [name, pitch, turn, enemyPitches] of [
    ['Атака топором', 170, 2, [320, 320]],
    ['Разящий удар', 240, 3, [850]],
    ['Болт Саяки', 1500, 2, [320, 320]],
  ] as const) {
    await loadBattle(page, { turn, witchMp: 8 });
    await page.getByRole('button', { name: 'Настройки', exact: true }).click();
    await page.getByRole('button', { name: 'Звук: выключен' }).click();
    await page.keyboard.press('Escape');
    await act(page, name);
    // Dialogue clicks may add 400 Hz, but each combat effect fires only once.
    expect((await pitches())!.filter(value => value !== 400)).toEqual([pitch, ...enemyPitches]);
    await page.getByRole('button', { name: 'Настройки', exact: true }).click();
    await page.getByRole('button', { name: 'Звук: включён' }).click();
    await page.keyboard.press('Escape');
    const before = await pitches();
    await act(page, 'Атака топором');
    expect(await pitches()).toEqual(before);
  }
});
