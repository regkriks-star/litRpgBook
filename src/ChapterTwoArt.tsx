import SceneObject from './SceneObject';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { assetUrl, assets } from './assets';
import CharacterLabel from './CharacterLabel';

export function MeadowSprite({ frame = 0, className = '', label }: { frame?: number; className?: string; label: string }) {
  const rects = [[0, 0, 540, 580], [545, 0, 709, 560], [0, 600, 550, 630], [550, 560, 704, 694]];
  const [x, y, width, height] = rects[frame];
  return <SceneObject id="ChapterTwoArt-meadow-sprite-1" kind="sprite"><div className={`meadow-sprite ${className}`} role="img" aria-label={label}><div style={{ width: `${width / 710 * 100}%`, height: `${height / 710 * 100}%`, left: `${(710 - width) / 1420 * 100}%`, bottom: 0, backgroundImage: `url("${assetUrl('rabbit')}")`, backgroundSize: `${1254 / width * 100}% ${1254 / height * 100}%`, backgroundPosition: `${x / (1254 - width) * 100}% ${y / (1254 - height) * 100}%` }} /></div></SceneObject>;
}

// One 512×560 stage canvas; source feet share y=545. Bent poses retain body scale.
const heroFrames = [
  [0, 0, 512, 550, 545], [512, 0, 512, 550, 535], [1024, 0, 512, 550, 545],
  [0, 550, 512, 474, 997], [512, 533, 512, 491, 997], [1024, 550, 512, 474, 1008],
];
const travelFrames = [[0, 0, 627, 660, 633], [627, 0, 627, 660, 640], [0, 700, 627, 554, 1219], [627, 700, 627, 554, 1220]];
export function mealPose(fight: number) {
  if (fight === 2 || fight === 5) return 8;
  if (fight === 4) return 9;
  return 5;
}

export function MeadowHero({ equipped, pose = 0, resting = false, stretching = false, slope }: { equipped: boolean; pose?: number; resting?: boolean; stretching?: boolean; slope?: 'up' | 'down' }) {
  if (resting) return <SceneObject id="ChapterTwoArt-meadow-hero-1" kind="sprite"><div className="meadow-hero bare resting" role="img" aria-label="Мач мягко приземлился и лежит на траве, глядя в небо; интимная область закрыта мозаикой" style={{ backgroundImage: `url("${assetUrl('machResting')}")` }}><span className="chapter-two-censor" aria-hidden="true" /></div></SceneObject>;
  if (!equipped) return <SceneObject id="ChapterTwoArt-meadow-hero-2" kind="sprite"><div className={`meadow-hero bare ${pose === 13 ? 'gathering' : ''}`} role="img" aria-label={pose === 13 ? 'Мач наклоняется за листьями цедулиса; интимная область закрыта мозаикой' : stretching ? 'Мач встал, потянулся и огляделся; интимная область закрыта мозаикой' : 'Мач Крайм; интимная область закрыта непрозрачной мозаикой'} style={{ backgroundImage: `url("${assetUrl('machRebirth')}")`, backgroundPosition: pose === 13 ? '66.666% 0' : stretching ? '33.333% 0' : '0 0' }}><span className="chapter-two-censor" aria-hidden="true" /></div></SceneObject>;
  if (slope) {
    const frame = slope === 'up' ? 0 : 1;
    const scale = .49;
    const anchor = frame === 0 ? 360 : 452;
    const floor = frame === 0 ? 920 : 950;
    return <SceneObject id="ChapterTwoArt-meadow-hero-3" kind="sprite"><div className="meadow-hero clothed hill-running" role="img" aria-label={frame === 0 ? 'Мач с наклонённым вперёд корпусом взбегает на холм' : 'Мач сбегает с холма к реке, выставив ногу и руки для равновесия'}>
      <div className="meadow-hero-frame" style={{ left: `${(256 - anchor * scale) / 512 * 100}%`, top: `${(545 - floor * scale) / 560 * 100}%`, width: `${768 * scale / 512 * 100}%`, height: `${1024 * scale / 560 * 100}%`, backgroundImage: `url("${assetUrl('machHillRun')}")`, backgroundSize: '200% 100%', backgroundPosition: `${frame * 100}% 0` }} />
    </div></SceneObject>;
  }
  if (pose >= 10) return <MeadowGesture frame={pose - 10} />;
  const extra = pose >= 6;
  const [x, y, w, h, floor] = extra ? travelFrames[pose - 6] : heroFrames[pose];
  const art = extra ? 'machTravel' : 'machLeaves';
  const [sheetW, sheetH] = assets[art].size;
  // Match head/body scale to the existing leaf-clothed sheet, independently of pose bounds.
  const scale = extra ? .65 : 1;
  return <SceneObject id="ChapterTwoArt-meadow-hero-4" kind="sprite"><div className="meadow-hero clothed" role="img" aria-label={['Мач в повязке из листьев', 'Мач наносит пинок', 'Мач бьёт рукой', 'Мач пытается уклониться', 'Мач получает удар рогом', 'Мач ест морковь и отдыхает', 'Мач бежит к реке', 'Мач бежит к реке', 'Мач ест яблоко и отдыхает', 'Мач ест апельсин и отдыхает'][pose]}>
    <div className="meadow-hero-frame" style={{
      top: `${(545 - (floor - y) * scale) / 560 * 100}%`, left: `${(512 - w * scale) / 1024 * 100}%`, width: `${w * scale / 512 * 100}%`, height: `${h * scale / 560 * 100}%`,
      backgroundImage: `url("${assetUrl(art)}")`, backgroundSize: `${sheetW / w * 100}% ${sheetH / h * 100}%`,
      backgroundPosition: `${x / (sheetW - w) * 100}% ${y / (sheetH - h) * 100}%`,
    } as CSSProperties} />
  </div></SceneObject>;
}

