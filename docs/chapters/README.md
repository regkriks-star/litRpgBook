# Где находятся главы

Номера абзацев в новой документации отсчитываются с нуля. Полный локальный источник — `ленивое мужество.fb2` в корне проекта; он не входит в публичную сборку и в Git (`*.fb2`). Для тестов и извлечения положите файл в корень. Извлечение — `scripts/extract-story.py`. Старые таблицы пролога с нумерацией от единицы явно помечены в исходных документах.

| Часть | Исходный текст в приложении | Реализация и постановка | Документы |
| --- | --- | --- | --- |
| Пролог | `src/prologue.json` | `src/Prologue.tsx` | [Иллюстрации](../prologue-art/README.md), [отложенное](../plans/improvements.md) |
| Глава 1, целиком | `src/chapter-one.json` | `src/ChapterOne.tsx`, `chapter-one-staging.ts`, `ClassCards.tsx`, `HeroCreation.tsx` | [Ресурсы](../chapter-one-art/README.md), [примеры правильной постановки](../guides/gameplay-examples.md) |
| Глава 2, целиком | `src/chapter-two.json` | `src/ChapterTwo.tsx`, `chapter-two-game.ts`, `ChapterTwoMenus.tsx`, `ChapterTwoArt.tsx`, `chapter-two-staging.ts` | [Текущее поведение](chapter-02.md), [будущий план](../plans/chapter-02.md), [ресурсы](../chapter-two-art/README.md) |
| Глава 3, целиком | `src/chapter-three.json` | `src/ChapterThree.tsx`, `chapter-three-game.ts`, `ChapterThreeArt.tsx` | [Текущее поведение](chapter-03.md), [постановка](../plans/chapter-03.md), [ресурсы](../art/sources/chapter-03/README.md), [проверка](../reviews/chapter-03.md) |
| Глава 4, целиком | `src/chapter-four.json` | `src/ChapterFour.tsx`, `chapter-four-game.ts`, `ChapterFourArt.tsx` | [Текущее поведение](chapter-04.md), [постановка](../plans/chapter-04.md), [ресурсы](../art/sources/chapter-04/README.md), [проверка](../reviews/chapter-04.md) |
| Глава 5, целиком | `src/chapter-five.json` | `src/ChapterFive.tsx`, `chapter-five-game.ts`, `ChapterFiveArt.tsx` | [Текущее поведение](chapter-05.md), [постановка](../plans/chapter-05.md), [ресурсы](../art/sources/chapter-05/README.md), [проверка](../reviews/chapter-05.md) |
| Глава 8, начальный фрагмент | `src/book.json`, `docs/chapter8-excerpt.json` | `src/App.tsx`, `src/story.ts`, `src/game.ts`, `src/BattleUI.tsx` | [Прохождение и допущения](chapter-08.md), [боевые изображения](../battle-art/README.md) |

Общие текст, пузыри, подписи и изображения: `BookText.tsx`, `SpeechBubble.tsx`, `CharacterLabel.tsx`, `assets.ts`. Остальные главы пока не представлены отдельными игровыми JSON; для чтения вперёд обращаться к FB2, не принимать планы за извлечённый текст.

Постановка первых пяти глав редактируется через кнопку «Редактор сцен» в оглавлении и хранится в `src/scenes/chapter-01.json` … `chapter-05.json`. [Инструкция](../guides/scene-editor.md) описывает кадры, состояния действий, размещение, комментарии и сохранение.

При добавлении главы обновить эту таблицу. В `chapter-NN.md` описывать только текущее поведение, допущения адаптации, сохранения и проверки. Будущие улучшения остаются в `../plans/`.
