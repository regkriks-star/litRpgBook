import { gameSceneVariant } from './scene-replay';
import SceneObject, { SceneScope, SceneFrame } from './SceneObject';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Backpack, BookOpen, ChevronDown, CircleHelp, Footprints, Hand, Map, MapPin, RotateCcw, ScrollText, Shield, Swords, UserRound } from 'lucide-react';
import BookText from './BookText';
import CharacterLabel from './CharacterLabel';
import GameNotice from './GameNotice';
import ChapterTwoMenus, { HealthMeter, ItemIcon } from './ChapterTwoMenus';
import { CartRide, GateGuards, HunterStrike, MeadowHero, MeadowSprite, RabbitRemains, RiverCrowd, TantrumPerson, mealPose } from './ChapterTwoArt';
import { BattleControls } from './BattleUI';
import { chapterTwoScene, isStatusListing } from './chapter-two-staging';
import paragraphs from './chapter-two.json' with { type: 'json' };
import { assetUrl } from './assets';
import { availableMenus, availableMoves, chapterReducer, CHAPTER_TWO_SAVE, HERO_HP, initialChapter, menuNames, moveNames, nextRequirement, RABBIT_HP, readChapterSave, storyMenu, type ChapterSave, type ChapterState, type Menu, type Move } from './chapter-two-game';
import './chapter-two.css';

const menuIcons = { inventory: Backpack, status: UserRound, help: CircleHelp, minimap: MapPin, map: Map, quests: ScrollText, journal: BookOpen };
const moveIcons = { kick: Footprints, punch: Hand, dodge: Shield };
const speakers: Record<number, string> = { 5: 'Мач Крайм', 12: 'Ичиро', 14: 'Мач Крайм', 15: 'Ичиро', 18: 'Ичиро', 19: 'Мач Крайм', 20: 'Ичиро', 23: 'Ичиро', 24: 'Мач Крайм', 26: 'Ичиро', 27: 'Мач Крайм', 29: 'Мач Крайм', 30: 'Жена Ичиро', 37: 'Ичиро', 39: 'Осама', 41: 'Хатико', 87: 'Мач Крайм', 88: 'Осама', 89: 'Мач Крайм', 94: 'Мач Крайм', 97: 'Девушки у реки' };

function load() {
  try { return readChapterSave(localStorage.getItem(CHAPTER_TWO_SAVE)); }
  catch { return initialChapter(); }
}

function TrainingBattle({ veteran }: { veteran: boolean }) {
  const [beat, setBeat] = useState(0);
  const victory = veteran ? 'Кролик повержен. Юный охотник продолжает охоту.' : 'Кролик повержен. Ученики продолжают тренировку.';
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setBeat(6); return; }
    const timer = window.setInterval(() => setBeat(value => {
      if (value >= 5) { clearInterval(timer); return 6; }
      return value + 1;
    }), 800);
    return () => clearInterval(timer);
  }, []);
  return <SceneObject id="ChapterTwo-training-battle-1" kind="group"><section className={`training-battle ${veteran ? 'veteran' : ''} beat-${beat}`} aria-label="Показательный бой — автоматически">
    <SceneObject id="ChapterTwo-training-caption-1" kind="group"><div className="training-caption"><Swords size={16} /><span>{veteran ? 'Охота с ножом' : 'Ученики Куратана'} · автобой</span></div></SceneObject>
    <SceneObject id="ChapterTwo-training-actors-1" kind="group"><div className="training-actors"><div>{veteran && <CharacterLabel name="Юный охотник" level={3} />}{veteran ? <HunterStrike attacking={beat % 2 === 1 || beat === 6} /> : <TantrumPerson frame={beat % 2 ? 4 : 3} label="Юные жители Куратана сражаются с кроликом" />}</div><div className={beat === 6 ? 'training-defeated' : 'training-rabbit'}><MeadowSprite frame={beat % 2 ? 1 : 0} label="Рогатый кролик в учебном бою" /><HealthMeter value={Math.max(0, 30 - Math.ceil(beat / 2) * 10)} max={30} name="Кролик" /></div></div></SceneObject>
    <SceneObject id="ChapterTwo-training-result-1" kind="effect"><p className="training-result" role="status">{beat === 6 ? victory : beat % 2 ? 'Кролик прыгает навстречу удару.' : 'Удар оружием — рогатый кролик отступает.'}</p></SceneObject>
  </section></SceneObject>;
}

