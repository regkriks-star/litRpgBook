import BookText from './BookText';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import type { SnapshotFrom } from 'xstate';
import { ArrowRight, Backpack, BookOpen, Check, Download, Feather, History, Maximize, RotateCcw, Settings2, Shield, Smartphone, Sparkles, Swords, Users, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { ENEMY_HP, MAX_HP, MAX_MP, WITCH_HP, WITCH_MP, SAVE_KEY, currentLine, gameMachine, intent, migrateV2Save, stableStates, unavailable, validSave, type Action, type Target } from './game';
import { bookRoute, endings, findLine, speakers, type Line } from './story';
import { playEffect, type Sound } from './sound';
import Prologue from './Prologue';
import ChapterOne from './ChapterOne';
import ChapterTwo from './ChapterTwo';
import ChapterThree from './ChapterThree';
import ChapterFour from './ChapterFour';
import ChapterFive from './ChapterFive';
import ChapterImprovements from './ChapterImprovements';
import SpeechBubble from './SpeechBubble';
import { BattleControls, Meter } from './BattleUI';
import { assetUrl, battleArt } from './assets';

// Absolute URLs also resolve correctly inside CSS custom properties in production.
type Panel = 'party' | 'bag' | 'journal' | 'settings' | 'restart' | 'guide' | null;
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type View = 'contents' | 'prologue' | 'chapter-one' | 'chapter-two' | 'chapter-three' | 'chapter-four' | 'chapter-five' | 'episode';
const viewKey = 'lazy-courage:view';
const chapters = [
  { id: 'prologue', title: 'Пролог', description: 'История одного призыва', image: 'summoning', detail: 'Читать' },
  { id: 'chapter-one', title: 'Глава 1', description: 'Аудиенция у Датарис', image: 'fiol', detail: 'Класс, дар и новая жизнь' },
  { id: 'chapter-two', title: 'Глава 2', description: 'Пять кроликов до Тантрума', image: 'tantrum', detail: 'Первый инвентарь и первая охота' },
  { id: 'chapter-three', title: 'Глава 3', description: 'Рыцарь с дубинкой', image: 'tantrumRoofs', detail: 'Тантрум, умения и первые канис' },
  { id: 'chapter-four', title: 'Глава 4', description: 'Дама в кармане', image: 'ichiroFarm', detail: 'Семья Ичиро, охота и трактир' },
  { id: 'chapter-five', title: 'Глава 5', description: 'Дуэль и гнев богини', image: 'tantrumTempleOutside', detail: 'Топор, новые навыки и побег из храма' },
  { id: 'episode', title: 'Глава 8', description: 'Плохой день для электрика', image: 'wasteland', detail: 'Читать и играть' },
] as const;

function loadView(hasEpisode: boolean): View {
  try {
    const value = localStorage.getItem(viewKey);
    if (value === 'contents' || value === 'prologue' || value === 'chapter-one' || value === 'chapter-two' || value === 'chapter-three' || value === 'chapter-four' || value === 'chapter-five' || value === 'episode') return value;
  } catch { /* Navigation also works without storage. */ }
  return hasEpisode ? 'episode' : 'contents';
}
function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const snapshot: unknown = JSON.parse(saved);
        if (validSave(snapshot)) return snapshot as SnapshotFrom<typeof gameMachine>;
      } catch { /* Fall through to the previous version below. */ }
    }
    const migrated = migrateV2Save(JSON.parse(localStorage.getItem('lazy-courage.save.v2') || 'null'));
    if (validSave(migrated)) return migrated as SnapshotFrom<typeof gameMachine>;
  } catch { /* A blocked store or malformed save starts the episode safely. */ }
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="modal" aria-label={title} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <header><h2>{title}</h2><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X /></button></header>
    <div className="modal-content">{children}</div>
  </dialog>;
}

