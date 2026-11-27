import SceneObject, { SceneScope } from './SceneObject';
import SceneAction from './SceneAction';
import { useEffect, useState } from 'react';
import { assetUrl, assets } from './assets';
import { GateGuards, MeadowSprite } from './ChapterTwoArt';
import { TownSprite, townHeroAnchors } from './ChapterThreeArt';
import { HealthMeter, ItemIcon } from './ChapterTwoMenus';
import CharacterLabel from './CharacterLabel';
import { has, maxHp, type ChapterAction, type ChapterState } from './chapter-four-game';

// Source rectangles, stage anchors at feet/hips, and body scale relative to a 444px canvas.
// The generated hero sheet has a 545px first row, not two equal rows.
export const mouseHeroFrames = [
  [0, 0, 444, 545, 205, 537, .82], [444, 0, 444, 545, 659, 537, .82],
  [888, 0, 444, 545, 1110, 537, .82], [1332, 0, 444, 545, 1530, 537, .82],
  [0, 545, 444, 343, 225, 853, 1], [444, 545, 444, 343, 670, 853, 1],
  [888, 545, 444, 343, 1092, 838, 1], [1332, 545, 444, 343, 1546, 838, 1],
] as const;
export const familyFrames = [
  [0, 0, 483, 634, 284, 625, .72], [483, 0, 483, 634, 740, 625, .72],
  [966, 0, 482, 634, 1205, 630, .76], [0, 634, 1448, 452, 762, 1055, 1],
] as const;
export const drinkingFrames = [[0, 0, 725, 1024, 414, 938, .5], [725, 0, 811, 1024, 1190, 938, .5]] as const;
export const blessingFrames = [[0, 0, 1024, 1536, 550, 1430, .303]] as const;
export const tavernServiceFrames = [
  [0, 0, 627, 627, 402, 604, .7], [627, 0, 627, 627, 821, 604, .7],
  [0, 627, 627, 627, 319, 1210, .7], [627, 627, 627, 627, 941, 1227, .7],
] as const;
export const tavernAnchors = [[236, 430], [247, 436], [220, 435], [228, 435], [253, 439], [230, 438], [220, 438], [225, 438]] as const;
export const gateFrames = [
  [0, 0, 440, 888, 225, 824, .54], [440, 0, 448, 888, 690, 824, .6],
  [888, 0, 356, 888, 1075, 824, .6], [1244, 0, 532, 888, 1480, 824, .6],
] as const;
export function FourSprite({ art, frame, label }: { art: 'machLadyMouse' | 'machBlessing' | 'ichiroFamily' | 'tavernCast' | 'gateReactions' | 'tavernDrinking' | 'tavernService'; frame: number; label: string }) {
  let sheet: readonly [number, number];
  let rect: readonly number[];
  if (art === 'machLadyMouse') { sheet = assets[art].size; rect = mouseHeroFrames[frame]; }
  else if (art === 'machBlessing') { sheet = assets[art].size; rect = blessingFrames[frame]; }
  else if (art === 'ichiroFamily') { sheet = assets[art].size; rect = familyFrames[frame]; }
  else if (art === 'gateReactions') { sheet = assets[art].size; rect = gateFrames[frame]; }
  else if (art === 'tavernDrinking') { sheet = assets[art].size; rect = drinkingFrames[frame]; }
  else if (art === 'tavernService') { sheet = [1254, 1254]; rect = tavernServiceFrames[frame]; }
  else {
    sheet = [1776, 888];
    const x = frame % 4 * 444, y = Math.floor(frame / 4) * 444;
    const [ax, ay] = tavernAnchors[frame];
    rect = [x, y, 444, 444, x + ax, y + ay, 1];
  }
  const [x, y, w, h, ax, ay, scale] = rect;
  const canvas = art === 'ichiroFamily' && frame === 3 ? [1448, 452] : [444, 444];
  return <SceneObject id="ChapterFourArt-four-sprite-1" kind="sprite"><div className={`four-sprite art-${art}`} role="img" aria-label={label} data-frame={frame} style={{ aspectRatio: `${canvas[0]} / ${canvas[1]}` }}>
    <div style={{ left: `${(canvas[0] / 2 - (ax - x) * scale) / canvas[0] * 100}%`, top: `${(canvas[1] - (ay - y) * scale) / canvas[1] * 100}%`, width: `${w * scale / canvas[0] * 100}%`, height: `${h * scale / canvas[1] * 100}%`,
      backgroundImage: `url("${assetUrl(art)}")`, backgroundSize: `${sheet[0] / w * 100}% ${sheet[1] / h * 100}%`, backgroundPosition: `${x ? x / (sheet[0] - w) * 100 : 0}% ${y ? y / (sheet[1] - h) * 100 : 0}%` }} />
  </div></SceneObject>;
}
export function FourHero({ state: s, pose = 1 }: { state: ChapterState; pose?: number }) {
  if (s.page === 102) return <FourSprite art="machBlessing" frame={0} label="Мач поднимает указательный палец, говоря о благословении Датарис, и смотрит к выходу справа" />;
  if (s.page >= 6 && s.page <= 9) return <FourSprite art="gateReactions" frame={3} label="Мач развернулся к девушке, подошедшей со стороны дороги слева" />;
  if (s.page === 10) return <FourSprite art="gateReactions" frame={3} label="Мач широким жестом показывает раскрытые ворота" />;
  if (s.page === 24 && s.cooking) return <TownSprite art="machTownActions" frame={1} label="Мач спит на сеновале после ужина и обучения" />;
  if (s.page >= 48 && s.page <= 74 && s.page !== 72 && has(s, 'beer')) return <FourSprite art="tavernDrinking" frame={0} label="Мач сидит за столом и пьёт пиво" />;
  if (s.lady) return <FourSprite art="machLadyMouse" frame={pose} label={pose === 2 ? 'Усиленный Мач замахивается дубинкой' : pose === 3 ? 'Усиленный Мач наносит удар вправо' : 'Мач с расправленными плечами и усиленными мышцами'} />;
  if (s.page === 25 && s.mouse !== 'cat') return <FourSprite art="machLadyMouse" frame={0} label={s.mouse === 'hand' ? 'Мач держит спасённую мышь у нагрудного кармана' : 'Мач прячет мышь в нагрудный карман жилетки'} />;
  if (s.lastMove === 'dinner' || s.lastMove === 'roast' || has(s, 'farm-dinner') && s.page === 24) return <TownSprite art="machTownActions" frame={0} label="Мач ест сытную похлёбку" />;
  const frame = s.page <= 3 && !has(s, 'knife-attack') ? 7 : 1;
  return <TownSprite art="machTown" frame={frame} label={frame === 7 ? 'Мач испытывает самодельный нож' : 'Одетый Мач с дубинкой'} anchor={townHeroAnchors[frame]} />;
}
export function chapterFourScene(page: number, cooking = 0) {
  if (page <= 3) return { id: 'knife', art: 'tantrum', name: 'Луга у Тантрума · испытание ножа' } as const;
  if (page <= 15) return { id: 'gates', art: 'tantrumGates', name: 'Западные ворота · проход в город' } as const;
  if (page === 16) return { id: 'loading', art: 'tantrumStreet', name: 'У кабака · повозка Ичиро' } as const;
  if (page <= 19) return { id: 'road', art: 'tantrumRoad', name: 'Из Тантрума к деревне · город позади справа' } as const;
  if (page <= 22) return { id: 'road', art: 'ichiroVillageRoad', name: 'Деревня впереди слева · Тантрум вдали справа' } as const;
  if (page === 24 && cooking) return { id: 'sleep', art: 'ichiroHayloft', name: 'Сеновал Ичиро · ночь' } as const;
  if (page <= 25) return { id: 'farm', art: 'ichiroFarm', name: page === 25 ? 'Двор Ичиро · утро' : 'Хозяйство Ичиро · вечер' } as const;
  if (page <= 32) return { id: 'hunt', art: 'tantrum', name: 'Луга между деревней и Тантрумом · охота' } as const;
  if (page <= 38) return { id: 'hunt', art: 'tantrumDayMeadow', name: 'Луговые холмы · путь к Тантруму вправо' } as const;
  if (page <= 43) return { id: 'pharmacy', art: 'tantrumPharmacy', name: 'Тантрум · аптека' } as const;
  if (page <= 46) return { id: 'hunter', art: 'tantrumHunter', name: 'Сатсубаки · продажа шкур' } as const;
  if (page === 47) return { id: 'market', art: 'tantrumMarket', name: 'Рынок · продажа мяса' } as const;
  if (page === 72) return { id: 'memory', art: 'tantrum', name: 'Воспоминание · окончание охоты' } as const;
  return { id: 'tavern', art: 'tantrumTavern', name: 'Трактир у казарм · выход справа' } as const;
}
export default function ChapterFourArt({ state: s, act }: { state: ChapterState; act?: (action: ChapterAction) => void }) {
  const scene = chapterFourScene(s.page, s.cooking);
  const [swing, setSwing] = useState(false);
  useEffect(() => {
    if (!['strike', 'critical', 'hunt'].includes(s.lastMove ?? '') || matchMedia('(prefers-reduced-motion: reduce)').matches) { setSwing(false); return; }
    setSwing(true);
    const timer = window.setTimeout(() => setSwing(false), 180);
    return () => clearTimeout(timer);
  }, [s.lastMove, s.hunts]);
  const hit = s.page <= 32 && has(s, 'strike') || s.page >= 33 && s.page <= 35 && has(s, 'critical') || s.page === 38 && s.hunts === 3;
  const carry = s.page === 16 && has(s, 'detach') && !has(s, 'load') || s.page === 23 && !has(s, 'unload');
  const pair = s.page >= 103;
  let encounter = s.page >= 33 ? 1 : 0;
  if (s.page === 38) encounter = Math.min(s.hunts, 2);
  const rabbitFrame = s.page === 38 && s.hunts === 2 ? 0 : encounter;
  const tavernLife = s.page >= 48 && s.page <= 50 || s.page >= 75 && s.page <= 84;
  let heroPose = hit || s.lastMove === 'hunt' ? 3 : 1;
  if (swing) heroPose = 2;
  let hitText = `Одним ударом · ${s.hunts} / 3`;
  if (s.page <= 35) hitText = '72 · критический!';
  if (s.page <= 32) hitText = '58';
  return <div className={`c4-actors scene-${scene.id} encounter-${encounter} ${s.lady ? 'lady-active' : ''}`}>
    {scene.id === 'road' ? <SceneObject id="ChapterFourArt-c4-cart-1" kind="sprite"><div className={`c4-cart ${has(s, 'drive') ? 'driving' : ''}`}><div className="c4-cart-figure"><FourSprite art="ichiroFamily" frame={3} label="Мач правит двумя мулами влево, от Тантрума к деревне; Оома рядом, Ичиро спит с дочками в кузове" />{act && s.page === 17 && !has(s, 'drive') && <SceneAction label="Взять вожжи · ехать к деревне" onClick={() => act({ type: 'do', task: 'drive' })} />}</div></div></SceneObject> : <>
      {!pair && <SceneObject selectAsGroup id="ChapterFourArt-c4-hero-1" kind="sprite"><div className={`c4-hero ${has(s, 'aside') && s.page <= 12 ? 'stepped-aside' : ''} ${s.page >= 6 && s.page <= 9 ? 'turned-to-road' : ''} ${s.page >= 85 ? 'toward-exit' : ''} ${s.lastMove === 'assign' ? 'transformed' : ''}`}>
        {carry ? <FourSprite art="ichiroFamily" frame={2} label="Мач несёт спящего Ичиро на руках" /> : <FourHero state={s} pose={heroPose} />}
        {act && s.page === 16 && has(s, 'detach') && !has(s, 'load') && <SceneAction label="Положить Ичиро в повозку" onClick={() => act({ type: 'do', task: 'load' })} />}
        {act && s.page === 23 && !has(s, 'unload') && <SceneAction label="Отнести Ичиро в дом" onClick={() => act({ type: 'do', task: 'unload' })} />}
        {act && s.page === 25 && s.mouse === 'hand' && <SceneAction label="Посадить мышь в карман" onClick={() => act({ type: 'pocket-mouse' })} />}
        {(scene.id === 'knife' || scene.id === 'hunt') && <HealthMeter value={s.hp} max={maxHp(s)} name="HP Мача" />}
      </div></SceneObject>}
      {scene.id === 'knife' && <><SceneObject id="ChapterFourArt-c4-rabbit-1" kind="sprite"><div className="c4-rabbit"><MeadowSprite label="Рогатый кролик: нож не наносит ему урона" />{act && !has(s, 'knife-attack') && <SceneAction label="Атаковать кролика ножом" onClick={() => act({ type: 'do', task: 'knife-attack' })} />}</div></SceneObject>{has(s, 'knife-attack') && <SceneObject id="ChapterFourArt-c4-knife-return-1" kind="group"><div className="c4-knife-return" role="status"><ItemIcon item="knife" /><span>Система: нож возвращён в инвентарь</span></div></SceneObject>}</>}
      {scene.id === 'gates' && <>
        <SceneObject id="ChapterFourArt-c4-guards-1" kind="sprite"><div className="c4-guards"><GateGuards page={0} />{s.page === 5 && <SceneObject id="ChapterFourArt-c4-osama-1" kind="group"><div className="c4-osama"><FourSprite art="gateReactions" frame={0} label="Осама согнулся от смеха, опираясь на копьё" /></div></SceneObject>}</div></SceneObject>
        {s.page >= 6 && s.page <= 12 && <SceneObject id="ChapterFourArt-c4-priestesses-1" kind="sprite"><div className={`c4-priestesses ${has(s, 'aside') ? 'entering-gate' : ''}`} role="img" aria-label={has(s, 'aside') ? 'Девушки пробежали внутрь ворот, Мач стоит в стороне от прохода' : 'Испуганные девушки в белом ждут снаружи ворот'}>{[0, 1, 2].map(frame => <SceneObject id="ChapterFourArt-c4-priestess-1" key={frame} instanceKey={frame} kind="sprite"><div className="c4-priestess" key={frame} style={{ backgroundImage: `url("${assetUrl('priestessPoses')}")`, backgroundPosition: `${frame / 2 * 100}% ${has(s, 'aside') || s.page === 7 ? 100 : 0}%` }} /></SceneObject>)}</div></SceneObject>}
        {(s.page === 7 || s.page === 9) && <SceneObject id="ChapterFourArt-c4-priestess-speaker-1" kind="sprite"><div className="c4-priestess-speaker"><FourSprite art="gateReactions" frame={s.page === 7 ? 1 : 2} label={s.page === 7 ? 'Девушка в белом испуганно подпрыгнула, поджав ноги' : 'Девушка в белом глубоко кланяется Мачу'} /></div></SceneObject>}
        {s.page >= 13 && <SceneObject id="ChapterFourArt-c4-npc-1" kind="sprite"><div className="c4-npc hooked-elbow"><FourSprite art="ichiroFamily" frame={0} label="Оома берёт Мача под локоть и зовёт помочь Ичиро" /></div></SceneObject>}
      </>}
      {scene.id === 'loading' && <>{!has(s, 'detach') && <SceneObject id="ChapterFourArt-c4-npc-2" kind="sprite"><div className="c4-npc"><FourSprite art="ichiroFamily" frame={1} label="Ичиро крепко держится за столб" />{act && <SceneAction label="Снять Ичиро со столба" onClick={() => act({ type: 'do', task: 'detach' })} />}</div></SceneObject>}{has(s, 'load') && <SceneObject id="ChapterFourArt-c4-loaded-1" kind="group"><div className="c4-loaded"><FourSprite art="ichiroFamily" frame={3} label="Ичиро уложен в повозку, семья готова отправляться" /></div></SceneObject>}</>}
      {scene.id === 'farm' && <><SceneObject id="ChapterFourArt-c4-npc-3" kind="sprite"><div className={`c4-npc ${s.cooking ? 'teaching-cooking' : ''}`}><FourSprite art="ichiroFamily" frame={0} label="Оома приглашает к ужину и обучает Кулинарии" />{act && s.page === 24 && !has(s, 'farm-dinner') && <SceneAction label="Поужинать у Оомы" onClick={() => act({ type: 'do', task: 'farm-dinner' })} />}</div></SceneObject>{s.page === 23 || s.page === 25 ? <SceneObject id="ChapterFourArt-c4-cat-1" kind="sprite"><div className={`c4-cat ${s.page === 23 ? 'cat-departs' : s.mouse !== 'cat' ? 'cat-shocked' : ''}`}><FourSprite art="machLadyMouse" frame={s.page === 25 && s.mouse === 'cat' ? 4 : 5} label={s.page === 23 ? 'Чёрный кот встречает повозку и скрывается в ночи' : s.mouse === 'cat' ? 'Огромный чёрный кот держит живую мышь' : 'Ошеломлённый чёрный кот остался без мыши'} />{act && s.page === 25 && s.mouse === 'cat' && <SceneAction label="Щелбан коту · перехватить мышь" onClick={() => act({ type: 'rescue-mouse' })} />}</div></SceneObject> : null}</>}
      {scene.id === 'hunt' && <><SceneObject id="ChapterFourArt-c4-rabbit-2" key={`rabbit-${s.page}-${s.hunts}`} kind="sprite"><div className={`c4-rabbit ${hit && !swing ? 'defeated' : ''}`} key={`rabbit-${s.page}-${s.hunts}`} data-encounter={encounter}><MeadowSprite frame={rabbitFrame} label={hit ? 'Кролик побеждён ударом дубинки' : 'Рогатый кролик справа от Мача'} />{act && s.page === 38 && s.hunts < 3 && <SceneAction label={`Продолжить охоту · ${s.hunts + 1} / 3`} onClick={() => act({ type: 'hunt' })} />}</div></SceneObject>{s.lady && <SceneObject id="ChapterFourArt-c4-lady-token-1" kind="group"><div className="c4-lady-token"><FourSprite art="machLadyMouse" frame={6} label="Мышь-дама в нагрудном кармане" /><span>Дама: мышь · ×2 характеристики</span></div></SceneObject>}{(hit || s.lastMove === 'hunt') && <SceneObject id="ChapterFourArt-c4-hit-number-1" key={`hit-${s.page}-${s.hunts}`} kind="effect"><span className="c4-hit-number" key={`hit-${s.page}-${s.hunts}`}>{hitText}</span></SceneObject>}</>}
      {(s.page === 32 || s.page === 35) && (() => { const task = s.page === 32 ? 'loot-one' as const : 'loot-two' as const; return <SceneObject id="ChapterFourArt-c4-loot-display-1" kind="group"><div className="c4-loot-display">{(['herb', 'crystal', 'meat', 'pelt'] as const).map(item => <SceneScope id="ChapterFourArt-ItemIcon-1" key={item} instanceKey={item}><ItemIcon item={item} key={item} /></SceneScope>)}{act && !has(s, task) ? <SceneAction label="Собрать добычу" onClick={() => act({ type: 'do', task })} /> : <span className="c4-loot-done" aria-hidden="true">✓</span>}</div></SceneObject>; })()}
      {scene.id === 'memory' && <><SceneObject id="ChapterFourArt-c4-torn-pocket-1" kind="group"><div className="c4-torn-pocket" role="status">Карман разорван · мышь 63-го уровня на свободе</div></SceneObject><SceneObject id="ChapterFourArt-c4-escaped-mouse-1" kind="sprite"><div className="c4-escaped-mouse"><FourSprite art="machLadyMouse" frame={7} label="Могучая мышь 63-го уровня вырвалась из кармана и убежала в сторону деревни, влево" /></div></SceneObject></>}
      {['pharmacy', 'hunter', 'market'].includes(scene.id) && <SceneObject id="ChapterFourArt-c4-npc-4" kind="sprite"><div className={`c4-npc ${scene.id === 'hunter' ? 'hunter-refusal' : ''}`}><TownSprite art="tantrumMerchants" frame={scene.id === 'pharmacy' ? 0 : scene.id === 'hunter' ? 1 : 2} label={scene.id === 'hunter' ? 'Сатсубаки разводит руками: денег на все шкуры нет' : scene.id === 'pharmacy' ? 'Аптекарша удивлена огромной партией санки' : 'Торговец покупает мясо'} /></div></SceneObject>}
      {scene.id === 'pharmacy' && has(s, 'herbs') && <SceneObject id="ChapterFourArt-c4-herb-pile-1" kind="sprite"><div className="c4-herb-pile" role="img" aria-label="Гора из 2247 проданных пучков санки">{[0, 1, 2, 3, 4].map(n => <SceneScope id="ChapterFourArt-ItemIcon-2" key={n} instanceKey={n}><ItemIcon key={n} item="herb" /></SceneScope>)}<b>2247 пучков</b></div></SceneObject>}
      {scene.id === 'tavern' && <>
        {s.page <= 84 && <SceneObject id="ChapterFourArt-c4-innkeeper-1" kind="sprite"><div className={`c4-innkeeper ${tavernLife ? 'serving' : ''}`}>
          {tavernLife ? <><FourSprite art="tavernService" frame={1} label="Усатый трактирщик выставляет полную кружку на стойку" /><SceneObject id="ChapterFourArt-c4-service-pour-1" kind="group"><div className="c4-service-pour" aria-hidden="true"><FourSprite art="tavernService" frame={0} label="Трактирщик наполняет кружку из бочонка" /></div></SceneObject></> : <FourSprite art="tavernCast" frame={1} label="Усатый трактирщик подаёт кружку пива" />}
        </div></SceneObject>}
        {tavernLife && <SceneObject id="ChapterFourArt-c4-patrons-1" kind="sprite"><div className={`c4-patrons ${s.page >= 75 ? 'adult-guests' : 'young-guests'}`} aria-label={s.page >= 75 ? 'Взрослые посетители сменяют друг друга у стойки' : 'Молодые посетители беседуют за кружками в глубине зала'} role="group">
          <SceneObject id="ChapterFourArt-c4-patrons-arriving-1" kind="sprite"><div className="c4-patrons-arriving"><FourSprite art={s.page >= 75 ? 'tavernService' : 'tavernCast'} frame={s.page >= 75 ? 2 : 6} label={s.page >= 75 ? 'Взрослая пара разговаривает с кружками пива' : 'Молодая компания разговаривает за едой'} /></div></SceneObject>
          <SceneObject id="ChapterFourArt-c4-patrons-departing-1" kind="sprite"><div className="c4-patrons-departing"><FourSprite art={s.page >= 75 ? 'tavernService' : 'tavernCast'} frame={s.page >= 75 ? 3 : 7} label={s.page >= 75 ? 'Новые взрослые гости получают кружку и отходят от стойки' : 'Другая компания молодых посетителей у стойки'} /></div></SceneObject>
        </div></SceneObject>}
        <SceneObject id="ChapterFourArt-c4-mage-1" kind="sprite"><div className="c4-mage">{s.page === 50 || s.page === 94 ? <FourSprite art="tavernDrinking" frame={1} label="Русоволосая волшебница подносит кружку пива к губам" /> : <FourSprite art="tavernCast" frame={0} label="Русоволосая волшебница с фиолетовыми глазами сидит у выхода с пивом, посохом и шляпой" />}<span>{s.page >= 94 ? 'Четвёртая кружка' : s.page >= 50 ? 'Третья кружка' : 'Вторая кружка'}</span></div></SceneObject>
        {s.page >= 85 && s.page < 98 && <SceneObject id="ChapterFourArt-c4-mimi-1" kind="sprite"><div className={`c4-mimi ${s.page === 85 ? 'mimi-falls' : ''}`}><FourSprite art="tavernCast" frame={3} label="Мими упала и сидит на полу" />{s.page === 85 && <SceneObject id="ChapterFourArt-c4-mimi-before-1" kind="sprite"><div className="c4-mimi-before"><FourSprite art="tavernCast" frame={2} label="Мими испуганно отступает, выставив дубинку" /></div></SceneObject>}</div></SceneObject>}
        {s.page >= 87 && <SceneObject id="ChapterFourArt-c4-crowd-1" key={s.page === 87 ? 'gather' : 'crowd'} kind="sprite"><div className={`c4-crowd ${s.page >= 95 ? 'makes-way' : ''}`} key={s.page === 87 ? 'gather' : 'crowd'}><SceneObject id="ChapterFourArt-c4-crowd-left-1" kind="sprite"><div className="c4-crowd-left"><FourSprite art="tavernCast" frame={6} label="Молодые посетители собрались слева от Мача" /></div></SceneObject><SceneObject id="ChapterFourArt-c4-crowd-right-1" kind="sprite"><div className="c4-crowd-right"><FourSprite art="tavernCast" frame={7} label={s.page >= 95 ? 'Толпа отступила, открывая проход к выходу справа' : 'Посетители справа обступили происшествие'} /></div></SceneObject></div></SceneObject>}
        {s.page >= 95 && <SceneObject id="ChapterFourArt-c4-baronet-1" kind="sprite"><div className={`c4-baronet ${pair ? 'grabs-shoulder' : 'blocks-exit'}`}><CharacterLabel name="Сын барона Кенхельма" profession="Мечник · баронет" level={15} /><FourSprite art="tavernCast" frame={pair ? 5 : 4} label={pair ? 'Баронет хватает Мача за плечо и не даёт выйти' : 'Баронет перекрывает выход и указывает на Мача'} /></div></SceneObject>}
        {s.page >= 98 && <SceneObject id="ChapterFourArt-c4-mimi-gone-1" kind="sprite"><span className="c4-mimi-gone" role="status">Мими поспешила уйти</span></SceneObject>}
      </>}
    </>}
  </div>;
}
