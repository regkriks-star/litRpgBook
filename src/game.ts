import { assign, setup } from 'xstate';
import { endings, findLine, lines, passage, speakers } from './story';

export const MAX_HP = 140;
export const MAX_MP = 20;
export const WITCH_HP = 96;
export const WITCH_MP = 8;
export const ENEMY_HP = 117;
export type Target = 'mach' | 'sayaka';
export type Action = 'attack' | 'strike' | 'bolt' | 'guard' | 'wait' | 'antidote' | 'apple';
export type GameContext = {
  hp: number; mp: number; witchHp: number; witchMp: number;
  enemyHp: number; wave: 1 | 2; turn: number;
  poison: number; witchPoison: number; apples: number; antidotes: number;
  guarding: boolean; lastAction: Action | null; lastTarget: Target;
  damage: number; enemyDamage: number;
  battleLines: string[]; history: string[]; log: string[]; endingLine: number;
};
export const freshContext = (): GameContext => ({
  hp: MAX_HP, mp: MAX_MP, witchHp: WITCH_HP, witchMp: WITCH_MP,
  enemyHp: ENEMY_HP, wave: 1, turn: 1, poison: 0, witchPoison: 0,
  apples: 3, antidotes: 3, guarding: false, lastAction: null,
  lastTarget: 'mach', damage: 0, enemyDamage: 0,
  battleLines: [], history: [], log: [], endingLine: 0,
});

type GameEvent =
  | { type: 'START' | 'NEXT' | 'RESTART' | 'RETRY' | 'CONTINUE' }
  | { type: 'ACT'; action: Action; target?: Target };

export function intent(c: GameContext) {
  let target: Target = 'mach';
  if (c.wave === 2 && !c.guarding && (c.turn <= 2 || c.turn % 2 === 0)) target = 'sayaka';
  const venom = c.turn % 2 === 1;
  return { target, title: venom ? 'Удар жалом' : 'Атака клешнями', damage: venom ? 18 : 12, poison: venom };
}

export function unavailable(c: GameContext, action: Action, target: Target = 'mach'): string | null {
  if (c.hp <= 0 || c.witchHp <= 0 || c.enemyHp <= 0) return 'Бой завершён';
  if (action === 'strike' && c.mp < 6) return 'Нужно 6 маны Мача';
  if (action === 'bolt' && c.witchMp < 8) return 'У Саяки кончилась мана';
  if (action === 'apple' && c.apples <= 0) return 'Яблоки закончились';
  if (action === 'apple' && (target === 'mach' ? c.hp === MAX_HP : c.witchHp === WITCH_HP)) return 'Здоровье уже полное';
  if (action === 'antidote' && c.antidotes <= 0) return 'Противоядие закончилось';
  if (action === 'antidote' && (target === 'mach' ? c.poison === 0 : c.witchPoison === 0)) return 'Нет отравления';
  return null;
}

export function playerAction(context: GameContext, action: Action, target: Target = 'mach'): GameContext {
  if (unavailable(context, action, target)) return context;
  const c = { ...context, guarding: false, lastAction: action, damage: 0, enemyDamage: 0, battleLines: [] as string[] };
  let message = '';
  switch (action) {
    case 'attack':
      c.enemyDamage = 39;
      message = 'Мач бьёт топором: 39 урона.';
      break;
    case 'strike':
      c.mp -= 6; c.enemyDamage = 54;
      message = 'Разящий удар: 54 урона, −6 маны.';
      break;
    case 'bolt':
      c.witchMp -= 8;
      // The opening misfire is a fixed book event, not a random penalty.
      c.hp = Math.max(0, c.hp - 12); c.damage = 12; c.lastTarget = 'mach';
      c.battleLines = passage(0);
      message = 'Болт Саяки попал в Мача: 12 урона. Скорпион не задет.';
      break;
    case 'guard':
      c.guarding = true; c.mp = Math.min(MAX_MP, c.mp + 4);
      message = 'Мач прикрывает Саяку: перехват следующего удара, −75% урона и защита от нового яда. +4 маны.';
      break;
    case 'wait':
      message = 'Мач выжидает. Скорпион получает ещё один ход.';
      break;
    case 'antidote':
      c.antidotes -= 1;
      if (target === 'mach') c.poison = 0; else c.witchPoison = 0;
      c.guarding = true;
      message = `${speakers[target]}: яд снят. Мач прикрывает отряд на этот ход.`;
      break;
    case 'apple':
      c.apples -= 1;
      if (target === 'mach') c.hp = Math.min(MAX_HP, c.hp + 40); else c.witchHp = Math.min(WITCH_HP, c.witchHp + 40);
      message = `${speakers[target]}: восстановлено до 40 здоровья.`;
      break;
  }
  c.enemyHp = Math.max(0, c.enemyHp - c.enemyDamage);
  c.log = [...c.log, message];
  if (c.enemyHp === 0 && c.wave === 1) c.battleLines = passage(6, 7);
  return c;
}

