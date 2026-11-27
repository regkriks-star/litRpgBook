# Журнал базы знаний

Обновлено: 2026-11-27. Статус: активно.

Хронология изменений базы. Одна запись на задачу; не удалять старые записи. Формат:

```md
## YYYY-MM-DD · Краткое название

* Что добавлено/изменено.
* Какие файлы затронуты.
* Ссылка на проверку/отчёт/коммит.
```

## 2026-11-27 · Общие настройки чтения для всех глав

* Кнопка «Настройки чтения» размером 44 × 44 стоит рядом с «Оглавлением» и сбросом главы в прологе, главах 1–5 и в меню фрагмента главы 8.
* Панель даёт ползунки размера шрифта (80–140 %), размера окна с текстом (80–120 %) и прозрачности фона окна (0–65 %); текст остаётся непрозрачным. Значения общие для всей книги, сохраняются в `lazy-courage:reader-settings:v1` и появляются в хранилище только после изменения; есть сброс.
* Настройки вынесены в [ReaderSettings.tsx](../../src/ReaderSettings.tsx) и [reader-settings.css](../../src/reader-settings.css). Переменные на `<html>` масштабируют любую книжную поверхность; главы только добавляют класс `reader-surface` и кнопку. Инструкция для будущих глав и переноса в другой проект — [reader-settings.md](../guides/reader-settings.md).
* На 568 × 320 панель ограничена экраном и прокручивается, ползунки не меньше 44 px; закрытие — кнопкой, Escape и нажатием вне панели.
* Комментарий кадра 0 в `src/scenes/chapter-01.json` очищен.
* Проверки: `typecheck`; E2E главы 1 — 13/13, новые сквозные настройки — 2/2 (пролог, главы 1–5, глава 8, 568 × 320); полные E2E глав 2–5 и пролога; редактор сцен; `build`; `check:kb`.
* Файлы: `src/ReaderSettings.tsx`, `src/reader-settings.css`, `src/ChapterOne.tsx`, `src/Prologue.tsx`, `src/ChapterTwo.tsx`–`src/ChapterFive.tsx`, `src/App.tsx`, `src/styles.css`, `tests/chapter-one.spec.ts`, `tests/reader-settings.spec.ts`, `src/scenes/chapter-01.json`; отчёт — [chapter-one-reader-settings.md](../reviews/chapter-one-reader-settings.md).

## 2026-11-26 · Сцены глав 2–5: объекты вместо подписей

* Куст цедулиса на странице 10 главы 2 теперь виден и кликается сам: раньше его рисунок сжимался до 0 × 0, оставалась только плашка «Собрать цедулис».
* По той же схеме прямо на рисунок перенесены добыча, пять кристаллов и пакет (глава 2), добыча (глава 3), кролик, Ичиро, повозка, Оома, кот и мышь (глава 4), волшебница и послушница (глава 5). Текстовые подписи этих действий убраны; доступное имя и подсказка сохранены.
* Добавлен общий [SceneAction.tsx](../../src/SceneAction.tsx) — прозрачная фокусируемая кнопка поверх готового объекта. Команды движения, боя и меню остаются кнопками, потому что у них нет отдельного предмета в сцене.
* Пустой контейнер `.c3-actions` больше не перехватывает нажатия: кликабельны только настоящие кнопки.
* Комментарий кадра 9 в `src/scenes/chapter-02.json` очищен после выполнения.
* Проверки: `typecheck`, 26 unit; главы 2–3 — 24/24, глава 4 — 6/6, followup — 4/4, глава 5 — 6/6, редактор сцен — 8/8; 1440 × 900 и 568 × 320, reduced motion.
* Файлы: `src/SceneAction.tsx`, `src/ChapterTwo.tsx`, `src/ChapterThree.tsx`, `src/ChapterFour.tsx`, `src/ChapterFourArt.tsx`, `src/ChapterFive.tsx`, `src/ChapterFiveArt.tsx`, `src/chapter-two.css`, `src/chapter-three.css`, `src/chapter-four.css`, `src/scenes/chapter-02.json`; отчёт — [chapter-object-actions.md](../reviews/chapter-object-actions.md).

## 2026-11-26 · Датарис крупнее и внутри божественной печати

