import SceneObject from './SceneObject';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { assetUrl } from './assets';
import BookText from './BookText';
import paragraphs from './chapter-two.json' with { type: 'json' };
import { HERO_HP, itemNames, menuNames, type ChapterAction, type ChapterState, type Item, type Menu } from './chapter-two-game';
import { MeadowHero, mealPose } from './ChapterTwoArt';
import { Meter } from './BattleUI';
import { isStatusListing, statusGroups } from './chapter-two-staging';

export function HealthMeter({ value, max, name }: { value: number; max: number; name: string }) {
  return <SceneObject id="ChapterTwoMenus-chapter-health-1" kind="group"><div className="chapter-health"><Meter value={value} max={max} name={name} /></div></SceneObject>;
}

// The shared 4×2 sheet follows this stable order; UI labels and quantities stay live.
export const itemFrames: Record<Item, number> = { leaves: 0, crystal: 1, herb: 2, carrot: 3, apple: 4, orange: 5, parcel: 6 };
export const townItemFrames = { club: 0, knife: 1, clothes: 2, ration: 3, soup: 4, trousers: 5, jacket: 6, cap: 7 } as const;
export type TownItem = keyof typeof townItemFrames;
export const huntItemFrames = { meat: 0, pelt: 1, water: 2, beer: 3, dinner: 4, roast: 5, peeledApple: 6, slicedCarrot: 7 } as const;
export const travelItemFrames = { axe: [0, 0, 977, 887], lighter: [977, 0, 797, 887] } as const;
export function ItemIcon({ item }: { item: Item | TownItem | keyof typeof huntItemFrames | keyof typeof travelItemFrames }) {
  if (item === 'axe' || item === 'lighter') {
    const [x, y, w, h] = travelItemFrames[item];
    return <SceneObject id="ChapterTwoMenus-item-icon-1" kind="sprite"><span className={`item-icon item-${item}`} aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: `${Math.min(100, w / h * 100)}%`, height: `${Math.min(100, h / w * 100)}%`, backgroundImage: `url("${assetUrl('travelItems')}")`, backgroundSize: `${1774 / w * 100}% ${887 / h * 100}%`, backgroundPosition: `${x ? x / (1774 - w) * 100 : 0}% ${y}%` }} /></span></SceneObject>;
  }
  const town = Object.hasOwn(townItemFrames, item);
  const hunt = Object.hasOwn(huntItemFrames, item);
  const frame = hunt ? huntItemFrames[item as keyof typeof huntItemFrames] : town ? townItemFrames[item as TownItem] : itemFrames[item as Item];
  const art = hunt ? 'huntItems' : town ? 'townItems' : 'meadowItems';
  return <SceneObject id="ChapterTwoMenus-item-icon-2" kind="sprite"><span className={`item-icon item-${item}`} aria-hidden="true"><span style={{ width: town || hunt ? '100%' : undefined, backgroundImage: `url("${assetUrl(art)}")`, backgroundSize: '400% 200%', backgroundPosition: `${frame % 4 / 3 * 100}% ${Math.floor(frame / 4) * 100}%` }} /></span></SceneObject>;
}

