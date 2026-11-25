import { availableMoves, chapterReducer, initialChapter, nextRequirement as requirementTwo, type ChapterAction as ActionTwo, type ChapterSave as SaveTwo, type Menu as MenuTwo } from './chapter-two-game';
import { canAttack, canStrike, chapterThreeReducer, initialChapterThree, nextRequirement as requirementThree, type ChapterAction as ActionThree, type ChapterSave as SaveThree, type Menu as MenuThree } from './chapter-three-game';
import { chapterFourReducer, initialChapterFour, nextRequirement as requirementFour, type ChapterAction as ActionFour, type ChapterSave as SaveFour, type Menu as MenuFour, type Task as TaskFour } from './chapter-four-game';
import { chapterFiveReducer, initialChapterFive, nextRequirement as requirementFive, pendingTasks, taskLabels, type ChapterSave as SaveFive, type Menu as MenuFive } from './chapter-five-game';
import { chapterLengths, type SceneChapterId } from './scene-layout';

export type SceneReplayState = { id: string; label: string; two?: { save: SaveTwo; menu?: MenuTwo }; three?: { save: SaveThree; menu?: MenuThree }; four?: { save: SaveFour; menu?: MenuFour }; five?: { save: SaveFive; menu?: MenuFive } };
const cache = new Map<SceneChapterId, SceneReplayState[][]>();
const fingerprints = new WeakMap<object, string>();
function fingerprint(value: object): string {
  let result = fingerprints.get(value);
  if (!result) {
    result = JSON.stringify(value, (key, entry: unknown) => {
      if (key === 'log') return undefined;
      if (Array.isArray(entry) && entry.every(item => typeof item === 'string')) return [...entry].sort();
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) return Object.fromEntries(Object.entries(entry).sort(([left], [right]) => left.localeCompare(right)));
      return entry;
    });
    fingerprints.set(value, result);
  }
  return result;
}
export function gameSceneVariant(chapter: SceneChapterId, current: { page: number }): string {
  const states = chapterReplay(chapter)[current.page];
  if (!states) return 'start';
  const snapshots = states.map(state => state.two?.save.current ?? state.three?.save.current ?? state.four?.save.current ?? state.five?.save.current);
  const exact = snapshots.findIndex(snapshot => snapshot && fingerprint(snapshot) === fingerprint(current));
  if (exact >= 0) return states[exact].id;
  const actual = current as Record<string, unknown>;
  let best = 'start';
  for (const [index, snapshot] of snapshots.entries()) {
    if (!snapshot) continue;
    const candidate = snapshot as unknown as Record<string, unknown>;
    const counters = ['phase', 'fight', 'turn', 'encounter', 'hunts', 'mouse', 'lady', 'collected', 'equipped', 'exchanged', 'parcelStored', 'roof', 'chimney', 'cooking', 'strike', 'thoughts'];
    const sets = ['done', 'inspected', 'opened', 'visited', 'menuVisits'];
    if (counters.every(key => candidate[key] === actual[key]) && sets.every(key => !Array.isArray(candidate[key]) || (candidate[key] as unknown[]).every(value => Array.isArray(actual[key]) && actual[key].includes(value)))) best = states[index].id;
  }
  return best;
}
export function chapterReplay(chapter: SceneChapterId): SceneReplayState[][] {
  const cached = cache.get(chapter); if (cached) return cached;
  const frames: SceneReplayState[][] = Array.from({ length: chapterLengths[chapter] }, () => []);
  const add = (page: number, state: Omit<SceneReplayState, 'id' | 'label'>, action?: string) => {
    const index = frames[page].length;
    frames[page].push({ id: index ? 'step-' + index : 'start', label: index ? 'После действия ' + index + (action ? ': ' + action : '') : 'Начало кадра', ...state });
  };
  if (chapter === 1) frames.forEach((_, page) => add(page, {}));
  if (chapter === 2) {
    let save = initialChapter();
    for (let page = 0; page < frames.length; page++) {
      let menu: MenuTwo | undefined;
      add(page, { two: { save } });
      for (let guard = 0; requirementTwo(save.current); guard++) {
        if (guard > 100) throw new Error('Не удалось воспроизвести главу 2, кадр ' + page);
        const s = save.current;
        let action: ActionTwo;
        if (page === 9) { action = s.collected ? { type: 'use', item: 'leaves' } : { type: 'gather' }; if (s.collected) menu = 'inventory'; }
        else if ([10, 64].includes(page)) action = { type: 'open-menu', menu: 'help' };
        else if (page === 42) action = { type: 'open-menu', menu: 'quests' };
        else if (page === 44) action = { type: 'open-menu', menu: 'status' };
        else if (page === 79) action = { type: 'open-menu', menu: 'inventory' };
        else if (page === 86) action = { type: 'exchange' };
        else if (page === 89) action = { type: 'store-parcel' };
        else if (availableMoves(s)[0]) action = { type: 'act', move: availableMoves(s)[0] };
        else if (s.phase === 'loot') action = { type: 'loot' };
        else if (s.phase === 'healing') {
          const item = (['carrot', 'apple', 'orange'] as const).find(item => s.bag[item]);
          if (!item) throw new Error('Нет еды при воспроизведении главы 2.');
          action = { type: 'use', item }; menu = 'inventory';
        } else if (page === 83 && s.phase === 'rested') { action = { type: 'hunt' }; menu = undefined; }
        else throw new Error('Нет действия для кадра ' + page);
        if (action.type === 'open-menu') menu = action.menu;
        const next = chapterReducer(save, action);
        if (next === save) throw new Error('Действие не завершает кадр ' + page);
        save = next; add(page, { two: { save, menu } }, requirementTwo(s) ?? undefined);
      }
      if (page < frames.length - 1) save = chapterReducer(save, { type: 'next' });
    }
  }
  if (chapter === 3) {
    let save = initialChapterThree();
    for (let page = 0; page < frames.length; page++) {
      let menu: MenuThree | undefined;
      add(page, { three: { save } });
      const send = (action: ActionThree, suggested?: MenuThree) => {
        const label = requirementThree(save.current) ?? undefined;
        const next = chapterThreeReducer(save, action);
        if (next === save) return;
        save = next; menu = suggested;
        add(page, { three: { save, menu } }, label);
      };
      if (page === 15) { send({ type: 'use', item: 'parcel' }, 'inventory'); send({ type: 'use', item: 'ration' }, 'inventory'); }
      const inspections: Record<number, string[]> = { 16: ['pervert'], 19: ['class', 'abilities'], 35: ['wash'], 63: ['strike', 'thoughts'], 72: ['streak'], 82: ['trousers', 'jacket', 'cap'], 85: ['club'], 93: ['knife'] };
      for (const id of inspections[page] ?? []) send({ type: 'inspect', id }, [16, 72].includes(page) ? 'achievements' : [19, 63].includes(page) ? 'class' : page === 35 ? undefined : 'trade');
      if (page === 25) { send({ type: 'roof' }); send({ type: 'chimney' }); }
      if ([35, 65, 66, 67, 68, 70].includes(page)) {
        for (let n = 0; n < 10; n++) {
          if (canStrike(save.current)) send({ type: 'strike' });
          else if (canAttack(save.current)) send({ type: 'attack' }); else break;
        }
        if (save.current.phase === 'loot') send({ type: 'loot' });
      }
      if ([36, 69, 70].includes(page)) send({ type: 'use', item: 'apple' }, 'inventory');
      if (page === 40) send({ type: 'open', menu: 'status' }, 'status');
      if (page === 61 || page === 77) {
        while (save.current.strength < (page === 61 ? 13 : 20)) send({ type: 'allocate', stat: 'strength' }, 'status');
        if (page === 77) {
          while (save.current.speed < 5) send({ type: 'allocate', stat: 'speed' }, 'status');
          send({ type: 'upgrade-strike' }, 'class'); send({ type: 'learn-thoughts' }, 'class');
        }
      }
      if (page === 64) send({ type: 'learn-strike' }, 'class');
      if (page === 79) { send({ type: 'sell', item: 'herb' }, 'trade'); send({ type: 'sell', item: 'crystal' }, 'trade'); }
      if (page === 81) send({ type: 'train' }, 'trade');
      if (page === 83) send({ type: 'soup' }, 'trade');
      if (page === 95) send({ type: 'buy-knife' }, 'trade');
      if (requirementThree(save.current)) throw new Error('Не завершён кадр главы 3: ' + page);
      if (page < frames.length - 1) save = chapterThreeReducer(save, { type: 'next' });
    }
  }
  if (chapter === 4) {
    let save = initialChapterFour();
    const tasks: Record<number, TaskFour[]> = { 1: ['peel', 'slice', 'test', 'knife-attack'], 12: ['aside'], 16: ['detach', 'load'], 17: ['drive'], 23: ['unload'], 24: ['farm-dinner'], 30: ['strike'], 32: ['loot-one'], 33: ['critical'], 35: ['loot-two'], 43: ['herbs', 'crystals'], 46: ['hides'], 47: ['meat'], 48: ['order'], 72: ['refuse'], 84: ['thanks'] };
    for (let page = 0; page < frames.length; page++) {
      add(page, { four: { save } });
      const send = (action: ActionFour, menu?: MenuFour) => {
        const label = requirementFour(save.current) ?? undefined;
        const next = chapterFourReducer(save, action); if (next === save) return;
        save = next; add(page, { four: { save, menu } }, label);
      };
      for (const task of tasks[page] ?? []) send({ type: 'do', task }, page === 1 ? 'inventory' : [43, 46, 47, 48].includes(page) ? 'trade' : undefined);
      if (page === 24) send({ type: 'cook' }, 'class');
      if (page === 25) { send({ type: 'rescue-mouse' }); send({ type: 'pocket-mouse' }); }
      if (page === 27) send({ type: 'assign' }, 'class');
      if (page === 29 || page === 50) send({ type: 'open', menu: 'status' }, 'status');
      if (page === 38) {
        for (let n = 0; n < 3; n++) send({ type: 'hunt' });
        send({ type: 'do', task: 'day' });
        for (const stat of ['strength', 'stamina', 'speed', 'intelligence'] as const) send({ type: 'allocate', stat }, 'status');
      }
      if (page === 48) { send({ type: 'use', item: 'dinner' }, 'inventory'); send({ type: 'use', item: 'roast' }, 'inventory'); for (let n = 0; n < 3; n++) send({ type: 'use', item: 'beer' }, 'inventory'); }
      if (requirementFour(save.current)) throw new Error('Не завершён кадр главы 4: ' + page);
      if (page < frames.length - 1) save = chapterFourReducer(save, { type: 'next' });
    }
  }
  if (chapter === 5) {
    let save = initialChapterFive();
    for (let page = 0; page < frames.length; page++) {
      add(page, { five: { save } });
      for (const task of pendingTasks(save.current)) {
        save = chapterFiveReducer(save, { type: 'do', task });
        const menu: MenuFive | undefined = task.startsWith('assign-') || task === 'cancel' ? 'class' : /^(sell|inspect|buy|learn)-/.test(task) ? 'trade' : undefined;
        add(page, { five: { save, menu } }, taskLabels[task]);
      }
      if (requirementFive(save.current)) throw new Error('Не завершён кадр главы 5: ' + page);
      if (page < frames.length - 1) save = chapterFiveReducer(save, { type: 'next' });
    }
  }
  cache.set(chapter, frames); return frames;
}