function StoryWindow({ line, advance, battle }: { line: Line; advance: () => void; battle: boolean }) {
  const text = useRef<HTMLParagraphElement>(null);
  useEffect(() => { text.current?.scrollTo(0, 0); }, [line.id]);
  return <section className={`story-window ${battle ? 'battle-narration' : ''}`} aria-label="Текст новеллы">
    <h2>{speakers[line.speaker]}</h2>
    <p className="dialogue-text" ref={text} key={line.id} aria-live="polite" tabIndex={0}><BookText text={line.text} /></p>
    <button className="next-button" onClick={advance}>{battle ? 'Продолжить бой' : 'Далее'}{battle ? <Swords size={20} aria-hidden="true" /> : <ArrowRight size={20} aria-hidden="true" />}</button>
  </section>;
}

const actions: { id: Action; label: string; detail: string; icon: typeof Swords }[] = [
  { id: 'attack', label: 'Атака топором', detail: '39 урона', icon: Swords },
  { id: 'strike', label: 'Разящий удар', detail: '54 урона · 6 MP', icon: Sparkles },
  { id: 'bolt', label: 'Болт Саяки', detail: '8 MP Саяки', icon: Zap },
  { id: 'guard', label: 'Прикрыть Саяку', detail: 'Перехват · +4 MP', icon: Shield },
  { id: 'wait', label: 'Выждать', detail: 'Пропустить ход', icon: History },
];

