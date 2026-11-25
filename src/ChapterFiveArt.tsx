import SceneObject from './SceneObject';
import { assetUrl, assets } from './assets';
import { GateGuards } from './ChapterTwoArt';
import { TownSprite, townHeroAnchors, RoofProp } from './ChapterThreeArt';
import { FourSprite } from './ChapterFourArt';
import { ItemIcon } from './ChapterTwoMenus';
import { has, type ChapterState } from './chapter-five-game';

// Source rectangles and foot/hip landmarks. Metadata is shared by all reading pages.
export const duelFrames = [
  [0, 0, 465, 422, 230, 410, 1.05], [475, 0, 520, 422, 755, 410, 1.05],
  [1035, 0, 365, 422, 1210, 410, 1.05], [1430, 0, 451, 422, 1635, 390, 1.05],
  [0, 422, 470, 414, 235, 815, 1.05], [460, 422, 535, 414, 706, 815, 1.05],
  [995, 422, 485, 414, 1230, 815, 1.05], [1520, 410, 361, 426, 1689, 815, 1.05],
] as const;
export const templeCastFrames = [
  [0, 0, 435, 780, 210, 749, .65], [350, 0, 410, 780, 553, 749, .65],
  [765, 0, 259, 780, 888, 755, .65], [0, 780, 445, 756, 226, 1490, .65],
  [343, 780, 365, 756, 535, 1490, .65], [700, 780, 324, 756, 860, 1490, .65],
] as const;
// Irregular robe/arm boundaries require polygon isolation in addition to source rectangles.
export const templeCastClips = [
  'polygon(0 0, 80% 0, 80% 80%, 100% 88%, 100% 100%, 0 100%)',
  'polygon(28% 0, 100% 0, 100% 100%, 23% 100%, 20% 50%, 0 44%, 0 30%, 28% 20%)',
  'inset(0)',
  'polygon(0 0, 100% 0, 100% 45%, 86% 55%, 78% 100%, 0 100%)',
  'polygon(38% 0, 100% 0, 100% 100%, 0 100%, 8% 60%, 32% 35%)',
  'inset(0)',
] as const;
export const templeHeroFrames = [
  [0, 0, 512, 575, 200, 550, .8], [512, 0, 512, 575, 748, 550, .8],
  [1024, 0, 512, 575, 1250, 550, .8], [0, 575, 512, 449, 260, 890, .8],
  [512, 575, 512, 449, 750, 885, .8], [1024, 575, 512, 449, 1280, 990, 1],
] as const;
// The collapsed pose's boot extends into the hands cell. Exclude that overlap.
const handsClip = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 72%, 22% 72%, 22% 54%, 0 54%)';
export const closeFrames = [
  [0, 0, 865, 480, 410, 465, 1], [865, 0, 671, 480, 1180, 465, 1],
  [0, 480, 768, 544, 410, 978, 1], [850, 435, 686, 589, 1115, 978, 1],
] as const;
export const contactFrames = [[0, 0, 1536, 1024, 510, 978, .5]] as const;
type FiveArt = 'chapterFiveDuel' | 'chapterFiveCast' | 'machTemple' | 'chapterFiveClose' | 'machMageContact';
export function FiveSprite({ art, frame, label }: { art: FiveArt; frame: number; label: string }) {
  const rects = { chapterFiveDuel: duelFrames, chapterFiveCast: templeCastFrames, machTemple: templeHeroFrames, chapterFiveClose: closeFrames, machMageContact: contactFrames };
  const [x, y, w, h, ax, ay, scale] = rects[art][frame];
  const [sw, sh] = assets[art].size;
  const canvas = art === 'chapterFiveClose' || art === 'machMageContact' ? [768, 512] : [444, 444];
  let clipPath: string | undefined;
  if (art === 'chapterFiveCast') clipPath = templeCastClips[frame];
  if (art === 'machTemple' && frame === 5) clipPath = handsClip;
  if (art === 'chapterFiveClose' && frame === 3) clipPath = 'polygon(42% 0, 100% 0, 100% 100%, 0 100%, 0 28%, 42% 28%)';
  return <SceneObject id="ChapterFiveArt-five-sprite-1" kind="sprite"><div className={`five-sprite art-${art}`} role="img" aria-label={label} data-frame={frame} style={{ aspectRatio: `${canvas[0]} / ${canvas[1]}` }}><div style={{
    left: `${(canvas[0] / 2 - (ax - x) * scale) / canvas[0] * 100}%`, top: `${(canvas[1] - (ay - y) * scale) / canvas[1] * 100}%`, width: `${w * scale / canvas[0] * 100}%`, height: `${h * scale / canvas[1] * 100}%`,
    clipPath,
    backgroundImage: `url("${assetUrl(art)}")`, backgroundSize: `${sw / w * 100}% ${sh / h * 100}%`, backgroundPosition: `${x ? x / (sw - w) * 100 : 0}% ${y ? y / (sh - h) * 100 : 0}%`,
  }} /></div></SceneObject>;
}
export function FiveHero({ state: s }: { state: ChapterState }) {
  if (s.page === 91 && !has(s, 'slip')) return <FiveSprite art="machTemple" frame={2} label="Мач ещё в руках Датарис, поднят за ноги" />;
  if (s.page >= 91) return <FiveSprite art="machTemple" frame={has(s, 'crawl') && !has(s, 'threshold') ? 3 : 4} label={has(s, 'threshold') ? 'Раненый Мач лежит снаружи храма, за порогом' : has(s, 'crawl') ? 'Мач ползёт влево к порогу' : 'Мач выскользнул из рук и упал на пол'} />;
  if (s.page === 90) return <FiveSprite art="machTemple" frame={2} label="Руки подняли Мача за ноги и тянут вправо к порталу" />;
  if (s.page >= 84) return <FiveSprite art="machTemple" frame={1} label="Мач держится обеими руками за дверные ручки слева, противодействуя рукам справа" />;
  if (s.page >= 67) return <FiveSprite art="machTemple" frame={0} label="Мач осторожно смотрит вправо к алтарю и порталу" />;
  if (s.page === 61 && has(s, 'scaffolding')) return <FiveSprite art="chapterFiveClose" frame={3} label="Мач поднимает деревянные леса на крышу муниципалитета" />;
  if ((s.page === 32 || s.page === 34) && has(s, 'chest')) return <FiveSprite art="chapterFiveDuel" frame={5} label="Усиленный Мач бьёт кулаком вправо" />;
  if (s.page === 32 && has(s, 'head')) return <FourSprite art="machLadyMouse" frame={3} label="Мач наносит Уогунну удар палкой по голове" />;
  if (s.page === 32 && has(s, 'dodge')) return <FiveSprite art="chapterFiveDuel" frame={4} label="Мач отскочил влево от меча Уогунна" />;
  if (s.page === 13 || s.page === 17) return <FourSprite art="gateReactions" frame={3} label="Мач сопровождает речь широким жестом" />;
  if (s.lady) return <FourSprite art="machLadyMouse" frame={1} label="Мач расправил плечи, сила 68" />;
  if (s.page === 40) return <FourSprite art="gateReactions" frame={3} label="Мач приветствует Хатико и Осаму и предлагает шкуры" />;
  return <TownSprite art="machTown" frame={1} anchor={townHeroAnchors[1]} label="Мач в одежде Хатико держит дубинку" />;
}
export function chapterFiveScene(page: number, escaped = false) {
  if (page <= 38) return { id: 'duel', art: 'tantrumStreet', name: 'У трактира · Мач слева, Уогунн справа' } as const;
  if (page === 39) return { id: 'night', art: 'tantrumStreet', name: 'Тантрум · путь к гостиному двору' } as const;
  if (page === 40) return { id: 'gates', art: 'tantrumGates', name: 'Западные ворота изнутри · утро' } as const;
  if (page <= 58) return { id: 'market', art: 'tantrumMarket', name: 'Рынок Тантрума · оружейный прилавок' } as const;
  if (page === 59) return { id: 'training', art: 'tantrumStreet', name: 'Рыночный переулок · снаряжение и учителя' } as const;
  if (page <= 62) return { id: 'roofs', art: 'tantrumRoofs', name: 'Муниципалитет · помощь Куджо' } as const;
  if (page <= 66) return { id: 'arrival', art: 'tantrumTempleOutside', name: 'Небольшой храм Датарис · вход справа' } as const;
  if (page >= 92 || page === 91 && escaped) return { id: 'outside', art: 'tantrumTempleOutside', name: 'За порогом храма · Мач выбрался' } as const;
  return { id: 'temple', art: 'tantrumTempleInside', name: 'Двери слева · алтарь и портал справа' } as const;
}
export default function ChapterFiveArt({ state: s }: { state: ChapterState }) {
  const scene = chapterFiveScene(s.page, has(s, 'threshold'));
  const close = s.page === 34 && has(s, 'disarm') && !has(s, 'nose');
  const touching = (s.page === 28 || s.page === 29) && has(s, 'touch-mage') && !s.lady;
  const temple = scene.id === 'temple';
  let heroPosition = 'left';
  if (temple && has(s, 'approach') && !has(s, 'retreat')) heroPosition = has(s, 'closer') ? 'closer' : 'approached';
  if (temple && s.page >= 79 && s.page <= 82) heroPosition = 'pulled';
  if (temple && s.page === 90) heroPosition = 'lifted';
  if (temple && s.page === 91) heroPosition = has(s, 'crawl') ? 'threshold' : 'fallen';
  const baronet = s.page >= 35 ? 3 : has(s, 'head') ? 2 : s.page === 32 ? 1 : 0;
  let closeFrame = 0;
  if (has(s, 'headbutt')) closeFrame = 1;
  if (has(s, 'knee-one')) closeFrame = 2;
  return <div className={`c5-actors scene-${scene.id} ${s.lady ? 'lady-active' : ''} move-${s.lastMove ?? 'idle'}`}>
    {scene.id === 'duel' && <SceneObject id="ChapterFiveArt-c5-crowd-1" kind="sprite"><div className={`c5-crowd ${s.page >= 37 ? 'parted' : ''}`}><div><FourSprite art="tavernCast" frame={6} label="Посетители трактира собрались посмотреть дуэль" /></div><div><FourSprite art="tavernCast" frame={7} label="Толпа наблюдает за Уогунном" /></div></div></SceneObject>}
    {temple && <><SceneObject id="ChapterFiveArt-c5-portal-1" kind="sprite"><div className={`c5-portal ${s.page >= 79 ? 'angry' : ''}`} role="img" aria-label="Овал солнечного света за алтарём · портал Датарис" /></SceneObject><SceneObject id="ChapterFiveArt-c5-hao-1" kind="group"><div className="c5-hao"><FiveSprite art="chapterFiveCast" frame={0} label="Старшая жрица Хао стоит у алтаря и делает жест левой рукой" /></div></SceneObject><SceneObject id="ChapterFiveArt-c5-priestesses-1" kind="sprite"><div className={`c5-priestesses ${s.page >= 79 ? 'scattered' : ''}`} aria-label="Жрицы в белом окружают алтарь">{[0, 1, 2].map((frame) => <SceneObject id="ChapterFiveArt-c5-priestess-1" key={frame} instanceKey={frame} kind="sprite"><div style={{ backgroundImage: `url("${assetUrl('priestessPoses')}")`, backgroundPosition: `${frame * 50}% ${s.page >= 79 ? 100 : 0}%` }} /></SceneObject>)}</div></SceneObject></>}
    {touching && <SceneObject id="ChapterFiveArt-c5-contact-1" kind="group"><div className="c5-contact"><FiveSprite art="machMageContact" frame={0} label="Мач легонько касается указательным пальцем бедра стоящей волшебницы через ткань одежды" /></div></SceneObject>}
    {!touching && (close ? <SceneObject id="ChapterFiveArt-c5-close-combat-1" key={s.lastMove} kind="group"><div className="c5-close-combat" key={s.lastMove}><FiveSprite art="chapterFiveClose" frame={closeFrame} label={closeFrame === 0 ? 'Мач выбивает меч пинком, Уогунн обезоружен' : closeFrame === 1 ? 'Мач ударяет Уогунна лбом' : 'Мач наносит Уогунну удар коленом'} /></div></SceneObject> : <SceneObject selectAsGroup id="ChapterFiveArt-c5-hero-1" key={`${s.page}-${s.lastMove}`} kind="sprite"><div className={`c5-hero position-${heroPosition} ${s.page >= 37 && s.page <= 39 ? 'departing' : ''} ${s.page >= 91 && has(s, 'slip') ? 'prone' : ''} ${has(s, 'threshold') ? 'escaped' : ''}`} key={`${s.page}-${s.lastMove}`}><FiveHero state={s} />{s.page === 89 && <SceneObject id="ChapterFiveArt-c5-scratches-1" kind="sprite"><div className="c5-scratches" aria-label="Руки исцарапали тело и разорвали одежду" role="img" /></SceneObject>}</div></SceneObject>)}
    {scene.id === 'duel' && <>{!close && <SceneObject id="ChapterFiveArt-c5-baronet-1" key={s.lastMove} kind="sprite"><div className={`c5-baronet ${s.page >= 35 ? 'defeated' : ''}`} key={s.lastMove}><FiveSprite art="chapterFiveDuel" frame={baronet} label={baronet === 3 ? 'Уогунн повержен и свернулся на земле' : baronet === 1 ? 'Уогунн замахивается мечом влево' : baronet === 2 ? 'Уогунн ошеломлён ударом по голове и в кирасу' : 'Уогунн сердито указывает на Мача'} /></div></SceneObject>}
      {!touching && <SceneObject id="ChapterFiveArt-c5-mage-1" kind="sprite"><div className={`c5-mage ${has(s, 'assign-mage') ? 'blessed' : ''} ${s.page >= 28 && s.page <= 30 ? 'contact-position' : ''}`}>{s.page === 22 ? <FiveSprite art="chapterFiveDuel" frame={6} label="Волшебница бьёт выскочку локтем, он падает на колени" /> : has(s, 'assign-mage') ? <FiveSprite art="chapterFiveDuel" frame={7} label="Волшебница сияет и преображается после назначения дамой" /> : <FourSprite art="tavernCast" frame={0} label="Подпитая волшебница рядом с толпой" />}</div></SceneObject>}
      {s.page >= 35 && <SceneObject id="ChapterFiveArt-c5-result-1" kind="effect"><span className="c5-result">Первая кровь · победа</span></SceneObject>}{s.page >= 29 && has(s, 'assign-mage') && <SceneObject id="ChapterFiveArt-c5-strength-1" kind="group"><span className="c5-strength">Сила 68 · дама назначена</span></SceneObject>}
    </>}
    {scene.id === 'gates' && <><SceneObject id="ChapterFiveArt-c5-guards-1" kind="sprite"><div className="c5-guards"><GateGuards page={0} /></div></SceneObject><SceneObject id="ChapterFiveArt-c5-sales-1" kind="group"><div className="c5-sales"><ItemIcon item="pelt" /><span>{has(s, 'sell-priestesses') ? 'Все шкуры проданы' : has(s, 'sell-students') ? 'Жрицы покупают оставшиеся 140 шкур' : '280 шкур · 20 канис за штуку'}</span></div></SceneObject></>}
    {scene.id === 'market' && <><SceneObject id="ChapterFiveArt-c5-merchant-1" kind="group"><div className="c5-merchant"><TownSprite art="tantrumMerchants" frame={2} label="Рыжий торговец предлагает оружие и навык Торговли" /></div></SceneObject>{s.page >= 47 && <SceneObject id="ChapterFiveArt-c5-purchase-1" kind="group"><div className={`c5-purchase ${has(s, 'buy-axe') ? 'in-bag' : ''}`}><ItemIcon item="axe" /><span>{has(s, 'buy-axe') ? 'Топор в инвентаре' : 'Простой топор · 9000 канис'}</span></div></SceneObject>}</>}
    {scene.id === 'training' && <SceneObject id="ChapterFiveArt-c5-training-summary-1" kind="group"><div className="c5-training-summary"><ItemIcon item="clothes" /><ItemIcon item="lighter" /><span>{s.stealth ? 'Скрытность · 1 ур.' : 'Скрытность'}</span><span>{s.traveler ? 'Путешественник · 1 ур.' : 'Путешественник'}</span></div></SceneObject>}
    {scene.id === 'roofs' && <><SceneObject id="ChapterFiveArt-c5-kudjo-1" kind="group"><div className="c5-kudjo"><TownSprite art="tantrumAuthorities" frame={4} label="Куджо ждёт помощи у муниципалитета" /></div></SceneObject><SceneObject id="ChapterFiveArt-c5-grandmother-1" kind="group"><div className={`c5-grandmother ${has(s, 'assign-grandmother') ? 'rejuvenated' : ''}`}><FiveSprite art="chapterFiveCast" frame={has(s, 'assign-grandmother') ? 5 : 4} label={has(s, 'assign-grandmother') ? 'Бабушка помолодела и бодро шагает дальше вправо' : 'Пожилая бабушка проходит мимо Куджо'} /></div></SceneObject>{has(s, 'scaffolding') && <SceneObject id="ChapterFiveArt-c5-roof-result-1" kind="effect"><div className="c5-roof-result"><RoofProp chimney={false} repaired onClick={undefined} /></div></SceneObject>}</>}
    {scene.id === 'arrival' && <SceneObject id="ChapterFiveArt-c5-guide-1" kind="group"><div className="c5-guide"><FiveSprite art="chapterFiveCast" frame={1} label="Жрица проводит Мача к дверям храма справа" /></div></SceneObject>}
    {temple && s.page >= 79 && s.page <= 91 && !has(s, 'threshold') && <SceneObject id="ChapterFiveArt-c5-hands-1" kind="sprite"><div className={`c5-hands ${has(s, 'push-novice') && s.page === 82 || s.page === 83 ? 'holds-novice' : ''} ${s.page === 90 ? 'at-ankles' : ''} ${has(s, 'slip') ? 'lost-grip' : ''}`}><FiveSprite art="machTemple" frame={5} label={has(s, 'slip') ? 'Прозрачные руки потеряли скользкого от крови и пота героя' : 'Прозрачные руки Датарис хватают и тянут в сторону портала справа'} /></div></SceneObject>}
    {temple && s.page >= 82 && <SceneObject id="ChapterFiveArt-c5-novice-1" kind="sprite"><div className={`c5-novice ${has(s, 'push-novice') ? 'on-hands' : ''}`}><FiveSprite art="chapterFiveCast" frame={has(s, 'assign-novice') ? 3 : 2} label={has(s, 'push-novice') ? 'Назначенная дамой послушница падает на прозрачные руки, освобождая Мача' : 'Послушница рядом с Мачем'} /></div></SceneObject>}
    {temple && s.page >= 89 && <SceneObject id="ChapterFiveArt-c5-injury-1" kind="group"><div className="c5-injury" role="status">Божественные царапины · одежда изорвана</div></SceneObject>}
    {scene.id === 'outside' && <SceneObject id="ChapterFiveArt-c5-found-mage-1" kind="sprite"><div className="c5-found-mage"><FourSprite art="tavernCast" frame={0} label="Волшебница нашла тяжело раненого Мача у порога храма" /></div></SceneObject>}
  </div>;
}
