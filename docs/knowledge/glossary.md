# Глоссарий и стабильные идентификаторы

Обновлено: 2026-11-20. Статус: активно.

Термины, ключи и константы, которые нельзя угадывать по имени. Полный реестр ресурсов — [assets.ts](../../src/assets.ts); полный реестр изображений — [catalog.md](../art/catalog.md).

## Термины

| Термин | Значение |
| --- | --- |
| **Абзац** | Единица книжного текста FB2, номер с нуля. Один шаг чтения, даже если внутри авторская вставка |
| **Страница** | Позиция чтения в главе/прологе; обычно совпадает с абзацем, но пролог группирует абзацы по страницам |
| **Кадр** | Позиция в редакторе сцен; соответствует абзацу (`frame` = `paragraph`) |
| **Вариант** | Состояние кадра в редакторе: `start`, `step-1`, …; определяет действия/фазу |
| **Сцена** | Набор фона, объектов и действий на странице (`scene.id` в `*-staging.ts`) |
| **Постановка** | Визуальное сопровождение текста: фон, спрайты, эффекты, интерфейс |
| **Спрайт** | Рисунок персонажа/объекта, обычно кадр листа |
| **Опора** | Точка привязки спрайта (стопы/трон/голова), не граница силуэта |
| **Лист** | Изображение с сеткой кадров (`grid`, `cell`) |
| **Тайлсет** | Лист предметов с фиксированным порядком кадров |
| **Реплика** | Прямая речь персонажа; в бою — пузырь |
| **Авторская вставка** | Слова автора внутри/после прямой речи; шрифт Alegreya, но шаг чтения тот же |
| **Дама** | Способность/спутница, удваивающая характеристики; в разных главах разные дамы |
| **Дар** | Классовый дар богини (Океан опыта, Гений, Череда побед) |
| **Канис** | Валюта мира |
| **Reduced motion** | `prefers-reduced-motion: reduce`; событие понятно без анимации |
| **PWA** | Устанавливаемое офлайн-приложение; service worker в production |
| **Флейк** | Тест, который иногда падает без изменения кода |

## Ключи `localStorage`

| Ключ | Что хранит |
| --- | --- |
| `lazy-courage:view` | Текущий экран (`contents`, `prologue`, `chapter-one`…`chapter-five`, `episode`) |
| `lazy-courage:prologue-page` | Страница пролога |
| `lazy-courage:chapter-one-page` | Страница главы 1 |
| `lazy-courage:chapter-two:v1` | Полный сейв главы 2 (`version`, `current`, `history`) |
| `lazy-courage:chapter-three:v1` | Полный сейв главы 3 |
| `lazy-courage:chapter-four:v1` | Полный сейв главы 4 |
| `lazy-courage:chapter-five:v1` | Полный сейв главы 5 |
| `lazy-courage.save.v3` | Снимок XState-боя главы 8 |
| `lazy-courage.save.v2` | Старый сейв боя; только для миграции |
| `lazy-courage:scene-layout:<1–5>:v1` | Правки постановки из редактора |

Не меняй существующий ключ без версии/миграции. Блокировка хранилища не должна ронять игру.

## Константы

### Бой главы 8 (`src/game.ts`)

| Константа | Значение |
| --- | --- |
| `MAX_HP` | 140 |
| `MAX_MP` | 20 |
| `WITCH_HP` | 96 |
| `WITCH_MP` | 8 |
| `ENEMY_HP` | 117 |
| Яблоки / противоядие | 3 / 3 |
| Состояния сейва | `intro`, `chapter`, `player`, `playerDialogue`, `enemyDialogue`, `arrivalDialogue`, `victory`, `defeat`, `ending`, `complete` |

### Главы 2–5

