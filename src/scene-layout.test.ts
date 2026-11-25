import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { changeElement, changeTransform, cloneElementInFrame, clonesAt, createSceneChapter, elementAt, parseSceneChapter, transformAt } from './scene-layout';
import { chapterReplay, gameSceneVariant } from './scene-replay';
import { readChapterSave } from './chapter-two-game';
import { readChapterThreeSave } from './chapter-three-game';
import { readChapterFourSave } from './chapter-four-game';
import { readChapterFiveSave } from './chapter-five-game';

test('whole chapter documents keep frame edits, mobile overrides, copies, deletion and comments independent', () => {
  let doc = createSceneChapter(1);
  doc = changeTransform(doc, 0, 'start', '/dataris', 'desktop', { x: 7, scale: 1.4, flipX: true });
  doc = changeTransform(doc, 0, 'start', '/dataris', 'mobile', { x: 2 });
  assert.equal(transformAt(elementAt(doc, 0, 'start', '/dataris'), 'desktop').x, 7);
  assert.equal(transformAt(elementAt(doc, 0, 'start', '/dataris'), 'mobile').x, 2);
  assert.equal(elementAt(doc, 1, 'start', '/dataris').desktop.x, 0);
  const copied = cloneElementInFrame(doc, 0, 'start', '/dataris', 'desktop');
  doc = copied.doc;
  doc = changeElement(doc, 0, 'start', '/dataris', element => ({ ...element, deleted: true }));
  assert.equal(elementAt(doc, 0, 'start', copied.id).deleted, false);
  assert.equal(elementAt(doc, 0, 'start', copied.id).desktop.scale, 1.4);
  const snapped = elementAt(doc, 0, 'start', copied.id);
  doc = changeElement(doc, 1, 'start', '/dataris', () => ({ ...structuredClone(snapped), locked: true }));
  doc = changeTransform(doc, 0, 'start', copied.id, 'desktop', { scale: 2 });
  assert.equal(elementAt(doc, 1, 'start', '/dataris').desktop.scale, 1.4, 'magnet does not inherit later changes');
  doc = changeElement(doc, 1, 'start', '/dataris', element => ({ ...element, locked: false }));
  assert.equal(elementAt(doc, 1, 'start', '/dataris').desktop.scale, 1.4, 'release keeps placement');
  doc.frames[0].comment = 'Сохранить опору трона';
  assert.deepEqual(parseSceneChapter(JSON.parse(JSON.stringify(doc)), 1), doc);
  assert.equal(doc.frames.length, 113);
  assert.throws(() => parseSceneChapter({ ...doc, chapter: 2 }, 1));
  assert.throws(() => parseSceneChapter({ ...doc, frames: doc.frames.slice(0, 1) }));
  const invalid = changeTransform(doc, 0, 'start', '/dataris', 'desktop', { scale: NaN });
  assert.throws(() => parseSceneChapter(invalid));
  let group = changeTransform(createSceneChapter(1), 0, 'start', '/actor/pose', 'desktop', { scale: 1.2, flipY: true });
  const childCopy = cloneElementInFrame(group, 0, 'start', '/actor/pose', 'desktop');
  group = childCopy.doc;
  const parentCopy = cloneElementInFrame(group, 0, 'start', '/actor', 'desktop');
  const descendants = clonesAt(parentCopy.doc, 0, 'start').filter(clone => clone.source.startsWith(parentCopy.id + '/'));
  assert.equal(descendants.length, 1, 'copying a group keeps its nested copies');
  assert.equal(clonesAt(group, 0, 'start').length, 1, 'immutable edits preserve undo snapshots');
  assert.equal(elementAt(parentCopy.doc, 0, 'start', parentCopy.id + '/pose').desktop.scale, 1.2);
  assert.equal(elementAt(parentCopy.doc, 0, 'start', descendants[0].id).desktop.flipY, true);
  assert.equal(clonesAt(parentCopy.doc, 0, 'step-1').length, 3, 'base copies survive game actions in the same paragraph');
  assert.deepEqual(parseSceneChapter(parentCopy.doc), parentCopy.doc);
  const changedGroup = changeTransform(group, 0, 'step-1', '/actor/pose', 'desktop', { scale: 2 });
  const pasted = cloneElementInFrame(changedGroup, 0, 'step-1', '/actor/pose', 'desktop', { document: group, variant: 'start' });
  assert.equal(elementAt(pasted.doc, 0, 'step-1', pasted.id).desktop.scale, 1.2, 'clipboard keeps the copied placement across action states of the same frame');
  const far = changeTransform(createSceneChapter(1), 0, 'start', '/actor', 'desktop', { x: 600, y: -600 });
  assert.equal(elementAt(far, 0, 'start', '/actor').desktop.x, 500);
  assert.equal(elementAt(far, 0, 'start', '/actor').desktop.y, -500);
  assert.doesNotThrow(() => parseSceneChapter(cloneElementInFrame(far, 0, 'start', '/actor', 'desktop').doc), 'dragging or pasting at the coordinate limit always produces a savable document');
});
test('all five scene files and every replay state preserve valid game progress through the complete chapters', () => {
  for (const chapter of [1, 2, 3, 4, 5] as const) {
    const doc = parseSceneChapter(JSON.parse(readFileSync('src/scenes/chapter-0' + chapter + '.json', 'utf8')), chapter);
    const frames = chapterReplay(chapter);
    assert.equal(frames.length, doc.frames.length);
    for (const [page, states] of frames.entries()) {
      assert.equal(states[0].id, 'start');
      for (const state of states) {
        assert.ok(doc.frames[page].variants[state.id], 'all canonical action states are included in the chapter JSON');
        if (state.two) { assert.equal(state.two.save.current.page, page); assert.deepEqual(readChapterSave(JSON.stringify(state.two.save)), state.two.save); assert.equal(gameSceneVariant(chapter, state.two.save.current), state.id); }
        if (state.three) { assert.equal(state.three.save.current.page, page); assert.deepEqual(readChapterThreeSave(JSON.stringify(state.three.save)), state.three.save); assert.equal(gameSceneVariant(chapter, state.three.save.current), state.id); }
        if (state.four) { assert.equal(state.four.save.current.page, page); assert.deepEqual(readChapterFourSave(JSON.stringify(state.four.save)), state.four.save); assert.equal(gameSceneVariant(chapter, state.four.save.current), state.id); }
        if (state.five) { assert.equal(state.five.save.current.page, page); assert.deepEqual(readChapterFiveSave(JSON.stringify(state.five.save)), state.five.save); assert.equal(gameSceneVariant(chapter, state.five.save.current), state.id); }
      }
    }
  }
  assert.equal(chapterReplay(4)[25].length, 3, 'mouse: cat, hand, pocket');
  assert.equal(chapterReplay(5)[34].length, 8, 'seven sequential actions in one book paragraph');
  assert.equal(chapterReplay(5)[91].length, 4, 'slip, crawl, threshold');
});
