import assert from 'node:assert/strict';
import { test } from 'node:test';
import { availableMenus, availableMoves, chapterReducer, HERO_HP, initialChapter, nextRequirement, readChapterSave, storyMenu, type ChapterSave } from './chapter-two-game';

export function finishPage(save: ChapterSave): ChapterSave {
  const send = (action: Parameters<typeof chapterReducer>[1]) => { save = chapterReducer(save, action); };
  for (let guard = 0; nextRequirement(save.current) && guard < 60; guard++) {
    const s = save.current;
    if (s.page === 9) { send(s.collected ? { type: 'use', item: 'leaves' } : { type: 'gather' }); continue; }
    if ([10, 64].includes(s.page)) { send({ type: 'open-menu', menu: 'help' }); continue; }
    if (s.page === 42) { send({ type: 'open-menu', menu: 'quests' }); continue; }
    if (s.page === 44) { send({ type: 'open-menu', menu: 'status' }); continue; }
    if (s.page === 79) { send({ type: 'open-menu', menu: 'inventory' }); continue; }
    if (s.page === 86) { send({ type: 'exchange' }); continue; }
    if (s.page === 89) { send({ type: 'store-parcel' }); continue; }
    const move = availableMoves(s)[0];
    if (move) { send({ type: 'act', move }); continue; }
    if (s.phase === 'loot') { send({ type: 'loot' }); continue; }
    if (s.phase === 'healing') {
      const item = (['carrot', 'apple', 'orange'] as const).find(item => s.bag[item]);
      assert(item); send({ type: 'use', item }); continue;
    }
    if (s.page === 83 && s.phase === 'rested') { send({ type: 'hunt' }); continue; }
    assert.fail(`Unreachable action on page ${s.page}`);
  }
  assert.equal(nextRequirement(save.current), null);
  return save;
}

export function saveAt(page: number): ChapterSave {
  let save = initialChapter();
  while (save.current.page < page) save = chapterReducer(finishPage(save), { type: 'next' });
  return save;
}

test('chapter 2 follows the book: clothing, exact first battle, five loot/heal cycles and exchange', () => {
  let save = saveAt(9);
  assert.deepEqual(availableMenus(save.current), []);
  assert.equal(chapterReducer(save, { type: 'next' }), save);
  save = chapterReducer(save, { type: 'gather' });
  assert.deepEqual(availableMenus(save.current), ['inventory']);
  assert.equal(chapterReducer(save, { type: 'gather' }), save);
  save = finishPage(save);
  assert.equal(save.current.equipped, true);
  assert.equal(save.current.bag.leaves, 0);
  assert.equal(storyMenu(saveAt(17).current), 'map');
  assert.equal(storyMenu(saveAt(49).current), 'status');
  assert.equal(storyMenu(saveAt(79).current), null);
  save = saveAt(70);
  assert.deepEqual(availableMoves(save.current), ['kick']);
  assert.equal(chapterReducer(save, { type: 'act', move: 'punch' }), save);
  save = chapterReducer(save, { type: 'act', move: 'kick' });
  assert.equal(save.current.hp, 133); assert.equal(save.current.rabbitHp, 26);
  save = saveAt(73);
  save = chapterReducer(save, { type: 'act', move: 'dodge' });
  assert.equal(save.current.hp, 127);
  save = chapterReducer(save, { type: 'act', move: 'punch' });
  assert.equal(save.current.hp, 120); assert.equal(save.current.rabbitHp, 21);
  save = saveAt(78);
  assert.equal(save.current.hp, 64);
  assert.equal(save.current.xp, 12); assert.equal(save.current.classXp, 16);
  assert.equal(save.current.log.filter(e => e.kind === 'dodge' && e.amount === 0).length, 2);
  assert.equal(chapterReducer(save, { type: 'act', move: 'kick' }), save);
  save = chapterReducer(save, { type: 'loot' });
  assert.equal(save.current.bag.crystal, 1); assert.equal(save.current.bag.carrot, 1);
  assert.equal(chapterReducer(save, { type: 'loot' }), save);
  save = finishPage(save);
  assert.equal(save.current.hp, HERO_HP); assert.equal(save.current.bag.carrot, 0);
  save = saveAt(84);
  assert.equal(save.current.fight, 5); assert.equal(save.current.bag.crystal, 5);
  assert.equal(save.current.hp, HERO_HP);
  assert.equal(save.current.log.filter(e => e.kind === 'heal').length, 5);
  assert.equal(save.current.log.filter(e => e.kind === 'xp').length, 5);
  assert.equal(save.current.bag.carrot + save.current.bag.apple + save.current.bag.orange, 0);
  save = saveAt(86);
  assert.equal(save.current.bag.crystal, 5); assert.equal(save.current.bag.parcel, 0);
  assert.equal(chapterReducer(save, { type: 'next' }), save);
  save = chapterReducer(save, { type: 'exchange' });
  assert.equal(save.current.bag.crystal, 0); assert.equal(save.current.bag.parcel, 0);
  assert.equal(save.current.exchanged, true);
  assert.equal(chapterReducer(save, { type: 'exchange' }), save);
  const beforeExchange = chapterReducer(save, { type: 'back' });
  assert.equal(beforeExchange.current.bag.crystal, 5);
  assert.deepEqual(chapterReducer(chapterReducer(beforeExchange, { type: 'next' }), { type: 'exchange' }), save);
  save = saveAt(89);
  assert.equal(save.current.parcelStored, false);
  save = chapterReducer(save, { type: 'store-parcel' });
  assert.equal(save.current.bag.parcel, 1);
  assert.equal(chapterReducer(save, { type: 'store-parcel' }), save);
  save = saveAt(97);
  assert.deepEqual(readChapterSave(JSON.stringify(save)), save);
  assert.equal(chapterReducer(save, { type: 'next' }), save);
  assert.deepEqual(chapterReducer(save, { type: 'restart' }), initialChapter());
  for (const bad of [null, 'broken', '{}', JSON.stringify({ ...save, history: [] }), JSON.stringify({ ...save, current: { ...save.current, hp: -1 } })]) assert.deepEqual(readChapterSave(bad), initialChapter());
});

test('chapter 2 migrates old menu visits and hand-held parcels, including back history', () => {
  for (const page of [10, 44, 64, 79, 86, 89, 97]) {
    const modern = finishPage(saveAt(page));
    const legacy = JSON.parse(JSON.stringify(modern));
    for (const state of [legacy.current, ...legacy.history]) {
      delete state.menuVisits; delete state.exchanged; delete state.parcelStored;
      if (state.page >= 86) state.bag.parcel = 1;
    }
    const restored = readChapterSave(JSON.stringify(legacy));
    assert.equal(restored.current.page, page);
    assert.equal(restored.current.hp, modern.current.hp);
    if (page >= 86) {
      assert.equal(restored.current.exchanged, true);
      assert.equal(restored.current.bag.parcel, page >= 89 ? 1 : 0);
      assert.equal(chapterReducer(restored, { type: 'exchange' }), restored);
    }
    assert.equal(nextRequirement(restored.current), page === 86 ? null : nextRequirement(modern.current));
    assert.deepEqual(readChapterSave(JSON.stringify(restored)), restored);
  }
});
