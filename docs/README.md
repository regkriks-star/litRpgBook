# Карта документации

Начинать с [правил проекта](../AGENTS.md), затем читать [порядок работы над главой](guides/chapter-workflow.md). Этот файл — единая точка поиска документов для человека и нейросети.

| Где | Что находится | Когда читать |
| --- | --- | --- |
| [knowledge/](knowledge/README.md) | Операционная база знаний: архитектура, инварианты, рецепты, решения, глоссарий и реестр инженерных проблем | Перед улучшением проекта; после изменений дополнять. |
| [guides/](guides/chapter-workflow.md) | Рабочий процесс, [примеры постановки](guides/gameplay-examples.md), [привязка спрайтов](guides/sprite-registration.md) | Перед созданием или переработкой сцен. |
| [guides/low-screens.md](guides/low-screens.md) | Проверка низких мониторов, областей касания, длинного текста, маршрутов и сохранений | Перед завершением правок глав и публикацией. |
| [guides/scene-editor.md](guides/scene-editor.md) | Редактор сцен глав 1–5, JSON постановки, мобильный предпросмотр и сохранение | При расстановке объектов и переносе изменений между устройствами. [Проверки](reviews/scene-editor.md). |
| [reviews/chapters-01-04.md](reviews/chapters-01-04.md) | Повторная проверка первых четырех глав и реализация отложенного уровня 2 | Сводка ошибок, исправлений и свежих доказательств. |
| [reviews/project-audit-2026-11-20.md](reviews/project-audit-2026-11-20.md) | Полный аудит кода, сборки, тестов, PWA, безопасности и мобильного UX | При планировании инженерных работ и перед публикацией. |
| [chapters/](chapters/README.md) | Карта исходных текстов и компонентов; описания фактически реализованных глав | Чтобы понять текущее поведение. |
| [plans/chapter-02.md](plans/chapter-02.md) | Подробный план второй главы с уровнями 1–3 | При реализации этого плана; это не отчёт о готовых изменениях. |
| [plans/improvements.md](plans/improvements.md) | Общий список отложенных улучшений с важностью | Записывать всё полезное, что не входит в обязательный первый проход. |
| [reviews/chapter-02.md](reviews/chapter-02.md) | Мобильная проверка главы 2: найденные проблемы, снимки и варианты исправления | Замечания M01–M12; [повторная проверка F01–F15 и уровень 2](reviews/chapter-02-followup.md). |
| [chapters/chapter-03.md](chapters/chapter-03.md) | Полная третья глава: ремонт, охота, развитие и торговля | [Постановка](plans/chapter-03.md), [ресурсы](art/sources/chapter-03/README.md), [повторные проверки](reviews/chapter-03-followup.md). |
| [chapters/chapter-04.md](chapters/chapter-04.md) | Полная четвёртая глава: семья Ичиро, мышь-дама, охота и трактир | [Постановка](plans/chapter-04.md), [ресурсы](art/sources/chapter-04/README.md), [повторные проверки](reviews/chapter-04-followup.md). |
| [chapters/chapter-05.md](chapters/chapter-05.md) | Полная пятая глава: дуэль, рынок и побег из храма | [Постановка](plans/chapter-05.md), [ресурсы](art/sources/chapter-05/README.md), [проверка](reviews/chapter-05.md). |
| [art/README.md](art/README.md) | Правила хранения и использования изображений | Перед поиском, генерацией и подключением ресурсов. |
| [art/catalog.md](art/catalog.md) | Содержание всех зарегистрированных изображений, кадры, места использования и источники | Чтобы найти готовую позу или фон и не генерировать дубликат. |
| [archive/](archive/README.md) | Исторические замечания и старые технические решения | Только для контекста; не как действующие инструкции или список невыполненных задач. |

## Соглашения об именах

Для новых документов использовать `chapter-NN.md` с двузначным номером, для пролога — `prologue.md`. В `chapters/` описывать реализованное, в `plans/` — будущее. Не смешивать оба статуса в одном списке. Создавать документ для новой главы, когда появляется содержательная работа, а не пустые файлы для всей книги.

Игровые изображения остаются в `public/art/` по персонажам, местам и назначению; код и стабильные идентификаторы — в `src/assets.ts`. Общие персонажи не копируются в папки каждой главы. Документация и исходные PNG не помещаются в `public/`.

Исторические пакеты генераций сохранены по прежним адресам: `prologue-art/`, `chapter-one-art/`, `chapter-two-art/`, `battle-art/`, `art-source/`. Это исходники и промпты, а не альтернативные игровые библиотеки; переходы к ним есть в каталоге. Для новых пакетов использовать `docs/art/sources/chapter-NN/` или `shared-<тема>/` с `README.md`, промптами и исходниками. При переименовании обновлять ссылки; не переписывать архивные промпты так, будто генерация изначально выполнялась с новыми путями.

## Основные перемещения

| Старый путь | Новый путь |
| --- | --- |
| `docs/chapter-two-rework-plan.md` | [plans/chapter-02.md](plans/chapter-02.md) |
| `docs/chapter-two.md` | [chapters/chapter-02.md](chapters/chapter-02.md) |
| `docs/book-walkthrough.md` | [chapters/chapter-08.md](chapters/chapter-08.md) |
| `docs/prologue-additional-images.md` | [plans/improvements.md](plans/improvements.md) |
| `docs/gameplay-examples.md` | [guides/gameplay-examples.md](guides/gameplay-examples.md) |
| `docs/sprite-registration.md` | [guides/sprite-registration.md](guides/sprite-registration.md) |
| `docs/asset-library.md` | [art/README.md](art/README.md) |
| `docs/art-direction.md` | [art/initial-prompts.md](art/initial-prompts.md) |
| `docs/implementation-notes.md`, прежний `TODO.md` | [archive/](archive/README.md) |

`docs/chapter8-excerpt.json` оставлен на месте: это данные, используемые извлечением текста и тестами, а не документ постановки.