// Common stage and body scale match MeadowHero. Anchors follow the feet/hips, not the reaching hand.
const gestureFrames = [[256, 0, 512, 512, 467, 508], [896, 0, 512, 512, 1108, 510], [256, 512, 512, 512, 487, 1012], [832, 512, 640, 512, 1120, 992]];
function MeadowGesture({ frame }: { frame: number }) {
  const [x, y, w, h, anchor, floor] = gestureFrames[frame];
  const scale = 1.08;
  return <SceneObject id="ChapterTwoArt-meadow-hero-5" kind="sprite"><div className="meadow-hero clothed" role="img" aria-label={['Мач морщится от зуда и чешет бедро через листья', 'Мач переминается от зуда', 'Мач протягивает Хатико пять кристаллов', 'Мач наклоняется за листьями цедулиса'][frame]}>
    <div className="meadow-hero-frame" style={{ left: `${(256 - (anchor - x) * scale) / 512 * 100}%`, top: `${(545 - (floor - y) * scale) / 560 * 100}%`, width: `${w * scale / 512 * 100}%`, height: `${h * scale / 560 * 100}%`, backgroundImage: `url("${assetUrl('machMeadowGestures')}")`, backgroundSize: `${1536 / w * 100}% ${1024 / h * 100}%`, backgroundPosition: `${x / (1536 - w) * 100}% ${y / (1024 - h) * 100}%` }} />
  </div></SceneObject>;
}

