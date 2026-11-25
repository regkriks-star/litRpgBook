import paragraphs from './chapter-four.json' with { type: 'json' };
import { itemNames as previousItems, type Item as PreviousItem } from './chapter-three-game';

export const CHAPTER_FOUR_SAVE = 'lazy-courage:chapter-four:v1';
export const newItemNames = { meat: 'Крольчатина', pelt: 'Кроличья шкурка', water: 'Фляга воды', beer: 'Кружка пива', dinner: 'Сытная похлёбка', roast: 'Жареная нога', peeledApple: 'Очищенное яблоко', slicedCarrot: 'Нарезанная морковь' } as const;
export type NewItem = keyof typeof newItemNames;
export type Item = PreviousItem | NewItem;
export const itemNames: Record<Item, string> = { ...previousItems, ...newItemNames };
export type Menu = 'inventory' | 'status' | 'class' | 'trade' | 'journal';
export const menuNames: Record<Menu, string> = { inventory: 'Инвентарь', status: 'Статус', class: 'Класс и ремесла', trade: 'Торговля', journal: 'Журнал' };
const tasks = ['peel', 'slice', 'test', 'knife-attack', 'aside', 'detach', 'load', 'drive', 'unload', 'farm-dinner', 'strike', 'critical', 'loot-one', 'loot-two', 'day', 'herbs', 'crystals', 'hides', 'meat', 'order', 'dinner', 'roast', 'beer', 'refuse', 'thanks'] as const;
export type Task = typeof tasks[number];
export type ChapterState = {
  page: number; bag: Record<Item, number>; money: number; hp: number; mp: number;
  level: number; classLevel: number; levelPoints: number; classPoints: number;
  strength: number; stamina: number; speed: number; intelligence: number; luck: number; freePoints: number;
  strike: number; thoughts: number; oneHanded: number; hunter: number; cooking: number;
  lady: boolean; mouse: 'cat' | 'hand' | 'pocket' | 'escaped'; hunts: number;
  done: Task[]; opened: Menu[]; lastMove: Task | 'mouse' | 'assign' | 'hunt' | null;
  xp: number; classXp: number; log: string[];
};
export type ChapterSave = { version: 1; current: ChapterState; history: ChapterState[] };
export type ChapterAction = { type: 'next' | 'back' | 'restart' | 'rescue-mouse' | 'pocket-mouse' | 'assign' | 'hunt' | 'cook' }
  | { type: 'do'; task: Task } | { type: 'open'; menu: Menu } | { type: 'use'; item: Item }
  | { type: 'allocate'; stat: 'strength' | 'stamina' | 'speed' | 'intelligence' };

export function initialChapterFour(): ChapterSave {
  const bag = Object.fromEntries(Object.keys(itemNames).map(id => [id, 0])) as Record<Item, number>;
  Object.assign(bag, { clothes: 1, club: 1, knife: 1, apple: 30, carrot: 2 });
  return { version: 1, history: [], current: {
    page: 0, bag, money: 0, hp: 160, mp: 40, level: 3, classLevel: 3, levelPoints: 2, classPoints: 0,
    strength: 20, stamina: 4, speed: 5, intelligence: 2, luck: 5, freePoints: 0,
    strike: 2, thoughts: 1, oneHanded: 0, hunter: 1, cooking: 0,
    lady: false, mouse: 'cat', hunts: 0, done: [], opened: [], lastMove: null, xp: 0, classXp: 0, log: [],
  } };
}
export function maxHp(s: ChapterState) { return (s.level === 11 ? 420 : 160) * (s.lady ? 2 : 1); }
export function maxMp(s: ChapterState) { return (s.level === 11 ? 170 : 40) * (s.lady ? 2 : 1); }
export function has(s: ChapterState, task: Task) { return s.done.includes(task); }
export const statTargets = { strength: 30, stamina: 17, speed: 19, intelligence: 5 } as const;
export const statNames = { strength: 'Сила', stamina: 'Выносливость', speed: 'Скорость', intelligence: 'Интеллект' } as const;
export function statBonus(s: ChapterState, stat: keyof typeof statTargets | 'luck') {
  const bonuses = s.level === 11 ? { strength: 4, stamina: 3, speed: 1, intelligence: 1, luck: 4 } : { strength: 0, stamina: 0, speed: 1, intelligence: 0, luck: 3 };
  return bonuses[stat];
}
export function effectiveStat(s: ChapterState, stat: keyof typeof statTargets | 'luck') {
  return (s[stat] + statBonus(s, stat)) * (s.lady ? 2 : 1);
}