function BattleLog({ state }: { state: ChapterState }) {
  const end = useRef<HTMLDivElement>(null);
  const latest = state.log.at(-1);
  const scrollToEnd = () => { if (end.current) end.current.scrollTop = end.current.scrollHeight; };
  useEffect(scrollToEnd, [state.log.length]);
  return <SceneObject id="ChapterTwo-chapter-combat-log-1" kind="group"><details className="chapter-combat-log" onToggle={scrollToEnd}>
    <SceneObject id="ChapterTwo-summary-1" kind="control"><summary aria-label="История сообщений"><ScrollText size={16} /><span className={latest ? `log-${latest.kind}` : ''} role="status" aria-live="polite"><BookText text={latest?.text ?? 'Сообщений пока нет. Выберите действие.'} /></span><small>История {state.log.length || ''}</small><ChevronDown size={16} /></summary></SceneObject>
    <SceneObject id="ChapterTwo-combat-log-history-1" kind="group"><div className="combat-log-history"><header>Урон, добыча и опыт <span>Опыт {state.xp} · Класс {state.classXp}</span></header><div className="combat-log-lines" ref={end} role="log" aria-label="История боя" tabIndex={0}>{!latest && <p>Здесь появятся сообщения боя.</p>}{state.log.map((entry, index) => <SceneObject id="ChapterTwo-log--1" key={index} instanceKey={index} kind="group"><p key={index} className={`log-${entry.kind}`}><BookText text={entry.text} /></p></SceneObject>)}</div></div></SceneObject>
  </details></SceneObject>;
}

