import { gameSceneVariant } from './scene-replay';
import SceneObject, { SceneFrame, SceneScope } from './SceneObject';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Backpack, BookOpen, Coins, RotateCcw, Shield, Sparkles, Swords, Trophy, UserRound, X } from 'lucide-react';
import BookText from './BookText';
import GameNotice from './GameNotice';
import { HealthMeter, ItemIcon } from './ChapterTwoMenus';
import ChapterThreeArt, { chapterThreeScene, RoofProp, TownHero } from './ChapterThreeArt';
import { assetUrl } from './assets';
import paragraphs from './chapter-three.json' with { type: 'json' };
import { canAttack, canStrike, CHAPTER_THREE_SAVE, chapterThreeReducer, initialChapterThree, itemNames, maxHp, maxMp, menuNames, nextRequirement, readChapterThreeSave, type ChapterAction, type ChapterSave, type ChapterState, type Item, type Menu } from './chapter-three-game';
import './chapter-two.css';
import './chapter-three.css';

const menuIcons = { inventory: Backpack, status: UserRound, class: Shield, achievements: Trophy, trade: Coins, journal: BookOpen };
const speakers: Record<number, string> = {
  0: 'Ома Тобуяма', 2: 'Ома Тобуяма', 4: 'Мач Крайм', 5: 'Ома Тобуяма', 6: 'Мач Крайм', 7: 'Ома Тобуяма', 8: 'Мач Крайм',
  10: 'Ома Тобуяма', 11: 'Мач Крайм', 12: 'Ома Тобуяма', 13: 'Мач Крайм', 32: 'Куджа',
  37: 'Система', 38: 'Система', 39: 'Система', 65: 'Система', 66: 'Система', 67: 'Система',
  87: 'Торговец', 88: 'Мач Крайм', 89: 'Торговец', 90: 'Мач Крайм', 91: 'Торговец', 93: 'Сын торговца',
};
type MenuProps = { state: ChapterState; dispatch: (action: ChapterAction) => void };

function Inventory({ state: s, dispatch }: MenuProps) {
  const [selected, setSelected] = useState<Item | null>(null);
  const items = (Object.keys(itemNames) as Item[]).filter(id => s.bag[id]);
  function select(item: Item) {
    setSelected(item);
    dispatch({ type: 'inspect', id: item });
    dispatch({ type: 'use', item });
  }
  return <SceneObject id="ChapterThree-chapter-inventory-1" kind="group"><div className="chapter-inventory c3-inventory">
    <SceneObject id="ChapterThree-inventory-character-1" kind="group"><div className="inventory-character"><TownHero state={s} pose={s.bag.knife ? 7 : s.lastMove === 'eat' && s.page > 24 ? 5 : s.bag.club ? 1 : 0} action={s.lastMove === 'eat' && s.page <= 24 ? 0 : undefined} /><span>{s.dressed ? 'Одежда Хатико' : 'Повязка из цедулиса'}</span><HealthMeter value={s.hp} max={maxHp(s)} name="Здоровье Мача" /></div></SceneObject>
    <SceneObject id="ChapterThree-inventory-storage-1" kind="group"><div className="inventory-storage"><SceneObject id="ChapterThree-inventory-hint-1" kind="group"><p className="inventory-hint">Нажмите предмет: осмотреть, надеть одежду или поесть. Канис: {s.money}.</p></SceneObject>
      <SceneObject id="ChapterThree-inventory-grid-1" kind="group"><div className="inventory-grid" aria-label="100 ячеек инвентаря" role="group" tabIndex={0}>{Array.from({ length: 100 }, (_, index) => {
        const item = items[index];
        if (!item) return <SceneObject id="ChapterThree-inventory-slot-1" key={index} instanceKey={index} kind="group"><span className="inventory-slot empty" key={index} aria-hidden="true" /></SceneObject>;
        return <SceneObject id="ChapterThree-inventory-slot-2" key={index} instanceKey={index} kind="control"><button key={index} className={`inventory-slot ${selected === item ? 'selected' : ''}`} disabled={item === 'ration' && !s.dressed} onClick={() => select(item)} aria-label={`${itemNames[item]}: ${s.bag[item]}`} title={itemNames[item]}><ItemIcon item={item} /><b>{s.bag[item]}</b></button></SceneObject>;
      })}</div></SceneObject>
      <SceneObject id="ChapterThree-inventory-description-1" kind="group"><p className="inventory-description" role="status">{selected ? `${itemNames[selected]}${selected === 'club' ? ' · Урон 1–2' : selected === 'knife' ? ' · Урон 2–4' : selected === 'parcel' && s.dressed ? ' · Одежда надета' : ''}` : 'Выберите предмет'}</p></SceneObject>
    </div></SceneObject>
  </div></SceneObject>;
}

