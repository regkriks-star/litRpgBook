import SceneObject, { SceneFrame, SceneScope } from './SceneObject';
import BookText from './BookText';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import paragraphs from './chapter-one.json';
import { datarisPoses, datarisGestures, registeredPose, registeredGesture } from './dataris-poses';
import { assetUrl } from './assets';
import { chapterCue, chapterSpeaker, goddessPose } from './chapter-one-staging';
import ClassCards from './ClassCards';
import HeroCreation from './HeroCreation';
import ReaderSettings from './ReaderSettings';
import './chapter-one.css';

const saveKey = 'lazy-courage:chapter-one-page';
const poses = {
  regal: 'Датарис торжественно обращается к голубой душе электрика',
  voice: 'Датарис смущённо поднимает ладонь, даруя душе голос',
  puzzled: 'Датарис сгорбилась на троне и недоумённо свела глаза',
  alarmed: 'Испуганная Датарис хватается обеими руками за голову',
  resolve: 'Датарис решительно сжимает кулачки перед собой',
  cards: 'Датарис вытаскивает журнал из-за спины и призывает карты',
  reading: 'Датарис читает глянцевый журнал и хихикает',
  shy: 'Смущённая Датарис тыкает указательными пальцами друг в дружку',
  clap: 'Датарис радостно хлопает в ладоши',
  casting: 'Датарис встала перед троном и колдует среди сияющих кругов',
  covered: 'Датарис прикрывает лицо ладонью и смотрит сквозь пальцы',
  dismiss: 'Датарис взмахом руки отправляет героя в мир Фиол',
};

function loadPage() {
  try {
    const value = Number(localStorage.getItem(saveKey));
    if (Number.isInteger(value) && value >= 0 && value < paragraphs.length) return value;
  } catch { /* Reading remains available without storage. */ }
  return 0;
}

