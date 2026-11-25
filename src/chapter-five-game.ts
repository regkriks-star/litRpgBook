import paragraphs from './chapter-five.json' with { type: 'json' };
import { itemNames as previousItems, type Item as PreviousItem } from './chapter-four-game';

export const CHAPTER_FIVE_SAVE = 'lazy-courage:chapter-five:v1';
export const itemNames = { ...previousItems, axe: 'Простой топор', lighter: 'Магическая зажигалка' } as const;
export type Item = PreviousItem | 'axe' | 'lighter';
export type Menu = 'inventory' | 'status' | 'class' | 'trade' | 'journal';
export { menuNames } from './chapter-four-game';
export const tasks = ['touch-mage', 'assign-mage', 'dodge', 'head', 'chest', 'jaw', 'disarm', 'headbutt', 'knee-one', 'knee-two', 'knee-three', 'nose', 'cancel', 'sell-students', 'sell-priestesses', 'inspect-knife', 'inspect-dagger', 'inspect-axe', 'buy-axe', 'buy-clothes', 'buy-lighter', 'learn-stealth', 'learn-traveler', 'assign-grandmother', 'scaffolding', 'approach', 'closer', 'retreat', 'assign-novice', 'push-novice', 'run', 'doors', 'hold', 'slip', 'crawl', 'threshold'] as const;
export type Task = typeof tasks[number];
export type ChapterState = {
  page: number; bag: Record<Item, number>; money: number; hp: number; mp: number;
  lady: 'mage' | 'grandmother' | 'novice' | null;
  stealth: number; traveler: number; levelPoints: number;
  done: Task[]; opened: Menu[]; lastMove: Task | null; log: string[];
};
export type ChapterSave = { version: 1; current: ChapterState; history: ChapterState[] };
export type ChapterAction = { type: 'next' | 'back' | 'restart' } | { type: 'do'; task: Task } | { type: 'open'; menu: Menu };
export const ladyNames = { mage: 'Волшебница', grandmother: 'Бабушка', novice: 'Послушница' } as const;
export function has(s: ChapterState, task: Task) { return s.done.includes(task); }
export function maxHp(s: ChapterState) { return s.lady ? 840 : 420; }
export function maxMp(s: ChapterState) { return s.lady ? 340 : 170; }
export function initialChapterFive(): ChapterSave {
  const bag = Object.fromEntries(Object.keys(itemNames).map(id => [id, 0])) as Record<Item, number>;
  Object.assign(bag, { clothes: 1, club: 1, knife: 1, apple: 30, carrot: 1, meat: 20, pelt: 280, water: 1 });
  return { version: 1, history: [], current: { page: 0, bag, money: 10165, hp: 420, mp: 170, lady: null, stealth: 0, traveler: 0, levelPoints: 9, done: [], opened: [], lastMove: null, log: [] } };
}
// Each group happens within one intact book paragraph, in this order.
export const pageTasks: Partial<Record<number, readonly Task[]>> = {
  28: ['touch-mage'], 29: ['assign-mage'], 32: ['dodge', 'head', 'chest'],
  34: ['jaw', 'disarm', 'headbutt', 'knee-one', 'knee-two', 'knee-three', 'nose'],
  39: ['cancel'], 40: ['sell-students', 'sell-priestesses'], 44: ['inspect-knife', 'inspect-dagger'],
  47: ['inspect-axe'], 56: ['buy-axe'], 59: ['buy-clothes', 'buy-lighter', 'learn-stealth', 'learn-traveler'],
  61: ['assign-grandmother', 'scaffolding'], 71: ['approach'], 75: ['closer'], 78: ['retreat'],
  82: ['assign-novice', 'push-novice'], 83: ['run'], 84: ['doors'], 86: ['hold'], 91: ['slip', 'crawl', 'threshold'],
};
export const taskLabels: Record<Task, string> = {
  'touch-mage': 'Коснуться волшебницы', 'assign-mage': 'Назначить даму · волшебница', dodge: 'Отскочить от замаха', head: 'Ударить палкой по голове', chest: 'Кулаком в кирасу',
  jaw: 'Ударить в челюсть', disarm: 'Выбить меч пинком', headbutt: 'Ударить лбом', 'knee-one': 'Удар коленом · 1 / 3', 'knee-two': 'Удар коленом · 2 / 3', 'knee-three': 'Удар коленом · 3 / 3', nose: 'Кулаком в нос · первая кровь',
  cancel: 'Отказаться от дамы', 'sell-students': 'Продать 140 шкур ученикам · 2800 канис', 'sell-priestesses': 'Продать 140 шкур жрицам · 2800 канис',
  'inspect-knife': 'Осмотреть нож · урон 1–3', 'inspect-dagger': 'Осмотреть кинжал · урон 6–12', 'inspect-axe': 'Осмотреть простой топор', 'buy-axe': 'Купить топор · 9000 канис',
  'buy-clothes': 'Купить смену одежды · 1000 канис', 'buy-lighter': 'Купить зажигалку · 500 канис', 'learn-stealth': 'Изучить Скрытность · 1500 канис', 'learn-traveler': 'Изучить Путешественника · 2500 канис',
  'assign-grandmother': 'Назначить даму · бабушка', scaffolding: 'Поднять леса на крышу', approach: 'Сделать несколько шагов к алтарю', closer: 'Подойти ещё немного', retreat: 'Пятиться к выходу',
  'assign-novice': 'Назначить даму · послушница', 'push-novice': 'Столкнуть послушницу на руки', run: 'Бежать к выходу', doors: 'Потянуть дверные ручки', hold: 'Держаться за ручки · сила 68', slip: 'Выскользнуть из рук', crawl: 'Проползти к порогу', threshold: 'Ухватиться за порог · выбросить себя наружу',
};
export function pendingTasks(s: ChapterState) { return (pageTasks[s.page] ?? []).filter(task => !has(s, task)); }
export function nextRequirement(s: ChapterState) { const task = pendingTasks(s)[0]; return task ? taskLabels[task] : null; }
function perform(s: ChapterState, task: Task): ChapterState {
  if (pendingTasks(s)[0] !== task) return s;
  let changes: Partial<ChapterState> = {};
  let message = taskLabels[task];
  if (task === 'assign-mage' || task === 'assign-grandmother' || task === 'assign-novice') {
    const lady = task === 'assign-mage' ? 'mage' : task === 'assign-grandmother' ? 'grandmother' : 'novice';
    changes = { lady, hp: s.lady ? s.hp : s.hp * 2, mp: s.lady ? s.mp : s.mp * 2 };
    message = `${ladyNames[lady]} назначена дамой. Сила 34 → 68, характеристики ×2.`;
  }
  if (task === 'cancel') { changes = { lady: null, hp: Math.min(s.hp, 420), mp: Math.min(s.mp, 170) }; message = 'Назначение снято. Сила снова 34; волшебница осталась позади.'; }
  if (task === 'sell-students' || task === 'sell-priestesses') {
    if (s.bag.pelt < 140) return s;
    changes = { money: s.money + 2800, bag: { ...s.bag, pelt: s.bag.pelt - 140 } };
    message = `Продано 140 шкур по 20 канис. +2800 канис; осталось ${s.bag.pelt - 140} шкур.`;
  }
  const purchases: Partial<Record<Task, [number, Item]>> = { 'buy-axe': [9000, 'axe'], 'buy-clothes': [1000, 'clothes'], 'buy-lighter': [500, 'lighter'] };
  const purchase = purchases[task];
  if (purchase) {
    const [price, item] = purchase;
    if (s.money < price) return s;
    changes = { money: s.money - price, bag: { ...s.bag, [item]: s.bag[item] + 1 } };
    message = `${itemNames[item]} в инвентаре. −${price} канис.`;
  }
  if (task === 'learn-stealth' || task === 'learn-traveler') {
    const price = task === 'learn-stealth' ? 1500 : 2500;
    if (s.money < price || !s.levelPoints) return s;
    changes = { money: s.money - price, levelPoints: s.levelPoints - 1, [task === 'learn-stealth' ? 'stealth' : 'traveler']: 1 };
    message = `${task === 'learn-stealth' ? 'Скрытность' : 'Путешественник'} изучен · 1 ур. −${price} канис, −1 очко уровня.`;
  }
  if (task === 'nose') message = 'Первая кровь. Дуэль окончена, Уогунн побеждён.';
  if (task === 'scaffolding') message = 'Леса подняты на крышу муниципалитета. Куджо благодарен; денег за помощь Мач не берёт.';
  if (task === 'doors') message = 'Двери открыты, но прозрачные руки вновь схватили Мача сзади.';
  if (task === 'threshold') message = 'Мач за порогом храма. Руки остались внутри.';
  return { ...s, ...changes, done: [...s.done, task], lastMove: task, log: [...s.log, message] };
}
function enterPage(s: ChapterState, page: number): ChapterState {
  const next = { ...s, page, opened: [], lastMove: null };
  // The goddess bypasses the HP shield. The injury is not a regular combat defeat.
  if (page === 89) return { ...next, hp: 1, bag: { ...s.bag, clothes: Math.max(0, s.bag.clothes - 1) } };
  return next;
}
export function chapterFiveReducer(save: ChapterSave, action: ChapterAction): ChapterSave {
  const s = save.current;
  if (action.type === 'restart') return initialChapterFive();
  if (action.type === 'back') { const previous = save.history.at(-1); return previous ? { ...save, current: previous, history: save.history.slice(0, -1) } : save; }
  if (action.type === 'next') {
    if (nextRequirement(s) || s.page === paragraphs.length - 1) return save;
    return { ...save, current: enterPage(s, s.page + 1), history: [...save.history, s] };
  }
  let next = s;
  if (action.type === 'do') next = perform(s, action.task);
  if (action.type === 'open' && !s.opened.includes(action.menu)) next = { ...s, opened: [...s.opened, action.menu] };
  return next === s ? save : { ...save, current: next };
}
function validState(value: unknown): value is ChapterState {
  if (!value || typeof value !== 'object') return false;
  const s = value as ChapterState;
  const integer = (n: unknown, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
  const set = (a: unknown, allowed: readonly string[]) => Array.isArray(a) && a.length <= allowed.length && new Set(a).size === a.length && a.every(id => allowed.includes(id));
  return integer(s.page, paragraphs.length - 1) && integer(s.money, 15765) && integer(s.hp, maxHp(s)) && integer(s.mp, maxMp(s))
    && (s.lady === null || Object.hasOwn(ladyNames, s.lady)) && integer(s.stealth, 1) && integer(s.traveler, 1) && integer(s.levelPoints, 9)
    && Boolean(s.bag) && Object.keys(itemNames).every(id => integer(s.bag[id as Item], 280))
    && set(s.done, tasks) && set(s.opened, ['inventory', 'status', 'class', 'trade', 'journal'])
    && (s.lastMove === null || tasks.includes(s.lastMove)) && Array.isArray(s.log) && s.log.length <= tasks.length && s.log.every(line => typeof line === 'string' && line.length < 500);
}
export function readChapterFiveSave(value: string | null): ChapterSave {
  try {
    const save = JSON.parse(value ?? 'null') as ChapterSave;
    if (save?.version === 1 && validState(save.current) && Array.isArray(save.history) && save.history.length === save.current.page && save.history.every((s, page) => validState(s) && s.page === page)) return save;
  } catch { /* Invalid or unavailable storage starts safely. */ }
  return initialChapterFive();
}
