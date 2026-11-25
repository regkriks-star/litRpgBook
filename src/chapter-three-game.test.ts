import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import paragraphs from './chapter-three.json' with { type: 'json' };
import { canAttack, canStrike, chapterThreeReducer, initialChapterThree, nextRequirement, readChapterThreeSave, type ChapterAction, type ChapterSave } from './chapter-three-game';

function finishPage(save: ChapterSave) {
  const send = (action: ChapterAction) => { save = chapterThreeReducer(save, action); };
  const page = save.current.page;
  if (page === 15) { send({ type: 'use', item: 'parcel' }); send({ type: 'use', item: 'ration' }); }
  const inspect: Record<number, string[]> = { 16: ['pervert'], 19: ['class', 'abilities'], 35: ['wash'], 63: ['strike', 'thoughts'], 72: ['streak'], 82: ['trousers', 'jacket', 'cap'], 85: ['club'], 93: ['knife'] };
  for (const id of inspect[page] ?? []) send({ type: 'inspect', id });
  if (page === 25) { send({ type: 'roof' }); send({ type: 'chimney' }); }
  if ([35, 65, 66, 67, 68, 70].includes(page)) {
    for (let i = 0; i < 10; i++) {
      if (canStrike(save.current)) send({ type: 'strike' });
      else if (canAttack(save.current)) send({ type: 'attack' });
      else break;
    }
    if (save.current.phase === 'loot') send({ type: 'loot' });
  }
  if ([36, 69, 70].includes(page)) send({ type: 'use', item: 'apple' });
  if (page === 40) send({ type: 'open', menu: 'status' });
  if (page === 61 || page === 77) {
    while (save.current.strength < (page === 61 ? 13 : 20)) send({ type: 'allocate', stat: 'strength' });
    if (page === 77) { while (save.current.speed < 5) send({ type: 'allocate', stat: 'speed' }); send({ type: 'upgrade-strike' }); send({ type: 'learn-thoughts' }); }
  }
  if (page === 64) send({ type: 'learn-strike' });
  if (page === 79) { send({ type: 'sell', item: 'herb' }); send({ type: 'sell', item: 'crystal' }); }
  if (page === 81) send({ type: 'train' });
  if (page === 83) send({ type: 'soup' });
  if (page === 95) send({ type: 'buy-knife' });
  assert.equal(nextRequirement(save.current), null, `Page ${page}`);
  return save;
}

test('chapter 3 preserves every FB2 paragraph, punctuation and emphasis', () => {
  const source = JSON.parse(execFileSync('python3', ['-c', `import xml.etree.ElementTree as E,json
n={'f':'http://www.gribuser.ru/xml/fictionbook/2.0'}
r=E.parse('ленивое мужество.fb2').getroot()
s=next(s for s in r.findall('.//f:body/f:section',n) if s.find('f:title',n) is not None and ''.join(s.find('f:title',n).itertext()).strip()=='Глава 3')
def runs(p):
 a=[{'text':p.text}] if p.text else []
 for c in p:
  a.append({'text':''.join(c.itertext()),c.tag.rsplit('}',1)[-1]:True})
  if c.tail:a.append({'text':c.tail})
 return a
print(json.dumps([runs(p) for p in s.findall('f:p',n)],ensure_ascii=False))`], { encoding: 'utf8' }));
  assert.equal(paragraphs.length, 97);
  assert.deepEqual(paragraphs, source);
});

test('all 97 pages follow the book with exact development, transactions, undo and durable saves', () => {
  let save = initialChapterThree();
  for (let page = 0; page < paragraphs.length; page++) {
    assert.equal(save.current.page, page);
    save = finishPage(save);
    const s = save.current;
    if (page === 61) { assert.equal(s.strength, 13); assert.equal(s.freePoints, 0); }
    if (page === 65) { assert.equal(s.rabbitHp, 22); assert.equal(s.turn, 1); }
    if (page === 66) { assert.equal(s.rabbitHp, 10); assert.equal(s.mp, 14); }
    if (page === 68) {
      assert.equal(s.rabbitHp, 0);
      assert.equal(s.turn, 2);
      assert.ok(s.log.some(line => line.startsWith('Критический удар!')));
      assert.ok(s.log.some(line => line.startsWith('Критический удар рогом!')));
      assert.ok(s.log.some(line => line.includes('14 ед. урона')));
    }
    if (page === 70) { assert.equal(s.encounter, 4); assert.equal(s.turn, 3); assert.ok(s.log.some(line => line.includes('10 ед. урона'))); }
    if (page === 77) { assert.equal(s.strength, 20); assert.equal(s.speed, 5); assert.equal(s.strike, 2); assert.equal(s.thoughts, 1); assert.equal(s.freePoints, 0); assert.equal(s.classPoints, 0); }
    if (page === 79) assert.equal(s.money, 310);
    if (page === 81) { assert.equal(s.money, 110); assert.equal(s.hunter, true); assert.equal(s.levelPoints, 2); }
    if (page === 83) assert.equal(s.money, 100);
    assert.equal(Object.hasOwn(s.bag, 'meat'), false);
    assert.equal(Object.hasOwn(s.bag, 'hide'), false);
    assert.deepEqual(readChapterThreeSave(JSON.stringify(save)), save, `Save at ${page}`);
    if (page > 0) {
      const back = chapterThreeReducer(save, { type: 'back' });
      assert.equal(back.current.page, page - 1);
      const forward = finishPage(chapterThreeReducer(back, { type: 'next' }));
      assert.deepEqual(forward, save, `Undo/redo at ${page}`);
    }
    if (page < paragraphs.length - 1) save = chapterThreeReducer(save, { type: 'next' });
  }
  assert.equal(save.current.money, 0); assert.equal(save.current.bag.knife, 1); assert.equal(save.history.length, 96);
  assert.equal(chapterThreeReducer(save, { type: 'buy-knife' }), save);
  assert.deepEqual(chapterThreeReducer(save, { type: 'restart' }), initialChapterThree());
});

test('unfinished actions block reading; invalid saves and repeated transactions are safe', () => {
  let save = initialChapterThree();
  while (save.current.page < 15) save = chapterThreeReducer(save, { type: 'next' });
  assert.equal(chapterThreeReducer(save, { type: 'next' }), save);
  assert.equal(chapterThreeReducer(save, { type: 'train' }), save);
  save = finishPage(save);
  assert.equal(chapterThreeReducer(save, { type: 'use', item: 'ration' }), save);
  for (const value of [null, 'broken', '{}', JSON.stringify({ ...save, current: { ...save.current, money: -1 } }), JSON.stringify({ ...save, history: [] })]) {
    assert.deepEqual(readChapterThreeSave(value), initialChapterThree());
  }
});
