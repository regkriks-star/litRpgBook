import { bookTextParts } from './BookText';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createActor, SimulatedClock } from 'xstate';
import { enemyAction, freshContext, gameMachine, migrateV2Save, playerAction, unavailable, validSave, type Action, type GameContext } from './game';
import { endings, lines } from './story';

function game() {
  const clock = new SimulatedClock();
  const actor = createActor(gameMachine, { clock }).start();
  const settle = () => {
    for (let i = 0; i < 100; i++) {
      const phase = actor.getSnapshot().value;
      if (phase === 'chapter') clock.increment(2000);
      else if (phase === 'hit' || phase === 'enemy') clock.increment(1000);
      else if (phase.endsWith('Dialogue')) actor.send({ type: 'NEXT' });
      else return;
    }
    assert.fail('Battle failed to settle');
  };
  const act = (action: Action) => { assert.equal(actor.getSnapshot().value, 'player'); actor.send({ type: 'ACT', action }); settle(); };
  return { actor, clock, settle, act };
}

test('the complete book route wins both fights, preserves health, and reads every page in order', () => {
  const { actor, settle, act } = game();
  actor.send({ type: 'START' }); settle();
  assert.equal(actor.getSnapshot().context.hp, 108);
  assert.equal(actor.getSnapshot().context.enemyHp, 117); // Friendly fire never damages the scorpion.
  for (let i = 0; i < 3; i++) act('attack');
  let c = actor.getSnapshot().context;
  assert.equal(c.wave, 2);
  assert.equal(c.enemyHp, 117);
  assert.equal(c.hp, 72); // Poison carries into the ambush; no between-wave healing.
  assert.equal(c.witchHp, 76);
  assert.equal(c.lastTarget, 'sayaka');
  for (const action of ['wait', 'guard', 'attack', 'attack', 'attack'] as const) act(action);
  c = actor.getSnapshot().context;
  assert.equal(actor.getSnapshot().value, 'victory');
  assert.ok(c.hp > 0 && c.witchHp > 0);
  assert.equal(c.apples, 3);
  assert.equal(c.antidotes, 3);
  console.log(`Book route result: Mach ${c.hp} HP, Sayaka ${c.witchHp} HP; targets: ${c.log.filter(l => l.includes('→')).join(' | ')}`);
  actor.send({ type: 'CONTINUE' });
  for (let i = 0; i < endings.length; i++) actor.send({ type: 'NEXT' });
  assert.equal(actor.getSnapshot().value, 'complete');
  assert.deepEqual(actor.getSnapshot().context.history, lines.map(line => line.id));
  actor.stop();
});

test('every word of all 26 source paragraphs survives extraction and pagination', () => {
  const source = JSON.parse(readFileSync('docs/chapter8-excerpt.json', 'utf8')) as string[];
  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < source.length; i++) {
    const paragraphLines = lines.filter(line => line.paragraph === i);
    assert.equal(normalize(paragraphLines.map(line => line.text).join(' ')), normalize(source[i]), `Paragraph ${i} was changed`);
    if (source[i].startsWith('—')) {
      assert.equal(paragraphLines.length, 1, `Dialogue ${i} must be a single reading step`);
      assert.equal(paragraphLines[0].text, source[i]);
      assert.notEqual(paragraphLines[0].speaker, 'narrator');
    }
  }
});

test('both allies can be attacked; cover intercepts damage and prevents fresh poison', () => {
  const c = { ...freshContext(), wave: 2 as const, mp: 10 };
  assert.equal(enemyAction(c).witchHp, 76);
  const protectedParty = enemyAction(playerAction(c, 'guard'));
  assert.equal(protectedParty.witchHp, c.witchHp);
  assert.equal(protectedParty.hp, c.hp - 5);
  assert.equal(protectedParty.poison, 0);
  assert.equal(protectedParty.witchPoison, 0);
  assert.equal(protectedParty.mp, 14);
  assert.equal(enemyAction({ ...c, turn: 3 }).lastTarget, 'mach');
});

