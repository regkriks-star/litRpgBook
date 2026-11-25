import paragraphs from './chapter-three.json' with { type: 'json' };
import { itemNames as meadowNames, type Item as MeadowItem } from './chapter-two-game';
import type { TownItem } from './ChapterTwoMenus';

export const CHAPTER_THREE_SAVE = 'lazy-courage:chapter-three:v1';
export type Item = MeadowItem | TownItem;
export type Menu = 'inventory' | 'status' | 'class' | 'achievements' | 'trade' | 'journal';
export const menuNames: Record<Menu, string> = { inventory: 'Инвентарь', status: 'Статус', class: 'Класс и умения', achievements: 'Достижения', trade: 'Торговля', journal: 'Журнал' };
export const itemNames: Record<Item, string> = { ...meadowNames, herb: 'Трава санка', club: 'Грубая дубинка', knife: 'Грубый самодельный нож', clothes: 'Одежда Хатико', ration: 'Похлёбка, хлеб и сыр', soup: 'Суп', trousers: 'Штаны', jacket: 'Куртка', cap: 'Шапочка' };
export type ChapterState = {
  page: number; bag: Record<Item, number>; money: number; dressed: boolean;
  hp: number; mp: number; level: number; classLevel: number;
  strength: number; speed: number; freePoints: number; levelPoints: number; classPoints: number;
  strike: number; thoughts: number; hunter: boolean; roof: boolean; chimney: boolean;
  opened: Menu[]; inspected: string[];
  encounter: number; phase: 'reading' | 'combat' | 'loot' | 'rest' | 'done';
  rabbitHp: number; turn: number; strikeUsed: boolean; victories: number; xp: number; classXp: number;
  lastMove: 'attack' | 'strike' | 'eat' | null; log: string[];
};
export type ChapterSave = { version: 1; current: ChapterState; history: ChapterState[] };
export type ChapterAction = { type: 'next' | 'back' | 'restart' | 'roof' | 'chimney' | 'attack' | 'strike' | 'loot' | 'learn-strike' | 'upgrade-strike' | 'learn-thoughts' | 'train' | 'buy-knife' | 'soup' }
  | { type: 'open'; menu: Menu } | { type: 'inspect'; id: string } | { type: 'use'; item: Item }
  | { type: 'allocate'; stat: 'strength' | 'speed' } | { type: 'sell'; item: 'herb' | 'crystal' };

export function initialChapterThree(): ChapterSave {
  const bag = Object.fromEntries(Object.keys(itemNames).map(id => [id, 0])) as Record<Item, number>;
  // A fresh chapter starts at the fixed book boundary, independently of chapter 2's save.
  bag.parcel = 1; bag.herb = 5;
  return { version: 1, history: [], current: {
    page: 0, bag, money: 0, dressed: false, hp: 140, mp: 20, level: 0, classLevel: 0,
    strength: 8, speed: 2, freePoints: 0, levelPoints: 0, classPoints: 0, strike: 0, thoughts: 0,
    hunter: false, roof: false, chimney: false, opened: [], inspected: [], encounter: 0,
    phase: 'reading', rabbitHp: 30, turn: 0, strikeUsed: false, victories: 0, xp: 60, classXp: 80,
    lastMove: null, log: [],
  } };
}

export function maxHp(s: ChapterState) { return 140 + Math.max(0, s.level - 1) * 10; }
export function maxMp(s: ChapterState) { return 20 + Math.max(0, s.level - 1) * 10; }