function Inventory({ state: s, dispatch }: { state: ChapterState; dispatch: (action: ChapterAction) => void }) {
  const [selected, setSelected] = useState<Item | null>(null);
  const items = (Object.keys(itemNames) as Item[]).filter(item => s.bag[item] > 0);
  function use(item: Item) { setSelected(item); dispatch({ type: 'use', item }); }
  const usable = (item: Item) => item === 'leaves' || ['carrot', 'apple', 'orange'].includes(item) && s.phase === 'healing';
  return <SceneObject id="ChapterTwoMenus-chapter-inventory-1" kind="group"><div className="chapter-inventory">
    <SceneObject id="ChapterTwoMenus-inventory-character-1" kind="group"><div className="inventory-character" onDragOver={e => e.preventDefault()} onDrop={e => {
      e.preventDefault(); const item = e.dataTransfer.getData('text/plain');
      if (Object.hasOwn(itemNames, item)) use(item as Item);
    }} aria-label="Персонаж — перетащите сюда листья или еду">
      <MeadowHero equipped={s.equipped} pose={s.phase === 'rested' && s.page <= 83 ? mealPose(s.fight) : 0} />
      <span>{s.equipped ? 'Повязка из цедулиса' : 'Без одежды'}</span>
      <HealthMeter value={s.hp} max={HERO_HP} name="Здоровье Мача" />
    </div></SceneObject>
    <SceneObject id="ChapterTwoMenus-inventory-storage-1" kind="group"><div className="inventory-storage">
      <SceneObject id="ChapterTwoMenus-inventory-hint-1" kind="group"><p className="inventory-hint">{s.phase === 'healing' ? 'Нажмите на еду: поесть и отдохнуть.' : !s.equipped ? 'Нажмите на листья или перетащите их на героя.' : '100 ячеек · одинаковые предметы складываются вместе.'}</p></SceneObject>
      <SceneObject id="ChapterTwoMenus-inventory-grid-1" kind="group"><div className="inventory-grid" role="group" aria-label="100 ячеек инвентаря" tabIndex={0}>
        {Array.from({ length: 100 }, (_, index) => {
          const item = items[index];
          if (!item) return <SceneObject id="ChapterTwoMenus-inventory-slot-1" key={index} instanceKey={index} kind="group"><span className="inventory-slot empty" key={index} aria-hidden="true" /></SceneObject>;
          return <SceneObject id="ChapterTwoMenus-inventory-slot-2" key={index} instanceKey={index} kind="control"><button key={index} className={`inventory-slot ${selected === item ? 'selected' : ''} ${s.page === 9 && item === 'leaves' || s.phase === 'healing' ? 'fresh-item' : ''}`} draggable={usable(item)} onDragStart={e => e.dataTransfer.setData('text/plain', item)} onClick={() => use(item)} aria-label={`${itemNames[item]}: ${s.bag[item]}${usable(item) ? ', использовать' : ''}`} title={itemNames[item]}><ItemIcon item={item} /><b>{s.bag[item]}</b><span>{itemNames[item]}</span></button></SceneObject>;
        })}
      </div></SceneObject>
      <SceneObject id="ChapterTwoMenus-inventory-description-1" kind="group"><p className="inventory-description" role="status">{selected ? itemNames[selected] + (selected === 'crystal' ? ' — пять кристаллов нужны Хатико.' : selected === 'herb' ? ' — пахучая травка из кролика.' : selected === 'parcel' ? ' — одежда, обувь и ремень. Сначала — к реке!' : '') : 'Выберите предмет'}</p></SceneObject>
    </div></SceneObject>
  </div></SceneObject>;
}

const regions = [
  { id: 'helis', name: 'Хелис', description: 'Континент. Мы находимся в его самой южной части.', x: 48, y: 35 },
  { id: 'kuratan', name: 'Куратан', description: 'Мирное королевство: богатые урожаи и мало опасных монстров.', x: 46, y: 60 },
  { id: 'front', name: 'Войска Князя Тьмы', description: 'Далёкий фронт. Точное направление и границы пока неизвестны.', x: 77, y: 20 },
  { id: 'tantrum', name: 'Тантрум', description: 'Город у южных лугов. Повозка направляется к его воротам.', x: 48, y: 74 },
  { id: 'villages', name: 'Деревни и леса', description: 'За спиной — лужайки, леса, деревни, монастырь и детский дом.', x: 31, y: 83 },
  { id: 'ocean', name: 'Океан', description: 'Через несколько сотен километров к югу начинается океан.', x: 50, y: 94 },
];

