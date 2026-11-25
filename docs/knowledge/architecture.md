# Архитектура

Обновлено: 2026-11-25. Статус: активно.

Краткая карта того, как устроен проект. Подробное поведение — в [главах](../chapters/README.md), правила — в [AGENTS.md](../../AGENTS.md).

## Стек и форма

* React 19 + TypeScript 5.9 (strict) + Vite 7.
* XState 5 для боя главы 8; главы 1–5 используют чистые редьюсеры.
* Без бэкенда: текст и ресурсы статичны, прогресс — в `localStorage`.
* PWA: `manifest.webmanifest` + генерируемый `dist/sw.js`, офлайн-кэш всего билда.
* Развёртывание: `dist` собирается и публикуется GitHub Actions на push в `main` ([deploy.yml](../../.github/workflows/deploy.yml)).

## Точка входа

```text
index.html
  └─ src/main.tsx
       ├─ ?scene-preview=1 → ScenePreview
       ├─ ?scene-editor=1  → SceneEditor (lazy)
       └─ иначе            → App + PwaUpdate
```

* [main.tsx](../../src/main.tsx) подключает шрифты и глобальные стили.
* [App.tsx](../../src/App.tsx) — оглавление, пролог/главы, бой главы 8, модальные окна, PWA-установка.
* `?scene-editor=1` доступен и в production-сборке, но запись в проект работает только в dev.
* `?scene-preview=1` используется редактором сцен и принимает `chapter`, `frame`, `variant`, `viewport`, `motion`, `ghost`.

## Экраны и маршруты

`App` хранит выбранный экран в `lazy-courage:view`:

| Значение | Что открывается |
| --- | --- |
| `contents` | Оглавление |
| `prologue` | [Prologue.tsx](../../src/Prologue.tsx) |
| `chapter-one` … `chapter-five` | [ChapterOne.tsx](../../src/ChapterOne.tsx) … [ChapterFive.tsx](../../src/ChapterFive.tsx) |
| `episode` | Бой и чтение главы 8 |

Маршрутов нет: переключение — условный рендер. Возврат в оглавление не сбрасывает прогресс. Если сохранён не-`intro` снимок боя, при отсутствии сохранённого view открывается `episode`.

## Анатомия главы 1–5

| Глава | Компонент | Текст | Логика | Постановка/ресурсы | Сохранение |
| --- | --- | --- | --- | --- | --- |
| 1 | `ChapterOne.tsx` | `chapter-one.json` (113 абзацев) | состояние страницы в `ChapterOne.tsx` | `ClassCards.tsx`, `HeroCreation.tsx`, `chapter-one-staging.ts`, `dataris-poses.ts` | `lazy-courage:chapter-one-page` |
| 2 | `ChapterTwo.tsx` | `chapter-two.json` (98) | `chapter-two-game.ts` | `ChapterTwoMenus.tsx`, `ChapterTwoArt.tsx`, `chapter-two-staging.ts` | `lazy-courage:chapter-two:v1` |
| 3 | `ChapterThree.tsx` | `chapter-three.json` (97) | `chapter-three-game.ts` | `ChapterThreeArt.tsx` | `lazy-courage:chapter-three:v1` |
| 4 | `ChapterFour.tsx` | `chapter-four.json` (108) | `chapter-four-game.ts` | `ChapterFourArt.tsx` | `lazy-courage:chapter-four:v1` |
| 5 | `ChapterFive.tsx` | `chapter-five.json` (94) | `chapter-five-game.ts` | `ChapterFiveArt.tsx` | `lazy-courage:chapter-five:v1` |

Общая схема:

```text
FB2/JSON абзацев → ChapterN.tsx
  ├─ SceneFrame/SceneObject (постановка поверх фона)
  ├─ chapter-N-game.ts (чистый reducer: page/phase/bag/tasks/history)
  ├─ BookText (шрифты прямой речи и авторских вставок)
  └─ localStorage ← read/valid/migrate → state
```

Каждая глава хранит независимый сейв. «Назад» откатывает `history`; «Далее» блокируется `nextRequirement`. Страница текста — это `page`, с нуля. Действия и предметы не должны начисляться дважды: проверяй `done`/`bag` до записи.

## Глава 8 / бой

* [story.ts](../../src/story.ts) — строки из `book.json`, `speakers`, `endings`, `passage`.
* [game.ts](../../src/game.ts) — XState-машина, константы HP/MP, `playerAction`, `enemyAction`, `validSave`, миграция v2.
* [App.tsx](../../src/App.tsx) — поле боя, пузыри, меню, журнал.
* [SpeechBubble.tsx](../../src/SpeechBubble.tsx) — единственный компонент боевых пузырей.
* [BattleUI.tsx](../../src/BattleUI.tsx) — полоски и панель команд.
* [book.json](../../src/book.json) — 30 строк, 26 абзацев фрагмента; `endings` — 15 строк.