export default function ChapterTwo({ onContents, onChapterThree, preview }: { onContents: () => void; onChapterThree?: () => void; preview?: { save: ChapterSave; menu?: Menu } }) {
  const [save, dispatch] = useReducer(chapterReducer, undefined, () => preview?.save ?? load());
  const s = save.current;
  const [manualMenu, setManualMenu] = useState<Menu | null>(preview?.menu ?? null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [restartPrompt, setRestartPrompt] = useState(false);
  const [heroPose, setHeroPose] = useState(0);
  const [rabbitFrame, setRabbitFrame] = useState(0);
  const [gathering, setGathering] = useState(false);
  const [lootCollected, setLootCollected] = useState(false);
  const [mapFocus, setMapFocus] = useState('helis');
  const [mapInspected, setMapInspected] = useState(false);
  const text = useRef<HTMLDivElement>(null);
  const restartDialog = useRef<HTMLDialogElement>(null);
  const restartCancel = useRef<HTMLButtonElement>(null);
  const forcedMenu = storyMenu(s);
  const menu = manualMenu ?? forcedMenu;
  const pinned = Boolean(menu && menu === forcedMenu);
  const moves = availableMoves(s);
  const requirement = nextRequirement(s);
  const battle = s.page >= 70 && s.page <= 83;
  const training = s.page >= 28 && s.page <= 31 || s.page === 80;
  const showLoot = s.phase === 'loot' && [78, 82, 83].includes(s.page);
  const last = s.page === paragraphs.length - 1;
  const achievement = s.page === 26;
  const statusListing = isStatusListing(s.page);
  const riding = s.page >= 16 && s.page <= 37;
  const scene = chapterTwoScene(s.page === 89 && !s.parcelStored ? 88 : s.page);
  let slope: 'up' | 'down' | undefined;
  if (s.parcelStored && s.page >= 89 && s.page <= 92) slope = s.page === 92 ? 'down' : 'up';
  let riverStage = '';
  if (s.page >= 95) riverStage = 'river-passage';
  else if (s.page >= 93) riverStage = 'river-approach';
  else if (s.page === 92) riverStage = 'river-downhill';
  else if (s.page >= 89 && s.parcelStored) riverStage = 'river-uphill';

  useEffect(() => {
    if (preview) return; try { localStorage.setItem(CHAPTER_TWO_SAVE, JSON.stringify(save)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }, [save]);
  useEffect(() => {
    text.current?.scrollTo(0, 0);
    setManualMenu(preview?.menu ?? null);
    setRestartPrompt(false);
  }, [s.page]);
  useEffect(() => {
    if (restartPrompt) { restartDialog.current?.showModal(); restartCancel.current?.focus(); }
  }, [restartPrompt]);
  useEffect(() => {
    if (s.page === 9 && gathering) { setHeroPose(13); return; }
    if (s.page >= 89 && s.parcelStored) {
      setHeroPose(6);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let step = 0;
      const timer = window.setInterval(() => { step++; setHeroPose(6 + step % 2); if (step >= 7) clearInterval(timer); }, 160);
      return () => clearInterval(timer);
    }
    if (s.page === 86 || s.page === 89 && !s.parcelStored) { setHeroPose(s.exchanged ? 0 : 12); return; }
    if (s.page === 24 || s.page >= 84 && s.page <= 88) {
      setHeroPose(10);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let step = 0;
      const timer = window.setInterval(() => { setHeroPose(10 + ++step % 2); if (step >= 5) clearInterval(timer); }, 450);
      return () => clearInterval(timer);
    }
    if (s.phase === 'rested' && battle) { setHeroPose(mealPose(s.fight)); setRabbitFrame(0); return; }
    if (!s.lastMove || !battle) { setHeroPose(0); setRabbitFrame(0); return; }
    setHeroPose({ kick: 1, punch: 2, dodge: 3 }[s.lastMove]);
    const miss = s.log.at(-2)?.kind === 'dodge' && s.log.at(-2)?.amount === 0;
    setRabbitFrame(miss ? 2 : 0);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fall = s.lastMove === 'punch' ? window.setTimeout(() => setRabbitFrame(3), 150) : undefined;
    const reply = window.setTimeout(() => { setHeroPose(4); setRabbitFrame(1); }, s.lastMove === 'punch' ? 620 : 340);
    const settle = window.setTimeout(() => { setHeroPose(0); setRabbitFrame(0); }, 950);
    return () => { clearTimeout(fall); clearTimeout(reply); clearTimeout(settle); };
  }, [s.turn, s.fight, s.lastMove, s.phase, s.page, battle, s.exchanged, s.parcelStored, gathering]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (restartPrompt) setRestartPrompt(false);
        else setManualMenu(null);
        return;
      }
      if (manualMenu || event.repeat || !(event.target instanceof HTMLElement) || event.target.closest('input, textarea, select, [role="dialog"]')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); dispatch({ type: 'next' }); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); dispatch({ type: 'back' }); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [manualMenu, restartPrompt]);

  const openMenu = (next: Menu) => { dispatch({ type: 'open-menu', menu: next }); setManualMenu(previous => previous === next ? null : next); };
  const gather = () => {
    dispatch({ type: 'gather' }); setGathering(true);
    window.setTimeout(() => setGathering(false), 800);
  };
  const collectLoot = () => { dispatch({ type: 'loot' }); setLootCollected(true); window.setTimeout(() => setLootCollected(false), 900); };
  return <SceneFrame chapter={2} frame={s.page} variant={gameSceneVariant(2, s)}><main className={`stage prologue-reader chapter-two scene-${scene.id} ${s.page <= 1 ? 'chapter-start' : ''} ${battle ? 'chapter-battle' : ''} ${training ? 'chapter-training' : ''} ${menu ? 'menu-open' : ''} ${statusListing ? 'status-reading' : ''} ${s.page === 86 ? 'exchanging' : ''} ${riverStage} ${gathering || lootCollected ? 'bag-highlight' : ''}`} aria-label="Глава 2">
    <figure className="prologue-illustration"><img key={scene.art} src={assetUrl(scene.art)} alt={scene.label} fetchPriority="high" /></figure>
    <div className="atmosphere" aria-hidden="true" />
    <SceneScope id="excluded-game-header" disabled><header className="game-header reader-header"><div className="reader-toolbar" role="navigation" aria-label="Меню игры"><button className="icon-button" aria-label="Оглавление" title="Оглавление" onClick={onContents}><BookOpen size={18} /></button><div className="chapter-header-actions"><button className="icon-button" aria-label="Журнал главы 2" title="Журнал главы 2" onClick={() => openMenu('journal')}><BookOpen size={18} /></button><button className="icon-button" aria-label="Читать главу 2 сначала" title="Читать главу 2 сначала" onClick={() => setRestartPrompt(true)}><RotateCcw size={18} /></button></div>
    <nav className="chapter-system-menu" aria-label="Меню героя">{availableMenus(s).map(id => {
      const Icon = menuIcons[id];
      return <button key={id} className={id === menu ? 'active' : ''} onClick={() => openMenu(id)} aria-label={menuNames[id]} title={menuNames[id]} aria-expanded={menu === id}><Icon size={17} /><span>{menuNames[id]}</span></button>;
    })}</nav>
    </div></header></SceneScope>

    <div className={`chapter-scene ${training ? 'has-training' : ''}`}>
      {scene.id === 'gates' && <SceneObject id="ChapterTwo-gate-occlusion-1" kind="group"><div className="gate-occlusion" aria-hidden="true" style={{ backgroundImage: `url("${assetUrl('tantrumGates')}")` }} /></SceneObject>}
      {!training && !riding && <SceneObject selectAsGroup id="ChapterTwo-chapter-hero-position-1" kind="sprite"><div className={`chapter-hero-position ${battle ? 'in-battle' : ''} ${s.page >= 89 ? 'running' : ''}`}>
        {s.page >= 49 && <CharacterLabel name="Мач Крайм" level={0} />}
        <MeadowHero equipped={s.equipped} pose={heroPose} resting={s.page === 0} stretching={s.page === 1} slope={slope} />
        {s.exchanged && !s.parcelStored && <SceneObject id="ChapterTwo-held-parcel-1" kind="group"><span className="held-parcel"><ItemIcon item="parcel" /></span></SceneObject>}
        {battle && <HealthMeter value={s.hp} max={HERO_HP} name="HP Мача" />}
        {battle && s.lastMove && s.log.slice(-3).find(entry => entry.kind === 'hurt') && <SceneObject id="ChapterTwo-damage-1" key={`${s.fight}-${s.turn}`} kind="sprite"><span key={`${s.fight}-${s.turn}`} className="damage" aria-hidden="true">−{s.log.slice(-3).find(entry => entry.kind === 'hurt')?.amount}</span></SceneObject>}
      </div></SceneObject>}
      {s.page >= 3 && s.page <= 8 && <SceneObject id="ChapterTwo-distant-rabbits-1" kind="sprite"><div className="distant-rabbits" aria-hidden="true">{[0, 1, 2].map(i => <SceneScope id="ChapterTwo-MeadowSprite-1" key={i} instanceKey={i}><MeadowSprite key={i} label="" /></SceneScope>)}</div></SceneObject>}
      {s.page === 9 && !s.collected && <SceneObject id="ChapterTwo-cedulis-bush-1" kind="control"><button className="cedulis-bush" onClick={gather} aria-label="Собрать листья цедулиса"><MeadowSprite frame={3} label="Куст цедулиса с длинными гибкими стеблями" /><span><Hand size={18} />Собрать цедулис</span></button></SceneObject>}
      {s.page === 9 && s.collected && !s.equipped && <SceneObject id="ChapterTwo-scene-instruction-1" kind="group"><div className="scene-instruction"><ItemIcon item="leaves" /><p>Листья собраны</p><SceneObject id="ChapterTwo-primary-button-1" kind="control"><button className="primary-button" onClick={() => openMenu('inventory')}>Открыть инвентарь<Backpack size={18} /></button></SceneObject></div></SceneObject>}
      {s.page >= 12 && s.page <= 15 && <SceneObject id="ChapterTwo-chapter-cart-1" kind="sprite"><div className="chapter-cart"><CartRide page={s.page} moving /></div></SceneObject>}
      {riding && <SceneObject id="ChapterTwo-chapter-ride-1" kind="group"><div className={`chapter-ride ${training ? 'observing' : ''} ${scene.id === 'gates' ? 'arrived' : ''}`}>
        <CartRide page={s.page} showLabel={s.page >= 23} moving={scene.id === 'road'} />
      </div></SceneObject>}
      {s.page === 38 && <SceneObject id="ChapterTwo-chapter-cart-2" kind="sprite"><div className="chapter-cart departing"><CartRide page={s.page} /></div></SceneObject>}
      {(s.page >= 33 && s.page <= 42 || s.page >= 86 && s.page <= 88) && <SceneObject id="ChapterTwo-chapter-guards-1" kind="sprite"><div className="chapter-guards">
        <GateGuards page={s.page} exchanging={s.exchanged} labels={<>{s.page >= 35 && <CharacterLabel name="Осама Закари" profession="Стражник" level={47} />}{s.page >= 36 && <CharacterLabel name="Хатико Таримори" profession="Стражник" level={48} />}</>} />
      </div></SceneObject>}
      {training && <TrainingBattle key={s.page === 80 ? 'veteran' : 'children'} veteran={s.page === 80} />}
      {s.page >= 93 && <RiverCrowd scattering={s.page >= 95} />}
      {battle && !training && <>
        <SceneObject id="ChapterTwo-chapter-battle-caption-1" kind="group"><div className="chapter-battle-caption"><Swords size={16} /><span>Рогатый кролик {s.fight} / 5</span></div></SceneObject>
        {s.phase === 'combat' && <SceneObject id="ChapterTwo-chapter-rabbit-position-1" kind="sprite"><div className={`chapter-rabbit-position frame-${rabbitFrame}`}><CharacterLabel name="Рогатый кролик" level={1} /><MeadowSprite frame={rabbitFrame === 3 ? 2 : rabbitFrame} label="Белый рогатый кролик" /><HealthMeter value={s.rabbitHp} max={RABBIT_HP} name="HP кролика" /></div></SceneObject>}
        {s.phase !== 'combat' && !showLoot && <SceneObject id="ChapterTwo-battle-result-1" kind="effect"><div className="battle-result"><strong>{s.phase === 'rested' ? 'Силы восстановлены' : s.phase === 'healing' ? 'Добыча в инвентаре' : 'Кролик повержен'}</strong><span>{s.phase === 'rested' ? '140 / 140 HP' : '+12 опыта · +16 опыта класса'}</span></div></SceneObject>}
        {!menu && <BattleControls className="chapter-battle-actions">
          {s.phase === 'combat' && (['kick', 'punch', 'dodge'] as Move[]).map(move => {
            const Icon = moveIcons[move];
            return <SceneObject id="ChapterTwo-action-button-1" key={move} instanceKey={move} kind="control"><button key={move} className={`action-button ${move === 'kick' ? 'attack' : ''}`} disabled={!moves.includes(move)} onClick={() => dispatch({ type: 'act', move })}><Icon size={18} /><span>{moveNames[move]}</span></button></SceneObject>;
          })}
          {s.phase === 'healing' && <SceneObject id="ChapterTwo-primary-button-2" kind="control"><button className="primary-button" onClick={() => openMenu('inventory')}><Backpack size={18} />Поесть и отдохнуть</button></SceneObject>}
          {s.page === 83 && s.phase === 'rested' && s.fight < 5 && <SceneObject id="ChapterTwo-primary-button-3" kind="control"><button className="primary-button" onClick={() => dispatch({ type: 'hunt' })}>Следующий кролик<Swords size={18} /></button></SceneObject>}
          {s.phase === 'rested' && <SceneObject id="ChapterTwo-crystal-counter-1" kind="group"><span className="crystal-counter"><ItemIcon item="crystal" />{s.bag.crystal} / 5</span></SceneObject>}
        </BattleControls>}
      </>}
      {showLoot && <SceneObject id="ChapterTwo-chapter-loot-1" kind="control"><button className="chapter-loot" onClick={collectLoot} aria-label="Подобрать добычу"><span><ItemIcon item="crystal" /><ItemIcon item="herb" /><ItemIcon item={s.fight === 1 || s.fight === 3 ? 'carrot' : s.fight === 4 ? 'orange' : 'apple'} /></span><strong>Подобрать добычу</strong></button></SceneObject>}
      {battle && !training && s.phase === 'loot' && <RabbitRemains key={s.fight} />}
      {s.page === 86 && s.exchanged && <SceneObject id="ChapterTwo-exchange-items-1" kind="group"><div className="exchange-items" aria-hidden="true"><SceneObject id="ChapterTwo-exchange-crystal-1" kind="group"><span className="exchange-crystal"><ItemIcon item="crystal" /></span></SceneObject><SceneObject id="ChapterTwo-exchange-parcel-1" kind="group"><span className="exchange-parcel"><ItemIcon item="parcel" /></span></SceneObject></div></SceneObject>}
      {s.page === 86 && !s.exchanged && <SceneObject id="ChapterTwo-chapter-exchange-1" kind="control"><button className="chapter-exchange primary-button" onClick={() => dispatch({ type: 'exchange' })}><ItemIcon item="crystal" />Передать пять кристаллов</button></SceneObject>}
      {s.page === 89 && !s.parcelStored && <SceneObject id="ChapterTwo-chapter-exchange-2" kind="control"><button className="chapter-exchange primary-button" onClick={() => dispatch({ type: 'store-parcel' })}><ItemIcon item="parcel" />Убрать пакет в инвентарь</button></SceneObject>}
    </div>

    {menu && <ChapterTwoMenus key={menu} menu={menu} pinned={pinned} state={s} dispatch={dispatch} onClose={() => setManualMenu(null)} onOpenMenu={openMenu} mapFocus={mapFocus} onMapFocus={setMapFocus} mapInspected={mapInspected} onMapInspect={() => setMapInspected(true)} />}

    <SceneScope id="excluded-story-window" disabled><section className="story-window prologue-reading chapter-two-reading" aria-label="Текст главы 2">
      {!statusListing && <><h2>{speakers[s.page] ?? 'Мач Крайм · мысли'}</h2>
      <div className="dialogue-text prologue-text chapter-two-text" key={s.page} ref={text} tabIndex={0} aria-label="Текст текущей страницы" aria-live="polite"><p><BookText runs={paragraphs[s.page]} /></p></div></>}
      <footer className="reader-controls"><button className="text-button" disabled={!save.history.length} onClick={() => dispatch({ type: 'back' })}><ArrowLeft size={18} /><span>Назад</span></button><div className="chapter-reading-status"><span className="reader-progress" role="status">{s.page + 1} / {paragraphs.length}<small>{saveFailed ? 'Сохранение недоступно' : requirement ?? 'Место чтения сохранено'}</small></span>{achievement && <GameNotice key="pervert-warning" title="Ичиро предупреждает о достижении" kind="achievement">Извращенец<small>Пять девиц увидят Героя голым — будет беда.</small></GameNotice>}{battle && <BattleLog state={s} />}</div><button className="primary-button" disabled={Boolean(requirement)} title={requirement ?? undefined} onClick={() => last ? (onChapterThree ?? onContents)() : dispatch({ type: 'next' })}>{last ? onChapterThree ? 'Глава 3' : 'К главам' : 'Далее'}<ArrowRight size={18} /></button></footer>
    </section></SceneScope>
    {restartPrompt && <dialog ref={restartDialog} className="chapter-restart" aria-label="Начать главу заново" onCancel={() => setRestartPrompt(false)}><h2>Начать главу 2 заново?</h2><p>Чтение, предметы и бои этой главы начнутся сначала.</p><button className="primary-button" onClick={() => { dispatch({ type: 'restart' }); setRestartPrompt(false); setManualMenu(null); }}>Начать заново</button><button ref={restartCancel} className="text-button" onClick={() => setRestartPrompt(false)}>Продолжить чтение</button></dialog>}
  </main></SceneFrame>;
}
