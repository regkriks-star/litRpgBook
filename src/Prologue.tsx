import BookText from './BookText';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import paragraphs from './prologue.json';
import { assetUrl } from './assets';
import './prologue.css';

const saveKey = 'lazy-courage:prologue-page';
const illustrations = {
  kyoto: 'Кэтсуо за партой у окна с видом на Киото',
  prologueFriend: 'Игараси поддерживает Кэтсуо у открытой двери и помогает ему вернуться к обычной жизни',
  prologueApartment: 'Тело электрика на диване в саратовской квартире; перед диваном свободное место на потёртом ламинате',
  platform: 'Случайный толчок на перроне перед прибывающей электричкой',
  ascent: 'Душа Кэтсуо поднимается над Киото на рассвете',
  summoning: 'Кэтсуо перед сияющей печатью призыва в космосе',
  satellite: 'Спутник преграждает путь магии, и она устремляется к Земле',
  electrician: 'Магическая печать находит душу электрика в саратовской квартире',
  cat: 'Персидский кот нежится на подоконнике в Омске',
};
const pages: { paragraphs: number[]; image: keyof typeof illustrations }[] = [
  { paragraphs: [0], image: 'kyoto' },
  { paragraphs: [1], image: 'kyoto' },
  { paragraphs: [2], image: 'prologueFriend' },
  { paragraphs: [3], image: 'kyoto' },
  { paragraphs: [4], image: 'platform' },
  { paragraphs: [5, 6, 7, 8], image: 'ascent' },
  { paragraphs: [9], image: 'summoning' },
  { paragraphs: [10], image: 'satellite' },
  { paragraphs: [11], image: 'prologueApartment' },
  { paragraphs: [12], image: 'prologueApartment' },
  { paragraphs: [13], image: 'cat' },
  { paragraphs: [14], image: 'prologueApartment' },
];

function loadPage() {
  try {
    const value = Number(localStorage.getItem(saveKey));
    if (Number.isInteger(value) && value >= 0 && value < pages.length) return value;
  } catch { /* Reading also works without storage. */ }
  return 0;
}

export default function Prologue({ onContents, onChapterOne }: { onContents: () => void; onChapterOne: () => void }) {
  const [page, setPage] = useState(loadPage);
  const [saveFailed, setSaveFailed] = useState(false);
  const text = useRef<HTMLDivElement>(null);
  const current = pages[page];
  const last = page === pages.length - 1;

  useEffect(() => {
    text.current?.scrollTo(0, 0);
    try { localStorage.setItem(saveKey, String(page)); }
    catch { setSaveFailed(true); }
    const next = pages[page + 1];
    if (next) new Image().src = assetUrl(next.image);
  }, [page]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || !(event.target instanceof HTMLElement) || event.target.closest('input, textarea, select')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); setPage(p => Math.min(p + 1, pages.length - 1)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setPage(p => Math.max(p - 1, 0)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <main className={`stage prologue-reader ${current.image === 'prologueApartment' ? 'prologue-apartment' : ''}`} aria-label="Пролог">
    <header className="game-header reader-header"><div className="reader-toolbar" role="navigation" aria-label="Меню игры">
      <button className="icon-button" aria-label="Оглавление" title="Оглавление" onClick={onContents}><BookOpen size={18} /></button>
      <button className="icon-button" aria-label="Читать пролог сначала" title="Читать сначала" onClick={() => setPage(0)}><RotateCcw size={18} /></button>
    </div></header>
    <figure className="prologue-illustration">
      <img key={current.image} src={assetUrl(current.image)} alt={illustrations[current.image]} fetchPriority="high" />
    </figure>
    <div className="atmosphere" aria-hidden="true" />
    {current.image === 'prologueApartment' && <div className={`apartment-event ${page === 9 ? 'apartment-summoning' : ''}`} key={page} role="img" aria-label={page === 8 ? 'Душа электрика парит над ламинатом перед своим телом' : 'После магической вспышки душа исчезла; тело осталось на диване'}>
      {(page === 8 || page === 9) && <div className="apartment-soul" />}
      {page === 9 && <><div className="apartment-seal"><i /><i /></div><div className="apartment-flash" /></>}
    </div>}
    <section className="story-window prologue-reading" aria-label="Текст пролога">
      <h2>Рассказчик</h2>
      <div className="dialogue-text prologue-text" key={page} ref={text} tabIndex={0} aria-label="Текст текущей страницы" aria-live="polite">
        {current.paragraphs.map(index => <p key={index}><BookText runs={paragraphs[index]} /></p>)}
      </div>
      <footer className="reader-controls">
        <button className="text-button" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft size={18} /><span>Назад</span></button>
        <span className="reader-progress" role="status">{page + 1} / {pages.length}<small>{saveFailed ? 'Сохранение недоступно' : 'Место чтения сохранено'}</small></span>
        <button className="primary-button" onClick={() => last ? onChapterOne() : setPage(page + 1)}>{last ? 'К главе 1' : 'Далее'}<ArrowRight size={18} /></button>
      </footer>
    </section>
  </main>;
}