function Status({ state: s, dispatch }: MenuProps) {
  const fields = useRef<HTMLDivElement>(null);
  const listing = s.page >= 41 && s.page <= 60;
  useEffect(() => {
    const row = fields.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const body = fields.current?.closest('.chapter-menu-body');
    if (!row || !body) return;
    const a = row.getBoundingClientRect(), b = body.getBoundingClientRect();
    if (a.top < b.top || a.bottom > b.bottom) body.scrollTop += a.top - b.top - (body.clientHeight - a.height) / 2;
  }, [s.page]);
  return <div ref={fields}>
    {listing ? <SceneObject id="ChapterThree-chapter-status-1" kind="group"><div className="chapter-status c3-source-status">{Array.from({ length: 20 }, (_, i) => i + 41).map(page => <SceneObject id="ChapterThree-status-field-1" key={page} instanceKey={page} kind="group"><p key={page} className={`status-field ${page === s.page ? 'current' : ''}`} data-status-page={page} aria-current={page === s.page ? 'true' : undefined}><BookText runs={paragraphs[page]} /></p></SceneObject>)}</div></SceneObject> : <>
      <SceneObject id="ChapterThree-c3-stats-1" kind="group"><div className="c3-stats"><section><h3>Мач Крайм</h3><p>Человек · Рыцарь Прекрасной Дамы</p><p>Уровень {s.level} · Уровень класса {s.classLevel}</p><p>HP {s.hp} / {maxHp(s)} · MP {s.mp} / {maxMp(s)}</p><p>Очки уровня: {s.levelPoints} · Очки класса: {s.classPoints}</p><p>Ремесло: {s.hunter ? 'Охотник · 1 ур.' : 'нет'}</p></section>
      <section><h3>Характеристики</h3><p>Свободных очков: <b>{s.freePoints}</b></p>
        {(['strength', 'speed'] as const).map(stat => <SceneObject id="ChapterThree-c3-stat-1" key={stat} instanceKey={stat} kind="group"><div className="c3-stat" key={stat}><span>{stat === 'strength' ? 'Сила' : 'Скорость'}: <b>{s[stat]}</b>{stat === 'speed' && s.classLevel > 0 ? ' (+1)' : ''}</span><SceneObject id="ChapterThree-button-1" kind="control"><button aria-label={stat === 'strength' ? 'Добавить очко силы' : 'Добавить очко скорости'} disabled={!s.freePoints || (s.page !== 61 && s.page !== 77) || s.page === 61 && stat !== 'strength' || s[stat] >= (stat === 'strength' ? s.page === 61 ? 13 : 20 : 5)} onClick={() => dispatch({ type: 'allocate', stat })}>+1</button></SceneObject></div></SceneObject>)}
        <p>Выносливость: 4 · Интеллект: 2</p><p>Удача: 5 (+3)</p><small>Извращенец F: +3 удачи. Уровень класса 1: +1 скорости.</small>
      </section></div></SceneObject>
    </>}
  </div>;
}

