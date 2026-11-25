import SceneObject from './SceneObject';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import BookText from './BookText';
import { assetUrl } from './assets';
import { cardCount, cardForPage, cards, gifts, giftReplies, type CardId } from './chapter-one-staging';

function CardFace({ id, amended }: { id: CardId; amended: boolean }) {
  const card = cards[id];
  return <>
    <SceneObject id="ClassCards-card-painting-1" kind="sprite"><span className="card-painting" aria-hidden="true" style={{ backgroundImage: `url("${assetUrl('classCards')}")`, backgroundPosition: `${card.frame % 3 * 50}% ${Math.floor(card.frame / 3) * 100}%` }} /></SceneObject>
    <span className="card-copy">
      <strong>{card.title}</strong>
      <span className="card-description" tabIndex={0} aria-label={`Описание: ${card.title}`}><BookText text={card.description} /></span>
      {id === 'lady' && <span className="card-amendment" key={String(amended)}><BookText text={amended ? 'Теперь даму можно менять!' : 'Невозможность сменить даму.'} /></span>}
    </span>
  </>;
}

export default function ClassCards({ page, onInspect }: { page: number; onInspect: () => void }) {
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [detail, setDetail] = useState<CardId | null>(null);
  const [choice, setChoice] = useState<{ page: number; id: keyof typeof giftReplies } | null>(null);
  const field = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = cardForPage(page);
  const count = cardCount(page);
  const showGifts = page >= 84 && page <= 91;
  const departing = page === 28 || page === 48;
  const canInspect = page === 25 || page === 26;
  const amended = page >= 70;
  const feedback = choice?.page === page ? giftReplies[choice.id] : '';

  useEffect(() => {
    const portrait = matchMedia('(orientation: portrait) and (max-width: 950px)');
    const close = () => { if (portrait.matches) { dialog.current?.close(); setDetail(null); } };
    portrait.addEventListener('change', close);
    return () => portrait.removeEventListener('change', close);
  }, []);

  function openDetail(id: CardId) {
    setDetail(id);
    dialog.current?.showModal();
  }

  return <>
    <SceneObject id="ClassCards-class-field-1" kind="group"><div ref={field} className={`class-field ${showGifts ? 'gift-field' : ''}`} aria-label={showGifts ? 'Божественные дары' : 'Карты классов'}>
      <SceneObject id="ClassCards-card-sky-1" kind="group"><div className="card-sky" aria-hidden={!canInspect} data-count={count}>
        {Array.from({ length: 72 }, (_, i) => {
          // Stable positions: filtering dissolves existing cards without reshuffling.
          const hidden = i >= count;
          const style = { '--x': `${5 + (i * 37 % 90)}%`, '--y': `${6 + (i * 23 % 75)}%`, '--tilt': `${i * 19 % 38 - 19}deg`, '--delay': `${i % 12 * 35}ms` } as CSSProperties;
          return <SceneObject id="ClassCards-scattered-card-1" key={i} instanceKey={i} kind="control"><button className={`scattered-card ${hidden ? 'vanished' : ''} ${page === 36 && i >= 12 && i < 18 ? 'second-filter' : ''}`} key={i} style={style} disabled={!canInspect || hidden} tabIndex={canInspect && !hidden ? 0 : -1} aria-label={`Открыть карту ${i + 1}`} onClick={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const bounds = field.current!.getBoundingClientRect();
            setOrigin({ x: rect.x + rect.width / 2 - bounds.x - bounds.width * .33, y: rect.y + rect.height / 2 - bounds.y - bounds.height / 2 });
            onInspect();
          }}><span>✦</span></button></SceneObject>;
        })}
      </div></SceneObject>
      {page === 25 && <SceneObject id="ClassCards-class-invitation-1" kind="group"><div className="class-invitation"><strong>Выбор класса</strong><span>Коснитесь любой карты</span></div></SceneObject>}
      {selected && <SceneObject id="ClassCards-revealed-card-1" key={selected} kind="group"><div key={selected} className={`revealed-card ${departing ? 'card-departing' : ''} card-${selected}`} style={{ '--from-x': `${origin.x}px`, '--from-y': `${origin.y}px` } as CSSProperties}>
        <SceneObject id="ClassCards-card-turn-1" kind="group"><div className="card-turn"><SceneObject id="ClassCards-card-back-1" kind="group"><span className="card-back" aria-hidden="true">✦</span></SceneObject><SceneObject id="ClassCards-illustrated-card-1" kind="group"><article className="illustrated-card"><CardFace id={selected} amended={amended} /></article></SceneObject></div></SceneObject>
        <SceneObject id="ClassCards-card-inspect-1" kind="control"><button className="card-inspect" onClick={() => openDetail(selected)} aria-label={`Прочитать карту «${cards[selected].title}»`}>↗</button></SceneObject>
      </div></SceneObject>}
      {showGifts && <SceneObject id="ClassCards-gift-cards-1" kind="group"><div className="gift-cards">
        {gifts.map(id => <SceneObject id="ClassCards-illustrated-card-2" key={id} instanceKey={id} kind="control"><article key={id} className={`illustrated-card gift-card ${page === 85 + gifts.indexOf(id) ? 'being-read' : ''} ${(page >= 89 || choice?.id === 'victories') && id === 'victories' ? 'chosen-gift' : ''}`} onClick={() => {
          setChoice({ page, id });
          openDetail(id);
        }}>
          <CardFace id={id} amended={false} />
          <SceneObject id="ClassCards-gift-hit-1" kind="control"><button className="gift-hit" aria-label={`Выбрать «${cards[id].title}»`} /></SceneObject>
        </article></SceneObject>)}
      </div></SceneObject>}
    </div></SceneObject>
    <SceneObject id="ClassCards-card-detail-dialog-1" kind="control"><dialog ref={dialog} className="card-detail-dialog" aria-label="Описание карты" onCancel={() => setDetail(null)} onClick={event => { if (event.target === dialog.current) { dialog.current.close(); setDetail(null); } }}>
      {detail && <>
        <SceneObject id="ClassCards-card-detail-close-1" kind="control"><button className="card-detail-close icon-button" aria-label="Закрыть карту" onClick={() => { dialog.current?.close(); setDetail(null); }}><X /></button></SceneObject>
        <SceneObject id="ClassCards-illustrated-card-3" kind="group"><article className="illustrated-card card-detail"><CardFace id={detail} amended={amended} /></article></SceneObject>
        {feedback && <SceneObject id="ClassCards-card-reaction-1" kind="group"><p className="card-reaction" role="status">{feedback}</p></SceneObject>}
        <SceneObject id="ClassCards-text-button-1" kind="control"><button className="text-button card-detail-return" onClick={() => { dialog.current?.close(); setDetail(null); }}>Вернуться к истории</button></SceneObject>
      </>}
    </dialog></SceneObject>
  </>;
}