* Глава 1: трон и печать получили общий центр; трон вырос с 45vh до 54vh (на низких экранах с 36vh до 44vh), диаметр печати — 1,16 ширины группы. Печать больше не смещена влево-вверх от фигуры и остаётся концентричной трону во всех позах и на всех 113 страницах.
* Базовое размещение задано переменными `.audience-scene` в `chapter-one.css`; JSON сцен по-прежнему хранит только отличия от общей композиции. Комментарий кадра 0 в `src/scenes/chapter-01.json` очищен после выполнения.
* Проверки: `typecheck`, 26 unit, E2E главы 1 — 11/11, редактора сцен — 8/8; снимки 1440 × 1000, 1440 × 900, 1280 × 600, 1024 × 600, 844 × 390, 568 × 320; reduced motion.
* Файлы: `src/chapter-one.css`, `src/scenes/chapter-01.json`; отчёт — [chapter-01-goddess-seal.md](../reviews/chapter-01-goddess-seal.md).

## 2026-11-25 · Переезд на regkriks-star и деплой через Actions

* Исходники инициализированы в Git (`main`), remote — `regkriks-star/litRpgBook`.
* Публикация переведена с force-push в `gh-pages` (`psyselfhelp/LitRPG`) на `.github/workflows/deploy.yml`: push в `main` собирает `dist` и публикует GitHub Pages.
* Удалены `scripts/publish.sh`, `scripts/test-publish.sh` и команда `deploy:psyselfhelp`; `docs/reviews/` исключены из Git (813 МБ QA-снимков).
* Первый деплой выполнен: <https://regkriks-star.github.io/litRpgBook/> отдаёт 200, `assets/index-*` совпадают с `dist`.
* Проверки: `typecheck`, 26 unit-тестов, `check:art` (77 WebP), `check:kb`, `build`.
* Обновлены `README.md`, `architecture.md`, `invariants.md`, `workflows.md`, `decisions.md`, `low-screens.md`.

## 2026-11-20 · Исправлены ошибки аудита

* Сохранения: битый `v3` больше не мешает fallback на `v2`; одежда на странице 89 главы 5 ограничена нулём.
* Клавиатура: `ArrowRight`/`ArrowLeft` работают после клика по кнопке; `Space` не срабатывает дважды.
* Мобильные зоны касания в главе 8 и модальных окнах доведены до 44 × 44.
* `SpeechBubble` обновляется по событиям, а не постоянным `requestAnimationFrame`.
* `Ctrl+C` в редакторе сцен копирует объект; отмена — `Ctrl+Z`.
* `check:art` читает WebP без ImageMagick.
* Убран случайный сдвиг трона в кадре 0 `src/scenes/chapter-01.json`; тест трона получил запас 120 с.
* Dev-сервер слушает `127.0.0.1`, POST редактора требует корректный `Origin`; добавлен `dev:lan`.
* Добавлены `engines` и `typecheck`; обновлены `known-issues.md` и `verification.md`.
* Проверки: `typecheck`, 26 unit, `check:art` (77 WebP), `build`, PWA 5/5; E2E пролога и главы 1, `novel` (15/15 плюс новый fallback-тест), редактор сцен (undo/compact/hierarchy).
* Файлы: `src/App.tsx`, `src/chapter-five-game.ts`, `src/SpeechBubble.tsx`, `src/SceneEditor.tsx`, `src/ChapterOne.tsx`, `src/ChapterTwo.tsx`, `src/ChapterThree.tsx`, `src/ChapterFour.tsx`, `src/ChapterFive.tsx`, `src/Prologue.tsx`, `src/styles.css`, `src/scenes/chapter-01.json`, `scripts/check-art.ts`, `vite.config.ts`, `package.json`, `tests/*`.

## 2026-11-20 · Пересозданы зависимости и проверен запуск

* `node_modules` пересоздан через `npm ci` с кэшем в `tmp/npm-cache` из-за read-only `~/.npm`.
* Проверены unit-тесты (25/25), production-сборка и загрузка оглавления, пролога и боя главы 8 в Chromium; ошибок консоли нет.
* В `verification.md` добавлены обход read-only кэша и занятого порта 5173.
* Файлы: `docs/knowledge/verification.md`, `docs/knowledge/changelog.md`, `tmp/npm-cache/`.

## 2026-11-20 · Создана база знаний

* Добавлены точка входа, архитектура, инварианты, рецепты, проверка, решения, реестр инженерных проблем, глоссарий и этот журнал.
* Инженерные находки [аудита](../reviews/project-audit-2026-11-20.md) импортированы как `KI-001`…`KI-015`.
* Зафиксированы первые решения `D-001`…`D-012`.
* База подключена к [карте документации](../README.md) и [AGENTS.md](../../AGENTS.md); добавлена проверка `npm run check:kb`, ссылки в корневом [README](../../README.md).
* `check:kb` сам находит все `docs/knowledge/*.md`, проверяет дату, H1, ссылки, якоря, ID и статусы.
* Файлы: `docs/knowledge/*.md`, `scripts/check-knowledge.mjs`, `package.json`, `docs/README.md`, `README.md`, `AGENTS.md`.