export function nextRequirement(s: ChapterState): string | null {
  if (s.page === 15 && !s.dressed) return 'Откройте пакет Хатико и наденьте одежду';
  if (s.page === 15 && s.bag.ration) return 'Поешьте из инвентаря';
  if (s.page === 16 && !s.inspected.includes('pervert')) return 'Откройте новое достижение';
  if (s.page === 19 && !s.inspected.includes('class')) return 'Изучите описание класса';
  if (s.page === 19 && !s.inspected.includes('abilities')) return 'Посмотрите способности класса';
  if (s.page === 25 && !s.roof) return 'Замените повреждённую черепицу';
  if (s.page === 25 && !s.chimney) return 'Покрасьте печную трубу';
  if ([35, 67, 68, 70].includes(s.page) && s.phase === 'combat') return 'Победите рогатого кролика';
  if ([35, 67, 68, 70].includes(s.page) && s.phase === 'loot') return 'Соберите добычу';
  if ([36, 69, 70].includes(s.page) && s.phase === 'rest') return 'Съешьте яблоко или апельсин и отдохните';
  if (s.page === 35 && !s.inspected.includes('wash')) return 'Умойтесь у реки';
  if (s.page === 40 && !s.opened.includes('status')) return 'Вызовите Статус';
  if (s.page === 61 && s.strength < 13) return 'Вложите пять очков в силу';
  if (s.page === 63 && (!s.inspected.includes('strike') || !s.inspected.includes('thoughts'))) return 'Посмотрите оба классовых умения';
  if (s.page === 64 && !s.strike) return 'Изучите Разящий удар';
  if (s.page === 65 && !s.turn) return 'Ударьте кролика дубинкой';
  if (s.page === 66 && !s.strikeUsed) return 'Примените Разящий удар';
  if (s.page === 72 && !s.inspected.includes('streak')) return 'Посмотрите дар Череда побед';
  if (s.page === 77 && (s.strength < 20 || s.speed < 5)) return 'Распределите очки: сила 20, скорость 5';
  if (s.page === 77 && (s.strike < 2 || !s.thoughts)) return 'Улучшите удар и изучите Мысли о Ней';
  if (s.page === 79 && (s.bag.herb || s.bag.crystal)) return 'Продайте траву и кристаллы аптекарше';
  if (s.page === 81 && !s.hunter) return 'Купите ремесло Охотник';
  if (s.page === 82 && !['trousers', 'jacket', 'cap'].every(id => s.inspected.includes(id))) return 'Осмотрите товары и цены';
  if (s.page === 83 && !s.inspected.includes('soup')) return 'Купите тарелку супа за 10 канис';
  if (s.page === 85 && !s.inspected.includes('club')) return 'Осмотрите свою дубинку';
  if ([93, 94].includes(s.page) && !s.inspected.includes('knife')) return 'Осмотрите предложенный нож';
  if (s.page === 95 && !s.bag.knife) return 'Купите нож за последние 100 канис';
  return null;
}

function enterPage(s: ChapterState, page: number): ChapterState {
  let next: ChapterState = { ...s, page, opened: [], lastMove: null };
  if (page === 15) next = { ...next, bag: { ...next.bag, ration: 1 } };
  if (page === 32) next = { ...next, bag: { ...next.bag, club: 1 } };
  if ([35, 65, 68, 70].includes(page)) next = { ...next, encounter: next.encounter + 1, phase: 'combat', rabbitHp: 30, turn: 0, strikeUsed: false };
  if (page === 38) next = { ...next, level: 1, freePoints: 5, levelPoints: 1, hp: 140 };
  if (page === 39) next = { ...next, classLevel: 1, classPoints: 1 };
  if (page === 77) next = { ...next, level: 3, classLevel: 3, freePoints: 10, levelPoints: 3, classPoints: 2,
    hp: 160, mp: 40, phase: 'reading', victories: 62, bag: { ...next.bag, herb: 62, crystal: 62, apple: 30 },
    log: [...next.log, '16:00. Охота за день: 62 пучка санки, 62 кристалла. Череда побед: 30 / 30.'] };
  return next;
}

export function canAttack(s: ChapterState) {
  if (s.phase !== 'combat') return false;
  if (s.page === 65) return s.turn === 0;
  return [35, 67, 68, 70].includes(s.page);
}
export function canStrike(s: ChapterState) {
  return s.phase === 'combat' && s.strike > 0 && s.mp >= 6 && !s.strikeUsed
    && (s.page === 66 || [68, 70].includes(s.page) && s.turn > 0);
}

export function battleExchange(s: ChapterState, strike: boolean, turn = s.turn) {
  if (s.page === 68) {
    let damage = 10;
    if (strike) damage = 14;
    else if (turn === 0) damage = 16;
    return { damage, critical: !strike && turn === 0, incoming: turn === 0 ? 9 : 6, incomingCritical: turn === 0 };
  }
  if (s.page === 70) return { damage: strike || turn === 0 ? 10 : 12, critical: false, incoming: 4, incomingCritical: false };
  return { damage: strike ? 12 : s.encounter === 1 ? 9 : 8, critical: false, incoming: 6, incomingCritical: false };
}