test('items target either ally, are finite, and failed commands do not spend a turn', () => {
  const start = { ...freshContext(), hp: 60, witchHp: 45, poison: 2, witchPoison: 2 };
  const healed = playerAction(start, 'apple', 'sayaka');
  assert.equal(healed.hp, 60); assert.equal(healed.witchHp, 85); assert.equal(healed.apples, 2);
  const cured = playerAction(start, 'antidote', 'sayaka');
  assert.equal(cured.poison, 2); assert.equal(cured.witchPoison, 0);
  assert.equal(cured.antidotes, 2); assert.equal(cured.guarding, true);
  assert.ok(unavailable({ ...start, witchMp: 0 }, 'bolt'));
  assert.ok(unavailable({ ...start, mp: 0 }, 'strike'));
  assert.ok(unavailable(freshContext(), 'apple', 'sayaka'));
  assert.deepEqual(playerAction({ ...start, apples: 0 }, 'apple'), { ...start, apples: 0 });
});

test('dialogue pauses combat and restores without repeating damage or history', () => {
  const { actor, clock } = game();
  actor.send({ type: 'START' }); clock.increment(2000); clock.increment(1000);
  assert.equal(actor.getSnapshot().value, 'playerDialogue');
  const snapshot = actor.getPersistedSnapshot();
  assert.ok(validSave(snapshot));
  clock.increment(20000); actor.send({ type: 'ACT', action: 'attack' });
  assert.deepEqual(actor.getPersistedSnapshot(), snapshot);
  actor.stop();
  const restored = createActor(gameMachine, { snapshot, clock }).start();
  assert.deepEqual(restored.getSnapshot().context.history, ['p0-0-0']);
  restored.send({ type: 'NEXT' }); clock.increment(1000);
  assert.equal(restored.getSnapshot().value, 'enemyDialogue');
  assert.equal(restored.getSnapshot().context.hp, 108);
  assert.equal(restored.getSnapshot().context.turn, 2);
  restored.stop();
});

test('the ambush and its dialogue persist at every stable boundary', () => {
  const fresh = game(); fresh.actor.send({ type: 'START' }); fresh.settle(); fresh.act('attack'); fresh.act('attack');
  fresh.actor.send({ type: 'ACT', action: 'attack' }); fresh.clock.increment(1000);
  let arrivals = 0;
  for (let i = 0; i < 20 && fresh.actor.getSnapshot().value !== 'player'; i++) {
    const state = fresh.actor.getSnapshot();
    if (state.value.endsWith('Dialogue')) {
      assert.ok(validSave(fresh.actor.getPersistedSnapshot()));
      const copy = createActor(gameMachine, { snapshot: fresh.actor.getPersistedSnapshot(), clock: new SimulatedClock() }).start();
      assert.deepEqual(copy.getSnapshot().context, state.context); copy.stop();
      if (state.value === 'arrivalDialogue') arrivals++;
      fresh.actor.send({ type: 'NEXT' });
    } else fresh.clock.increment(1000);
  }
  assert.equal(arrivals, 1); // Direct speech and the author's description stay together.
  assert.equal(fresh.actor.getSnapshot().context.witchHp, 76);
  fresh.actor.stop();
});

test('losing either ally ends the fight and retry resets the whole encounter', () => {
  const seed = createActor(gameMachine).start();
  for (const target of ['mach', 'sayaka'] as const) {
    const clock = new SimulatedClock();
    const snapshot = { ...seed.getPersistedSnapshot(), value: 'player', context: { ...freshContext(), wave: 2 as const, turn: target === 'mach' ? 3 : 1, hp: target === 'mach' ? 1 : 140, witchHp: target === 'sayaka' ? 1 : 96 } };
    const actor = createActor(gameMachine, { snapshot, clock }).start();
    actor.send({ type: 'ACT', action: 'wait' }); clock.increment(1000); clock.increment(1000);
    assert.equal(actor.getSnapshot().value, 'defeat');
    actor.send({ type: 'RETRY' });
    assert.equal(actor.getSnapshot().context.wave, 1);
    assert.equal(actor.getSnapshot().context.witchHp, 96);
    actor.stop();
  }
  seed.stop();
});