| Глава | Константы/пределы |
| --- | --- |
| 2 | `HERO_HP=140`, `RABBIT_HP=30`; 5 боёв; кристаллы за бой |
| 3 | `maxHp = 140 + (level-1)*10`; `maxMp = 20 + (level-1)*10`; 62 победы в дне |
| 4 | `maxHp` 160/420 ×2 при даме; `maxMp` 40/170 ×2; деньги до 15 535 |
| 5 | старт 10 165 канис; `maxHp` 420/840; `maxMp` 170/340; 94 абзаца |

Точные пределы — в `validState` соответствующего `chapter-*-game.ts`; не дублируй их вручную в новых проверках.

## Длины частей

| Часть | Абзацев | Файл |
| --- | --- | --- |
| Пролог | 15 (12 страниц) | `src/prologue.json` |
| Глава 1 | 113 | `src/chapter-one.json` |
| Глава 2 | 98 | `src/chapter-two.json` |
| Глава 3 | 97 | `src/chapter-three.json` |
| Глава 4 | 108 | `src/chapter-four.json` |
| Глава 5 | 94 | `src/chapter-five.json` |
| Глава 8, фрагмент | 26 абзацев / 30 строк | `src/book.json` |

`chapterLengths` в `scene-layout.ts` должен совпадать с длиной JSON.

## ID и спикеры

* Спикеры боя: `mach`, `sayaka`, `narrator`, `clerk`.
* Подписи: `speakers` в `story.ts`.
* Герой: Мач Крайм; ведьма: Саяка Такамацури; регистраторша: `clerk`.
* Богиня: Датарис (глава 1).
* Имена ID ресурсов — `camelCase` в `assets.ts` (`machBattle`, `tantrumGates`, `classCards`).
* ID сцен — `kebab-case` (`chapter-hero-position`, `c3-hero`, `chapter-cart`).
* Ключи React у соседних спрайтов/урона/эффектов должны различаться; для клонов сцены — `copy-<uuid>`.

## Порядок кадров предметов

`itemFrames` (лист `meadowItems`, 4×2):

`leaves:0, crystal:1, herb:2, carrot:3, apple:4, orange:5, parcel:6`

`townItemFrames` (`townItems`, 4×2):

`club:0, knife:1, clothes:2, ration:3, soup:4, trousers:5, jacket:6, cap:7`

`huntItemFrames` (`huntItems`, 4×2):

`meat:0, pelt:1, water:2, beer:3, dinner:4, roast:5, peeledApple:6, slicedCarrot:7`

`travelItemFrames` (`travelItems`, 1774×887):

`axe:[0,0,977,887], lighter:[977,0,797,887]`

Порядок кадров менять нельзя без обновления `ItemIcon` и проверки всех сцен.

## Query-параметры

| Параметр | Назначение |
| --- | --- |
| `?scene-editor=1` | Редактор сцен |
| `?scene-preview=1&chapter=…&frame=…&variant=…&viewport=…&motion=…&ghost=…` | Предпросмотр одного кадра для редактора |

## Именование файлов

* Глава: `chapter-NN.md` (двузначный номер); пролог: `prologue.md`.
* Компонент: `ChapterN.tsx`; логика: `chapter-n-game.ts`; текст: `chapter-n.json`; постановка: `ChapterNArt.tsx`.
* Сцена: `src/scenes/chapter-0N.json`.
* Отчёт: `docs/reviews/<тема>.md`; план: `docs/plans/chapter-NN.md`.
* Ресурсы: `public/art/<characters|locations|items|cards|illustrations>/…`.

## Термины статусов

* **Уровень 1** — обязательное для первого прохода.
* **Уровень 2** — желательное заметное улучшение.
* **Уровень 3** — полировка.
* **`KI-NNN`** — инженерная проблема, [known-issues.md](known-issues.md).
* **`D-NNN`** — решение, [decisions.md](decisions.md).
* **`INV-NN`** — инвариант, [invariants.md](invariants.md).
* **`WF-NN`** — рецепт, [workflows.md](workflows.md).
