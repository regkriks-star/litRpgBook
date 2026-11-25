import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { bookTextParts } from './BookText';
import paragraphs from './chapter-five.json' with { type: 'json' };
import { chapterFiveReducer as reduce, initialChapterFive, maxHp, pageTasks, pendingTasks, readChapterFiveSave, type ChapterSave } from './chapter-five-game';
import { readChapterFourSave, initialChapterFour } from './chapter-four-game';

test('chapter 5 keeps every FB2 paragraph, whitespace, emphasis and dialogue together', () => {
  const extracted = JSON.parse(execFileSync('python3', ['-c', `
import json,xml.etree.ElementTree as E
ns={'f':'http://www.gribuser.ru/xml/fictionbook/2.0'}
r=E.parse('ленивое мужество.fb2').getroot()
s=next(s for s in r.findall('.//f:body/f:section',ns) if s.find('f:title',ns) is not None and ''.join(s.find('f:title',ns).itertext()).strip()=='Глава 5')
def runs(p):
 a=[{'text':p.text}] if p.text else []
 for c in p:
  a.append({'text':''.join(c.itertext()),c.tag.rsplit('}',1)[-1]:True})
  if c.tail:a.append({'text':c.tail})
 return a
print(json.dumps([runs(p) for p in s.findall('f:p',ns)],ensure_ascii=False))
`], { encoding: 'utf8' }));
  assert.deepEqual(paragraphs, extracted);
  assert.equal(paragraphs.length, 94);
  assert.ok(paragraphs[0].map(r => r.text).join('').endsWith('палкой?'));
  assert.match(readFileSync('src/ChapterFive.tsx', 'utf8'), /BookText runs=\{paragraphs\[s.page\]\}/);
});
test('all mandatory actions, money, blessings, injuries, back and reload follow the book', () => {
  let save = initialChapterFive();
  for (let page = 0; page < paragraphs.length; page++) {
    assert.equal(save.current.page, page);
    if (pageTasks[page]) assert.equal(reduce(save, { type: 'next' }), save, `page ${page} must wait for actions`);
    for (const task of pageTasks[page] ?? []) {
      const wrong = (pageTasks[page] ?? []).at(-1)!;
      if (wrong !== pendingTasks(save.current)[0]) assert.equal(reduce(save, { type: 'do', task: wrong }), save);
      const before = save;
      save = reduce(save, { type: 'do', task });
      assert.notEqual(save, before, task);
      assert.equal(reduce(save, { type: 'do', task }), save, `${task} cannot repeat`);
      assert.deepEqual(readChapterFiveSave(JSON.stringify(save)), save, `${task} reload`);
    }
    if (page === 30) { assert.equal(save.current.lady, 'mage'); assert.equal(maxHp(save.current), 840); }
    if (page === 39) assert.equal(save.current.lady, null);
    if (page === 40) { assert.equal(save.current.money, 15765); assert.equal(save.current.bag.pelt, 0); }
    if (page === 56) {
      assert.equal(save.current.money, 6765); assert.equal(save.current.bag.axe, 1);
      const rewind = reduce(save, { type: 'back' });
      assert.equal(rewind.current.bag.axe, 0); assert.equal(rewind.current.money, 15765);
      let replay = reduce(rewind, { type: 'next' }); replay = reduce(replay, { type: 'do', task: 'buy-axe' });
      assert.deepEqual(replay, save);
    }
    if (page === 59) { assert.equal(save.current.money, 1265); assert.equal(save.current.bag.clothes, 2); assert.equal(save.current.levelPoints, 7); assert.equal(save.current.stealth, 1); assert.equal(save.current.traveler, 1); }
    if (page === 89) { assert.equal(save.current.hp, 1); assert.equal(save.current.bag.clothes, 1); }
    if (page === 93) { assert.equal(save.current.lady, 'novice'); assert.equal(save.current.bag.lighter, 1); }
    save = reduce(save, { type: 'next' });
  }
  assert.equal(save.history.length, 93);
  assert.deepEqual(readChapterFourSave(JSON.stringify(initialChapterFour())), initialChapterFour());
});
test('page 89 never makes the clothes count negative', () => {
  const save = initialChapterFive();
  save.current.page = 88;
  save.current.bag.clothes = 0;
  const next = reduce(save, { type: 'next' });
  assert.equal(next.current.page, 89);
  assert.equal(next.current.bag.clothes, 0);
});

test('damaged and old saves fall back safely', () => {
  const first = initialChapterFive();
  for (const text of [null, '{broken', '{}', JSON.stringify(initialChapterFour()), JSON.stringify({ ...first, history: [{}] })]) assert.deepEqual(readChapterFiveSave(text), first);
  const invalid: ChapterSave = structuredClone(first); invalid.current.bag.axe = -1;
  assert.deepEqual(readChapterFiveSave(JSON.stringify(invalid)), first);
});

test('dialogue resumes in speech font after an ellipsis following the author insertion', () => {
  const text = paragraphs[0].map(run => run.text).join('');
  const parts = bookTextParts(text);
  assert.deepEqual(parts.map(p => p.spoken), [true, false, true]);
  assert.match(parts[2].text, /…и сражаемся/);
  assert.equal(parts.map(p => p.text).join(''), text);
});