// Rear wheel hub in each 1086×362 source cell. The radius is the same in all poses.
// Canonical hub (170, 289) leaves hoof baseline at y=361; frame bounds never set scale.
export const cartWheelAnchors = [[170, 260], [143, 260], [170, 237], [143, 237]] as const;
export function CartRide({ moving = false, page, showLabel = false }: { moving?: boolean; page: number; showLabel?: boolean }) {
  const frame = page < 16 || page === 38 ? 0 : page === 24 ? 2 : page === 26 ? 3 : 1;
  const labels = [
    'Ичиро с семьёй и двумя мулами догоняет Мача сзади по дороге к Тантруму',
    'Мач сидит рядом с Ичиро на козлах телеги; два мула везут их и семью к Тантруму',
    'Мач сидит рядом с Ичиро и чешет бедро под листом цедулиса',
    'Мач сидит рядом с Ичиро; Ичиро машет рукой, предупреждая о достижении',
  ];
  const offended = page >= 27 && page <= 37;
  const label = page === 38 ? 'Повозка Ичиро без Мача въезжает в ворота Тантрума' : offended ? 'Обиженный Ичиро молча подстёгивает мулов; Мач и семья продолжают поездку к воротам' : labels[frame];
  const [wheelX, wheelY] = cartWheelAnchors[frame];
  return <SceneObject id="ChapterTwoArt-cart-ride-1" kind="sprite"><div className={`cart-ride ${moving ? 'moving' : ''}`} role="img" aria-label={label} data-cart-frame={frame}>
    <SceneObject id="ChapterTwoArt-cart-art-1" kind="sprite"><div className="cart-art"><SceneObject id="ChapterTwoArt-cart-frame-1" kind="sprite"><div className="cart-frame" style={offended ? { left: `${33 / 1086 * 100}%`, top: `${48 / 362 * 100}%`, backgroundImage: `url("${assetUrl('ichiroOffended')}")`, backgroundSize: '100% 100%', backgroundPosition: '0 0' } : { left: `${(170 - wheelX) / 1086 * 100}%`, top: `${(289 - wheelY) / 362 * 100}%`, backgroundImage: `url("${assetUrl('tantrumCartJourney')}")`, backgroundPosition: `${frame % 2 * 100}% ${Math.floor(frame / 2) * 100}%` }} /></SceneObject></div></SceneObject>
    {showLabel && <CharacterLabel name="Ичиро Кока" profession="Крестьянин" level={24} />}
  </div></SceneObject>;
}

export function RiverCrowd({ scattering }: { scattering: boolean }) {
  return <SceneObject id="ChapterTwoArt-river-crowd-1" kind="sprite"><div className={`river-crowd ${scattering ? 'scattering' : ''}`} role="img" aria-label={scattering ? 'Девушки в белом поворачиваются и разбегаются в разные стороны, открывая проход к воде' : 'Девушки в белых одеждах стоят между Мачем и водой'}>
    {[0, 1, 2].map(frame => <SceneObject id="ChapterTwoArt-river-person-1" key={frame} instanceKey={frame} kind="group"><div key={frame} className="river-person" aria-hidden="true" style={{ backgroundImage: `url("${assetUrl('priestessPoses')}")`, backgroundPosition: `${frame / 2 * 100}% ${scattering ? 100 : 0}%` }} /></SceneObject>)}
  </div></SceneObject>;
}

export function GateGuards({ page, labels, exchanging = true }: { page: number; labels?: ReactNode; exchanging?: boolean }) {
  const blocked = page >= 38 && page <= 42;
  const [crossed, setCrossed] = useState(blocked);
  const [handoff, setHandoff] = useState(false);
  useEffect(() => {
    if (page !== 86 || !exchanging || matchMedia('(prefers-reduced-motion: reduce)').matches) { setHandoff(false); return; }
    setHandoff(true);
    const timer = window.setTimeout(() => setHandoff(false), 700);
    return () => clearTimeout(timer);
  }, [page, exchanging]);
  useEffect(() => {
    if (page !== 38 || matchMedia('(prefers-reduced-motion: reduce)').matches) { setCrossed(blocked); return; }
    setCrossed(false);
    const timer = window.setTimeout(() => setCrossed(true), 340);
    return () => clearTimeout(timer);
  }, [page, blocked]);
  const frame = handoff ? 3 : crossed ? 1 : 0;
  // Source sole baselines and midpoint between the guards register all poses to one stage.
  const [anchor, floor] = [[400, 500], [362, 500], [411, 468], [382, 468]][frame];
  const heads = frame === 3 ? [214, 534] : [264, 550];
  const style = { backgroundImage: `url("${assetUrl('tantrumGuards')}")`, backgroundPosition: `${frame % 2 * 100}% ${Math.floor(frame / 2) * 100}%`, left: `${(384 - anchor) / 768 * 100}%`, top: `${(500 - floor) / 512 * 100}%` };
  return <SceneObject id="ChapterTwoArt-guard-poses-1" kind="sprite"><div className="guard-poses" role="img" aria-label={frame === 3 ? 'Хатико протягивает бумажный пакет, Осама стоит рядом' : exchanging && page >= 86 ? 'Хатико передал Мачу бумажный пакет; Осама стоит рядом' : crossed ? 'Стражники скрестили копья, преградив Мачу вход в город' : 'Осама и Хатико стоят у ворот с поднятыми копьями'}>
    {frame === 3 ? <><SceneObject id="ChapterTwoArt-guard-body-1" kind="group"><div className="guard-body osama" style={{ ...style, clipPath: 'inset(0 57% 0 0)' }} /></SceneObject><SceneObject id="ChapterTwoArt-guard-body-2" kind="group"><div className="guard-body hatiko" style={{ ...style, clipPath: 'inset(0 0 0 43%)' }} /></SceneObject></> : <div style={style} />}
    <SceneObject id="ChapterTwoArt-guard-labels-1" kind="group"><div className="guard-labels" style={{ '--osama-head': `${heads[0] / 768 * 100}%`, '--hatiko-head': `${heads[1] / 768 * 100}%` } as CSSProperties}>{labels}</div></SceneObject>
  </div></SceneObject>;
}

