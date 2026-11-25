import paragraphs from './chapter-two.json' with { type: 'json' };

export const CHAPTER_TWO_SAVE = 'lazy-courage:chapter-two:v1';
export const HERO_HP = 140;
export const RABBIT_HP = 30;
export type Item = 'leaves' | 'crystal' | 'herb' | 'carrot' | 'apple' | 'orange' | 'parcel';
export type Menu = 'inventory' | 'status' | 'help' | 'minimap' | 'map' | 'quests' | 'journal';
export type Move = 'kick' | 'punch' | 'dodge';
export type BattleEvent = { kind: 'hit' | 'hurt' | 'dodge' | 'xp' | 'loot' | 'heal'; text: string; amount?: number };
export type ChapterState = {
  page: number;
  collected: boolean;
  equipped: boolean;
  hp: number;
  xp: number;
  classXp: number;
  fight: number;
  turn: number;
  rabbitHp: number;
  phase: 'reading' | 'combat' | 'loot' | 'healing' | 'rested';
  bag: Record<Item, number>;
  log: BattleEvent[];
  lastMove: Move | null;
  menuVisits: number[];
  exchanged: boolean;
  parcelStored: boolean;
};
export type ChapterSave = { version: 1; current: ChapterState; history: ChapterState[] };
export type ChapterAction = { type: 'next' | 'back' | 'restart' | 'gather' | 'loot' | 'hunt' | 'exchange' | 'store-parcel' } | { type: 'use'; item: Item } | { type: 'act'; move: Move } | { type: 'open-menu'; menu: Menu };

export function initialChapter(): ChapterSave {
  return { version: 1, history: [], current: {
    page: 0, collected: false, equipped: false, hp: HERO_HP, xp: 0, classXp: 0,
    fight: 0, turn: 0, rabbitHp: RABBIT_HP, phase: 'reading', lastMove: null,
    bag: { leaves: 0, crystal: 0, herb: 0, carrot: 0, apple: 0, orange: 0, parcel: 0 }, log: [], menuVisits: [], exchanged: false, parcelStored: false,
  } };
}

export function availableMenus(s: ChapterState): Menu[] {
  const menus: Menu[] = [];
  if (s.collected) menus.push('inventory');
  if (s.page >= 10) menus.push('status', 'help', 'minimap', 'map');
  if (s.page >= 42) menus.push('quests');
  return menus;
}

// Ranges end where attention returns to the world; the FB2 has no explicit close commands.
export function storyMenu(s: ChapterState): Menu | null {
  if ((s.page === 10 || s.page === 64) && s.menuVisits.includes(s.page)) return 'help';
  if (s.page === 17) return 'map';
  if (s.page >= 44 && s.page <= 69 && s.menuVisits.includes(44)) return 'status';
  if (s.page === 42 && s.menuVisits.includes(42)) return 'quests';
  if (s.page === 79 && s.menuVisits.includes(79)) return 'inventory';
  return null;
}

export function nextRequirement(s: ChapterState): string | null {
  if (s.page === 9 && !s.collected) return 'Соберите листья цедулиса';
  if (s.page === 9 && !s.equipped) return 'Откройте инвентарь и наденьте листья';
  if ([10, 64].includes(s.page) && !s.menuVisits.includes(s.page)) return 'Откройте Справку';
  if (s.page === 42 && !s.menuVisits.includes(42)) return 'Проверьте вкладку «Задания»';
  if (s.page === 44 && !s.menuVisits.includes(44)) return 'Вызовите Статус';
  if (s.page === 79 && !s.menuVisits.includes(79)) return 'Откройте инвентарь';
  if (s.page === 86 && !s.exchanged) return 'Передайте Хатико пять кристаллов';
  if (s.page === 89 && !s.parcelStored) return 'Уберите пакет в инвентарь';
  if (s.page === 70 && s.turn < 1) return 'Пните кролика';
  if (s.page === 73 && s.turn < 3) return s.turn === 1 ? 'Попробуйте уклониться' : 'Ударьте рукой';
  if (s.page === 76 && s.phase === 'combat') return 'Завершите первый бой';
  if ([78, 82, 83].includes(s.page)) {
    if (s.phase === 'combat') return 'Победите кролика';
    if (s.phase === 'loot') return 'Соберите добычу';
    if (s.phase === 'healing') return 'Съешьте еду из инвентаря и восстановите здоровье';
    if (s.page === 83 && s.fight < 5) return 'Продолжите охоту — нужны пять кристаллов';
  }
  return null;
}