function ClassMenu({ state: s, dispatch }: MenuProps) {
  const [tab, setTab] = useState('');
  const inspect = (id: string) => { setTab(id); dispatch({ type: 'inspect', id }); };
  return <SceneObject id="ChapterThree-c3-class-1" kind="group"><div className="c3-class"><SceneObject id="ChapterThree-c3-tabs-1" kind="group"><div className="c3-tabs" role="group" aria-label="Описание класса и умений">{[['class', 'Описание класса'], ['abilities', 'Способности'], ['strike', 'Разящий удар'], ['thoughts', 'Мысли о Ней']].map(([id, name]) => <SceneObject id="ChapterThree-button-2" key={id} instanceKey={id} kind="control"><button key={id} onClick={() => inspect(id)} aria-pressed={tab === id}>{name}{s.inspected.includes(id) && <span aria-label="Просмотрено"> ✓</span>}</button></SceneObject>)}</div></SceneObject>
    <SceneObject id="ChapterThree-c3-description-1" kind="group"><div className="c3-description" aria-live="polite">
      {!tab && <p>Выберите описание, чтобы изучить класс и его умения.</p>}
      {tab === 'class' && <p><BookText runs={paragraphs[20]} /></p>}
      {tab === 'abilities' && <><h3>Назначить даму · Отказаться от дамы</h3><p><BookText runs={paragraphs[22]} /></p><small>Дама пока не назначена. Класс изменить нельзя.</small></>}
      {tab === 'strike' && <><h3>Разящий удар · {s.strike ? `${s.strike} ур.` : 'Не изучен'}</h3><p>Ударный приём. Применяется вне паузы между обычными ударами. В первом бою: 12 урона, расход 6 MP. Один раз за бой.</p><p>Очки класса: {s.classPoints}</p>{s.page === 64 && <SceneObject id="ChapterThree-primary-button-1" kind="control"><button className="primary-button" disabled={Boolean(s.strike)} onClick={() => dispatch({ type: 'learn-strike' })}>Изучить Разящий удар · 1 очко</button></SceneObject>}{s.page === 77 && <SceneObject id="ChapterThree-primary-button-2" kind="control"><button className="primary-button" disabled={s.strike >= 2 || !s.classPoints} onClick={() => dispatch({ type: 'upgrade-strike' })}>Улучшить Разящий удар · 2 ур.</button></SceneObject>}</>}
      {tab === 'thoughts' && <><h3>Мысли о Ней · {s.thoughts ? '1 ур.' : 'Не изучено'}</h3><p>Сидящий и думающий рыцарь быстро восстанавливает здоровье за счёт маны.</p>{s.page === 77 && <SceneObject id="ChapterThree-primary-button-3" kind="control"><button className="primary-button" disabled={Boolean(s.thoughts) || !s.classPoints} onClick={() => dispatch({ type: 'learn-thoughts' })}>Изучить Мысли о Ней · 1 очко</button></SceneObject>}</>}
    </div></SceneObject>
  </div></SceneObject>;
}

function Achievements({ state: s, dispatch }: MenuProps) {
  const [selected, setSelected] = useState('');
  const select = (id: string) => { setSelected(id); dispatch({ type: 'inspect', id }); };
  return <SceneObject id="ChapterThree-c3-class-2" kind="group"><div className="c3-class"><SceneObject id="ChapterThree-c3-tabs-2" kind="group"><div className="c3-tabs"><SceneObject id="ChapterThree-button-3" kind="control"><button onClick={() => select('pervert')} aria-pressed={selected === 'pervert'}>Извращенец · F</button></SceneObject><SceneObject id="ChapterThree-button-4" kind="control"><button onClick={() => select('streak')} aria-pressed={selected === 'streak'}>Череда побед</button></SceneObject></div></SceneObject><SceneObject id="ChapterThree-c3-description-2" kind="group"><div className="c3-description" aria-live="polite">
    {!selected && <p>Откройте достижение или божественный дар.</p>}
    {selected === 'pervert' && <p><BookText runs={paragraphs[17]} /></p>}
    {selected === 'streak' && <><p><BookText runs={paragraphs[73]} /></p><p><BookText runs={paragraphs[76]} /></p><p>Серия: {Math.min(30, s.victories)} / 30 · Добавка: +{Math.min(30, s.victories)} опыта</p><SceneObject id="ChapterThree-c3-streak-1" kind="group"><div className="c3-streak"><span style={{ width: `${Math.min(30, s.victories) / 30 * 100}%` }} /></div></SceneObject></>}
  </div></SceneObject></div></SceneObject>;
}