function battleMove(s: ChapterState, strike: boolean): ChapterState {
  if (strike ? !canStrike(s) : !canAttack(s)) return s;
  // Unnumbered exchanges are adaptation rules; paragraphs 65–67 retain exact 8/12 and 11/13.
  const { damage, critical, incoming: reply, incomingCritical } = battleExchange(s, strike);
  const rabbitHp = Math.max(0, s.rabbitHp - damage);
  const incoming = rabbitHp && !strike ? reply : 0;
  const xp = s.encounter === 1 ? 17 : 11;
  const classXp = s.encounter === 1 ? 22 : 13;
  const log = [`${critical ? 'Критический удар! ' : ''}Вы наносите рогатому кролику ${s.encounter === 1 ? 2 : 1}-го уровня ${strike ? 'умением „Разящий удар“ ' : ''}${damage} ед. урона`];
  if (incoming) log.push(`${incomingCritical ? 'Критический удар рогом! ' : ''}Рогатый кролик наносит вам ${incoming} ед. урона`);
  if (!rabbitHp) log.push(`Рогатый кролик убит! Вы получаете: ${xp} очков опыта, ${classXp} очков опыта класса`);
  return { ...s, rabbitHp, hp: Math.max(1, s.hp - incoming), mp: s.mp - (strike ? 6 : 0), turn: s.turn + 1,
    strikeUsed: s.strikeUsed || strike, lastMove: strike ? 'strike' : 'attack', phase: rabbitHp ? 'combat' : 'loot',
    xp: s.xp + (rabbitHp ? 0 : xp), classXp: s.classXp + (rabbitHp ? 0 : classXp), log: [...s.log, ...log] };
}

export function chapterThreeReducer(save: ChapterSave, action: ChapterAction): ChapterSave {
  const s = save.current;
  if (action.type === 'restart') return initialChapterThree();
  if (action.type === 'back') {
    const previous = save.history.at(-1);
    return previous ? { ...save, current: previous, history: save.history.slice(0, -1) } : save;
  }
  if (action.type === 'next') {
    if (nextRequirement(s) || s.page === paragraphs.length - 1) return save;
    return { ...save, current: enterPage(s, s.page + 1), history: [...save.history, s] };
  }
  let next = s;
  if (action.type === 'open' && !s.opened.includes(action.menu)) next = { ...s, opened: [...s.opened, action.menu] };
  if (action.type === 'inspect' && !s.inspected.includes(action.id)) next = { ...s, inspected: [...s.inspected, action.id] };
  if (action.type === 'roof' && s.page === 25) next = { ...s, roof: true };
  if (action.type === 'chimney' && s.page === 25) next = { ...s, chimney: true };
  if (action.type === 'attack' || action.type === 'strike') next = battleMove(s, action.type === 'strike');
  if (action.type === 'loot' && s.phase === 'loot') next = { ...s, phase: 'rest', victories: s.victories + 1,
    bag: { ...s.bag, herb: s.bag.herb + 1, crystal: s.bag.crystal + 1, apple: s.bag.apple + 1, orange: s.bag.orange + 1 },
    log: [...s.log, 'Добыча: трава санка, кристалл и фрукты. Мясо и шкуры пока не выпадают.'] };
  if (action.type === 'use' && s.bag[action.item] > 0) {
    if (action.item === 'parcel' && s.page === 15 && !s.dressed) next = { ...s, dressed: true, bag: { ...s.bag, parcel: 0, clothes: 1 } };
    if (action.item === 'ration' && s.page === 15 && s.dressed || ['apple', 'orange'].includes(action.item) && s.phase === 'rest') {
      next = { ...s, hp: maxHp(s), mp: maxMp(s), phase: 'done', lastMove: 'eat', bag: { ...s.bag, [action.item]: s.bag[action.item] - 1 }, log: [...s.log, 'Еда и отдых: здоровье и мана восстановлены.'] };
    }
  }
  if (action.type === 'allocate' && s.freePoints > 0) {
    const ceiling = action.stat === 'strength' ? s.page === 61 ? 13 : 20 : 5;
    if ((s.page === 61 && action.stat === 'strength' || s.page === 77) && s[action.stat] < ceiling) next = { ...s, [action.stat]: s[action.stat] + 1, freePoints: s.freePoints - 1 };
  }
  if (action.type === 'learn-strike' && s.page === 64 && !s.strike && s.classPoints) next = { ...s, strike: 1, classPoints: s.classPoints - 1 };
  if (action.type === 'upgrade-strike' && s.page === 77 && s.strike === 1 && s.classPoints) next = { ...s, strike: 2, classPoints: s.classPoints - 1 };
  if (action.type === 'learn-thoughts' && s.page === 77 && !s.thoughts && s.classPoints) next = { ...s, thoughts: 1, classPoints: s.classPoints - 1 };
  if (action.type === 'sell' && s.page === 79 && s.bag[action.item] > 0) next = { ...s,
    money: s.money + s.bag[action.item] * (action.item === 'herb' ? 4 : 1), bag: { ...s.bag, [action.item]: 0 },
    log: [...s.log, `${itemNames[action.item]}: продано ${s.bag[action.item]}, получено ${s.bag[action.item] * (action.item === 'herb' ? 4 : 1)} канис.`] };
  if (action.type === 'train' && s.page === 81 && !s.hunter && s.money >= 200 && s.levelPoints >= 1) next = { ...s, hunter: true, money: s.money - 200, levelPoints: s.levelPoints - 1, log: [...s.log, 'Изучено ремесло Охотник, уровень 1. Потрачено 200 канис и 1 очко уровня. Теперь из кроликов могут выпадать мясо и шкуры.'] };
  if (action.type === 'soup' && s.page === 83 && s.money >= 10 && !s.inspected.includes('soup')) next = { ...s, money: s.money - 10, hp: maxHp(s), lastMove: 'eat', inspected: [...s.inspected, 'soup'] };
  if (action.type === 'buy-knife' && s.page === 95 && s.money >= 100 && !s.bag.knife) next = { ...s, money: s.money - 100, bag: { ...s.bag, knife: 1 }, log: [...s.log, 'Куплен грубый самодельный нож. Урон 2–4. Потрачено 100 канис.'] };
  return next === s ? save : { ...save, current: next };
}