export function WorldMap({ page, mini = false, focus, onFocus, onResize, inspecting, onInspect }: { page: number; mini?: boolean; focus: string; onFocus: (id: string) => void; onResize: () => void; inspecting: boolean; onInspect: () => void }) {
  useEffect(() => {
    if (inspecting) return;
    if (page !== 17 && page !== 33) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { onFocus(page === 33 ? 'ocean' : 'front'); return; }
    const sequence = page === 33 ? ['tantrum', 'villages', 'ocean'] : ['helis', 'kuratan', 'front', 'tantrum'];
    let index = 0;
    const timer = window.setInterval(() => {
      index++;
      if (index >= sequence.length) { clearInterval(timer); return; }
      onFocus(sequence[index]);
    }, 3200);
    return () => clearInterval(timer);
  }, [page, inspecting, onFocus]);
  const inspect = (id: string) => { onInspect(); onFocus(id); };
  const region = regions.find(r => r.id === focus)!;
  return <SceneObject id="ChapterTwoMenus-chapter-map-1" kind="group"><div className={`chapter-map ${mini ? 'mini' : ''}`}>
    <SceneObject id="ChapterTwoMenus-map-drawing-1" kind="group"><div className="map-drawing">
      <svg viewBox="0 0 700 440" preserveAspectRatio="none" aria-hidden="true">
        <defs><pattern id="map-waves" width="35" height="25" patternUnits="userSpaceOnUse"><path d="M0 12 Q9 5 17 12 T35 12" fill="none" stroke="#a2c1ad" strokeOpacity=".15" /></pattern></defs>
        <rect width="700" height="440" fill="#21464b" /><rect width="700" height="440" fill="url(#map-waves)" />
        <path d="M145 0 L553 0 581 42 550 76 572 115 544 130 572 170 524 196 530 238 502 260 472 304 468 344 407 367 382 405 329 391 296 369 249 357 236 320 205 298 230 255 183 233 207 196 176 154 197 121 151 88 166 45Z" fill="#719778" stroke="#d4cca0" strokeWidth="2" />
        <path d="M260 265 Q364 226 492 272 L468 344 407 367 382 405 329 391 296 369 249 357 236 320Z" fill="#b5b879" opacity=".75" />
        <path d="M366 88 Q296 167 365 211 T359 354" stroke="#d7e6cb" strokeWidth="5" fill="none" />
        <path d="M530 42 L481 94 513 143 457 175" stroke="#963c3a" strokeWidth="22" opacity=".6" fill="none" strokeDasharray="8 5" />
        <path d="M323 54 l14 -20 14 20 m9 12 19 -30 19 30 m-133 72 19 -30 19 30 m94 32 22 -34 22 34" fill="none" stroke="#314e43" strokeWidth="3" />
      </svg>
      {regions.map(r => <SceneObject id="ChapterTwoMenus-map-marker-1" key={r.id} instanceKey={r.id} kind="control"><button key={r.id} className={`map-marker ${r.id} ${focus === r.id ? 'active' : ''}`} style={{ left: `${r.x}%`, top: `${r.y}%` }} onClick={() => inspect(r.id)} aria-label={r.name} aria-pressed={focus === r.id}><SceneObject id="ChapterTwoMenus-i-1" kind="effect"><i /></SceneObject><span>{r.name}</span></button></SceneObject>)}
    </div></SceneObject>
    <SceneObject id="ChapterTwoMenus-map-caption-1" kind="group"><div className="map-caption"><SceneObject id="ChapterTwoMenus-map-resize-1" kind="control"><button className="map-resize" onClick={onResize}>{mini ? 'Развернуть карту' : 'Свернуть в миникарту'}</button></SceneObject><strong>{region.name}</strong><p>{region.description}</p><SceneObject id="ChapterTwoMenus-map-stops-1" kind="group"><div className="map-stops" aria-label="Места на карте">{regions.map(place => <SceneObject id="ChapterTwoMenus-button-1" key={place.id} instanceKey={place.id} kind="control"><button key={place.id} onClick={() => inspect(place.id)} aria-pressed={focus === place.id}>{place.name}</button></SceneObject>)}</div></SceneObject><small>Схема по рассказу Ичиро. Очертания и расстояния условны.</small></div></SceneObject>
  </div></SceneObject>;
}

function CharacterStatus({ state }: { state: ChapterState }) {
  const fields = useRef<HTMLDivElement>(null);
  let related: number[] = [];
  if ([53, 55].includes(state.page)) related = [53, 55];
  else if ([54, 56, 64].includes(state.page)) related = [51, 54, 56];
  useEffect(() => {
    const current = fields.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const body = fields.current?.closest('.chapter-menu-body');
    if (!current || !body) return;
    const row = current.getBoundingClientRect();
    const viewport = body.getBoundingClientRect();
    if (row.top < viewport.top || row.bottom > viewport.bottom) body.scrollTop += row.top - viewport.top - (body.clientHeight - row.height) / 2;
  }, [state.page]);
  return <SceneObject id="ChapterTwoMenus-chapter-status-1" kind="group"><div className="chapter-status" ref={fields}>
    {statusGroups.map(group => <section key={group.name} aria-label={group.name}>
      <h3>{group.name}</h3>
      {group.pages.map(page => <SceneObject id="ChapterTwoMenus-status-field-1" key={page} instanceKey={page} kind="group"><p key={page} data-status-page={page} className={`status-field ${state.page === page ? 'current' : ''} ${related.includes(page) ? 'related' : ''}`} aria-current={state.page === page ? 'true' : undefined}>
        {page === 51 && state.page >= 70 ? <>ХП — {state.hp} МП — 20</> : <BookText runs={paragraphs[page]} />}
      </p></SceneObject>)}
    </section>)}
    {!isStatusListing(state.page) && <SceneObject id="ChapterTwoMenus-status-resources-1" kind="group"><div className="status-resources"><HealthMeter value={state.hp} max={HERO_HP} name="Здоровье Мача" /><p>Опыт: {state.xp} · Опыт класса: {state.classXp}</p></div></SceneObject>}
  </div></SceneObject>;
}