test('malformed, incompatible, and empty-dialogue saves are rejected', () => {
  const actor = createActor(gameMachine).start();
  const snapshot = actor.getPersistedSnapshot();
  assert.ok(validSave(snapshot));
  for (const context of [{}, { ...freshContext(), witchHp: -1 }, { ...freshContext(), battleLines: [null] }, { ...freshContext(), history: ['missing'] }]) assert.equal(validSave({ ...snapshot, context }), false);
  assert.equal(validSave({ ...snapshot, value: 'enemyDialogue' }), false);
  assert.equal(validSave({ ...snapshot, value: 'player', context: { ...freshContext(), hp: 0 } }), false);
  actor.stop();
});

test('v2 saves resume whole dialogue paragraphs without losing combat progress', () => {
  const actor = createActor(gameMachine).start();
  const seed = actor.getPersistedSnapshot();
  for (const [value, endingLine, history, battleLines, expected] of [
    ['enemyDialogue', 0, ['p3-0-0', 'p3-1-0'], ['p3-1-0', 'p3-2-0', 'p4-0-0'], 'p13-0-0'],
    ['ending', 17, ['p22-0-0', 'p22-1-0', 'p23-0-0', 'p23-1-0', 'p23-1-1'], [], 'p23-0-0'],
    ['complete', 23, ['p25-0-0', 'p25-1-0'], [], 'p25-0-0'],
  ] as const) {
    const migrated = migrateV2Save({ ...seed, value, context: {
      ...freshContext(), hp: 72, witchHp: 76, endingLine, history, battleLines,
    } }) as { context: GameContext };
    assert.ok(validSave(migrated));
    assert.equal(migrated.context.hp, 72);
    assert.equal(migrated.context.witchHp, 76);
    assert.equal(endings[migrated.context.endingLine], expected);
    assert.ok(migrated.context.history.every(id => lines.some(line => line.id === id)));
    if (value === 'enemyDialogue') {
      assert.deepEqual(migrated.context.battleLines, ['p3-0-0', 'p4-0-0']);
      assert.deepEqual(migrated.context.history, ['p3-0-0']);
    }
  }
  for (const bad of [null, {}, { context: {} }, { ...seed, context: { ...freshContext(), history: [null] } }]) {
    assert.equal(migrateV2Save(bad), undefined);
  }
  actor.stop();
});

test('chapter card precedes combat without spending health or mana', () => {
  const { actor, clock } = game();
  actor.send({ type: 'START' });
  assert.equal(actor.getSnapshot().value, 'chapter');
  assert.deepEqual(actor.getSnapshot().context, freshContext());
  assert.ok(validSave(actor.getPersistedSnapshot()));
  clock.increment(1999);
  assert.equal(actor.getSnapshot().value, 'chapter');
  clock.increment(1);
  assert.equal(actor.getSnapshot().value, 'hit');
  assert.equal(actor.getSnapshot().context.hp, 128);
  actor.stop();
});


test('speech and author insertions use separate runs without changing the book text', () => {
  const text = '— Прости!! — верещала она, — Мне шляпа на глаза упала!';
  assert.deepEqual(bookTextParts(text), [
    { text: '— Прости!! ', spoken: true },
    { text: '— верещала она, ', spoken: false },
    { text: '— Мне шляпа на глаза упала!', spoken: true },
  ]);
  assert.deepEqual(bookTextParts('— У него попроси! — ткнул я пальцем. Всё остальное — потом.'), [
    { text: '— У него попроси! ', spoken: true },
    { text: '— ткнул я пальцем. Всё остальное — потом.', spoken: false },
  ]);
  assert.deepEqual(bookTextParts('— Всё, что остается — это работа.'), [
    { text: '— Всё, что остается — это работа.', spoken: true },
  ]);
  assert.deepEqual(bookTextParts('Он сказал слово «совсем» — и замолчал.'), [
    { text: 'Он сказал слово «совсем» — и замолчал.', spoken: false },
  ]);
  for (const line of lines) {
    assert.equal(bookTextParts(line.text).map(part => part.text).join(''), line.text);
  }
});