type Exchange = { damage: number; incoming: number; move?: Move };
// Only 4, 7, 6, 5, 7 damage, two misses, 64 final HP and 12/16 XP are exact in the book.
// The unnumbered exchanges fill the remaining 21 rabbit HP / 56 hero damage.
const firstFight: Exchange[] = [
  { damage: 4, incoming: 7, move: 'kick' },
  { damage: 0, incoming: 6, move: 'dodge' },
  { damage: 5, incoming: 7, move: 'punch' },
  { damage: 0, incoming: 8, move: 'kick' },
  { damage: 4, incoming: 8 }, { damage: 4, incoming: 8 },
  { damage: 0, incoming: 8, move: 'kick' },
  { damage: 4, incoming: 8 }, { damage: 4, incoming: 8 }, { damage: 5, incoming: 8 },
];
// Four later fights are summarized by the author, so these exchanges are adaptation rules.
const laterFight: Exchange[] = [
  { damage: 4, incoming: 7 }, { damage: 5, incoming: 6 },
  { damage: 0, incoming: 7 }, { damage: 5, incoming: 7 },
  { damage: 5, incoming: 6 }, { damage: 5, incoming: 7 }, { damage: 6, incoming: 0 },
];

export function availableMoves(s: ChapterState): Move[] {
  if (s.phase !== 'combat') return [];
  if (s.fight === 1) {
    if (s.page === 70 && s.turn !== 0 || s.page === 73 && (s.turn < 1 || s.turn > 2)) return [];
    if (![70, 73, 76].includes(s.page)) return [];
    const exchange = firstFight[s.turn];
    if (!exchange) return [];
    if (exchange.move) return [exchange.move];
  }
  return ['kick', 'punch'];
}

export const moveNames: Record<Move, string> = { kick: 'Пинок', punch: 'Удар рукой', dodge: 'Уклонение' };
export const menuNames: Record<Menu, string> = { inventory: 'Инвентарь', status: 'Статус', help: 'Справка', minimap: 'Миникарта', map: 'Карта', quests: 'Задания', journal: 'Журнал' };
export const itemNames: Record<Item, string> = { leaves: 'Листья цедулиса', crystal: 'Круглый кристалл', herb: 'Пахучая травка', carrot: 'Морковь', apple: 'Яблоко', orange: 'Апельсин', parcel: 'Пакет Хатико' };
const food: Item[] = ['carrot', 'apple', 'carrot', 'orange', 'apple'];

function startFight(s: ChapterState, fight: number): ChapterState {
  return { ...s, fight, turn: 0, rabbitHp: RABBIT_HP, phase: 'combat', lastMove: null };
}

function enterPage(s: ChapterState, page: number): ChapterState {
  let next: ChapterState = { ...s, page, lastMove: null };
  if (page === 70) next = startFight(next, 1);
  if (page === 81) next = startFight(next, 2);
  if (page === 83) next = startFight(next, 3);
  return next;
}

function act(s: ChapterState, move: Move): ChapterState {
  if (!availableMoves(s).includes(move)) return s;
  const exchange = (s.fight === 1 ? firstFight : laterFight)[s.turn];
  if (!exchange) return s;
  const log: BattleEvent[] = [];
  if (move === 'dodge') {
    log.push({ kind: 'dodge', text: 'Уклониться не получилось — рог снова попал в грудь.' });
  } else if (exchange.damage === 0) {
    log.push({ kind: 'dodge', text: 'Пинок прошёл мимо. Кролик неторопливо прыгает по той же траектории. Промах!', amount: 0 });
  } else {
    log.push({ kind: 'hit', text: `Вы наносите рогатому кролику 1-го уровня ${exchange.damage} ед. урона`, amount: exchange.damage });
  }
  if (exchange.incoming) log.push({ kind: 'hurt', text: `Рогатый кролик 1-го уровня наносит вам ${exchange.incoming} ед. урона`, amount: exchange.incoming });
  const rabbitHp = Math.max(0, s.rabbitHp - exchange.damage);
  const won = rabbitHp === 0;
  if (won) log.push({ kind: 'xp', text: 'Рогатый кролик 1-го уровня убит! Вы получаете: 12 очков опыта, 16 очков опыта класса', amount: 12 });
  return { ...s, rabbitHp, hp: s.hp - exchange.incoming, turn: s.turn + 1, lastMove: move,
    phase: won ? 'loot' : 'combat', xp: s.xp + (won ? 12 : 0), classXp: s.classXp + (won ? 16 : 0), log: [...s.log, ...log] };
}

