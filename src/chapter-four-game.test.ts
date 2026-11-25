import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import paragraphs from './chapter-four.json' with { type: 'json' };
import { chapterFourReducer, effectiveStat, initialChapterFour, nextRequirement, readChapterFourSave, type ChapterAction, type ChapterSave, type Task } from './chapter-four-game';

function finishPage(save: ChapterSave) {
  const send = (action: ChapterAction) => { save = chapterFourReducer(save, action); };
  const page = save.current.page;
  const tasks: Record<number, Task[]> = { 1: ['peel', 'slice', 'test', 'knife-attack'], 12: ['aside'], 16: ['detach', 'load'], 17: ['drive'], 23: ['unload'], 24: ['farm-dinner'], 30: ['strike'], 32: ['loot-one'], 33: ['critical'], 35: ['loot-two'], 43: ['herbs', 'crystals'], 46: ['hides'], 47: ['meat'], 48: ['order'], 72: ['refuse'], 84: ['thanks'] };
  for (const task of tasks[page] ?? []) send({ type: 'do', task });
  if (page === 24) send({ type: 'cook' });
  if (page === 25) { send({ type: 'rescue-mouse' }); send({ type: 'pocket-mouse' }); }
  if (page === 27) send({ type: 'assign' });
  if (page === 29 || page === 50) send({ type: 'open', menu: 'status' });
  if (page === 38) {
    for (let n = 0; n < 3; n++) send({ type: 'hunt' });
    send({ type: 'do', task: 'day' });
    for (const stat of ['strength', 'stamina', 'speed', 'intelligence'] as const) send({ type: 'allocate', stat });
  }
  if (page === 48) { send({ type: 'use', item: 'dinner' }); send({ type: 'use', item: 'roast' }); for (let n = 0; n < 3; n++) send({ type: 'use', item: 'beer' }); }
  assert.equal(nextRequirement(save.current), null, `Unfinished page ${page}`);
  return save;
}
test('chapter 4 is exactly the complete FB2 text with original emphasis and punctuation', () => {
  const source = JSON.parse(execFileSync('python3', ['-c', `import xml.etree.ElementTree as E,json
n={'f':'http://www.gribuser.ru/xml/fictionbook/2.0'}
r=E.parse('ленивое мужество.fb2').getroot()
s=next(s for s in r.findall('.//f:body/f:section',n) if s.find('f:title',n) is not None and ''.join(s.find('f:title',n).itertext()).strip()=='Глава 4')
def runs(p):
 a=[{'text':p.text}] if p.text else []
 for c in p:
  a.append({'text':''.join(c.itertext()),c.tag.rsplit('}',1)[-1]:True})
  if c.tail:a.append({'text':c.tail})
 return a
print(json.dumps([runs(p) for p in s.findall('f:p',n)],ensure_ascii=False))`], { encoding: 'utf8' }));
  assert.equal(paragraphs.length, 108);
  assert.deepEqual(paragraphs, source);
});
test('all 108 pages preserve the book results, save/reload, undo and transaction limits', () => {
  let save = initialChapterFour();
  for (let page = 0; page < paragraphs.length; page++) {
    assert.equal(save.current.page, page);
    save = finishPage(save);
    const s = save.current;
    if (page === 1) { assert.equal(s.hp, 157); assert.equal(s.bag.knife, 1); assert.equal(s.bag.peeledApple, 1); assert.equal(s.bag.slicedCarrot, 1); assert.equal(s.xp, 0); }
    if (page === 24) { assert.equal(s.cooking, 1); assert.equal(s.levelPoints, 1); }
    if (page === 27) { assert.equal(s.lady, true); assert.equal(s.mouse, 'pocket'); assert.equal(s.hp, 320); assert.equal(effectiveStat(s, 'speed'), 12); assert.equal(effectiveStat(s, 'luck'), 16); }
    if (page === 30) { assert.equal(s.xp, 9); assert.equal(s.classXp, 11); }
    if (page === 33) { assert.equal(s.xp, 24); assert.equal(s.classXp, 28); }
    if (page === 38) { assert.deepEqual([s.level, s.classLevel, s.strength, s.stamina, s.speed, s.intelligence, s.freePoints], [11, 10, 30, 17, 19, 5, 0]); assert.equal(effectiveStat(s, 'strength'), 68); assert.equal(s.bag.herb, 2247); assert.equal(s.bag.crystal, 2247); }
    if (page === 39) { assert.equal(s.lady, false); assert.equal(s.mouse, 'escaped'); assert.equal(s.hp, 420); assert.equal(s.mp, 170); }
    if (page === 43) assert.equal(s.money, 11235);
    if (page === 46) { assert.equal(s.money, 12735); assert.equal(s.bag.pelt, 280); }
    if (page === 47) { assert.equal(s.money, 15535); assert.equal(s.bag.meat, 20); assert.equal(s.bag.water, 1); }
    if (page === 48) { assert.equal(s.money, 15465); assert.equal(s.bag.beer, 0); }
    if (page === 84) assert.equal(s.money, 10165);
    assert.deepEqual(readChapterFourSave(JSON.stringify(save)), save, `Save on page ${page}`);
    if (page > 0) {
      const back = chapterFourReducer(save, { type: 'back' });
      assert.equal(back.current.page, page - 1);
      const forward = finishPage(chapterFourReducer(back, { type: 'next' }));
      assert.deepEqual(forward, save, `Undo/redo on page ${page}`);
    }
    if (page < paragraphs.length - 1) save = chapterFourReducer(save, { type: 'next' });
  }
  assert.equal(save.history.length, 107);
  assert.equal(chapterFourReducer(save, { type: 'do', task: 'thanks' }), save);
  assert.deepEqual(chapterFourReducer(save, { type: 'restart' }), initialChapterFour());
});
test('unfinished actions, premature abilities, repeated items and malformed saves are safe', () => {
  let save = chapterFourReducer(initialChapterFour(), { type: 'next' });
  assert.equal(chapterFourReducer(save, { type: 'next' }), save);
  assert.equal(chapterFourReducer(save, { type: 'assign' }), save);
  assert.equal(chapterFourReducer(save, { type: 'do', task: 'knife-attack' }), save);
  save = finishPage(save);
  assert.equal(chapterFourReducer(save, { type: 'do', task: 'peel' }), save);
  for (const value of [null, 'broken', '{}', JSON.stringify({ ...save, current: { ...save.current, money: -1 } }), JSON.stringify({ ...save, current: { ...save.current, lady: 'yes' } }), JSON.stringify({ ...save, history: [] })]) assert.deepEqual(readChapterFourSave(value), initialChapterFour());
});