export default function ChapterOne({ onContents, preview }: { onContents: () => void; preview?: { page: number } }) {
  const [page, setPage] = useState(() => preview?.page ?? loadPage());
  const [saveFailed, setSaveFailed] = useState(false);
  const text = useRef<HTMLDivElement>(null);
  const last = page === paragraphs.length - 1;
  const pose = goddessPose(page);
  const speaking = chapterSpeaker(page);
  const hero = page >= 98 ? 'Мач Крайм' : 'Электрик';
  const speaker = { goddess: 'Датарис', soul: hero, narrator: `${hero} · мысли` }[speaking];
  const cue = chapterCue(page);
  const extra = datarisGestures.find(frame => frame.name === pose);

  useEffect(() => {
    text.current?.scrollTo(0, 0);
    if (preview) return;
    try { localStorage.setItem(saveKey, String(page)); }
    catch { setSaveFailed(true); }
  }, [page]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || !(event.target instanceof HTMLElement) || event.target.closest('input, textarea, select, dialog')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); setPage(p => Math.min(p + 1, paragraphs.length - 1)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setPage(p => Math.max(p - 1, 0)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <SceneFrame chapter={1} frame={page}><main className={`stage prologue-reader chapter-one reader-surface speaking-${speaking} cue-${cue}`} aria-label="Глава 1">
    <SceneScope id="excluded-game-header" disabled><header className="game-header reader-header"><div className="reader-toolbar" role="navigation" aria-label="Меню игры">
      <button className="icon-button" aria-label="Оглавление" title="Оглавление" onClick={onContents}><BookOpen size={18} /></button>
      <button className="icon-button" aria-label="Читать главу 1 сначала" title="Читать сначала" onClick={() => setPage(0)}><RotateCcw size={18} /></button>
      <ReaderSettings />
    </div></header>
    </SceneScope>
    <figure className="prologue-illustration chapter-one-background">
      <img src={assetUrl('fiol')} alt="Голубая планета Фиол с незнакомыми материками под звёздной пустотой" fetchPriority="high" />
    </figure>
    <div className="atmosphere" aria-hidden="true" />
    <div className="audience-scene" key={cue}>
      <SceneObject id="ChapterOne-fiol-shadow-1" kind="effect"><div className="fiol-shadow" aria-hidden="true" /></SceneObject>
      <SceneObject id="ChapterOne-divine-seal-1" kind="effect"><div className="divine-seal" aria-hidden="true"><SceneObject id="ChapterOne-i-1" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-2" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-3" kind="effect"><i /></SceneObject></div></SceneObject>
      <SceneObject selectAsGroup id="ChapterOne-goddess-position-1" kind="sprite"><div className="goddess-position">
        <SceneObject id="ChapterOne-goddess-sprite-1" kind="sprite"><div className={`goddess-sprite pose-${pose} ${extra ? 'extra-pose' : ''}`} role="img" aria-label={poses[pose]}>
          {extra ? <div className="goddess-extra-frame" data-pose={extra.name} style={{ ...registeredGesture(extra), backgroundImage: `url("${assetUrl('datarisGestures')}")` }} /> :
          <div className="goddess-poses" style={{ '--pose': datarisPoses.findIndex(frame => frame.name === pose) } as CSSProperties}>
            {datarisPoses.map((frame, index) => <div className="goddess-cell" key={frame.name} aria-hidden="true">
              <div className="goddess-frame" data-pose={frame.name} style={{
                ...registeredPose(frame),
                backgroundImage: `url("${assetUrl('dataris')}")`,
                backgroundPosition: `${index % 3 * 50}% ${Math.floor(index / 3) * 100}%`,
              }} />
            </div>)}
          </div>}
        </div></SceneObject>
      </div></SceneObject>
      {page < 101 && <SceneObject selectAsGroup id="ChapterOne-soul-position-1" kind="sprite"><div className={`soul-position ${page >= 99 ? 'soul-entering' : ''}`}>
        <SceneObject id="ChapterOne-soul-motion-1" kind="sprite"><div className="soul-motion">
          <SceneObject id="ChapterOne-soul-1" kind="sprite"><div className="soul" role="img" aria-label="Душа электрика — светящийся голубой шар без тела"><SceneObject id="ChapterOne-i-4" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-5" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-6" kind="effect"><i /></SceneObject></div></SceneObject>
          <SceneObject id="ChapterOne-voice-rings-1" kind="effect"><div className="voice-rings" aria-hidden="true"><SceneObject id="ChapterOne-i-7" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-8" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-9" kind="effect"><i /></SceneObject></div></SceneObject>
        </div></SceneObject>
      </div></SceneObject>}
      <SceneObject id="ChapterOne-spell-circles-1" kind="effect"><div className="spell-circles" aria-hidden="true"><SceneObject id="ChapterOne-i-10" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-11" kind="effect"><i /></SceneObject><SceneObject id="ChapterOne-i-12" kind="effect"><i /></SceneObject></div></SceneObject>
    </div>
    {page >= 25 && page <= 91 && <ClassCards page={page} onInspect={() => setPage(page === 25 ? 26 : 27)} />}
    <HeroCreation page={page} />
    <SceneScope id="excluded-story-window" disabled><section className="story-window prologue-reading" aria-label="Текст главы 1">
      <h2>{speaker}</h2>
      <div className="dialogue-text prologue-text chapter-one-text" key={page} ref={text} tabIndex={0} aria-label="Текст текущей страницы" aria-live="polite">
        <p><BookText runs={paragraphs[page]} /></p>
      </div>
      <footer className="reader-controls">
        <button className="text-button" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft size={18} /><span>Назад</span></button>
        <span className="reader-progress" role="status">{page + 1} / {paragraphs.length}<small>{saveFailed ? 'Сохранение недоступно' : last ? 'Конец главы 1' : 'Место чтения сохранено'}</small></span>
        <button className="primary-button" onClick={() => last ? onContents() : setPage(page + 1)}>{last ? 'К главам' : 'Далее'}<ArrowRight size={18} /></button>
      </footer>
    </section></SceneScope>
  </main></SceneFrame>;
}