export function nextRequirement(s: ChapterState): string | null {
  if (s.page === 1 && !(['peel', 'slice', 'test', 'knife-attack'] as Task[]).every(task => has(s, task))) return 'Испытайте нож с едой, здоровьем и в бою';
  if (s.page === 12 && !has(s, 'aside')) return 'Отойдите от прохода к воротам';
  if (s.page === 16 && !has(s, 'load')) return has(s, 'detach') ? 'Положите Ичиро в повозку' : 'Снимите Ичиро со столба';
  if (s.page === 17 && !has(s, 'drive')) return 'Возьмите вожжи и направьте повозку к деревне';
  if (s.page === 23 && !has(s, 'unload')) return 'Отнесите Ичиро в дом';
  if (s.page === 24 && !has(s, 'farm-dinner')) return 'Поужинайте у Оомы';
  if (s.page === 24 && !s.cooking) return 'Изучите Кулинарию у Оомы';
  if (s.page === 25 && s.mouse !== 'pocket') return s.mouse === 'cat' ? 'Перехватите мышь у кота' : 'Посадите мышь в нагрудный карман';
  if (s.page === 27 && !s.lady) return 'Назначьте мышь своей дамой';
  if (s.page === 29 && !s.opened.includes('status')) return 'Откройте Статус и посмотрите усиление';
  if (s.page === 30 && !has(s, 'strike')) return 'Примените Разящий удар';
  if (s.page === 32 && !has(s, 'loot-one')) return 'Соберите добычу первого кролика';
  if (s.page === 33 && !has(s, 'critical')) return 'Атакуйте следующего кролика дубинкой';
  if (s.page === 35 && !has(s, 'loot-two')) return 'Соберите добычу второго кролика';
  if (s.page === 38 && !has(s, 'day')) return 'Продолжите дневную охоту';
  if (s.page === 38 && s.freePoints) return 'Распределите характеристики после охоты';
  if (s.page === 43 && (!has(s, 'herbs') || !has(s, 'crystals'))) return 'Продайте траву и ядра аптекарше';
  if (s.page === 46 && !has(s, 'hides')) return 'Продайте Сатсубаки 30 шкурок';
  if (s.page === 47 && !has(s, 'meat')) return 'Продайте часть мяса, сохранив запас';
  if (s.page === 48 && !has(s, 'order')) return 'Закажите ужин и пиво';
  if (s.page === 48 && (!has(s, 'dinner') || !has(s, 'roast') || !has(s, 'beer'))) return 'Поешьте и выпейте пиво из инвентаря';
  if (s.page === 50 && !s.opened.includes('status')) return 'Откройте Статус';
  if (s.page === 72 && !has(s, 'refuse')) return 'Завершите воспоминание: Отказаться от дамы';
  if (s.page === 84 && !has(s, 'thanks')) return 'Оплатите пирушку и чаевые трактирщику';
  return null;
}

function enterPage(s: ChapterState, page: number): ChapterState {
  const next = { ...s, page, opened: [], lastMove: null };
  // The book returns to town, then recalls the end of the hunt in paragraph 72.
  // Present-time status is already unboosted; the refusal is played in that recollection.
  if (page === 39) return { ...next, lady: false, mouse: 'escaped' as const, hp: 420, mp: 170 };
  return next;
}
function finish(s: ChapterState, task: Task, changes: Partial<ChapterState> = {}, message?: string): ChapterState {
  return { ...s, ...changes, done: [...s.done, task], lastMove: task, log: message ? [...s.log, message] : s.log };
}