export function chapterReducer(save: ChapterSave, action: ChapterAction): ChapterSave {
  const s = save.current;
  if (action.type === 'restart') return initialChapter();
  if (action.type === 'back') {
    const previous = save.history.at(-1);
    return previous ? { ...save, current: previous, history: save.history.slice(0, -1) } : save;
  }
  if (action.type === 'next') {
    if (nextRequirement(s) || s.page >= paragraphs.length - 1) return save;
    return { ...save, current: enterPage(s, s.page + 1), history: [...save.history, s] };
  }
  let next = s;
  if (action.type === 'open-menu' && availableMenus(s).includes(action.menu)) {
    let visit: number | undefined;
    if (action.menu === 'help' && [10, 64].includes(s.page)) visit = s.page;
    if (action.menu === 'status' && s.page === 44) visit = 44;
    if (action.menu === 'quests' && s.page === 42) visit = 42;
    if (action.menu === 'inventory' && [78, 79].includes(s.page)) visit = 79;
    if (visit !== undefined && !s.menuVisits.includes(visit)) next = { ...s, menuVisits: [...s.menuVisits, visit] };
  }
  if (action.type === 'exchange' && s.page === 86 && !s.exchanged && s.bag.crystal >= 5) {
    next = { ...s, exchanged: true, bag: { ...s.bag, crystal: s.bag.crystal - 5 } };
  }
  if (action.type === 'store-parcel' && s.page === 89 && s.exchanged && !s.parcelStored) {
    next = { ...s, parcelStored: true, bag: { ...s.bag, parcel: 1 } };
  }
  if (action.type === 'gather' && s.page === 9 && !s.collected) {
    next = { ...s, collected: true, bag: { ...s.bag, leaves: 1 } };
  }
  if (action.type === 'act') next = act(s, action.move);
  if (action.type === 'loot' && s.phase === 'loot' && [78, 82, 83].includes(s.page)) {
    const item = food[s.fight - 1];
    next = { ...s, phase: 'healing', bag: { ...s.bag, crystal: s.bag.crystal + 1, herb: s.bag.herb + 1, [item]: s.bag[item] + 1 },
      log: [...s.log, { kind: 'loot', text: `Добыча: круглый кристалл, пахучая травка, ${itemNames[item].toLowerCase()}.` }] };
  }
  if (action.type === 'use' && s.bag[action.item] > 0) {
    if (action.item === 'leaves' && !s.equipped) next = { ...s, equipped: true, bag: { ...s.bag, leaves: 0 } };
    if (['carrot', 'apple', 'orange'].includes(action.item) && s.phase === 'healing') {
      next = { ...s, hp: HERO_HP, phase: 'rested', bag: { ...s.bag, [action.item]: s.bag[action.item] - 1 },
        log: [...s.log, { kind: 'heal', text: `${itemNames[action.item]} и отдых. Здоровье восстановлено: ${HERO_HP} / ${HERO_HP}.`, amount: HERO_HP - s.hp }] };
    }
  }
  if (action.type === 'hunt' && s.page === 83 && s.phase === 'rested' && s.fight < 5) next = startFight(s, s.fight + 1);
  return next === s ? save : { ...save, current: next };
}

function validState(value: unknown): value is ChapterState {
  if (!value || typeof value !== 'object') return false;
  const s = value as ChapterState;
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  return integer(s.page, paragraphs.length - 1) && integer(s.hp, HERO_HP) && integer(s.rabbitHp, RABBIT_HP)
    && integer(s.fight, 5) && integer(s.turn, 10) && integer(s.xp, 60) && integer(s.classXp, 80)
    && typeof s.collected === 'boolean' && typeof s.equipped === 'boolean'
    && (s.menuVisits === undefined || Array.isArray(s.menuVisits) && s.menuVisits.every(page => [10, 42, 44, 64, 79].includes(page)))
    && (s.exchanged === undefined || typeof s.exchanged === 'boolean') && (s.parcelStored === undefined || typeof s.parcelStored === 'boolean')
    && ['reading', 'combat', 'loot', 'healing', 'rested'].includes(s.phase)
    && (s.lastMove === null || ['kick', 'punch', 'dodge'].includes(s.lastMove))
    && Boolean(s.bag) && Object.keys(itemNames).every(key => integer(s.bag[key as Item], 100))
    && Array.isArray(s.log) && s.log.length <= 120 && s.log.every(entry => entry && typeof entry.text === 'string' && entry.text.length < 500
      && ['hit', 'hurt', 'dodge', 'xp', 'loot', 'heal'].includes(entry.kind) && (entry.amount === undefined || integer(entry.amount, HERO_HP)));
}

export function readChapterSave(value: string | null): ChapterSave {
  try {
    const save = JSON.parse(value ?? 'null') as ChapterSave;
    if (save?.version === 1 && validState(save.current) && Array.isArray(save.history)
      && save.history.length === save.current.page && save.history.every((state, page) => validState(state) && state.page === page)) {
      const migrate = (state: ChapterState): ChapterState => {
        if (state.menuVisits !== undefined && state.exchanged !== undefined && state.parcelStored !== undefined) return state;
        const exchanged = state.page >= 86 && state.bag.parcel === 1;
        return { ...state, menuVisits: [10, 42, 44, 64, 79].filter(page => page <= state.page), exchanged, parcelStored: exchanged && state.page >= 89,
          bag: { ...state.bag, parcel: exchanged && state.page < 89 ? 0 : state.bag.parcel } };
      };
      return { ...save, current: migrate(save.current), history: save.history.map(migrate) };
    }
  } catch { /* A malformed or unavailable save starts a new chapter. */ }
  return initialChapter();
}