const offers = [{ id: 'trousers', price: 700 }, { id: 'jacket', price: 1500 }, { id: 'cap', price: 2000 }] as const;
function Trade({ state: s, dispatch }: MenuProps) {
  const [selected, setSelected] = useState<Item | null>(null);
  const inspect = (item: Item) => { setSelected(item); dispatch({ type: 'inspect', id: item }); };
  return <SceneObject id="ChapterThree-c3-trade-1" kind="group"><div className="c3-trade"><SceneObject id="ChapterThree-c3-money-1" kind="group"><p className="c3-money" role="status">Канис: <b>{s.money}</b></p></SceneObject>
    {s.page === 79 && <><SceneObject id="ChapterThree-c3-offers-1" kind="group"><div className="c3-offers">{(['herb', 'crystal'] as const).map(item => <SceneObject id="ChapterThree-button-5" key={item} instanceKey={item} kind="control"><button key={item} disabled={!s.bag[item]} onClick={() => dispatch({ type: 'sell', item })}><ItemIcon item={item} /><span>Продать {itemNames[item]}<small>{s.bag[item]} × {item === 'herb' ? 4 : 1} канис</small></span></button></SceneObject>)}</div></SceneObject><p>Яблоки аптекарша не покупает.</p></>}
    {s.page >= 80 && s.page <= 81 && <><h3>Сатсубаки Суджиро</h3><p>Ремесло Охотник · 200 канис и 1 очко уровня.</p><SceneObject id="ChapterThree-primary-button-4" kind="control"><button className="primary-button" disabled={s.page !== 81 || s.hunter || s.money < 200} onClick={() => dispatch({ type: 'train' })}>{s.hunter ? 'Охотник изучен · 1 ур.' : 'Купить ремесло Охотник'}</button></SceneObject><p>После обучения добыча с кроликов может содержать мясо и шкуры.</p></>}
    {s.page >= 82 && s.page <= 91 && <><SceneObject id="ChapterThree-c3-offers-2" kind="group"><div className="c3-offers">{offers.map(({ id, price }) => <SceneObject id="ChapterThree-button-6" key={id} instanceKey={id} kind="control"><button key={id} onClick={() => inspect(id)} aria-label={`Осмотреть: ${itemNames[id]}, ${price} канис`} aria-pressed={selected === id}><ItemIcon item={id} /><span>{itemNames[id]}<small>{price} канис</small>{s.inspected.includes(id) && <small>Осмотрено ✓</small>}</span></button></SceneObject>)}</div></SceneObject>{selected && <p role="status">{itemNames[selected]} · {offers.find(o => o.id === selected)?.price} канис. Денег не хватает.</p>}{s.page === 83 && <SceneObject id="ChapterThree-primary-button-5" kind="control"><button className="primary-button c3-food-offer" disabled={s.inspected.includes('soup')} onClick={() => dispatch({ type: 'soup' })}><ItemIcon item="soup" />{s.inspected.includes('soup') ? 'Суп съеден · осталось 100 канис' : 'Купить и съесть суп · 10 канис'}</button></SceneObject>}<p>Кинжал купца — 300 канис. Ночлег в гостинице — 100 канис.</p></>}
    {s.page >= 92 && <><SceneObject id="ChapterThree-c3-knife-offer-1" kind="control"><button className="c3-knife-offer" onClick={() => inspect('knife')} aria-label="Осмотреть самодельный нож"><ItemIcon item="knife" /><span>Грубый самодельный нож<small>100 канис · осмотреть</small></span></button></SceneObject>{s.inspected.includes('knife') && <p role="status"><BookText runs={paragraphs[94]} /></p>}{s.page >= 95 && <SceneObject id="ChapterThree-primary-button-6" kind="control"><button className="primary-button" disabled={Boolean(s.bag.knife) || s.money < 100} onClick={() => dispatch({ type: 'buy-knife' })}>{s.bag.knife ? 'Нож куплен' : 'Купить нож · 100 канис'}</button></SceneObject>}</>}
  </div></SceneObject>;
}

function load() {
  try { return readChapterThreeSave(localStorage.getItem(CHAPTER_THREE_SAVE)); }
  catch { return initialChapterThree(); }
}