function validState(value: unknown): value is ChapterState {
  if (!value || typeof value !== 'object') return false;
  const s = value as ChapterState;
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  return integer(s.page, paragraphs.length - 1) && integer(s.money, 310) && integer(s.hp, 160) && integer(s.mp, 40)
    && ['level', 'classLevel', 'levelPoints', 'classPoints'].every(key => integer(s[key as 'level'], 3)) && integer(s.encounter, 4)
    && integer(s.strength, 20) && integer(s.speed, 5) && integer(s.freePoints, 10) && integer(s.strike, 2) && integer(s.thoughts, 1)
    && integer(s.rabbitHp, 30) && integer(s.turn, 6) && integer(s.victories, 62) && integer(s.xp, 500) && integer(s.classXp, 500)
    && ['dressed', 'hunter', 'roof', 'chimney', 'strikeUsed'].every(key => typeof s[key as 'dressed'] === 'boolean')
    && ['reading', 'combat', 'loot', 'rest', 'done'].includes(s.phase) && [null, 'attack', 'strike', 'eat'].includes(s.lastMove)
    && Boolean(s.bag) && Object.keys(itemNames).every(id => integer(s.bag[id as Item], 100))
    && Array.isArray(s.opened) && s.opened.length <= 6 && s.opened.every(id => Object.hasOwn(menuNames, id))
    && Array.isArray(s.inspected) && s.inspected.length <= 30 && s.inspected.every(id => typeof id === 'string' && id.length < 50)
    && Array.isArray(s.log) && s.log.length < 100 && s.log.every(line => typeof line === 'string' && line.length < 500);
}

export function readChapterThreeSave(value: string | null): ChapterSave {
  try {
    const save = JSON.parse(value ?? 'null') as ChapterSave;
    if (save?.version === 1 && validState(save.current) && Array.isArray(save.history) && save.history.length === save.current.page
      && save.history.every((state, page) => validState(state) && state.page === page)) return save;
  } catch { /* Invalid or unavailable storage starts this chapter safely. */ }
  return initialChapterThree();
}
