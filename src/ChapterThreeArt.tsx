import SceneObject from './SceneObject';
import { useEffect, useState, type CSSProperties } from 'react';
import { assetUrl, assets } from './assets';
import { GateGuards, MeadowHero, MeadowSprite } from './ChapterTwoArt';
import CharacterLabel from './CharacterLabel';
import { HealthMeter } from './ChapterTwoMenus';
import { battleExchange, maxHp, type ChapterState } from './chapter-three-game';

const heroLabels = ['Мач понурился', 'Мач с дубинкой смотрит на кролика справа', 'Мач замахивается дубинкой', 'Мач бьёт дубинкой вправо', 'Мач получает удар рогом', 'Мач ест яблоко', 'Мач заменяет черепицу', 'Мач рассматривает самодельный нож'];
const actionLabels = ['Мач ест похлёбку', 'Мач спит на нарах', 'Мач красит печную трубу', 'Мач умывается'];
// One stage canvas and fixed body scale. These are foot/hip anchors, not silhouette bounds.
export const townHeroAnchors = [[240, 440], [212, 438], [245, 438], [223, 438], [240, 428], [234, 431], [255, 435], [232, 435]] as const;
// x, y, width, height, anchor x/y (in the source), scale by head/shoulder landmarks.
// The generated second row is not evenly divided: retain hands and exclude neighbours.
export const townActionFrames = [
  [0, 0, 590, 575, 320, 552, .85], [590, 0, 664, 575, 930, 458, .9],
  [0, 575, 685, 679, 330, 1235, 1], [685, 575, 569, 679, 970, 1190, 1],
] as const;
export const authorityFrames = [
  [0, 0, 512, 496, 258, 491, 1], [512, 0, 512, 496, 757, 487, 1], [1024, 0, 512, 496, 1282, 490, 1],
  [0, 496, 600, 528, 300, 1000, 1], [600, 496, 410, 528, 819, 1000, 1], [1010, 496, 526, 528, 1352, 1002, 1],
] as const;
export const merchantAnchors = [[379, 601], [352, 605], [405, 600], [351, 598]] as const;
export const roofPropFrames = [[0, 0, 627, 500], [627, 0, 627, 500], [0, 500, 627, 754], [627, 500, 627, 754]] as const;
// Shared foot baseline; the healer's head starts above the nominal second half.
export const cityLifeFrames = [
  [0, 0, 768, 480, 430, 470, 1], [768, 0, 768, 480, 1180, 477, 1],
  [0, 480, 768, 544, 380, 1011, 1], [768, 480, 768, 544, 1160, 1012, 1],
] as const;

export function RoofProp({ chimney, repaired, onClick }: { chimney: boolean; repaired: boolean; onClick?: () => void }) {
  const frame = (chimney ? 2 : 0) + (repaired ? 1 : 0);
  const [x, y, w, h] = roofPropFrames[frame];
  const label = chimney ? repaired ? 'Труба покрашена ✓' : 'Покрасить трубу' : repaired ? 'Черепица заменена ✓' : 'Заменить черепицу';
  return <SceneObject id="ChapterThreeArt-c3-prop-1" kind="control"><button className={`c3-prop ${chimney ? 'c3-chimney' : 'c3-tile'} ${repaired ? 'repaired' : ''}`} disabled={repaired || !onClick} onClick={onClick} aria-label={label} style={{ aspectRatio: `${w} / ${h}` }}>
    <SceneObject id="ChapterThreeArt-c3-prop-art-1" kind="sprite"><span className="c3-prop-art" role="img" aria-label={label} style={{ aspectRatio: `${w} / ${h}`, backgroundImage: `url("${assetUrl('tantrumRoofRepairs')}")`, backgroundSize: `${1254 / w * 100}% ${1254 / h * 100}%`, backgroundPosition: `${x / (1254 - w) * 100}% ${y / (1254 - h) * 100}%` }} /></SceneObject>
    {onClick && <SceneObject id="ChapterThreeArt-c3-prop-label-1" kind="group"><span className="c3-prop-label">{label}</span></SceneObject>}
  </button></SceneObject>;
}