Сохранение: `lazy-courage.save.v3`, миграция из `lazy-courage.save.v2`. Сейв пишется только в стабильных состояниях; сбой во время анимации возвращает к предыдущему стабильному.

## Система сцен

```text
src/scenes/chapter-0N.json  ←  SceneEditor (dev: файл + localStorage; prod: localStorage + download)
        │
        ├─ SceneFrame(chapter, frame, variant)
        ├─ SceneScope / SceneObject (идентификаторы, трансформации, клоны)
        └─ elementAt / transformAt / parseSceneChapter
```

* [scene-layout.ts](../../src/scene-layout.ts) — схема JSON, длины глав, `parseSceneChapter`, трансформации.
* [scene-documents.ts](../../src/scene-documents.ts) — чтение/запись `lazy-courage:scene-layout:N:v1`.
* [SceneObject.tsx](../../src/SceneObject.tsx) — привязка React-элементов к сцене, замеры, drag.
* [SceneEditor.tsx](../../src/SceneEditor.tsx) — редактор; сохранение в dev идёт через POST `/__scene-editor/chapter-0N.json`.
* [scene-replay.ts](../../src/scene-replay.ts) — перебор состояний главы для кадров и вариантов.

Координаты — проценты от viewport; мобильные поправки хранятся отдельно в `mobile`. Не редактируй JSON вручную в обход `parseSceneChapter`: он проверяет все кадры, варианты, копии и пределы.

## Текст

```text
FB2 → scripts/extract-story.py → src/prologue.json / chapter-N.json / book.json
  └─ BookText: runs (emphasis/strong) → сегменты «речь/повествование»
```

* [BookText.tsx](../../src/BookText.tsx) — единственный рендерер книжного текста.
* Прямая речь — Golos Text, повествование и авторские вставки — Alegreya.
* Один диалоговый абзац с авторской вставкой — один шаг чтения.
* Не редактируй JSON текста вручную: сначала проверь извлечение и полноту.

## Ресурсы

* `public/art/` — WebP; `src/assets.ts` — единственный реестр.
* `assetUrl(id)` возвращает абсолютный URL с учётом `BASE_URL` и подкаталога.
* Листы спрайтов описываются `grid`/`cell`/`size`; кадры — в `*-art.ts`/`dataris-poses.ts`.
* `scripts/check-art.ts` сверяет физические размеры, отсутствие дублей и незарегистрированных WebP.
* Исходные PNG и промпты — в `docs/art/sources/` и исторических пакетах; в `public/` их быть не должно.

## PWA и сборка

```text
tsc -b → vite build → node scripts/build-pwa.mjs
```

* [build-pwa.mjs](../../scripts/build-pwa.mjs) собирает список файлов `dist`, считает хеш версии и генерирует `sw.js`.
* Кэш версионируется; старые ключи удаляются на activate; навигация отдаёт `index.html`.
* [PwaUpdate.tsx](../../src/PwaUpdate.tsx) проверяет обновление при входе, возврате из фона и восстановлении сети.
* В dev service worker не регистрируется.
* `base: './'` в [vite.config.ts](../../vite.config.ts) позволяет публиковать в подкаталоге.

## Документация

* [AGENTS.md](../../AGENTS.md) — правила.
* [docs/README.md](../README.md) — карта.
* `docs/chapters/` — реализованное, `docs/plans/` — будущее, `docs/reviews/` — доказательства, `docs/archive/` — история.
* `docs/knowledge/` — эта база.
* `ChapterImprovements.tsx` автоматически подключает `docs/plans/*.md` в окно «Улучшения глав».

## Точки расширения

| Задача | Куда смотреть сначала |
| --- | --- |
| Новая глава | [workflows.md](workflows.md#wf-01-новая-или-продолжаемая-глава), `docs/guides/chapter-workflow.md` |
| Новая сцена/кадр | [workflows.md](workflows.md#wf-02-изменение-постановки-сцены), `docs/guides/scene-editor.md` |
| Новый предмет | [workflows.md](workflows.md#wf-03-новый-предмет), `docs/art/README.md` |
| Новое поле сейва | [workflows.md](workflows.md#wf-04-изменение-схемы-сохранения), [glossary.md](glossary.md) |
| Мобильная правка | [workflows.md](workflows.md#wf-05-мобильная-правка), `docs/guides/low-screens.md` |
| Релиз/PWA | [workflows.md](workflows.md#wf-06-сборка-pwa-и-публикация), [verification.md](verification.md) |