export default function ChapterTwoMenus({ menu, pinned, state, dispatch, onClose, onOpenMenu, mapFocus, onMapFocus, mapInspected, onMapInspect }: { menu: Menu; pinned: boolean; state: ChapterState; dispatch: (action: ChapterAction) => void; onClose: () => void; onOpenMenu: (menu: Menu) => void; mapFocus: string; onMapFocus: (id: string) => void; mapInspected: boolean; onMapInspect: () => void }) {
  return <SceneObject id="ChapterTwoMenus-chapter-menu-1" kind="group"><section className={`chapter-menu menu-${menu}`} role="region" aria-label={`${menuNames[menu]}${pinned ? ' — по сюжету' : ''}`}>
    <header><h2 className={menu === 'status' && state.page === 45 ? 'current' : ''} data-status-page={menu === 'status' ? 45 : undefined} aria-current={menu === 'status' && state.page === 45 ? 'true' : undefined}>{menu === 'status' ? <BookText runs={paragraphs[45]} /> : menuNames[menu]}</h2>{pinned ? <SceneObject id="ChapterTwoMenus-story-menu-note-1" kind="group"><span className="story-menu-note">Открыто по сюжету · читайте дальше</span></SceneObject> : <SceneObject id="ChapterTwoMenus-icon-button-1" kind="control"><button className="icon-button" aria-label="Закрыть меню" onClick={onClose}><X size={18} /></button></SceneObject>}</header>
    <div className="chapter-menu-body">
      {menu === 'inventory' && <Inventory state={state} dispatch={dispatch} />}
      {(menu === 'map' || menu === 'minimap') && <WorldMap key={state.page === 33 ? 'south' : 'world'} page={state.page} mini={menu === 'minimap'} focus={mapFocus} onFocus={onMapFocus} onResize={() => onOpenMenu(menu === 'map' ? 'minimap' : 'map')} inspecting={mapInspected} onInspect={onMapInspect} />}
      {menu === 'status' && <CharacterStatus state={state} />}
      {menu === 'help' && <SceneObject id="ChapterTwoMenus-chapter-help-1" kind="group"><div className="chapter-help"><h3>{state.page >= 64 ? 'Характеристики' : 'Мысленные команды'}</h3>{state.page >= 64 ? <><SceneObject id="ChapterTwoMenus-related-1" kind="group"><p className="related">Сила 8 → физический урон. Скорость 2 → частота ударов и шанс уклониться.</p></SceneObject><SceneObject id="ChapterTwoMenus-related-2" kind="group"><p className="related">Выносливость 4 → 100 + 4 × 10 = 140 HP. Интеллект 2 → 2 × 10 = 20 MP.</p></SceneObject></> : <><p>Инвентарь хранит вещи. Нажмите на листья, чтобы надеть их, на еду — чтобы восстановить силы после боя.</p><p>Статус показывает характеристики. Миникарта и карта помогают осмотреть мир.</p></>}<p>Доступные меню можно открывать кнопками сверху. Окно, открытое героем по сюжету, остаётся до возвращения к действию.</p></div></SceneObject>}
      {menu === 'quests' && <SceneObject id="ChapterTwoMenus-chapter-help-2" kind="group"><div className="chapter-help"><h3>Заданий нет</h3><p>Хатико предложил обменять пять кристаллов на одежду. Системного задания он не выдал.</p></div></SceneObject>}
      {menu === 'journal' && <div className="chapter-journal">{paragraphs.slice(0, state.page + 1).map((runs, index) => <p key={index}><BookText runs={runs} /></p>)}</div>}
    </div>
  </section></SceneObject>;
}
