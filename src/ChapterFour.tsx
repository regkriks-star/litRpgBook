import { gameSceneVariant } from './scene-replay';
import SceneObject, { SceneFrame, SceneScope } from './SceneObject';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Backpack, BookOpen, Coins, RotateCcw, Shield, UserRound, X } from 'lucide-react';
import BookText from './BookText';
import GameNotice from './GameNotice';
import { HealthMeter, ItemIcon } from './ChapterTwoMenus';
import ChapterFourArt, { chapterFourScene, FourHero, FourSprite } from './ChapterFourArt';
import { assetUrl } from './assets';
import paragraphs from './chapter-four.json' with { type: 'json' };
import { CHAPTER_FOUR_SAVE, chapterFourReducer, effectiveStat, has, initialChapterFour, itemNames, maxHp, maxMp, menuNames, nextRequirement, readChapterFourSave, statBonus, statNames, statTargets, type ChapterAction, type ChapterSave, type ChapterState, type Item, type Menu, type Task } from './chapter-four-game';
import './chapter-two.css';
import './chapter-three.css';
import './chapter-four.css';

const menuIcons = { inventory: Backpack, status: UserRound, class: Shield, trade: Coins, journal: BookOpen };
const speakers: Record<number, string> = {
  4: 'Хатико Таримори', 6: 'Девушка в белом', 8: 'Мач Крайм', 9: 'Девушка в белом', 10: 'Мач Крайм', 11: 'Девушка в белом',
  14: 'Оома', 15: 'Оома', 18: 'Оома', 19: 'Мач Крайм', 20: 'Оома', 21: 'Мач Крайм', 26: 'Мач Крайм', 30: 'Мач Крайм',
  31: 'Система', 32: 'Система', 34: 'Система', 35: 'Система', 39: 'Мач Крайм', 40: 'Аптекарша', 41: 'Мач Крайм', 42: 'Аптекарша', 45: 'Сатсубаки Суджиро',
  75: 'Мач Крайм', 76: 'Трактирщик', 77: 'Мач Крайм', 78: 'Трактирщик', 79: 'Мач Крайм', 80: 'Трактирщик', 81: 'Мач Крайм', 83: 'Трактирщик',
  85: 'Мими', 86: 'Мач Крайм', 88: 'Посетители', 89: 'Посетители', 90: 'Посетители', 91: 'Посетители', 92: 'Посетители', 93: 'Посетители', 94: 'Мач Крайм',
  96: 'Сын барона Кенхельма', 97: 'Мач Крайм', 100: 'Сын барона Кенхельма', 102: 'Мач Крайм', 103: 'Сын барона Кенхельма', 105: 'Мач Крайм', 106: 'Сын барона Кенхельма',
};
type MenuProps = { state: ChapterState; dispatch: (action: ChapterAction) => void };