function perform(s: ChapterState, task: Task): ChapterState {
  if (has(s, task)) return s;
  if (s.page === 1 && s.bag.knife) {
    if (task === 'peel' && s.bag.apple) return finish(s, task, { bag: { ...s.bag, apple: s.bag.apple - 1, peeledApple: 1 } }, 'Яблоко очищено ножом.');
    if (task === 'slice' && s.bag.carrot) return finish(s, task, { bag: { ...s.bag, carrot: s.bag.carrot - 1, slicedCarrot: 1 } }, 'Морковь нарезана ножом.');
    if (task === 'test') return finish(s, task, { hp: s.hp - 3 }, 'Проверка ножа: −3 HP.');
    if (task === 'knife-attack' && (['peel', 'slice', 'test'] as Task[]).every(id => has(s, id))) return finish(s, task, {}, 'Система: Рыцарь Прекрасной Дамы не может использовать простой нож в бою. Нож возвращён в инвентарь, кролик не получил урона.');
  }
  const pageTasks: Partial<Record<Task, number>> = { aside: 12, detach: 16, drive: 17, unload: 23, 'farm-dinner': 24 };
  const taskMessages: Partial<Record<Task, string>> = { aside: 'Мач отошёл от ворот. Девушки могут пройти в город.', detach: 'Ичиро снят со столба; Мач держит его на руках.', drive: 'Мач взял вожжи. Повозка едет из Тантрума к деревне.', unload: 'Мач отнёс спящего Ичиро в дом.', 'farm-dinner': 'Сытный ужин у Оомы. Здоровье и мана восстановлены.' };
  if (pageTasks[task] === s.page) return finish(s, task, task === 'farm-dinner' ? { hp: maxHp(s), mp: maxMp(s) } : {}, taskMessages[task]);
  if (task === 'load' && s.page === 16 && has(s, 'detach')) return finish(s, task, {}, 'Ичиро уложен в кузов повозки рядом с дочками.');
  if ((task === 'strike' && s.page === 30 || task === 'critical' && s.page === 33) && s.lady) {
    const strike = task === 'strike';
    const xp = strike ? 9 : 15, classXp = strike ? 11 : 17;
    return finish(s, task, { xp: s.xp + xp, classXp: s.classXp + classXp }, `${strike ? 'Разящий удар: 58' : 'Критический удар: 72'} ед. урона. Кролик ${strike ? '1' : '2'}-го уровня убит! +${xp} опыта, +${classXp} опыта класса.`);
  }
  if (task === 'loot-one' && s.page === 32 && has(s, 'strike') || task === 'loot-two' && s.page === 35 && has(s, 'critical')) return finish(s, task, { bag: { ...s.bag, herb: s.bag.herb + 1, crystal: s.bag.crystal + 1, meat: s.bag.meat + 1, pelt: s.bag.pelt + 1 } }, 'Собраны санка, ядро, крольчатина и шкурка.');
  if (task === 'day' && s.page === 38 && s.hunts === 3) return finish(s, task, {
    level: 11, classLevel: 10, levelPoints: 9, classPoints: 0, freePoints: 40,
    strike: 4, thoughts: 2, oneHanded: 5, hunter: 15, hp: 840, mp: 340,
    bag: { ...s.bag, herb: 2247, crystal: 2247, pelt: 310, meat: 120, water: 1 },
  }, 'Итог дня: уровень 11, класс 10, Охотник 15, Одноручное оружие 5. Добыча: 2247 санки, 2247 ядер, 310 шкур. Мышь выросла до уровня 63.');
  if (s.page === 43 && (task === 'herbs' || task === 'crystals')) {
    const item = task === 'herbs' ? 'herb' : 'crystal';
    if (!s.bag[item]) return s;
    const income = s.bag[item] * (item === 'herb' ? 4 : 1);
    return finish(s, task, { money: s.money + income, bag: { ...s.bag, [item]: 0 } }, `${itemNames[item]}: продано ${s.bag[item]}, +${income} канис.`);
  }
  if (task === 'hides' && s.page === 46 && s.bag.pelt >= 30) return finish(s, task, { money: s.money + 1500, bag: { ...s.bag, pelt: s.bag.pelt - 30 } }, 'Продано 30 шкур за 1500 канис. У охотника больше нет свободных денег; 280 шкур остаются.');
  if (task === 'meat' && s.page === 47 && s.bag.meat >= 100) return finish(s, task, { money: s.money + 2800, bag: { ...s.bag, meat: s.bag.meat - 100 } }, 'Продана партия мяса за 2800 канис. Оставлен запас еды и воды.');
  if (task === 'order' && s.page === 48 && s.money >= 70) return finish(s, task, { money: s.money - 70, bag: { ...s.bag, dinner: 1, roast: 1, beer: 3 } }, 'Заказаны похлёбка, жареная нога и три кружки пива. −70 канис.');
  if (task === 'refuse' && s.page === 72) return finish(s, task, { lady: false }, 'Воспоминание: мышь 63-го уровня убежала. Способность «Отказаться от дамы» снимает удвоение характеристик.');
  if (task === 'thanks' && s.page === 84 && s.money >= 5300) return finish(s, task, { money: s.money - 5300 }, 'Пирушка для стражи: 5000 канис. Чаевые: 300. Осталось 10165 канис.');
  return s;
}

