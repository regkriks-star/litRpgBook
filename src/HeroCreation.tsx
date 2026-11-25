import SceneObject from './SceneObject';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { assetUrl } from './assets';

// Censorship follows the pose on the source canvas, including knees and sitting.
const censorship = [[60, 350, 245, 245], [68, 345, 248, 250], [38, 563, 244, 219], [88, 626, 262, 180]];
const mosaicColors = ['#9b8067', '#cfb398', '#bda18a', '#827263', '#dbc3a4', '#ac927b'];

export default function HeroCreation({ page }: { page: number }) {
  const [typed, setTyped] = useState('');
  const name = 'Мач Крайм';
  useEffect(() => {
    if (page !== 98) { setTyped(page > 98 ? name : ''); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setTyped(name); return; }
    setTyped('');
    let length = 0;
    const timer = window.setInterval(() => {
      length++;
      setTyped(name.slice(0, length));
      if (length >= name.length) clearInterval(timer);
    }, 135);
    return () => clearInterval(timer);
  }, [page]);

  if (page < 92) return null;
  if (page >= 101) {
    let frame = 0;
    if (page <= 103) frame = 1;
    if (page === 104 || page === 105) frame = 2;
    if (page >= 111) frame = 3;
    const [x, y, width, height] = censorship[frame];
    return <SceneObject selectAsGroup id="HeroCreation-reborn-position-1" kind="sprite"><div className={`reborn-position ${page >= 109 ? 'approaching' : ''} ${page === 112 ? 'falling' : ''}`}>
      <SceneObject id="HeroCreation-reborn-hero-1" kind="sprite"><div className="reborn-hero" role="img" aria-label="Мач Крайм в новом теле; интимная область закрыта непрозрачной мозаикой" style={{ '--body-frame': frame, backgroundImage: `url("${assetUrl('machRebirth')}")` } as CSSProperties}>
        <span className="mosaic-censor" aria-hidden="true" style={{ left: `${x / 443.5 * 100}%`, top: `${y / 887 * 100}%`, width: `${width / 443.5 * 100}%`, height: `${height / 887 * 100}%` }}>
          {Array.from({ length: 48 }, (_, i) => <i key={i} style={{ background: mosaicColors[(i * 7 + Math.floor(i / 8) * 3) % mosaicColors.length] }} />)}
        </span>
      </div></SceneObject>
    </div></SceneObject>;
  }
  let appearanceColors: ReactNode = 'Чёрно-белые волосы';
  if (page === 92) appearanceColors = 'Подбор внешности';
  if (page === 93) appearanceColors = <><SceneObject id="HeroCreation-blue-choice-1" kind="group"><span className="blue-choice">Голубые волосы · красные глаза</span></SceneObject><SceneObject id="HeroCreation-green-choice-1" kind="group"><span className="green-choice">Зелёные волосы · золотые глаза</span></SceneObject></>;
  return <SceneObject id="HeroCreation-creation-panel-1" kind="group"><section className="creation-panel" aria-label="Создание героя — воля Датарис">
    <header><span>Воля Датарис</span><h3>{page < 97 ? 'Новое тело' : 'Имя героя'}</h3></header>
    <SceneObject id="HeroCreation-appearance-portrait-1" kind="sprite"><div className={`appearance-portrait ${page === 92 ? 'appearance-forming' : ''} ${page === 93 ? 'appearance-changing' : ''}`} role="img" aria-label={page < 94 ? 'Богиня создаёт облик: голубые волосы с красными глазами, затем зелёные с золотыми' : 'Высокий худой герой с длинными чёрно-белыми волосами'} style={{ '--appearance': page < 94 ? 1 : 2, backgroundImage: `url("${assetUrl('machAppearance')}")` } as CSSProperties} /></SceneObject>
    <div className="creation-properties" tabIndex={0} aria-label="Параметры создаваемого героя">
      {page < 97 ? <><p>Высокое худое тело</p><SceneObject id="HeroCreation-appearance-colors-1" kind="group"><p className="appearance-colors">{appearanceColors}</p></SceneObject><small>Облик создаёт богиня</small></> : <>
        <label htmlFor="hero-name">Имя в мире Фиол</label>
        <SceneObject id="HeroCreation-input-1" kind="control"><input id="hero-name" value={page === 97 ? '' : typed} disabled aria-label="Имя героя" /></SceneObject>
        <SceneObject id="HeroCreation-name-announcement-1" kind="group"><span className="name-announcement" role="status">{page >= 99 ? 'Наречён: Мач Крайм' : 'Слово за героем'}</span></SceneObject>
      </>}
    </div>
  </section></SceneObject>;
}