function Inventory({ state: s, dispatch }: MenuProps) {
  const [selected, setSelected] = useState<Item | null>(null);
  const items = (Object.keys(itemNames) as Item[]).filter(id => s.bag[id]);
  return <SceneObject id="ChapterFour-chapter-inventory-1" kind="group"><div className="chapter-inventory c3-inventory"><SceneObject id="ChapterFour-inventory-character-1" kind="group"><div className="inventory-character"><FourHero state={s} /><span>Одежда Хатико{ s.lady ? ' · мышь в кармане' : '' }</span><HealthMeter value={s.hp} max={maxHp(s)} name="Здоровье Мача" /></div></SceneObject><SceneObject id="ChapterFour-inventory-storage-1" kind="group"><div className="inventory-storage">
    <SceneObject id="ChapterFour-inventory-hint-1" kind="group"><p className="inventory-hint">100 ячеек · нажмите предмет, чтобы осмотреть или поесть. Канис: {s.money}.</p></SceneObject>
    <SceneObject id="ChapterFour-inventory-grid-1" kind="group"><div className="inventory-grid" role="group" aria-label="100 ячеек инвентаря" tabIndex={0}>{Array.from({ length: 100 }, (_, i) => {
      const item = items[i];
      return item ? <SceneObject id="ChapterFour-inventory-slot-1" key={i} instanceKey={i} kind="control"><button key={i} className={`inventory-slot ${selected === item ? 'selected' : ''}`} aria-label={`${itemNames[item]}: ${s.bag[item]}`} title={itemNames[item]} onClick={() => { setSelected(item); dispatch({ type: 'use', item }); }}><ItemIcon item={item} /><b>{s.bag[item]}</b></button></SceneObject> : <SceneObject id="ChapterFour-inventory-slot-2" key={i} instanceKey={i} kind="group"><span key={i} className="inventory-slot empty" aria-hidden="true" /></SceneObject>;
    })}</div></SceneObject>
    <SceneObject id="ChapterFour-inventory-description-1" kind="group"><p className="inventory-description" role="status">{selected ? `${itemNames[selected]}${selected === 'knife' ? ' · Урон 2–4 · в бою недоступен этому классу' : selected === 'club' ? ' · Урон 1–2 · разрешённое оружие' : ''}` : 'Выберите предмет'}</p></SceneObject>
    {s.page === 1 && <SceneObject id="ChapterFour-c4-knife-tools-1" kind="group"><div className="c4-knife-tools"><SceneObject id="ChapterFour-button-1" kind="control"><button disabled={has(s, 'peel')} onClick={() => dispatch({ type: 'do', task: 'peel' })}>Очистить яблоко ножом</button></SceneObject><SceneObject id="ChapterFour-button-2" kind="control"><button disabled={has(s, 'slice')} onClick={() => dispatch({ type: 'do', task: 'slice' })}>Нарезать морковь ножом</button></SceneObject><SceneObject id="ChapterFour-button-3" kind="control"><button disabled={has(s, 'test')} onClick={() => dispatch({ type: 'do', task: 'test' })}>Проверить нож на себе · −3 HP</button></SceneObject></div></SceneObject>}
  </div></SceneObject></div></SceneObject>;
}
function Status({ state: s, dispatch }: MenuProps) {
  const rows = useRef<HTMLDivElement>(null);
  const listing = s.page >= 51 && s.page <= 71;
  useEffect(() => {
    const row = rows.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const body = rows.current?.closest('.chapter-menu-body');
    if (!row || !body) return;
    const a = row.getBoundingClientRect(), b = body.getBoundingClientRect();
    if (a.top < b.top || a.bottom > b.bottom) body.scrollTop += a.top - b.top - (body.clientHeight - a.height) / 2;
  }, [s.page]);
  return <div ref={rows}>{listing ? <SceneObject id="ChapterFour-chapter-status-1" kind="group"><div className="chapter-status c3-source-status">{Array.from({ length: 21 }, (_, i) => i + 51).map(page => <SceneObject id="ChapterFour-status-field-1" key={page} instanceKey={page} kind="group"><p className={`status-field ${page === s.page ? 'current' : ''}`} data-status-page={page} key={page} aria-current={page === s.page ? 'true' : undefined}><BookText runs={paragraphs[page]} /></p></SceneObject>)}</div></SceneObject> : <SceneObject id="ChapterFour-c3-stats-1" kind="group"><div className="c3-stats"><section><h3>Мач Крайм</h3><p>Человек · Рыцарь Прекрасной Дамы</p><p>Уровень {s.level} · Уровень класса {s.classLevel}</p><p>HP {s.hp} / {maxHp(s)} · MP {s.mp} / {maxMp(s)}</p><p>Очки уровней: {s.levelPoints} · Очки класса: {s.classPoints}</p><p>Охотник: {s.hunter} · Кулинария: {s.cooking}</p><p>Одноручное оружие: {s.oneHanded}</p><p>Дама: {s.lady ? 'мышь · все характеристики ×2' : 'не назначена'}</p><p>Канис: {s.money}</p></section><section><h3>Характеристики</h3><p>Свободных очков: <b>{s.freePoints}</b></p>
    {(Object.keys(statTargets) as (keyof typeof statTargets)[]).map(stat => <SceneObject id="ChapterFour-c3-stat-1" key={stat} instanceKey={stat} kind="group"><div className="c3-stat" key={stat}><span>{statNames[stat]}: <b>{s[stat]}</b>{statBonus(s, stat) > 0 && <small> (+{statBonus(s, stat)})</small>}{s.lady && <strong> → {effectiveStat(s, stat)}</strong>}</span>{s.page === 38 && has(s, 'day') && <SceneObject id="ChapterFour-button-4" kind="control"><button disabled={s[stat] === statTargets[stat]} aria-label={`Развить: ${statNames[stat]}`} onClick={() => dispatch({ type: 'allocate', stat })}>+{statTargets[stat] - s[stat]}</button></SceneObject>}</div></SceneObject>)}
    <p>Удача: {s.luck} (+{statBonus(s, 'luck')}){s.lady ? ` → ${effectiveStat(s, 'luck')}` : ''}</p>
    {s.lady && <SceneObject id="ChapterFour-c4-buff-note-1" kind="group"><p className="c4-buff-note">×2 ко всем характеристикам. HP и MP восстанавливаются быстрее.</p></SceneObject>}
  </section></div></SceneObject>}</div>;
}
function ClassMenu({ state: s, dispatch }: MenuProps) {
  return <SceneObject id="ChapterFour-c4-class-1" kind="group"><div className="c4-class"><h3>Рыцарь Прекрасной Дамы</h3><SceneObject id="ChapterFour-c4-lady-card-1" kind="group"><div className="c4-lady-card"><FourSprite art="machLadyMouse" frame={s.mouse === 'escaped' ? 7 : 6} label={s.mouse === 'escaped' ? 'Мышь 63-го уровня покинула героя' : 'Мышь — доступная цель способности'} /><div><p>Дама: {s.lady ? 'мышь · назначена' : 'не назначена'}</p>{s.page === 27 && <SceneObject id="ChapterFour-primary-button-1" kind="control"><button className="primary-button" disabled={s.lady} onClick={() => dispatch({ type: 'assign' })}>{s.lady ? 'Мышь назначена · ×2 характеристики' : 'Назначить даму · мышь'}</button></SceneObject>}{s.page === 72 && <><p>Воспоминание: разорванный карман, мышь убежала. Снимите назначение.</p><SceneObject id="ChapterFour-primary-button-2" kind="control"><button className="primary-button" disabled={has(s, 'refuse')} onClick={() => dispatch({ type: 'do', task: 'refuse' })}>{has(s, 'refuse') ? 'Назначение снято' : 'Отказаться от дамы'}</button></SceneObject></>}</div></div></SceneObject>
    <p>Разящий удар · {s.strike} ур. · Мысли о Ней · {s.thoughts} ур.</p><p>Одноручное оружие · {s.oneHanded} ур.</p><h3>Ремесла</h3><p>Охотник · {s.hunter} ур. · Кулинария · {s.cooking} ур.</p>
    {s.page === 24 && <><p>Оома учит бесплатно. Требуется одно очко уровня.</p><SceneObject id="ChapterFour-primary-button-3" kind="control"><button className="primary-button" disabled={Boolean(s.cooking) || !has(s, 'farm-dinner')} onClick={() => dispatch({ type: 'cook' })}>{s.cooking ? 'Кулинария изучена · 1 ур.' : 'Изучить Кулинарию у Оомы'}</button></SceneObject></>}
  </div></SceneObject>;
}
function Trade({ state: s, dispatch }: MenuProps) {
  const offer = (task: Task, item: Item, label: string) => <SceneObject id="ChapterFour-c4-offer-1" kind="control"><button className="c4-offer" disabled={has(s, task)} onClick={() => dispatch({ type: 'do', task })}><ItemIcon item={item} /><span>{label}{has(s, task) && ' ✓'}</span></button></SceneObject>;
  return <SceneObject id="ChapterFour-c3-trade-1" kind="group"><div className="c3-trade"><SceneObject id="ChapterFour-c3-money-1" kind="group"><p className="c3-money" role="status">Канис: <b>{s.money}</b></p></SceneObject>
    {s.page >= 39 && s.page <= 43 && <><h3>Аптека</h3><p>Санка: 4 канис за пучок · ядро: 1 канис.</p><SceneObject id="ChapterFour-c3-offers-1" kind="group"><div className="c3-offers">{s.page === 43 ? <>{offer('herbs', 'herb', 'Продать 2247 пучков санки · 8988 канис')}{offer('crystals', 'crystal', 'Продать 2247 ядер · 2247 канис')}</> : <p>Аптекарша готовится принять вашу добычу.</p>}</div></SceneObject></>}
    {s.page >= 44 && s.page <= 46 && <><h3>Сатсубаки Суджиро</h3><p>Шкурки: {s.bag.pelt} · по 50 канис. Запас денег на покупку: {has(s, 'hides') ? 0 : 1500} канис.</p><SceneObject id="ChapterFour-c4-offer-2" kind="control"><button disabled className="c4-offer"><ItemIcon item="pelt" />Продать все шкуры · денег у охотника не хватает</button></SceneObject>{s.page === 46 && offer('hides', 'pelt', 'Продать 30 шкурок · 1500 канис')}<p>К концу следующей недели охотник сможет купить не более пятидесяти шкур, частями.</p></>}
    {s.page === 47 && <><h3>Рынок</h3>{offer('meat', 'meat', 'Продать партию мяса · 2800 канис')}<p>После продажи в сумке остаются двадцать порций и фляга воды.</p></>}
    {s.page === 48 && <><h3>Трактир · ужин</h3>{offer('order', 'dinner', 'Заказать ужин и три кружки пива · 70 канис')}<p>Похлёбка, жареная нога и пиво появляются в инвентаре.</p></>}
    {s.page >= 75 && s.page <= 84 && <><h3>Благодарность страже</h3><p>Хатико Таримори, Осама Закари и капитан Ома Табуяма со своей сменой.</p><p>Пирушка: 5000 канис · чаевые: 300 канис.</p>{s.page === 84 ? offer('thanks', 'beer', 'Оплатить пирушку и чаевые · 5300 канис') : <p>Договоритесь с хозяином по ходу разговора.</p>}</>}
  </div></SceneObject>;
}
function load() {
  try { return readChapterFourSave(localStorage.getItem(CHAPTER_FOUR_SAVE)); }
  catch { return initialChapterFour(); }
}