export function TownSprite({ art, frame, label, anchor }: { art: 'machTown' | 'machTownActions' | 'tantrumAuthorities' | 'tantrumMerchants' | 'cityLife'; frame: number; label: string; anchor?: readonly [number, number] }) {
  const asset = assets[art];
  let stage: readonly [number, number];
  let rect: readonly number[];
  let sheet: readonly [number, number];
  if (art === 'machTownActions') { stage = [700, 700]; rect = townActionFrames[frame]; sheet = assets[art].size; }
  else if (art === 'tantrumAuthorities') { stage = [512, 512]; rect = authorityFrames[frame]; sheet = assets[art].size; }
  else if (art === 'cityLife') { stage = [768, 544]; rect = cityLifeFrames[frame]; sheet = assets[art].size; }
  else if ('grid' in asset) {
    stage = asset.cell;
    const [ax, ay] = anchor ?? merchantAnchors[frame];
    const x = frame % asset.grid[0] * stage[0], y = Math.floor(frame / asset.grid[0]) * stage[1];
    rect = [x, y, stage[0], stage[1], x + ax, y + ay, 1];
    sheet = [asset.grid[0] * stage[0], asset.grid[1] * stage[1]];
  } else return null;
  const [x, y, w, h, ax, ay, scale] = rect;
  return <SceneObject id="ChapterThreeArt-town-sprite-1" kind="sprite"><div className={`town-sprite art-${art}`} role="img" aria-label={label} data-frame={frame} style={{ aspectRatio: `${stage[0]} / ${stage[1]}` }}>
    <div style={{ left: `${(stage[0] / 2 - (ax - x) * scale) / stage[0] * 100}%`, top: `${(stage[1] - (ay - y) * scale) / stage[1] * 100}%`, width: `${w * scale / stage[0] * 100}%`, height: `${h * scale / stage[1] * 100}%`,
      backgroundImage: `url("${assetUrl(art)}")`, backgroundSize: `${sheet[0] / w * 100}% ${sheet[1] / h * 100}%`,
      backgroundPosition: `${x / (sheet[0] - w) * 100}% ${y / (sheet[1] - h) * 100}%` } as CSSProperties} />
  </div></SceneObject>;
}

export function TownHero({ state: s, pose = 0, action }: { state: ChapterState; pose?: number; action?: number }) {
  if (!s.dressed) return <MeadowHero equipped pose={0} />;
  if (action !== undefined) return <TownSprite art="machTownActions" frame={action} label={actionLabels[action]} />;
  return <TownSprite art="machTown" frame={pose} label={heroLabels[pose]} anchor={townHeroAnchors[pose]} />;
}

export function chapterThreeScene(page: number) {
  if (page <= 14) return { id: 'shore', art: 'tantrumRiver', name: 'Берег реки · у Тантрума' } as const;
  if (page <= 24) return { id: 'cell', art: 'tantrumCell', name: 'Казарма · тюремная пристройка' } as const;
  if (page <= 33) return { id: 'roofs', art: page <= 25 || page >= 32 ? 'tantrumRoofs' : 'tantrumStreet', name: 'Тантрум · общественные работы' } as const;
  if (page <= 77) return { id: 'meadow', art: 'tantrum', name: page === 34 ? 'За городской стеной · ночёвка' : page === 77 ? 'Луга Тантрума · 16:00' : 'Луга Тантрума · охота' } as const;
  if (page === 78) return { id: 'return', art: 'tantrumGates', name: 'Возвращение в Тантрум' } as const;
  if (page === 79) return { id: 'pharmacy', art: 'tantrumPharmacy', name: 'Аптека · продажа санки' } as const;
  if (page <= 81) return { id: 'hunter', art: 'tantrumHunter', name: 'Сатсубаки · третий дом от западных ворот' } as const;
  return { id: 'market', art: 'tantrumMarket', name: 'Рынок Тантрума · вечер' } as const;
}

