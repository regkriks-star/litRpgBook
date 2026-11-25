# Журнал базы знаний

Обновлено: 2026-11-25. Статус: активно.

Хронология изменений базы. Одна запись на задачу; не удалять старые записи. Формат:

```md
## YYYY-MM-DD · Краткое название

* Что добавлено/изменено.
* Какие файлы затронуты.
* Ссылка на проверку/отчёт/коммит.
```

## 2026-11-25 · Переезд на regkriks-star и деплой через Actions

* Исходники инициализированы в Git (`main`), remote — `regkriks-star/litRpgBook`.
* Публикация переведена с force-push в `gh-pages` (`psyselfhelp/LitRPG`) на `.github/workflows/deploy.yml`: push в `main` собирает `dist` и публикует GitHub Pages.
* Удалены `scripts/publish.sh`, `scripts/test-publish.sh` и команда `deploy:psyselfhelp`; `docs/reviews/` исключены из Git (813 МБ QA-снимков).
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