export default function ChapterFour({ onContents, onChapterFive = onContents, preview }: { onContents: () => void; onChapterFive?: () => void; preview?: { save: ChapterSave; menu?: Menu } }) {
  const [save, dispatch] = useReducer(chapterFourReducer, undefined, () => preview?.save ?? load());
  const s = save.current;
  const [manualMenu, setManualMenu] = useState<Menu | null>(preview?.menu ?? null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [restart, setRestart] = useState(false);
  const text = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const listing = s.page >= 51 && s.page <= 71;
  const menu = manualMenu ?? (listing ? 'status' : null);
  const requirement = nextRequirement(s);
  const scene = chapterFourScene(s.page, s.cooking);
  const last = s.page === paragraphs.length - 1;
  useEffect(() => {
    if (preview) return; try { localStorage.setItem(CHAPTER_FOUR_SAVE, JSON.stringify(save)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }, [save]);
  useEffect(() => { text.current?.scrollTo(0, 0); setManualMenu(preview?.menu ?? null); setRestart(false); }, [s.page]);
  useEffect(() => { if (restart) { dialog.current?.showModal(); cancel.current?.focus(); } }, [restart]);
  useEffect(() => {
    const portrait = matchMedia('(orientation: portrait) and (max-width: 950px)');
    const rotate = () => { if (portrait.matches) { setRestart(false); setManualMenu(null); } };
    portrait.addEventListener('change', rotate);
    return () => portrait.removeEventListener('change', rotate);
  }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setManualMenu(null); setRestart(false); return; }
      if (menu || restart || e.repeat || !(e.target instanceof HTMLElement) || e.target.closest('input, textarea, select, dialog')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); dispatch({ type: 'next' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); dispatch({ type: 'back' }); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [menu, restart]);
  function openMenu(id: Menu) { setManualMenu(id); dispatch({ type: 'open', menu: id }); }
  function taskButton(task: Task, label: string) {
    const knifeNotReady = task === 'knife-attack' && !(['peel', 'slice', 'test'] as Task[]).every(id => has(s, id));
    return <SceneObject id="ChapterFour-primary-button-4" kind="control"><button className="primary-button" disabled={has(s, task) || knifeNotReady} onClick={() => dispatch({ type: 'do', task })}>{label}{has(s, task) && ' ✓'}</button></SceneObject>;
  }
  let suggested: Menu | null = null;
  if (s.page === 1 || s.page === 48 && has(s, 'order')) suggested = 'inventory';
  if (s.page === 24 && has(s, 'farm-dinner') && !s.cooking || s.page === 27 || s.page === 72) suggested = 'class';
  if (s.page === 29 || s.page === 38 && has(s, 'day') || s.page === 50) suggested = 'status';
  if ([43, 46, 47, 84].includes(s.page) || s.page === 48 && !has(s, 'order')) suggested = 'trade';
  const menus: Menu[] = ['inventory', 'status', 'class'];
  if (s.page >= 39 && s.page <= 48 || s.page >= 75 && s.page <= 84) menus.push('trade');
  return <SceneFrame chapter={4} frame={s.page} variant={gameSceneVariant(4, s)}><main className={`stage prologue-reader chapter-two chapter-three chapter-four c4-${scene.id} ${menu ? 'menu-open' : ''} ${listing && menu === 'status' ? 'status-reading' : ''}`} aria-label="Глава 4">
    <figure className="prologue-illustration"><img src={assetUrl(scene.art)} alt={scene.name} fetchPriority="high" /></figure><div className="atmosphere" aria-hidden="true" />
    <SceneScope id="excluded-game-header" disabled><header className="game-header reader-header"><div className="reader-toolbar" role="navigation" aria-label="Меню игры"><button className="icon-button" aria-label="Оглавление" title="Оглавление" onClick={onContents}><BookOpen size={18} /></button><div className="chapter-header-actions"><button className="icon-button" aria-label="Журнал главы 4" title="Журнал главы 4" onClick={() => openMenu('journal')}><BookOpen size={18} /></button><button className="icon-button" aria-label="Читать главу 4 сначала" title="Читать главу 4 сначала" onClick={() => setRestart(true)}><RotateCcw size={18} /></button></div><nav className="chapter-system-menu" aria-label="Меню героя">{menus.map(id => { const Icon = menuIcons[id]; return <button key={id} className={menu === id ? 'active' : ''} aria-label={menuNames[id]} title={menuNames[id]} aria-expanded={menu === id} onClick={() => menu === id && !listing ? setManualMenu(null) : openMenu(id)}><Icon size={18} /><span>{menuNames[id]}</span></button>; })}</nav></div></header></SceneScope>
    <div className="chapter-scene"><SceneObject id="ChapterFour-c3-location-1" kind="group"><span className="c3-location">{scene.name}</span></SceneObject><ChapterFourArt state={s} />{!menu && <SceneObject id="ChapterFour-c3-actions-1" kind="group"><div className="c3-actions c4-actions">
      {suggested && <SceneObject id="ChapterFour-primary-button-5" kind="control"><button className="primary-button" onClick={() => openMenu(suggested)}>{menuNames[suggested]}<ArrowRight size={18} /></button></SceneObject>}
      {s.page === 1 && taskButton('knife-attack', 'Атаковать кролика ножом')}
      {s.page === 12 && taskButton('aside', 'Отойти от ворот')}
      {s.page === 16 && (has(s, 'detach') ? taskButton('load', 'Положить Ичиро в повозку') : taskButton('detach', 'Снять Ичиро со столба'))}
      {s.page === 17 && taskButton('drive', 'Взять вожжи · ехать к деревне')}
      {s.page === 23 && taskButton('unload', 'Отнести Ичиро в дом')}
      {s.page === 24 && !has(s, 'farm-dinner') && taskButton('farm-dinner', 'Поужинать у Оомы')}
      {s.page === 25 && s.mouse === 'cat' && <SceneObject id="ChapterFour-primary-button-6" kind="control"><button className="primary-button" onClick={() => dispatch({ type: 'rescue-mouse' })}>Щелбан коту · перехватить мышь</button></SceneObject>}
      {s.page === 25 && s.mouse === 'hand' && <SceneObject id="ChapterFour-primary-button-7" kind="control"><button className="primary-button" onClick={() => dispatch({ type: 'pocket-mouse' })}>Посадить мышь в карман</button></SceneObject>}
      {s.page === 30 && taskButton('strike', 'Разящий удар')}
      {s.page === 32 && taskButton('loot-one', 'Собрать добычу')}
      {s.page === 33 && taskButton('critical', 'Удар дубинкой')}
      {s.page === 35 && taskButton('loot-two', 'Собрать добычу')}
      {s.page === 38 && !has(s, 'day') && (s.hunts < 3 ? <SceneObject id="ChapterFour-primary-button-8" kind="control"><button className="primary-button" onClick={() => dispatch({ type: 'hunt' })}>Продолжить охоту · {s.hunts + 1} / 3</button></SceneObject> : taskButton('day', 'Завершить дневную охоту'))}
    </div></SceneObject>}</div>
    {menu && <SceneObject id="ChapterFour-chapter-menu-1" kind="group"><section className={`chapter-menu c3-menu c4-menu menu-${menu}`} aria-label={menuNames[menu]} role="region"><header><h2>{menuNames[menu]}</h2>{listing && menu === 'status' ? <SceneObject id="ChapterFour-story-menu-note-1" kind="group"><span className="story-menu-note">Читайте показатели · далее внизу</span></SceneObject> : <SceneObject id="ChapterFour-icon-button-1" kind="control"><button className="icon-button" aria-label="Закрыть меню" onClick={() => setManualMenu(null)}><X size={18} /></button></SceneObject>}</header><div className="chapter-menu-body">
      {menu === 'inventory' && <Inventory state={s} dispatch={dispatch} />}{menu === 'status' && <Status state={s} dispatch={dispatch} />}{menu === 'class' && <ClassMenu state={s} dispatch={dispatch} />}{menu === 'trade' && <Trade state={s} dispatch={dispatch} />}{menu === 'journal' && <div className="chapter-journal">{paragraphs.slice(0, s.page + 1).map((runs, i) => <p key={i}><BookText runs={runs} /></p>)}</div>}
    </div></section></SceneObject>}
    {s.page === 24 && s.cooking === 1 && <GameNotice title="Новое ремесло" kind="achievement">Кулинария · 1 ур.</GameNotice>}{s.page === 27 && s.lady && <GameNotice title="Дама назначена" kind="achievement">Мышь · ×2 характеристики</GameNotice>}
    <SceneScope id="excluded-story-window" disabled><section className="story-window prologue-reading chapter-two-reading c3-reading c4-reading" aria-label="Текст главы 4">
      {!(listing && menu === 'status') && <><h2>{speakers[s.page] ?? 'Мач Крайм · мысли'}</h2><div className="dialogue-text prologue-text" ref={text} tabIndex={0} aria-live="polite" aria-label="Текст текущей страницы"><p><BookText runs={paragraphs[s.page]} /></p></div></>}
      <footer className="reader-controls"><button className="text-button" disabled={!save.history.length} onClick={() => dispatch({ type: 'back' })}><ArrowLeft size={18} /><span>Назад</span></button><div className="chapter-reading-status"><span className="reader-progress" role="status">{s.page + 1} / {paragraphs.length}<small>{saveFailed ? 'Сохранение недоступно' : requirement ?? 'Место чтения сохранено'}</small></span>{s.lastMove && s.log.length > 0 && <details className="c3-log"><summary><BookText text={s.log.at(-1)!} /></summary><div role="log" tabIndex={0}>{s.log.map((line, i) => <p key={i}><BookText text={line} /></p>)}</div></details>}</div><button className="primary-button" disabled={Boolean(requirement)} title={requirement ?? undefined} onClick={() => last ? onChapterFive() : dispatch({ type: 'next' })}>{last ? 'Глава 5' : 'Далее'}<ArrowRight size={18} /></button></footer>
    </section></SceneScope>
    {restart && <dialog ref={dialog} className="chapter-restart" aria-label="Начать главу заново" onCancel={() => setRestart(false)}><h2>Начать главу 4 заново?</h2><p>Чтение, помощь семье, охота и торговля этой главы начнутся сначала.</p><button className="primary-button" onClick={() => { dispatch({ type: 'restart' }); setRestart(false); setManualMenu(null); }}>Начать заново</button><button ref={cancel} className="text-button" onClick={() => setRestart(false)}>Продолжить чтение</button></dialog>}
  </main></SceneFrame>;
}
