import { gameSceneVariant } from './scene-replay';
import SceneObject, { SceneFrame, SceneScope } from './SceneObject';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Backpack, BookOpen, Coins, RotateCcw, Shield, UserRound, X } from 'lucide-react';
import BookText from './BookText';
import ReaderSettings from './ReaderSettings';
import { HealthMeter, ItemIcon } from './ChapterTwoMenus';
import ChapterFiveArt, { chapterFiveScene, FiveHero, FiveSprite } from './ChapterFiveArt';
import { FourSprite } from './ChapterFourArt';
import { assetUrl } from './assets';
import paragraphs from './chapter-five.json' with { type: 'json' };
import { CHAPTER_FIVE_SAVE, chapterFiveReducer, has, initialChapterFive, itemNames, ladyNames, maxHp, maxMp, menuNames, nextRequirement, pendingTasks, readChapterFiveSave, taskLabels, type ChapterAction, type ChapterSave, type ChapterState, type Item, type Menu, type Task } from './chapter-five-game';
import './chapter-two.css';
import './chapter-three.css';
import './chapter-four.css';
import './chapter-five.css';

const menuIcons = { inventory: Backpack, status: UserRound, class: Shield, trade: Coins, journal: BookOpen };
const speakers: Record<number, string> = {
  0: 'Мач Крайм', 2: 'Секундант', 5: 'Уогунн Кенхельм', 6: 'Мач Крайм', 7: 'Уогунн Кенхельм', 9: 'Мач Крайм', 11: 'Уогунн Кенхельм', 13: 'Мач Крайм', 15: 'Уогунн Кенхельм', 17: 'Мач Крайм', 19: 'Мач Крайм', 22: 'Парень из толпы', 24: 'Мач Крайм', 25: 'Толпа', 26: 'Толпа', 27: 'Мими', 28: 'Мач Крайм', 29: 'Мач Крайм', 31: 'Мач Крайм', 37: 'Мач Крайм',
  47: 'Система · предмет', 48: 'Система · предмет', 49: 'Система · предмет', 50: 'Система · предмет', 52: 'Мач Крайм', 53: 'Рыжий торговец', 54: 'Мач Крайм', 55: 'Рыжий торговец', 64: 'Жрица-проводница', 69: 'Мач Крайм', 70: 'Старшая жрица Хао', 72: 'Мач Крайм', 74: 'Датарис', 76: 'Мач Крайм', 77: 'Датарис', 78: 'Мач Крайм', 79: 'Датарис', 80: 'Мач Крайм', 81: 'Датарис', 85: 'Датарис', 87: 'Датарис', 89: 'Мач Крайм', 93: 'Волшебница',
};
type MenuProps = { state: ChapterState; dispatch: (action: ChapterAction) => void };
function TaskButton({ state, dispatch, task }: MenuProps & { task: Task }) {
  const done = has(state, task);
  return <SceneObject id="ChapterFive-primary-button-1" kind="control"><button className="primary-button" data-task={task} disabled={done || pendingTasks(state)[0] !== task} onClick={() => dispatch({ type: 'do', task })}>{taskLabels[task]}{done && ' ✓'}</button></SceneObject>;
}
function Inventory({ state: s }: MenuProps) {
  const [selected, setSelected] = useState<Item | null>(null);
  const items = (Object.keys(itemNames) as Item[]).filter(id => s.bag[id]);
  return <SceneObject id="ChapterFive-chapter-inventory-1" kind="group"><div className="chapter-inventory c3-inventory"><SceneObject id="ChapterFive-inventory-character-1" kind="group"><div className="inventory-character"><FiveHero state={s} /><span>{s.page >= 89 ? 'Запасная одежда в сумке' : 'Одежда Хатико'}</span><HealthMeter value={s.hp} max={maxHp(s)} name="Здоровье Мача" /></div></SceneObject><SceneObject id="ChapterFive-inventory-storage-1" kind="group"><div className="inventory-storage">
    <SceneObject id="ChapterFive-inventory-hint-1" kind="group"><p className="inventory-hint">100 ячеек · нажмите предмет для осмотра · {s.money} канис.</p></SceneObject><SceneObject id="ChapterFive-inventory-grid-1" kind="group"><div className="inventory-grid" role="group" aria-label="100 ячеек инвентаря" tabIndex={0}>{Array.from({ length: 100 }, (_, i) => {
      const item = items[i];
      return item ? <SceneObject id="ChapterFive-inventory-slot-1" key={i} instanceKey={i} kind="control"><button key={i} className={`inventory-slot ${selected === item ? 'selected' : ''}`} aria-label={`${itemNames[item]}: ${s.bag[item]}`} onClick={() => setSelected(item)}><ItemIcon item={item} /><b>{s.bag[item]}</b></button></SceneObject> : <SceneObject id="ChapterFive-inventory-slot-2" key={i} instanceKey={i} kind="group"><span key={i} className="inventory-slot empty" aria-hidden="true" /></SceneObject>;
    })}</div></SceneObject><SceneObject id="ChapterFive-inventory-description-1" kind="group"><p className="inventory-description" role="status">{selected ? `${itemNames[selected]}${selected === 'axe' ? ' · железо, дерево · урон 3–9 · плотницкий инструмент, допустимый для рыцаря' : selected === 'clothes' ? ` · ${s.bag.clothes} комплект(а)` : ''}` : 'Выберите предмет'}</p></SceneObject>
  </div></SceneObject></div></SceneObject>;
}
function Status({ state: s }: MenuProps) {
  return <SceneObject id="ChapterFive-c3-stats-1" kind="group"><div className="c3-stats"><section><h3>Мач Крайм</h3><p>Человек · Рыцарь Прекрасной Дамы</p><p>Уровень 11 · Уровень класса 10</p><p>HP {s.hp} / {maxHp(s)} · MP {s.mp} / {maxMp(s)}</p><p>Очки уровня: {s.levelPoints} · Очки класса: 0</p><p>Дама: {s.lady ? ladyNames[s.lady] : 'не назначена'}</p><p>Канис: {s.money}</p>{s.page >= 89 && <p>Божественные царапины обходят защиту HP. Герой тяжело ранен; это не обычная атака.</p>}</section><section><h3>Характеристики</h3>{[['Сила', 34], ['Выносливость', 20], ['Скорость', 20], ['Интеллект', 6], ['Удача', 9]].map(([label, value]) => <p key={label}>{label}: <b>{Number(value) * (s.lady ? 2 : 1)}</b></p>)}{s.lady && <SceneObject id="ChapterFive-c4-buff-note-1" kind="group"><p className="c4-buff-note">Все характеристики ×2. Восстановление HP и MP ускорено.</p></SceneObject>}<p>Одноручное оружие · 5 ур.</p><p>Охотник · 15 ур. · Кулинария · 1 ур.</p><p>Скрытность · {s.stealth} ур. · Путешественник · {s.traveler} ур.</p></section></div></SceneObject>;
}
function ClassMenu({ state: s, dispatch }: MenuProps) {
  const task = pendingTasks(s)[0];
  const ability = task && ['assign-mage', 'assign-grandmother', 'assign-novice', 'cancel'].includes(task);
  let art: 'chapterFiveDuel' | 'chapterFiveCast' = 'chapterFiveDuel';
  let frame = 7;
  if (s.page === 61 || s.lady === 'grandmother') { art = 'chapterFiveCast'; frame = s.lady === 'grandmother' ? 5 : 4; }
  if (s.page >= 82) { art = 'chapterFiveCast'; frame = s.lady === 'novice' ? 3 : 2; }
  return <SceneObject id="ChapterFive-c4-class-1" kind="group"><div className="c4-class"><h3>Рыцарь Прекрасной Дамы</h3><SceneObject id="ChapterFive-c4-lady-card-1" kind="group"><div className="c4-lady-card">{art === 'chapterFiveDuel' && !s.lady ? <FourSprite art="tavernCast" frame={0} label="Волшебница до назначения дамой" /> : <FiveSprite art={art} frame={frame} label="Доступная цель классового умения" />}<div><p>Дама: {s.lady ? ladyNames[s.lady] : 'не назначена'}</p>{ability && <TaskButton state={s} dispatch={dispatch} task={task} />}</div></div></SceneObject><p>Разящий удар · 4 ур. · Мысли о Ней · 2 ур.</p><p>Назначение дамы удваивает характеристики героя и преображает выбранную даму.</p><h3>Навыки и ремесла</h3><p>Скрытность · {s.stealth ? 'изучена · 1 ур.' : 'не изучена'}</p><p>Путешественник · {s.traveler ? 'изучен · 1 ур. · скрытый лагерь и отметки на миникарте' : 'не изучен'}</p><p>Охотник · 15 ур. · Кулинария · 1 ур.</p></div></SceneObject>;
}
function Trade({ state: s, dispatch }: MenuProps) {
  const offer = (task: Task, item?: Item) => <SceneObject id="ChapterFive-c5-offer-1" key={task} kind="group"><div className="c5-offer" key={task}>{item && <ItemIcon item={item} />}<TaskButton state={s} dispatch={dispatch} task={task} /></div></SceneObject>;
  return <SceneObject id="ChapterFive-c3-trade-1" kind="group"><div className="c3-trade"><SceneObject id="ChapterFive-c3-money-1" kind="group"><p className="c3-money" role="status">Канис: <b>{s.money}</b></p></SceneObject>
    {s.page === 40 && <><h3>Западные ворота · шкуры по 20 канис</h3>{offer('sell-students', 'pelt')}{offer('sell-priestesses', 'pelt')}<p>Шкур осталось: {s.bag.pelt}</p></>}
    {s.page >= 41 && s.page <= 58 && <><h3>Оружейный прилавок</h3>{s.page === 44 && <>{offer('inspect-knife')}{has(s, 'inspect-knife') && <p>Нож · 300 канис · урон 1–3</p>}{offer('inspect-dagger')}{has(s, 'inspect-dagger') && <p>Кинжал · 28000 канис · урон 6–12</p>}</>}
      {s.page >= 47 && <SceneObject id="ChapterFive-c5-axe-card-1" kind="group"><div className="c5-axe-card"><ItemIcon item="axe" /><div>{s.page === 47 && offer('inspect-axe')}{(has(s, 'inspect-axe') || s.page > 47) && <>{[47, 48, 49, 50].map(page => <p key={page} aria-current={s.page === page ? 'true' : undefined}><BookText runs={paragraphs[page]} /></p>)}<p>Цена: 9000 канис</p></>}</div></div></SceneObject>}
      {s.page === 56 && offer('buy-axe', 'axe')}{s.page >= 53 && <p>Навык Торговли: 10000 канис. В этой главе Мач его не покупает.</p>}</>}
    {s.page === 59 && <><h3>Запас снаряжения и обучение</h3>{offer('buy-clothes', 'clothes')}{offer('buy-lighter', 'lighter')}{offer('learn-stealth')}{offer('learn-traveler')}<p>Обучение расходует одно очко уровня на каждый навык.</p></>}
    {(s.page < 40 || s.page > 59) && <p>Здесь нет открытого прилавка.</p>}
  </div></SceneObject>;
}
function load() { try { return readChapterFiveSave(localStorage.getItem(CHAPTER_FIVE_SAVE)); } catch { return initialChapterFive(); } }
export default function ChapterFive({ onContents, preview }: { onContents: () => void; preview?: { save: ChapterSave; menu?: Menu } }) {
  const [save, dispatch] = useReducer(chapterFiveReducer, undefined, () => preview?.save ?? load());
  const s = save.current;
  const [menu, setMenu] = useState<Menu | null>(preview?.menu ?? null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [restart, setRestart] = useState(false);
  const text = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const requirement = nextRequirement(s);
  const task = pendingTasks(s)[0];
  const scene = chapterFiveScene(s.page, has(s, 'threshold'));
  const last = s.page === paragraphs.length - 1;
  useEffect(() => { if (preview) return; try { localStorage.setItem(CHAPTER_FIVE_SAVE, JSON.stringify(save)); setSaveFailed(false); } catch { setSaveFailed(true); } }, [save]);
  useEffect(() => { text.current?.scrollTo(0, 0); setMenu(preview?.menu ?? null); setRestart(false); }, [s.page]);
  useEffect(() => { if (restart) { dialog.current?.showModal(); cancel.current?.focus(); } }, [restart]);
  useEffect(() => {
    const portrait = matchMedia('(orientation: portrait) and (max-width: 950px)');
    const rotate = () => { if (portrait.matches) { setRestart(false); setMenu(null); } };
    portrait.addEventListener('change', rotate); return () => portrait.removeEventListener('change', rotate);
  }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenu(null); setRestart(false); return; }
      if (menu || restart || e.repeat || !(e.target instanceof HTMLElement) || e.target.closest('input, textarea, select, dialog')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); dispatch({ type: 'next' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); dispatch({ type: 'back' }); }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, [menu, restart]);
  function openMenu(id: Menu) { setMenu(id); dispatch({ type: 'open', menu: id }); }
  let suggested: Menu | null = null;
  if (task?.startsWith('assign-') || task === 'cancel') suggested = 'class';
  if (task?.startsWith('sell-') || task?.startsWith('inspect-') || task?.startsWith('buy-') || task?.startsWith('learn-')) suggested = 'trade';
  const menus: Menu[] = ['inventory', 'status', 'class'];
  if (s.page >= 40 && s.page <= 59) menus.push('trade');
  return <SceneFrame chapter={5} frame={s.page} variant={gameSceneVariant(5, s)}><main className={`stage prologue-reader reader-surface chapter-two chapter-three chapter-four chapter-five c5-${scene.id} ${menu ? 'menu-open' : ''}`} aria-label="Глава 5">
    <figure className="prologue-illustration"><img src={assetUrl(scene.art)} alt={scene.name} fetchPriority="high" /></figure><div className="atmosphere" aria-hidden="true" />
    <SceneScope id="excluded-game-header" disabled><header className="game-header reader-header"><div className="reader-toolbar" role="navigation" aria-label="Меню игры"><button className="icon-button" aria-label="Оглавление" title="Оглавление" onClick={onContents}><BookOpen size={18} /></button><div className="chapter-header-actions"><button className="icon-button" aria-label="Журнал главы 5" title="Журнал главы 5" onClick={() => openMenu('journal')}><BookOpen size={18} /></button><button className="icon-button" aria-label="Читать главу 5 сначала" title="Читать главу 5 сначала" onClick={() => setRestart(true)}><RotateCcw size={18} /></button><ReaderSettings /></div><nav className="chapter-system-menu" aria-label="Меню героя">{menus.map(id => { const Icon = menuIcons[id]; return <button key={id} className={menu === id ? 'active' : ''} aria-label={menuNames[id]} title={menuNames[id]} aria-expanded={menu === id} onClick={() => menu === id ? setMenu(null) : openMenu(id)}><Icon size={18} /><span>{menuNames[id]}</span></button>; })}</nav></div></header></SceneScope>
    <div className="chapter-scene"><SceneObject id="ChapterFive-c3-location-1" kind="group"><span className="c3-location">{scene.name}</span></SceneObject><ChapterFiveArt state={s} act={dispatch} />{!menu && <SceneObject id="ChapterFive-c3-actions-1" kind="group"><div className="c3-actions c4-actions c5-actions">{suggested ? <SceneObject id="ChapterFive-primary-button-2" kind="control"><button className="primary-button" onClick={() => openMenu(suggested)}>{menuNames[suggested]}<ArrowRight size={18} /></button></SceneObject> : task && task !== 'touch-mage' && task !== 'push-novice' && <TaskButton state={s} dispatch={dispatch} task={task} />}</div></SceneObject>}</div>
    {menu && <SceneObject id="ChapterFive-chapter-menu-1" kind="group"><section className={`chapter-menu c3-menu c4-menu c5-menu menu-${menu}`} aria-label={menuNames[menu]} role="region"><header><h2>{menuNames[menu]}</h2><SceneObject id="ChapterFive-icon-button-1" kind="control"><button className="icon-button" aria-label="Закрыть меню" onClick={() => setMenu(null)}><X size={18} /></button></SceneObject></header><div className="chapter-menu-body">
      {menu === 'inventory' && <Inventory state={s} dispatch={dispatch} />}{menu === 'status' && <Status state={s} dispatch={dispatch} />}{menu === 'class' && <ClassMenu state={s} dispatch={dispatch} />}{menu === 'trade' && <Trade state={s} dispatch={dispatch} />}{menu === 'journal' && <div className="chapter-journal">{paragraphs.slice(0, s.page + 1).map((runs, i) => <p key={i}><BookText runs={runs} /></p>)}</div>}
    </div></section></SceneObject>}
    <SceneScope id="excluded-story-window" disabled><section className="story-window prologue-reading chapter-two-reading c3-reading c4-reading" aria-label="Текст главы 5"><h2>{speakers[s.page] ?? 'Мач Крайм · мысли'}</h2><div className="dialogue-text prologue-text" ref={text} tabIndex={0} aria-live="polite" aria-label="Текст текущей страницы"><p><BookText runs={paragraphs[s.page]} /></p></div><footer className="reader-controls"><button className="text-button" disabled={!save.history.length} onClick={() => dispatch({ type: 'back' })}><ArrowLeft size={18} /><span>Назад</span></button><div className="chapter-reading-status"><span className="reader-progress" role="status">{s.page + 1} / {paragraphs.length}<small>{saveFailed ? 'Сохранение недоступно' : requirement ?? 'Место чтения сохранено'}</small></span>{s.lastMove && <details className="c3-log"><summary><BookText text={s.log.at(-1)!} /></summary><div role="log" tabIndex={0}>{s.log.map((line, i) => <p key={i}><BookText text={line} /></p>)}</div></details>}</div><button className="primary-button" disabled={Boolean(requirement)} title={requirement ?? undefined} onClick={() => last ? onContents() : dispatch({ type: 'next' })}>{last ? 'К главам' : 'Далее'}<ArrowRight size={18} /></button></footer></section></SceneScope>
    {restart && <dialog ref={dialog} className="chapter-restart" aria-label="Начать главу заново" onCancel={() => setRestart(false)}><h2>Начать главу 5 заново?</h2><p>Дуэль, покупки и побег этой главы начнутся сначала.</p><button className="primary-button" onClick={() => { dispatch({ type: 'restart' }); setRestart(false); setMenu(null); }}>Начать заново</button><button ref={cancel} className="text-button" onClick={() => setRestart(false)}>Продолжить чтение</button></dialog>}
  </main></SceneFrame>;
}