export default function ChapterThree({ onContents, onChapterFour, preview }: { onContents: () => void; onChapterFour: () => void; preview?: { save: ChapterSave; menu?: Menu } }) {
  const [save, dispatch] = useReducer(chapterThreeReducer, undefined, () => preview?.save ?? load());
  const s = save.current;
  const [manualMenu, setManualMenu] = useState<Menu | null>(preview?.menu ?? null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [restart, setRestart] = useState(false);
  const text = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const listing = s.page >= 41 && s.page <= 60;
  const menu = manualMenu ?? (listing ? 'status' : null);
  const requirement = nextRequirement(s);
  const scene = chapterThreeScene(s.page);
  const washing = s.page === 35 && s.inspected.includes('wash');
  const battle = [35, 65, 66, 67, 68, 70].includes(s.page);
  const last = s.page === paragraphs.length - 1;

  useEffect(() => {
    if (preview) return; try { localStorage.setItem(CHAPTER_THREE_SAVE, JSON.stringify(save)); setSaveFailed(false); }
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
  const closeMenu = () => setManualMenu(null);
  let suggested: Menu | null = null;
  if (s.page === 15 || [36, 69].includes(s.page) || s.page === 85) suggested = 'inventory';
  if (s.page === 16 || s.page === 72) suggested = 'achievements';
  if (s.page === 19 || s.page === 63 || s.page === 64) suggested = 'class';
  if (s.page === 40 || s.page === 61 || s.page === 77) suggested = 'status';
  if (s.page >= 79 && s.page !== 85) suggested = 'trade';
  const menus: Menu[] = ['inventory', 'status', 'class', 'achievements'];
  if (s.page >= 79) menus.push('trade');

  return <SceneFrame chapter={3} frame={s.page} variant={gameSceneVariant(3, s)}><main className={`stage prologue-reader chapter-two chapter-three c3-${scene.id} ${menu ? 'menu-open' : ''} ${listing && menu === 'status' ? 'status-reading' : ''} ${battle ? 'c3-battle' : ''} ${[24, 34].includes(s.page) ? 'c3-night' : ''}`} aria-label="Глава 3">
    <figure className="prologue-illustration"><img src={assetUrl(washing ? 'tantrumRiver' : scene.art)} alt={washing ? 'Берег реки · умывание после охоты' : scene.name} fetchPriority="high" /></figure><div className="atmosphere" aria-hidden="true" />
    <SceneScope id="excluded-game-header" disabled><header className="game-header reader-header"><div className="reader-toolbar" role="navigation" aria-label="Меню игры"><button className="icon-button" aria-label="Оглавление" title="Оглавление" onClick={onContents}><BookOpen size={18} /></button><div className="chapter-header-actions"><button className="icon-button" aria-label="Журнал главы 3" title="Журнал главы 3" onClick={() => openMenu('journal')}><BookOpen size={18} /></button><button className="icon-button" aria-label="Читать главу 3 сначала" title="Читать главу 3 сначала" onClick={() => setRestart(true)}><RotateCcw size={18} /></button></div>
      <nav className="chapter-system-menu" aria-label="Меню героя">{menus.map(id => { const Icon = menuIcons[id]; return <button key={id} className={menu === id ? 'active' : ''} aria-label={menuNames[id]} title={menuNames[id]} aria-expanded={menu === id} onClick={() => menu === id && !listing ? closeMenu() : openMenu(id)}><Icon size={18} /><span>{menuNames[id]}</span></button>; })}</nav>
    </div></header></SceneScope>
    <div className="chapter-scene"><SceneObject id="ChapterThree-c3-location-1" kind="group"><span className="c3-location">{scene.name}</span></SceneObject><ChapterThreeArt state={s} />
      {!menu && <>
        {scene.art === 'tantrumRoofs' && <SceneObject id="ChapterThree-c3-repair-state-1" kind="group"><div className="c3-repair-state"><RoofProp chimney={false} repaired={s.roof} onClick={s.page === 25 ? () => dispatch({ type: 'roof' }) : undefined} /><RoofProp chimney repaired={s.chimney} onClick={s.page === 25 ? () => dispatch({ type: 'chimney' }) : undefined} /></div></SceneObject>}
        {battle && <SceneObject id="ChapterThree-c3-actions-1" kind="group"><div className="c3-actions">
          {s.phase === 'combat' && <><SceneObject id="ChapterThree-primary-button-7" kind="control"><button className="primary-button" disabled={!canAttack(s)} onClick={() => dispatch({ type: 'attack' })}><Swords size={18} />Удар дубинкой</button></SceneObject><SceneObject id="ChapterThree-primary-button-8" kind="control"><button className="primary-button" disabled={!canStrike(s)} onClick={() => dispatch({ type: 'strike' })}><Sparkles size={18} />Разящий удар</button></SceneObject></>}
          {s.phase === 'loot' && <SceneObject id="ChapterThree-primary-button-9" kind="control"><button className="primary-button" onClick={() => dispatch({ type: 'loot' })}><ItemIcon item="herb" /><ItemIcon item="crystal" />Собрать добычу</button></SceneObject>}
          {s.phase === 'rest' && <SceneObject id="ChapterThree-primary-button-10" kind="control"><button className="primary-button" onClick={() => openMenu('inventory')}><Backpack size={18} />Поесть и отдохнуть</button></SceneObject>}
          {s.page === 35 && !s.inspected.includes('wash') && s.phase !== 'combat' && s.phase !== 'loot' && <SceneObject id="ChapterThree-primary-button-11" kind="control"><button className="primary-button" onClick={() => dispatch({ type: 'inspect', id: 'wash' })}>Умыться у реки</button></SceneObject>}
        </div></SceneObject>}
        {suggested && <SceneObject id="ChapterThree-c3-actions-2" kind="group"><div className="c3-actions"><SceneObject id="ChapterThree-primary-button-12" kind="control"><button className="primary-button" onClick={() => openMenu(suggested!)}>{menuNames[suggested]}<ArrowRight size={18} /></button></SceneObject>{s.page === 77 && <SceneObject id="ChapterThree-primary-button-13" kind="control"><button className="primary-button" onClick={() => openMenu('class')}>Улучшить умения<Sparkles size={18} /></button></SceneObject>}</div></SceneObject>}
      </>}
    </div>
    {menu && <SceneObject id="ChapterThree-chapter-menu-1" kind="group"><section className={`chapter-menu menu-${menu} c3-menu`} aria-label={menuNames[menu]} role="region"><header><h2>{menuNames[menu]}</h2>{listing && menu === 'status' ? <SceneObject id="ChapterThree-story-menu-note-1" kind="group"><span className="story-menu-note">Читайте показатели · далее внизу</span></SceneObject> : <SceneObject id="ChapterThree-icon-button-1" kind="control"><button className="icon-button" aria-label="Закрыть меню" onClick={closeMenu}><X size={18} /></button></SceneObject>}</header><div className="chapter-menu-body">
      {menu === 'inventory' && <Inventory state={s} dispatch={dispatch} />}
      {menu === 'status' && <Status state={s} dispatch={dispatch} />}
      {menu === 'class' && <ClassMenu state={s} dispatch={dispatch} />}
      {menu === 'achievements' && <Achievements state={s} dispatch={dispatch} />}
      {menu === 'trade' && <Trade state={s} dispatch={dispatch} />}
      {menu === 'journal' && <div className="chapter-journal">{paragraphs.slice(0, s.page + 1).map((runs, i) => <p key={i}><BookText runs={runs} /></p>)}</div>}
    </div></section></SceneObject>}
    {[38, 39].includes(s.page) && <GameNotice key={s.page} title="Получен уровень" kind="achievement">{s.page === 38 ? 'Уровень 1 · +5 очков характеристик' : 'Уровень класса 1 · доступны умения'}</GameNotice>}
    {s.page === 81 && s.hunter && <GameNotice key="hunter" title="Новое ремесло" kind="achievement">Охотник · 1 ур.</GameNotice>}
    <SceneScope id="excluded-story-window" disabled><section className="story-window prologue-reading chapter-two-reading c3-reading" aria-label="Текст главы 3">
      {!(listing && menu === 'status') && <><h2>{speakers[s.page] ?? 'Мач Крайм · мысли'}</h2><div className="dialogue-text prologue-text" ref={text} tabIndex={0} aria-live="polite" aria-label="Текст текущей страницы"><p><BookText runs={paragraphs[s.page]} /></p></div></>}
      <footer className="reader-controls"><button className="text-button" disabled={!save.history.length} onClick={() => dispatch({ type: 'back' })}><ArrowLeft size={18} /><span>Назад</span></button><div className="chapter-reading-status"><span className="reader-progress" role="status">{s.page + 1} / {paragraphs.length}<small>{saveFailed ? 'Сохранение недоступно' : requirement ?? 'Место чтения сохранено'}</small></span>{battle && <details className="c3-log"><summary><BookText text={s.log.at(-1) ?? 'Выберите действие'} /></summary><div role="log" tabIndex={0}>{s.log.map((line, i) => <p key={i}><BookText text={line} /></p>)}</div></details>}</div><button className="primary-button" disabled={Boolean(requirement)} title={requirement ?? undefined} onClick={() => last ? onChapterFour() : dispatch({ type: 'next' })}>{last ? 'Глава 4' : 'Далее'}<ArrowRight size={18} /></button></footer>
    </section></SceneScope>
    {restart && <dialog ref={dialog} className="chapter-restart" aria-label="Начать главу заново" onCancel={() => setRestart(false)}><h2>Начать главу 3 заново?</h2><p>Чтение, предметы, развитие и покупки этой главы начнутся сначала.</p><button className="primary-button" onClick={() => { dispatch({ type: 'restart' }); setRestart(false); setManualMenu(null); }}>Начать заново</button><button ref={cancel} className="text-button" onClick={() => setRestart(false)}>Продолжить чтение</button></dialog>}
  </main></SceneFrame>;
}