export function chapterFourReducer(save: ChapterSave, action: ChapterAction): ChapterSave {
  const s = save.current;
  if (action.type === 'restart') return initialChapterFour();
  if (action.type === 'back') {
    const previous = save.history.at(-1);
    return previous ? { ...save, current: previous, history: save.history.slice(0, -1) } : save;
  }
  if (action.type === 'next') {
    if (nextRequirement(s) || s.page === paragraphs.length - 1) return save;
    return { ...save, current: enterPage(s, s.page + 1), history: [...save.history, s] };
  }
  let next = s;
  if (action.type === 'do') next = perform(s, action.task);
  if (action.type === 'open' && !s.opened.includes(action.menu)) next = { ...s, opened: [...s.opened, action.menu] };
  if (action.type === 'rescue-mouse' && s.page === 25 && s.mouse === 'cat') next = { ...s, mouse: 'hand', lastMove: 'mouse', log: [...s.log, 'Кот выронил мышь. Мач перехватил её на лету.'] };
  if (action.type === 'pocket-mouse' && s.page === 25 && s.mouse === 'hand') next = { ...s, mouse: 'pocket', lastMove: 'mouse', log: [...s.log, 'Живая мышь посажена в нагрудный карман жилетки.'] };
  if (action.type === 'assign' && s.page === 27 && s.mouse === 'pocket' && !s.lady) next = { ...s, lady: true, hp: maxHp(s) * 2, mp: maxMp(s) * 2, lastMove: 'assign', log: [...s.log, 'Мышь назначена дамой. Все характеристики удвоены, восстановление HP и MP ускорено.'] };
  if (action.type === 'cook' && s.page === 24 && has(s, 'farm-dinner') && !s.cooking && s.levelPoints) next = { ...s, cooking: 1, levelPoints: s.levelPoints - 1, log: [...s.log, 'Оома бесплатно обучила Кулинарии. Потрачено 1 очко уровня.'] };
  if (action.type === 'hunt' && s.page === 38 && s.hunts < 3 && !has(s, 'day')) next = { ...s, hunts: s.hunts + 1, lastMove: 'hunt', log: [...s.log, `Быстрая охота: кролик побеждён одним ударом. Серия побед: ${Math.min(30, 2 + (s.hunts + 1) * 10)} / 30.`] };
  if (action.type === 'allocate' && s.page === 38 && s.freePoints && has(s, 'day')) {
    const amount = statTargets[action.stat] - s[action.stat];
    if (amount > 0 && s.freePoints >= amount) next = { ...s, [action.stat]: statTargets[action.stat], freePoints: s.freePoints - amount };
  }
  if (action.type === 'use' && s.page === 48 && s.bag[action.item] > 0 && ['dinner', 'roast', 'beer'].includes(action.item)) {
    const item = action.item as 'dinner' | 'roast' | 'beer';
    const bag = { ...s.bag, [item]: s.bag[item] - 1 };
    next = { ...s, bag, hp: maxHp(s), lastMove: item, done: bag[item] ? s.done : [...s.done, item], log: [...s.log, `${itemNames[item]}: ${item === 'beer' ? 'выпито' : 'съедено'}.`] };
  }
  return next === s ? save : { ...save, current: next };
}

function validState(value: unknown): value is ChapterState {
  if (!value || typeof value !== 'object') return false;
  const s = value as ChapterState;
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  const limits = { page: 107, money: 15535, hp: 840, mp: 340, level: 11, classLevel: 10, levelPoints: 9, classPoints: 0, strength: 30, stamina: 17, speed: 19, intelligence: 5, luck: 5, freePoints: 40, strike: 4, thoughts: 2, oneHanded: 5, hunter: 15, cooking: 1, hunts: 3, xp: 24, classXp: 28 };
  const arrayOf = (a: unknown, allowed: readonly string[]) => Array.isArray(a) && a.length <= allowed.length && new Set(a).size === a.length && a.every(id => allowed.includes(id));
  return Object.entries(limits).every(([key, max]) => integer(s[key as keyof typeof limits], max))
    && s.hp <= maxHp(s) && s.mp <= maxMp(s) && typeof s.lady === 'boolean'
    && ['cat', 'hand', 'pocket', 'escaped'].includes(s.mouse)
    && Boolean(s.bag) && Object.keys(itemNames).every(id => integer(s.bag[id as Item], 2247))
    && arrayOf(s.done, tasks) && arrayOf(s.opened, Object.keys(menuNames))
    && (s.lastMove === null || [...tasks, 'mouse', 'assign', 'hunt'].includes(s.lastMove))
    && Array.isArray(s.log) && s.log.length < 80 && s.log.every(line => typeof line === 'string' && line.length < 500);
}
export function readChapterFourSave(value: string | null): ChapterSave {
  try {
    const save = JSON.parse(value ?? 'null') as ChapterSave;
    if (save?.version === 1 && validState(save.current) && Array.isArray(save.history) && save.history.length === save.current.page
      && save.history.every((s, page) => validState(s) && s.page === page)) return save;
  } catch { /* Start safely if storage is unavailable or malformed. */ }
  return initialChapterFour();
}