export function enemyAction(context: GameContext): GameContext {
  const c = { ...context, battleLines: [] as string[] };
  const attack = intent(c);
  const damage = c.guarding ? Math.ceil(attack.damage / 4) : attack.damage;
  if (attack.poison && !c.guarding) {
    if (attack.target === 'mach') c.poison = 3; else c.witchPoison = 3;
  }
  const heroPoison = c.poison > 0 ? 2 : 0;
  const witchPoison = c.witchPoison > 0 ? 2 : 0;
  c.hp = Math.max(0, c.hp - (attack.target === 'mach' ? damage : 0) - heroPoison);
  c.witchHp = Math.max(0, c.witchHp - (attack.target === 'sayaka' ? damage : 0) - witchPoison);
  c.poison = Math.max(0, c.poison - 1);
  c.witchPoison = Math.max(0, c.witchPoison - 1);
  c.damage = damage + (attack.target === 'mach' ? heroPoison : witchPoison);
  c.lastTarget = attack.target;
  c.turn += 1; c.guarding = false;
  c.log = [...c.log, `${attack.title} → ${speakers[attack.target]}: ${damage} урона.${heroPoison ? ' Яд: Мач −2 HP.' : ''}${witchPoison ? ' Яд: Саяка −2 HP.' : ''}`];
  if (context.wave === 1 && context.turn === 1) c.battleLines = passage(1, 5);
  if (context.wave === 2 && context.turn === 1) c.battleLines = passage(9, 12);
  return c;
}

export const stableStates = ['intro', 'chapter', 'player', 'playerDialogue', 'enemyDialogue', 'arrivalDialogue', 'victory', 'defeat', 'ending', 'complete'];
export const gameMachine = setup({
  types: { context: {} as GameContext, events: {} as GameEvent },
  actions: {
    recordLine: assign(({ context }) => ({ history: [...context.history, context.battleLines[0]] })),
    nextLine: assign({ battleLines: ({ context }) => context.battleLines.slice(1) }),
    enemyActs: assign(({ context }) => enemyAction(context)),
    start: assign(() => playerAction(freshContext(), 'bolt')),
  },
}).createMachine({
  id: 'novel', initial: 'intro', context: freshContext,
  on: { RESTART: { target: '.intro', actions: assign(() => freshContext()) } },
  states: {
    intro: { on: { START: 'chapter' } },
    chapter: { after: { 2000: { target: 'hit', actions: 'start' } } },
    player: { on: { ACT: {
      guard: ({ context, event }) => !unavailable(context, event.action, event.target),
      actions: assign(({ context, event }) => playerAction(context, event.action, event.target)), target: 'hit',
    } } },
    hit: { after: { 720: 'afterHit' } },
    afterHit: { always: [
      { guard: ({ context: c }) => c.hp <= 0 || c.witchHp <= 0, target: 'defeat' },
      { guard: ({ context }) => context.battleLines.length > 0, target: 'playerDialogue' },
      { guard: ({ context: c }) => c.enemyHp === 0 && c.wave === 1, target: 'arrivalDialogue', actions: assign(({ context }) => ({
        wave: 2 as const, enemyHp: ENEMY_HP, turn: 1, lastAction: null,
        battleLines: passage(8), log: [...context.log, 'Первый скорпион повержен. Второй подкрадывается к Саяке!'],
      })) },
      { guard: ({ context }) => context.enemyHp === 0, target: 'victory' },
      { target: 'enemy', actions: 'enemyActs' },
    ] },
    playerDialogue: {
      entry: 'recordLine', on: { NEXT: [
        { guard: ({ context }) => context.battleLines.length > 1, target: 'playerDialogue', reenter: true, actions: 'nextLine' },
        { target: 'afterHit', actions: 'nextLine' },
      ] },
    },
    arrivalDialogue: {
      entry: 'recordLine', on: { NEXT: [
        { guard: ({ context }) => context.battleLines.length > 1, target: 'arrivalDialogue', reenter: true, actions: 'nextLine' },
        { target: 'enemy', actions: ['nextLine', 'enemyActs'] },
      ] },
    },
    enemy: { after: { 850: 'afterEnemy' } },
    afterEnemy: { always: [
      { guard: ({ context: c }) => c.hp <= 0 || c.witchHp <= 0, target: 'defeat' },
      { guard: ({ context }) => context.battleLines.length > 0, target: 'enemyDialogue' },
      { target: 'player' },
    ] },
    enemyDialogue: {
      entry: 'recordLine', on: { NEXT: [
        { guard: ({ context }) => context.battleLines.length > 1, target: 'enemyDialogue', reenter: true, actions: 'nextLine' },
        { target: 'afterEnemy', actions: 'nextLine' },
      ] },
    },
    defeat: { on: { RETRY: { target: 'hit', actions: 'start' } } },
    victory: { on: { CONTINUE: 'ending' } },
    ending: {
      entry: assign(({ context }) => ({ history: [...context.history, endings[context.endingLine]] })),
      on: { NEXT: [
        { guard: ({ context }) => context.endingLine >= endings.length - 1, target: 'complete' },
        { target: 'ending', reenter: true, actions: assign({ endingLine: ({ context }) => context.endingLine + 1 }) },
      ] },
    },
    complete: {},
  },
});