export default function App() {
  const [saved] = useState(loadGame);
  const [view, setView] = useState(() => loadView(Boolean(saved && saved.value !== 'intro')));
  const [state, send, actor] = useMachine(gameMachine, { snapshot: saved });
  const c = state.context;
  const phase = state.value;
  const line = currentLine(c, phase);
  const battleDialogue = phase.endsWith('Dialogue');
  const battle = battleDialogue || ['player', 'hit', 'enemy'].includes(phase);
  const bubble = battleDialogue && line?.speaker !== 'narrator' ? line : null;
  const [panel, setPanel] = useState<Panel>(null);
  const [showImprovements, setShowImprovements] = useState(false);
  const [target, setTarget] = useState<Target>('mach');
  const [muted, setMuted] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [savedStatus, setSavedStatus] = useState('Сохранено');
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [pwaStatus, setPwaStatus] = useState('');
  const [screenMessage, setScreenMessage] = useState('');
  const audio = useRef<AudioContext | null>(null);
  const soundedPhase = useRef(phase);
  const anticipated = intent(c);
  const guild = phase === 'ending' && Boolean(line && line.paragraph >= 21);

  useEffect(() => {
    if (!stableStates.includes(phase)) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(actor.getPersistedSnapshot())); setSavedStatus('Сохранено'); }
    catch { setSavedStatus('Сохранение недоступно'); }
  }, [actor, phase, state]);
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    const installed = () => { setInstall(null); setPwaStatus('Игра установлена'); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setPwaStatus('Готово к игре без интернета')).catch(() => setPwaStatus('Офлайн-режим пока недоступен'));
    }
    return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installed); };
  }, []);
  useEffect(() => {
    const portrait = matchMedia('(orientation: portrait) and (max-width: 950px)');
    const closeMenu = () => { if (portrait.matches) setPanel(null); };
    portrait.addEventListener('change', closeMenu);
    return () => portrait.removeEventListener('change', closeMenu);
  }, []);
  const playSound = useCallback((sound: Sound = 'click') => {
    if (muted) return;
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume().catch(() => setMuted(true));
      playEffect(audio.current, sound);
    } catch { setMuted(true); }
  }, [muted]);
  useEffect(() => {
    if (soundedPhase.current === phase) return;
    soundedPhase.current = phase;
    if (phase === 'hit' && (c.lastAction === 'attack' || c.lastAction === 'strike' || c.lastAction === 'bolt')) {
      playSound(c.lastAction);
    } else if (phase === 'enemy') {
      // enemyAction has already advanced the turn before the animation starts.
      playSound(intent({ ...c, turn: c.turn - 1 }).poison ? 'sting' : 'claws');
    }
  }, [phase, c, playSound]);
  useEffect(() => () => { void audio.current?.close().catch(() => {}); }, []);
  const toggleSound = () => {
    try {
      if (muted) {
        audio.current ??= new AudioContext();
        void audio.current.resume().catch(() => setMuted(true));
      } else {
        void audio.current?.suspend().catch(() => {});
      }
      setMuted(!muted);
    } catch { setMuted(true); }
  };
  const advance = useCallback(() => { playSound(); send({ type: 'NEXT' }); }, [playSound, send]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== 'episode' || panel || e.repeat || !(e.target instanceof HTMLElement) || e.target.closest('input, textarea, dialog, select')) return;
      // Space on a focused button already activates it; arrows should still page.
      if (e.key === ' ' && e.target.closest('button')) return;
      if ((e.key === ' ' || e.key === 'ArrowRight') && (battleDialogue || phase === 'ending')) { e.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, panel, phase, battleDialogue, view]);

  const fullscreen = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      if (orientation.lock) await orientation.lock('landscape');
      setScreenMessage('');
    } catch { setScreenMessage('Поверните телефон горизонтально; при необходимости отключите блокировку поворота.'); }
  };
  const act = (action: Action) => {
    if (phase !== 'player') return;
    if (unavailable(c, action, target)) return;
    if (!['attack', 'strike', 'bolt'].includes(action)) playSound();
    send({ type: 'ACT', action, target }); setPanel(null);
  };
  const attackWho = phase === 'hit' && c.lastAction === 'bolt' ? 'sayaka' : phase === 'hit' && ['attack', 'strike'].includes(c.lastAction ?? '') ? 'mach' : phase === 'enemy' ? 'scorpion' : null;
  const navigate = (next: View) => {
    setPanel(null);
    setView(next);
    try { localStorage.setItem(viewKey, next); } catch { /* Keep navigation available. */ }
  };
  const openEpisode = () => {
    playSound();
    navigate('episode');
    if (phase === 'intro') send({ type: 'START' });
  };

  if (view === 'prologue') return <Prologue onContents={() => navigate('contents')} onChapterOne={() => navigate('chapter-one')} />;
  if (view === 'chapter-one') return <ChapterOne onContents={() => navigate('contents')} />;
  if (view === 'chapter-two') return <ChapterTwo onContents={() => navigate('contents')} onChapterThree={() => navigate('chapter-three')} />;
  if (view === 'chapter-three') return <ChapterThree onContents={() => navigate('contents')} onChapterFour={() => navigate('chapter-four')} />;
  if (view === 'chapter-four') return <ChapterFour onContents={() => navigate('contents')} onChapterFive={() => navigate('chapter-five')} />;

  if (view === 'chapter-five') return <ChapterFive onContents={() => navigate('contents')} />;

  if (view === 'contents' || phase === 'intro') return <main className="contents-screen">
    <img className="contents-backdrop" src={assetUrl('kyoto')} alt="" />
    <header className="book-title"><span>Харитон Мамбурин</span><h1>Ленивое<br />мужество</h1><p>Но наша история будет<br />всё-таки про электрика.</p></header>
    <section className="chapter-list" aria-labelledby="contents-title">
      <h2 id="contents-title">Оглавление</h2>
      {chapters.map(chapter => <button key={chapter.id} className="chapter-entry" aria-label={`${chapter.title}: ${chapter.description}`} onClick={() => chapter.id === 'episode' ? openEpisode() : navigate(chapter.id)}>
        <img src={assetUrl(chapter.image)} alt="" />
        <span className="chapter-entry-text"><strong>{chapter.title}</strong><span>{chapter.description}</span><small>{chapter.id === 'episode' && phase !== 'intro' ? 'Продолжить' : chapter.detail}</small></span>
        <ArrowRight size={22} />
      </button>)}
      <p className="contents-note">История пополняется. Здесь будут появляться новые главы.</p>
      <button className="text-button improvements-button" onClick={() => setShowImprovements(true)}>Улучшения глав<BookOpen size={18} aria-hidden="true" /></button>
      <button className="text-button improvements-button" onClick={() => { const url = new URL(location.href); url.searchParams.set('scene-editor', '1'); location.assign(url.href); }}>Редактор сцен<Settings2 size={18} aria-hidden="true" /></button>
    </section>
    {showImprovements && <ChapterImprovements onClose={() => setShowImprovements(false)} />}
  </main>;

  return <div className={`app ${largeText ? 'large-text' : ''}`}>
    <div className="rotate-screen" role="status"><Smartphone size={54} /><h1>Поверните телефон</h1><p>Эта история играется горизонтально.</p><button className="primary-button" onClick={() => void fullscreen()}>Развернуть игру<Maximize size={18} /></button><button className="text-button" onClick={() => navigate('contents')}>Оглавление</button>{screenMessage && <p>{screenMessage}</p>}</div>
    <main className={`stage ${battle ? 'battle' : 'novel'} ${battle && c.wave === 2 ? 'second-wave' : ''} ${guild ? 'guild' : ''} ${phase}`} aria-label={battle ? 'Поле боя' : 'Визуальная новелла'}>
      <img className="landscape" src={assetUrl(guild ? 'guild' : 'wasteland')} alt={guild ? 'Гильдия Авантюристов' : 'Песчаные пустоши Хаис-Лумпура'} fetchPriority="high" />
      <div className="atmosphere" />
      <header className="game-header">
        <span className="location"><Feather size={18} />{guild ? 'Гильдия Авантюристов · восемь часов спустя' : 'Пустоши Хаис-Лумпура'}</span>
        <nav aria-label="Меню игры">
          <button className="icon-button" aria-label="Оглавление" title="Оглавление" onClick={() => navigate('contents')}><BookOpen size={19} /></button>
          <button className="icon-button" aria-label="Отряд" title="Отряд" onClick={() => setPanel('party')}><Users size={19} /></button>
          <button className="icon-button" aria-label="Журнал" title="Журнал" onClick={() => setPanel('journal')}><BookOpen size={19} /></button>
          <button className="icon-button" aria-label="Порядок действий" title="Порядок действий" onClick={() => setPanel('guide')}><Swords size={19} /></button>
          <button className="icon-button" aria-label="Настройки" title="Настройки" onClick={() => setPanel('settings')}><Settings2 size={19} /></button>
        </nav>
      </header>

      {!battle && <div className={`novel-actors speaking-${line?.speaker ?? 'none'}`} aria-hidden="true">
        <div className="novel-character mach"><img src={assetUrl('companions')} alt="" /></div>
        <div className="novel-character sayaka"><img src={assetUrl('companions')} alt="" /></div>
      </div>}

      {phase === 'chapter' && <section className="chapter-card" role="status"><h1>Глава 8</h1></section>}

      {battle && <>
        <div className="battle-caption"><strong>Скорпион {c.wave} / 2</strong><span>Ход {phase === 'enemy' || phase === 'enemyDialogue' ? Math.max(1, c.turn - 1) : c.turn}</span></div>
        <div className="battlefield">
          {(['sayaka', 'mach', 'scorpion'] as const).map(who => {
            const enemy = who === 'scorpion';
            if (enemy && c.enemyHp === 0) return null;
            const attacking = attackWho === who;
            const hurting = enemy ? phase === 'hit' && c.enemyDamage > 0 : (phase === 'enemy' || phase === 'hit' && c.lastAction === 'bolt') && c.lastTarget === who && c.damage > 0;
            const hp = who === 'mach' ? c.hp : who === 'sayaka' ? c.witchHp : c.enemyHp;
            const max = who === 'mach' ? MAX_HP : who === 'sayaka' ? WITCH_HP : ENEMY_HP;
            const poison = who === 'mach' ? c.poison : who === 'sayaka' ? c.witchPoison : 0;
            return <div key={enemy ? `${who}-${c.wave}` : who} data-character={who} className={`combatant ${who} ${attacking ? 'attacking' : ''} ${hurting ? 'hurting' : ''} ${hp === 0 ? 'fallen' : ''} ${who === 'scorpion' && phase === 'arrivalDialogue' ? 'arriving' : ''}`}>
              {bubble?.speaker === who && <SpeechBubble key={bubble.id} line={bubble} />}
              <div className="sprite-motion"><div className="sprite" role="img" aria-label={enemy ? `Хитрый скорпион ${c.wave}` : speakers[who]} style={{ '--sprite': `url("${assetUrl(battleArt[who])}")` } as CSSProperties} /></div>
              {hurting && <span className="damage" aria-hidden="true">−{enemy ? c.enemyDamage : c.damage}</span>}
              <div className="fighter-status"><strong>{enemy ? `Скорпион ${c.wave}` : who === 'mach' ? 'Мач' : 'Саяка'}{poison > 0 && <small className="poison">Яд {poison}</small>}</strong>
                <Meter value={hp} max={max} name={enemy ? `HP скорпиона ${c.wave}` : `HP ${who === 'mach' ? 'Мача' : 'Саяки'}`} kind={enemy ? 'enemy-hp' : 'hp'} />
                {!enemy && <Meter value={who === 'mach' ? c.mp : c.witchMp} max={who === 'mach' ? MAX_MP : WITCH_MP} name={`Мана ${who === 'mach' ? 'Мача' : 'Саяки'}`} kind="mp" />}
              </div>
            </div>;
          })}
        </div>
        {battleDialogue && line && <>
          {line.speaker === 'narrator' ? <StoryWindow line={line} advance={advance} battle /> : <div className="bubble-controls"><span>Нажмите, чтобы продолжить</span><button className="next-button" onClick={advance}>Продолжить бой<Swords size={20} aria-hidden="true" /></button></div>}
        </>}
        {!battleDialogue && <BattleControls caption={phase === 'player' ? 'Ваш ход' : phase === 'enemy' ? 'Атака скорпиона' : 'Действие отряда'} message={phase === 'player' ? `${anticipated.title} → ${speakers[anticipated.target]}` : c.log.at(-1)}>
          {actions.map(({ id, label, detail, icon: Icon }) => <button key={id} className={`action-button ${id}`} disabled={phase !== 'player' || Boolean(unavailable(c, id))} title={unavailable(c, id) ?? detail} onClick={() => act(id)}><Icon size={19} /><span>{label}<small>{detail}</small></span></button>)}<button className="action-button" disabled={phase !== 'player'} onClick={() => setPanel('bag')}><Backpack size={19} /><span>Предметы<small>Лечение и противоядие</small></span></button>
        </BattleControls>}
      </>}

      {phase === 'ending' && line && <StoryWindow line={line} advance={advance} battle={false} />}
      {['victory', 'defeat', 'complete'].includes(phase) && <section className="outcome" aria-live="polite">
        <Feather size={35} /><h1>{phase === 'defeat' ? 'Нужен другой план' : phase === 'victory' ? 'Оба скорпиона повержены' : 'Продолжение следует'}</h1>
        <p>{phase === 'defeat' ? `${c.hp === 0 ? 'Мач' : 'Саяка'} больше не может сражаться. Прикрывайте Саяку и используйте предметы для нужного героя.` : phase === 'victory' ? `Мач: ${c.hp} HP. Саяка: ${c.witchHp} HP. Охота только начинается.` : 'Охота позади. Мач и Саяка записались в Гильдию Авантюристов.'}</p>
        <button className="primary-button" onClick={() => send({ type: phase === 'defeat' ? 'RETRY' : phase === 'victory' ? 'CONTINUE' : 'RESTART' })}>{phase === 'defeat' ? 'Повторить оба боя' : phase === 'victory' ? 'После боя' : 'Пройти ещё раз'}<ArrowRight size={19} /></button>
        {phase === 'defeat' && <button className="text-button" onClick={() => setPanel('guide')}>Посмотреть порядок действий</button>}
      </section>}
      <span className="save-status"><Check size={11} />{savedStatus}{phase === 'ending' ? ` · ${c.endingLine + 1}/${endings.length}` : ''}</span>
    </main>

    {panel && <Modal title={{ party: 'Отряд', bag: 'Дорожная сумка', journal: 'Журнал', settings: 'Настройки', restart: 'Начать заново?', guide: 'Пройти по событиям книги' }[panel]} onClose={() => setPanel(null)}>
      {panel === 'party' && (['mach', 'sayaka'] as const).map(who => <article className="party-member" key={who}><h3>{speakers[who]}</h3><p>{who === 'mach' ? 'Рыцарь Прекрасной Дамы · плотницкий топор' : 'Ведьма · электрический болт'}</p><Meter value={who === 'mach' ? c.hp : c.witchHp} max={who === 'mach' ? MAX_HP : WITCH_HP} name={`Здоровье ${speakers[who]}`} /><Meter value={who === 'mach' ? c.mp : c.witchMp} max={who === 'mach' ? MAX_MP : WITCH_MP} name={`Мана ${speakers[who]}`} kind="mp" /></article>)}
      {panel === 'bag' && <>
        <fieldset className="item-target"><legend>Кому дать предмет?</legend>{(['mach', 'sayaka'] as const).map(who => <label key={who}><input type="radio" name="target" value={who} checked={target === who} onChange={() => setTarget(who)} />{speakers[who]}</label>)}</fieldset>
        <article className="item-row"><div><h3>Яблоко ×{c.apples}</h3><p>Восстанавливает до 40 HP. Занимает ход.</p></div><button className="primary-button" disabled={phase !== 'player' || Boolean(unavailable(c, 'apple', target))} title={unavailable(c, 'apple', target) ?? ''} onClick={() => act('apple')}>Съесть</button></article>
        <article className="item-row"><div><h3>Противоядие ×{c.antidotes}</h3><p>Снимает яд выбранного героя; Мач прикрывает отряд.</p></div><button className="primary-button" disabled={phase !== 'player' || Boolean(unavailable(c, 'antidote', target))} title={unavailable(c, 'antidote', target) ?? ''} onClick={() => act('antidote')}>Выпить</button></article>
      </>}
      {panel === 'journal' && <><p className="source-note">Харитон Мамбурин, «Ленивое мужество». Начало главы 8 до записи в Гильдию. Книжный текст сохранён полностью. Параметры и команды боя — игровая адаптация.</p><h3>Прочитано</h3>{c.history.map((id, i) => { const entry = findLine(id); return <article className="journal-line" key={`${id}-${i}`}><strong>{speakers[entry.speaker]}</strong><p><BookText text={entry.text} /></p></article>; })}<details><summary>Журнал боя</summary>{c.log.map((entry, i) => <p className="log-entry" key={i}>{entry}</p>)}</details></>}
      {panel === 'guide' && <><p>В книге: промах Саяки → укол Мача → три удара топором → второй скорпион подкрадывается к Саяке → её крик → Мач выжидает ещё один укус и спасает её.</p><p className="source-note">Дальнейшие удары по второму скорпиону в книге не перечислены. Последовательность ниже — проверенный игровой маршрут, который воспроизводит описанные события и доводит бой до победы.</p><ol className="route">{bookRoute.map(step => <li key={step}>{step}</li>)}</ol><p>Лечение не обязательно. Чтение реплик не тратит ход. Урон и запас здоровья подобраны для прохождения обоих боёв без случайности.</p></>}
      {panel === 'settings' && <>
        <button className="setting-row" onClick={toggleSound}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}Звук: {muted ? 'выключен' : 'включён'}</button>
        <label className="setting-row"><BookOpen size={20} />Крупный текст<input type="checkbox" checked={largeText} onChange={e => setLargeText(e.target.checked)} /></label>
        <button className="setting-row" onClick={() => void fullscreen()}><Maximize size={20} />Полный экран</button>{screenMessage && <p>{screenMessage}</p>}
        {install ? <button className="setting-row" onClick={async () => { try { await install.prompt(); const result = await install.userChoice; if (result.outcome === 'accepted') setPwaStatus('Игра установлена'); } catch { setPwaStatus('Установите игру через меню браузера'); } setInstall(null); }}><Download size={20} />Установить игру</button> : <p className="install-help">Чтобы установить игру, выберите «Установить приложение» в меню браузера. На iPhone: «Поделиться» → «На экран Домой».</p>}
        {pwaStatus && <p className="pwa-status" role="status">{pwaStatus}</p>}
        <button className="setting-row" onClick={() => setPanel('restart')}><RotateCcw size={20} />Начать эпизод заново</button>
      </>}
      {panel === 'restart' && <><p>Прогресс обоих боёв и чтения будет сброшен.</p><button className="primary-button" onClick={() => { send({ type: 'RESTART' }); setPanel(null); }}>Начать заново<RotateCcw size={18} /></button></>}
    </Modal>}
  </div>;
}