export function TantrumPerson({ frame, label }: { frame: number; label: string }) {
  if (frame === 5) return <SceneObject id="ChapterTwoArt-tantrum-person-1" kind="sprite"><img className="tantrum-person priestesses" src={assetUrl('priestesses')} alt={label} /></SceneObject>;
  const rects = [[0, 100, 563, 448], [650, 0, 270, 548], [1145, 0, 280, 548], [0, 550, 510, 474], [510, 550, 514, 474], [1024, 550, 512, 474], [0, 550, 280, 474]];
  const [x, y, width, height] = rects[frame];
  return <SceneObject id="ChapterTwoArt-tantrum-person-2" kind="sprite"><div className={`tantrum-person person-${frame}`} role="img" aria-label={label}><div style={{ width: `${width / 565 * 100}%`, height: `${height / 565 * 100}%`, left: `${(565 - width) / 1130 * 100}%`, bottom: 0, backgroundImage: `url("${assetUrl('tantrumCast')}")`, backgroundSize: `${1536 / width * 100}% ${1024 / height * 100}%`, backgroundPosition: `${x / (1536 - width) * 100}% ${y / (1024 - height) * 100}%` }} /></div></SceneObject>;
}

export function HunterStrike({ attacking }: { attacking: boolean }) {
  const [x, width, anchor] = attacking ? [700, 836, 420] : [0, 700, 355];
  return <SceneObject id="ChapterTwoArt-tantrum-person-3" kind="sprite"><div className="tantrum-person person-6 hunter-pose" role="img" aria-label={attacking ? 'Юный охотник наносит рогатому кролику низкий удар изогнутым ножом' : 'Юный охотник готовит изогнутый нож к удару'}>
    <div style={{ width: `${width / 768 * 100}%`, height: '100%', left: `${(384 - anchor) / 768 * 100}%`, bottom: 0, backgroundImage: `url("${assetUrl('hunterStrike')}")`, backgroundSize: `${1536 / width * 100}% 100%`, backgroundPosition: `${x / (1536 - width) * 100}% 0` }} />
  </div></SceneObject>;
}

export function RabbitRemains() {
  return <SceneObject id="ChapterTwoArt-rabbit-remains-1" kind="sprite"><div className="rabbit-remains meadow-sprite" role="img" aria-label="Поверженный рогатый кролик лежит на боку и растворяется; на траве остаётся добыча"><div style={{ left: '10%', bottom: '4%', width: `${1254 * .45 / 710 * 100}%`, height: `${520 * .45 / 710 * 100}%`, backgroundImage: `url("${assetUrl('rabbitFallen')}")`, backgroundSize: '100% 241.154%', backgroundPosition: '0 74.932%' }} /></div></SceneObject>;
}