export const SAVE_KEY = 'lazy-courage.save.v3';

export function migrateV2Save(value: unknown): unknown {
  if (!value || typeof value !== 'object' || !('context' in value)) return;
  const c = value.context as GameContext | null;
  if (!c || ![c.battleLines, c.history].every(list => Array.isArray(list) && list.every(id => typeof id === 'string'))) return;
  // V2 counted each author interjection as a separate page.
  const oldEndings = [
    'p13-0-0', 'p13-0-0', 'p14-0-0', 'p14-0-0', 'p15-0-0', 'p16-0-0',
    'p17-0-0', 'p18-0-0', 'p18-0-1', 'p19-0-0', 'p19-0-1', 'p20-0-0',
    'p21-0-0', 'p22-0-0', 'p22-0-0', 'p23-0-0', 'p23-0-0', 'p23-0-0',
    'p23-0-0', 'p24-0-0', 'p24-0-0', 'p24-0-0', 'p25-0-0', 'p25-0-0',
  ];
  const merge = (ids: string[]) => ids.map(id => id.replace(/^(p\d+)-[12]-\d+$/, '$1-0-0'))
    .filter((id, i, all) => i === 0 || id !== all[i - 1]);
  const snapshot = { ...value, context: {
    ...c, battleLines: merge(c.battleLines), history: merge(c.history),
    endingLine: endings.indexOf(oldEndings[c.endingLine]),
  } };
  return validSave(snapshot) ? snapshot : undefined;
}

export function validSave(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const s = value as { value?: unknown; context?: unknown; status?: unknown };
  if (typeof s.value !== 'string' || !stableStates.includes(s.value) || s.status !== 'active') return false;
  if (!s.context || typeof s.context !== 'object') return false;
  const c = s.context as GameContext;
  const limits: [keyof GameContext, number][] = [
    ['hp', MAX_HP], ['mp', MAX_MP], ['witchHp', WITCH_HP], ['witchMp', WITCH_MP],
    ['enemyHp', ENEMY_HP], ['turn', 10000], ['poison', 3], ['witchPoison', 3],
    ['apples', 3], ['antidotes', 3], ['damage', 100], ['enemyDamage', 100],
    ['endingLine', endings.length - 1],
  ];
  if (!limits.every(([key, max]) => Number.isInteger(c[key]) && Number(c[key]) >= 0 && Number(c[key]) <= max)) return false;
  const knownLines = new Set(lines.map(line => line.id));
  if (![c.battleLines, c.history].every(list => Array.isArray(list) && list.length <= lines.length && list.every(id => knownLines.has(id)))) return false;
  if (s.value.endsWith('Dialogue') && c.battleLines.length === 0) return false;
  if (s.value === 'player' && (c.hp === 0 || c.witchHp === 0 || c.enemyHp === 0)) return false;
  return [1, 2].includes(c.wave) && c.turn > 0 && typeof c.guarding === 'boolean'
    && ['mach', 'sayaka'].includes(c.lastTarget)
    && [null, 'attack', 'strike', 'bolt', 'guard', 'wait', 'antidote', 'apple'].includes(c.lastAction)
    && Array.isArray(c.log) && c.log.length < 20000 && c.log.every(line => typeof line === 'string' && line.length < 1000);
}

export function currentLine(c: GameContext, phase: string) {
  if (phase === 'ending') return findLine(endings[c.endingLine]);
  return phase.endsWith('Dialogue') ? findLine(c.battleLines[0]) : null;
}