export default function ChapterThreeArt({ state: s }: { state: ChapterState }) {
  const [beat, setBeat] = useState(3);
  const battle = s.encounter > 0 && s.page >= 35 && s.page <= 70;
  const scene = chapterThreeScene(s.page);
  useEffect(() => {
    setBeat(3);
    if (!s.lastMove || s.lastMove === 'eat' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setBeat(0);
    const hit = window.setTimeout(() => setBeat(1), 160);
    const reply = window.setTimeout(() => setBeat(2), 420);
    const settled = window.setTimeout(() => setBeat(3), 740);
    return () => { clearTimeout(hit); clearTimeout(reply); clearTimeout(settled); };
  }, [s.turn, s.encounter, s.lastMove]);
  let pose = s.bag.club ? 1 : 0;
  let action: number | undefined;
  if (battle && s.lastMove && s.lastMove !== 'eat' && s.phase !== 'rest') {
    if (beat === 0) pose = 2;
    else if (beat === 1 || s.phase === 'loot') pose = 3;
    else if (beat === 2 && s.lastMove !== 'strike') pose = 4;
  }
  if (s.lastMove === 'eat') { if (s.page <= 24 || s.page === 83) action = 0; else pose = 5; }
  if (s.page === 24 || s.page === 34) action = 1;
  if (s.page === 25 || s.page === 33) { if (s.chimney) action = 2; else if (s.roof) pose = 6; }
  if (s.page === 35 && s.inspected.includes('wash')) action = 3;
  if (s.bag.knife) pose = 7;
  const captainFrame = s.page === 9 ? 1 : s.page >= 10 ? 2 : 0;
  const exchange = battleExchange(s, s.lastMove === 'strike', Math.max(0, s.turn - 1));
  const replied = s.lastMove === 'attack' && s.rabbitHp > 0;
  const city = s.page >= 26 && s.page <= 31;
  return <div className={`c3-actors scene-${scene.id} ${battle ? 'hunting' : ''} ${s.page === 9 ? 'cedulis-reaction' : ''}`}>
    {city && <SceneObject id="ChapterThreeArt-c3-city-life-1" key={`city-${s.page}`} kind="group"><div className="c3-city-life" key={`city-${s.page}`} aria-label="Самостоятельная жизнь горожан">
      <SceneObject id="ChapterThreeArt-c3-residents-1" kind="sprite"><div className="c3-residents city-children"><TownSprite art="cityLife" frame={0} label="Дети-посыльные несут ящик и свёрток по улице вправо" /></div></SceneObject>
      <SceneObject id="ChapterThreeArt-c3-residents-2" kind="sprite"><div className="c3-residents city-sweeper"><TownSprite art="cityLife" frame={1} label="Подросток подметает улицу у дома" /></div></SceneObject>
      <SceneObject id="ChapterThreeArt-c3-residents-3" kind="sprite"><div className="c3-residents city-healer"><TownSprite art="cityLife" frame={2} label="Девушка-лекарка в бело-зелёном платье идёт по улице влево" /></div></SceneObject>
      <SceneObject id="ChapterThreeArt-c3-residents-4" kind="sprite"><div className="c3-residents city-adults"><TownSprite art="cityLife" frame={3} label="Взрослые неспешно идут с корзиной покупок" /></div></SceneObject>
    </div></SceneObject>}
    <SceneObject selectAsGroup id="ChapterThreeArt-c3-hero-1" kind="sprite"><div className={`c3-hero ${s.page === 78 ? 'entering-town' : ''} ${s.page >= 92 && !s.bag.knife ? 'leaving-market' : ''}`}>
      <TownHero state={s} pose={pose} action={action} />
      {battle && <HealthMeter value={s.hp} max={maxHp(s)} name="HP Мача" />}
    </div></SceneObject>
    {scene.id === 'shore' && <>
      <SceneObject id="ChapterThreeArt-c3-supporting-guards-1" kind="sprite"><div className="c3-supporting-guards">{s.page === 9 ? <TownSprite art="tantrumAuthorities" frame={3} label="Осама и Хатико синхронно хватаются за ягодицы" /> : <GateGuards page={0} />}</div></SceneObject>
      <SceneObject id="ChapterThreeArt-c3-captain-1" kind="sprite"><div className={`c3-captain ${s.page === 4 ? 'captain-jump' : ''}`}><CharacterLabel name="Ома Тобуяма" profession="Глава стражи" level={63} /><TownSprite art="tantrumAuthorities" frame={captainFrame} label={['Капитан сердито упирает руки в бока', 'Капитан сочувственно морщится и хватается за ягодицы', 'Капитан смущённо улыбается и смягчает наказание'][captainFrame]} /></div></SceneObject>
    </>}
    {scene.id === 'roofs' && <SceneObject id="ChapterThreeArt-c3-npc-1" kind="sprite"><div className={`c3-npc ${s.page === 32 ? 'giving-club' : ''}`}><CharacterLabel name="Куджа" profession="Мастер" /><TownSprite art="tantrumAuthorities" frame={s.page >= 32 ? 5 : 4} label={s.page >= 32 ? 'Куджа передаёт Мачу дубинку' : 'Куджа с инструментами и гвоздями во рту'} /></div></SceneObject>}
    {battle && ['combat', 'loot'].includes(s.phase) && <SceneObject id="ChapterThreeArt-c3-rabbit-1" kind="sprite"><div className={`c3-rabbit ${s.phase === 'loot' ? 'rabbit-defeated' : ''} ${beat === 2 && replied ? 'rabbit-reply' : ''} ${s.page === 70 ? 'rabbit-quick' : ''}`}>
      {s.phase === 'loot' ? <><SceneObject id="ChapterThreeArt-c3-victory-1" kind="group"><span className="c3-victory">Кролик побеждён · добыча</span></SceneObject><SceneObject id="ChapterThreeArt-c3-rabbit-remains-1" kind="sprite"><div className="c3-rabbit-remains" aria-hidden="true"><MeadowSprite frame={0} label="" /></div></SceneObject></> : <><MeadowSprite frame={beat === 2 && replied ? 1 : 0} label={beat === 2 && replied ? 'Рогатый кролик прыгает влево и бьёт Мача рогом' : 'Рогатый кролик перед Мачем смотрит влево'} /><HealthMeter value={s.rabbitHp} max={30} name="HP кролика" /></>}
      {s.turn > 0 && s.lastMove && s.lastMove !== 'eat' && <SceneObject id="ChapterThreeArt-c3-hit-result-1" key={`${s.encounter}-${s.turn}`} kind="effect"><span key={`${s.encounter}-${s.turn}`} className={`c3-hit-result ${exchange.critical ? 'critical' : ''}`}>{s.lastMove === 'strike' ? 'Разящий удар' : exchange.critical ? 'Критический удар' : 'Удар дубинкой'} · −{exchange.damage} HP</span></SceneObject>}
    </div></SceneObject>}
    {battle && replied && s.turn > 0 && <SceneObject id="ChapterThreeArt-c3-reply-result-1" key={`${s.encounter}-${s.turn}`} kind="effect"><span key={`${s.encounter}-${s.turn}`} className={`c3-reply-result ${exchange.incomingCritical ? 'critical' : ''}`}>{exchange.incomingCritical ? 'Критический удар рогом' : 'Удар рогом'} · −{exchange.incoming} HP</span></SceneObject>}
    {s.page >= 71 && s.page <= 76 && <SceneObject id="ChapterThreeArt-c3-streak-summary-1" kind="group"><div className="c3-streak-summary"><span>Череда побед</span><b>{Math.min(30, s.victories)} / 30</b><small>+{Math.min(30, s.victories)} опыта · предел +30</small></div></SceneObject>}
    {scene.id === 'return' && <SceneObject id="ChapterThreeArt-c3-return-guards-1" kind="sprite"><div className="c3-return-guards"><GateGuards page={0} /></div></SceneObject>}
    {scene.id === 'pharmacy' && <SceneObject id="ChapterThreeArt-c3-npc-2" kind="sprite"><div className="c3-npc"><TownSprite art="tantrumMerchants" frame={0} label="Аптекарша принимает траву и кристаллы" /></div></SceneObject>}
    {scene.id === 'hunter' && <SceneObject id="ChapterThreeArt-c3-npc-3" kind="sprite"><div className={`c3-npc ${s.hunter ? 'teaching-hunter' : ''}`}><CharacterLabel name="Сатсубаки Суджиро" profession="Охотник" /><TownSprite art="tantrumMerchants" frame={1} label={s.hunter ? 'Сатсубаки передаёт ремесло охотника взмахом руки' : 'Сатсубаки принимает посетителей у своего дома'} /></div></SceneObject>}
    {scene.id === 'market' && <SceneObject id="ChapterThreeArt-c3-npc-4" kind="sprite"><div className={`c3-npc ${s.page >= 92 ? 'son-approaches' : ''}`}><TownSprite art="tantrumMerchants" frame={s.page >= 92 ? 3 : 2} label={s.page >= 92 ? 'Сын торговца догоняет Мача сзади и протягивает нож' : 'Рыжий торговец сложил руки на груди'} /></div></SceneObject>}
  </div>;
}
