# Каталог игровых изображений

Перечень соответствует [реестру assets.ts](../../src/assets.ts). Все игровые файлы — WebP; каждый путь ниже открывает сам рисунок. Содержание описано по постановке, метаданным кадров и документации генераций. При новой нарезке обязательно просмотреть изображение: промпт не доказывает фактическую сетку или направление.

У персонажей и листов поз используется прозрачность; фоны и иллюстрации — цельные сцены. Размеры и сетки берутся из реестра; у пролога 1536 × 1024 по документации исходников. Номера кадров с нуля, порядок по строкам, если не оговорено иначе.

| ID / изображение | Размер или сетка | Содержание | Использование / ограничения | Источник и промпты |
| --- | --- | --- | --- | --- |
| [fiol](../../public/art/locations/fiol.webp) | 1536 × 1024 | Звёздная пустота и планета Фиол, без персонажей | Глава 1, аудиенция | [Пакет](../chapter-one-art/README.md) |
| [wasteland](../../public/art/locations/wasteland.webp) | 1536 × 1024 | Каменистая пустошь, поле охоты | Глава 8, бой | [Пакет](initial-prompts.md) |
| [guild](../../public/art/locations/guild.webp) | 1536 × 1024 | Сцена у регистраторши Гильдии | Глава 8, финал фрагмента | [Пакет](../battle-art/README.md) |
| [tantrum](../../public/art/locations/tantrum.webp) | 1536 × 1024 | Зелёные холмы, рощи, река и дальний город | Глава 2, луг | [Пакет](../chapter-two-art/README.md) |
| [tantrumRoad](../../public/art/locations/tantrum-road.webp) | 1536 × 1024 | Дорога к Тантруму | Глава 2, встреча и поездка | [Пакет](../chapter-two-art/README.md) |
| [tantrumGates](../../public/art/locations/tantrum-gates.webp) | 1536 × 1024 | Каменные ворота и площадь снаружи | Глава 2, стражники | [Пакет](../chapter-two-art/README.md) |
| [tantrumRiver](../../public/art/locations/tantrum-river.webp) | 1536 × 1024 | Холм и берег реки | Глава 2, финальный бег | [Пакет](../chapter-two-art/README.md) |
| [tantrumHill](../../public/art/locations/tantrum-hill.webp) | 1536 × 1024 | Сухой подъём к гребню холма, город сзади слева | Глава 2, 89–91; воды на пути ещё нет | [Паспорт и промпты](sources/chapter-02-mobile/README.md) |
| [machResting](../../public/art/characters/mach/resting.webp) | 1536 × 1024, прозрачность | Лежащий герой после мягкого приземления | Глава 2, 0; непрозрачная мозаика поверх закрытых шорт | [Паспорт](sources/chapter-02-mobile/README.md) |
| [tantrumCartJourney](../../public/art/characters/tantrum/cart-journey.webp) | 2172 × 724; 2 × 2, ячейка 1086 × 362 | Семья без Мача; поездка с Мачем; зуд; жест Ичиро. Два мула направлены вправо | Глава 2, 12–38; опоры колёс в `cartWheelAnchors`, без зеркалирования персонажей | [Паспорт](sources/chapter-02-mobile/README.md) |
| [priestessPoses](../../public/art/characters/tantrum/priestess-poses.webp) | 1536 × 1024; 3 × 2, ячейка 512 × 512 | Три отдельные фигуры: стоят / разворачиваются и разбегаются | Глава 2, 93–97; `RiverCrowd` открывает проход, включая reduced motion | [Паспорт](sources/chapter-02-mobile/README.md) |
| [meadowItems](../../public/art/items/meadow.webp) | 1536 × 1024; 4 × 2, ячейка 384 × 512 | Листья, круглое ядро, трава, морковь / яблоко, апельсин, бумажный пакет, пусто | Общие рисунки инвентаря, добычи и счётчика; ID / порядок в `itemFrames` | [Паспорт и промпт](sources/shared-items/README.md) |
| [townItems](../../public/art/items/town.webp) | 1776 × 888; 4 × 2 по 444 | Дубинка, самодельный нож, одежда, паёк / суп, штаны, куртка, шапочка | Глава 3, инвентарь/торговля/осмотр; ID в `townItemFrames`, предлагаемые товары не добавляются в сумку | [Паспорт и промпты](sources/chapter-03/README.md) |
| [machTown](../../public/art/characters/mach/town.webp) | 1776 × 888; 4 × 2 по 444 | Одетый Мач: понурился, дубинка, замах, удар / ответ, яблоко, черепица, нож | Глава 3, 15–96; удар вправо, фиксированные опоры стоп, без зеркалирования оружия | [Паспорт](sources/chapter-03/README.md) |
| [machTownActions](../../public/art/characters/mach/town-actions.webp) | 1254 × 1254; неравные кадры | Похлёбка, сон на боку, покраска, умывание | Глава 3; `townActionFrames`, не делить поровну: иначе обрезаются голова и кисть | [Паспорт](sources/chapter-03/README.md) |
| [tantrumAuthorities](../../public/art/characters/tantrum/authorities.webp) | 1536 × 1024; неравные кадры | Капитан: гнев, цедулис, смягчение; реакция двух стражников; Куджа с кистью и с дубинкой | Глава 3, 0–14, 25–33; смотрят к герою слева. `authorityFrames` исключает соседей | [Паспорт и итоговый промпт](sources/chapter-03/README.md) |
| [tantrumMerchants](../../public/art/characters/tantrum/merchants.webp) | 1294 × 1216; 2 × 2 по 647 × 608 | Аптекарша, Сатсубаки, рыжий купец, его сын с ножом | Глава 3, 79–96; сын подходит сзади справа, сохраняет меньший рост | [Паспорт](sources/chapter-03/README.md) |
| [tantrumCell](../../public/art/locations/tantrum-cell.webp) | 508 × 506 | Камера при казарме: нары слева, дверь справа | Глава 3, 15–24; фон заполняет сцену за окном текста | [Паспорт](sources/chapter-03/README.md) |
| [tantrumRoofs](../../public/art/locations/tantrum-roofs.webp) | 508 × 490 | Крыши, черепица, труба и город | Глава 3, 25, 32–33; отдельные объекты ремонта поверх фона | [Паспорт](sources/chapter-03/README.md) |
| [tantrumPharmacy](../../public/art/locations/tantrum-pharmacy.webp) | 508 × 490 | Полки с травами и прилавок | Глава 3, 79 | [Паспорт](sources/chapter-03/README.md) |
| [tantrumHunter](../../public/art/locations/tantrum-hunter.webp) | 508 × 490 | Дом охотника, шкуры, западные ворота в глубине | Глава 3, 80–81; место соответствует совету Куджи | [Паспорт](sources/chapter-03/README.md) |
| [tantrumMarket](../../public/art/locations/tantrum-market.webp) | 508 × 526 | Рынок: одежда и простое оружие | Глава 3, 82–96; герои отдельными слоями | [Паспорт](sources/chapter-03/README.md) |
| [tantrumStreet](../../public/art/locations/tantrum-street.webp) | 508 × 526 | Чистая улица Тантрума и западные ворота | Глава 3, 26–31; фоновые жители внутри рисунка | [Паспорт](sources/chapter-03/README.md) |
| [tantrumRoofRepairs](../../public/art/objects/tantrum-roof-repairs.webp) | 1254 × 1254; неравные кадры | Черепица до/после замены, труба до/после покраски | Глава 3, 25, 32–33; реальные нажимаемые объекты, без добавления в инвентарь, `roofPropFrames` | [Паспорт и промпт](sources/chapter-03/README.md) |
| [ichiroFarm](../../public/art/locations/ichiro-farm.webp) | 1536 × 1024 | Двор Ичиро: дорога и ворота слева, дом и сеновал справа | Глава 4, 23–25; приезд, ужин и утро | [Паспорт и промпт](sources/chapter-04/README.md) |
| [ichiroHayloft](../../public/art/locations/ichiro-hayloft.webp) | 1536 × 1024 | Ночной сеновал: солома, балки, окно слева и лампа справа | Глава 4, 24 после обучения Кулинарии; отдельная спящая поза, без Оомы во дворе | [Исходник и промпт](sources/chapter-04/README.md) |
| [tantrumTavern](../../public/art/locations/tantrum-tavern.webp) | 1536 × 1024 | Трактир, стойка слева в глубине, выход справа | Глава 4, 48–107 кроме воспоминания 72; волшебница у выхода | [Паспорт](sources/chapter-04/README.md) |
| [ichiroFamily](../../public/art/characters/tantrum/ichiro-family-v2.webp) | 1448 × 1086; неравные кадры | Оома, Ичиро у столба, переноска, повозка с семьёй | Глава 4, 13–24; повозка движется влево из города; `familyFrames`, не зеркалировать | [Итоговый исходник и промпт](sources/chapter-04/README.md) |
| [machLadyMouse](../../public/art/characters/mach/lady-mouse.webp) | 1776 × 888; строки 545 / 343 px | Мач с мышью, усиленный, замах, удар / кот с мышью, кот без мыши, малая и выросшая мышь | Глава 4, 23–38 и 72; `mouseHeroFrames`, удар вправо, устойчивые опоры | [Паспорт](sources/chapter-04/README.md) |
| [machBlessing](../../public/art/characters/mach/blessing.webp) | 1024 × 1536; одна прозрачная поза | Обычный Мач с поднятым указательным пальцем | Глава 4, 102, слова о благословении Датарис; смотрит вправо, опора и масштаб в `blessingFrames`, без зеркалирования | [Паспорт и промпт](sources/chapter-04/README.md) |
| [gateReactions](../../public/art/characters/tantrum/gate-reactions.webp) | 1776 × 888; четыре неравные колонки | Осама смеётся с копьём, прыжок и поклон девушки, жест Мача | Глава 4, 5–10; `gateFrames`, проверенное отражение только безоружного героя и девушки для диалога | [Паспорт и ограничения](sources/chapter-04/README.md) |
| [tavernCast](../../public/art/characters/tantrum/tavern-cast.webp) | 1776 × 888; 4 × 2 по 444 | Волшебница, трактирщик, Мими до/после падения / баронет, захват плеча, две группы посетителей | Глава 4, 48–107; `tavernAnchors`, парный захват вместо отдельного героя | [Паспорт](sources/chapter-04/README.md) |
| [tavernDrinking](../../public/art/characters/tantrum/drinking.webp) | 1536 × 1024; две неравные колонки | Мач и волшебница пьют за столами | Глава 4, 48–74, 94; `drinkingFrames`, кружка в позе, мягкая тень на прозрачном фоне | [Паспорт и промпт](sources/chapter-04/README.md) |
| [huntItems](../../public/art/items/hunt-and-tavern.webp) | 1776 × 888; 4 × 2 по 444 | Мясо, шкура, фляга, пиво / похлёбка, жареная нога, очищенное яблоко, нарезанная морковь | Глава 4, инвентарь/добыча/торговля; `huntItemFrames`, без рамок и надписей | [Предметы и стабильные ID](sources/chapter-04/README.md) |
| [machLeaves](../../public/art/characters/mach/leaves.webp) | 1536 × 1024 | 6 поз Мача в повязке: стойка, пинок, удар рукой, уклонение, получение урона, еда с морковью | Глава 2, бой и отдых | [Пакет](../chapter-two-art/README.md) |
| [machTravel](../../public/art/characters/mach/travel.webp) | 1254 × 1254 | 4 кадра: две фазы бега, еда с яблоком, еда с апельсином | Глава 2, отдых и бег | [Пакет](../chapter-two-art/README.md) |
| [machMeadowGestures](../../public/art/characters/mach/meadow-gestures.webp) | 1536 × 1024 | 4 позы: почёсывание через листья, переминание, передача кристаллов, наклон за листьями | Глава 2; наличие кадра не означает, что он уже используется во всех подходящих сценах | [Пакет](../chapter-two-art/README.md) |
| [tantrumGuards](../../public/art/characters/tantrum/guards-actions.webp) | 1536 × 1024 | Группа стражников: поднятые копья, скрещённые копья, дополнительный кадр, передача пакета | Глава 2, ворота и обмен | [Пакет](../chapter-two-art/README.md) |
| [tantrumRide](../../public/art/characters/tantrum/cart-ride.webp) | Сетка 1 × 2; кадр 1536 × 512 | 2 кадра общей повозки: Мач рядом с Ичиро, семья и мулы | Исторический исходник; в текущей поездке заменён `tantrumCartJourney` | [Пакет](../chapter-two-art/README.md) |
| [rabbit](../../public/art/characters/rabbit/meadow.webp) | 1254 × 1254 | 3 позы рогатого кролика и куст цедулиса | Глава 2, луг и бои | [Пакет](../chapter-two-art/README.md) |
| [tantrumCast](../../public/art/characters/tantrum/cast.webp) | 1536 × 1024 | Повозка с семьёй, два стражника, две позы учеников, группа людей в белом | Глава 2, NPC и наблюдаемые бои | [Пакет](../chapter-two-art/README.md) |
| [priestesses](../../public/art/characters/tantrum/priestesses.webp) | 1536 × 1024 | Отдельная группа трёх людей в белых одеждах, испуг | Исторический референс реки; текущая постановка использует `priestessPoses` | [Пакет](../chapter-two-art/README.md) |
| [companions](../../public/art/characters/companions.webp) | Сетка 2 × 1; кадр 768 × 1024 | Мач слева, Саяка справа, в полный рост | Общие образы героев главы 8 | [Пакет](initial-prompts.md) |
| [dataris](../../public/art/characters/dataris/audience.webp) | Сетка 3 × 2; кадр 512 × 512 | 6 поз на троне: речь, дар речи, недоумение, испуг, решимость, призыв карт | Глава 1 | [Пакет](../chapter-one-art/README.md) |
| [datarisGestures](../../public/art/characters/dataris/gestures.webp) | 1254 × 1254 | 6 поз: чтение, смущение, хлопок, колдовство стоя, прикрытое лицо, прощальный жест | Глава 1 | [Пакет](../chapter-one-art/README.md) |
| [machAppearance](../../public/art/characters/mach/appearance.webp) | Сетка 3 × 1; кадр 512 × 1024 | 3 варианта внешности: голубые волосы, зелёные волосы, итоговые чёрно-белые | Глава 1, создание тела | [Пакет](../chapter-one-art/README.md) |
| [machRebirth](../../public/art/characters/mach/rebirth.webp) | 1774 × 887 | 4 позы нового тела; исходник с закрытыми шортами, сценическая мозаика отдельная | Глава 1, возрождение; глава 2 до повязки | [Пакет](../chapter-one-art/README.md) |
| [machBattle](../../public/art/characters/mach/battle.webp) | Сетка 4 × 1; кадр 543 × 724 | 4 кадра: стойка, замах, удар топором, завершение | Глава 8, герой направлен вправо | [Пакет](../battle-art/README.md) |
| [sayakaBattle](../../public/art/characters/sayaka/battle.webp) | Сетка 4 × 1; кадр 543 × 724 | 4 кадра: стойка, заряд посоха, болт, отдача | Глава 8, героиня направлена вправо | [Пакет](../battle-art/README.md) |
| [scorpionBattle](../../public/art/characters/scorpion/battle.webp) | Сетка 4 × 1; кадр 543 × 724 | 4 кадра: готовность, подготовка жала, выпад, возврат | Глава 8, противник направлен влево | [Пакет](../battle-art/README.md) |
| [scorpion](../../public/art/characters/scorpion/idle.webp) | 1536 × 1024 | Один чёрный скорпион, направлен влево | Общий исходный образ противника | [Пакет](initial-prompts.md) |
| [classCards](../../public/art/cards/classes-and-gifts.webp) | Сетка 3 × 2; кадр 418 × 627 | 6 рисунков: алхимик, рыцарь крови, рыцарь дамы, океан опыта, гений, череда побед | Глава 1; текст и рамки интерфейса отдельно | [Пакет](../chapter-one-art/README.md) |
| [kyoto](../../public/art/illustrations/prologue/kyoto.webp) | 1536 × 1024 | Кэтсуо и обычная жизнь в Киото | Пролог, абзацы 0–3 | [Пакет](../prologue-art/README.md) |
| [platform](../../public/art/illustrations/prologue/platform.webp) | 1536 × 1024 | Событие на перроне | Пролог, абзац 4 | [Пакет](../prologue-art/README.md) |
| [ascent](../../public/art/illustrations/prologue/ascent.webp) | 1536 × 1024 | Душа над городом и восход | Пролог, абзацы 5–8 | [Пакет](../prologue-art/README.md) |
| [summoning](../../public/art/illustrations/prologue/summoning.webp) | 1536 × 1024 | Приближение магической печати | Пролог, абзац 9 | [Пакет](../prologue-art/README.md) |
| [satellite](../../public/art/illustrations/prologue/satellite.webp) | 1536 × 1024 | Спутник на пути магии | Пролог, абзац 10 | [Пакет](../prologue-art/README.md) |
| [electrician](../../public/art/illustrations/prologue/electrician.webp) | 1536 × 1024 | Квартира электрика и призыв | Пролог, абзацы 11–12; повтор в 14 | [Пакет](../prologue-art/README.md) |
| [cat](../../public/art/illustrations/prologue/cat.webp) | 1536 × 1024 | Новая жизнь Кэтсуо в образе кота | Пролог, абзац 13 | [Пакет](../prologue-art/README.md) |

## Нарезка и повторное использование

| Лист | Где фактические кадры и опоры | Важное ограничение |
| --- | --- | --- |
| `dataris`, `datarisGestures` | [dataris-poses.ts](../../src/dataris-poses.ts) | Опоры трона; у жестов вторая строка начинается на y=575. Не делить лист поровну и не масштабировать по рукам. |
| `machRebirth`, `machAppearance` | [HeroCreation.tsx](../../src/HeroCreation.tsx) | Возрождение: стоя, первый вдох/восстановление, колени, падение. Координаты мозаики индивидуальны для поз. Имя и выбор внешности управляются сценой. |
| `machLeaves`, `machTravel`, `machMeadowGestures` | [ChapterTwoArt.tsx](../../src/ChapterTwoArt.tsx) | Общий сценический холст и опора стоп; разные размеры исходников не означают разный рост героя. |
| `rabbit` | `MeadowSprite` в [ChapterTwoArt.tsx](../../src/ChapterTwoArt.tsx) | Кадры 0–2 — кролик, 3 — куст. Кадра мёртвого кролика в текущей нарезке нет. |
| `tantrumCast` | `TantrumPerson` в [ChapterTwoArt.tsx](../../src/ChapterTwoArt.tsx) | Неравные прямоугольники; кадр охотника выделен из общего листа. Для людей у реки используется отдельный `priestesses`. |
| `tantrumGuards` | `GateGuards` в [ChapterTwoArt.tsx](../../src/ChapterTwoArt.tsx) | Код выбирает кадры 0, 1, 3. Содержание неиспользуемого кадра 2 нужно проверить визуально перед применением. |
| `tantrumRide` | `CartRide` в [ChapterTwoArt.tsx](../../src/ChapterTwoArt.tsx) | Две строки, персонажи и повозка нарисованы вместе. Исторический ракурс влево; заменён новым зарегистрированным листом, не используется в поездке. |
| `classCards` | [ClassCards.tsx](../../src/ClassCards.tsx), [chapter-one-staging.ts](../../src/chapter-one-staging.ts) | Названия, описания и изменение условия — живой текст поверх рисунков. |
| `machTown`, `machTownActions`, `tantrumAuthorities`, `tantrumMerchants`, `tantrumRoofRepairs` | [ChapterThreeArt.tsx](../../src/ChapterThreeArt.tsx) | Общие опоры; дополнительные действия и власти/ремонт имеют неравные прямоугольники. Для двух стражников сохранена полная ширина. |
| Боевые листы | [assets.ts](../../src/assets.ts), [styles.css](../../src/styles.css) | Четыре равных кадра; герои смотрят вправо, скорпион влево. |

## Предметы инвентаря

`meadowItems` — общий растровый набор. `ItemIcon` использует кадры этого атласа с исходными пропорциями, а названия и количество рисует интерфейс. Отдельные изображения предметов в руках героев не заменяют его. Паспорт — [shared-items](sources/shared-items/README.md).

`townItems` дополняет общую библиотеку предметами главы 3. Тот же `ItemIcon` выбирает нужный лист по стабильному ID; библиотека второй главы и её порядок кадров сохранены. Паспорт — [chapter-03](sources/chapter-03/README.md).

`huntItems` добавляет восемь предметов и результатов действий главы 4. Порядок — `huntItemFrames`; один рисунок используется в сумке, добыче и обмене. Паспорт — [chapter-04](sources/chapter-04/README.md).

## Поддержка каталога

При добавлении или замене изображения обновить строку с ID, содержимым и источником. Для сложного нового атласа создать паспорт рядом с его исходниками и дать ссылку из этой таблицы: порядок кадров, точные координаты или ссылка на метаданные, направления, места использования, ограничения. Не дублировать числовую нарезку вручную, если её источник уже есть в коде. Неизвестный исходник отмечать явно.

## Дополнения уровня 2: 05.10.2026

| ID / изображение | Фактический размер / кадры | Содержание, направления и использование | Источник / ограничения |
| --- | --- | --- | --- |
| [prologueFriend](../../public/art/illustrations/prologue/friend.webp) |1536 ×1024, непрозрачный фон | Кэтсуо слева, Игараси справа поддерживает его у двери; пролог, абзац2 / страница2 | [Паспорт и промпт](sources/prologue-followup/README.md); лица в верхней трети, низ покрывает окно текста |
| [prologueApartment](../../public/art/illustrations/prologue/apartment.webp) |1536 ×1024, непрозрачный фон | Тело слева на диване, свободный ламинат справа; пролог11–12/14, страницы8–9/11 | [Паспорт](sources/prologue-followup/README.md); чистая квартира без души/печати, эффекты отдельными слоями; object-position82% |
| [cityLife](../../public/art/characters/tantrum/city-life.webp) |1536 ×1024, прозрачный; неравные кадры | Дети-посыльные вправо, подросток с метлой, лекарка влево, взрослые с корзиной вправо; глава3,26–31 | [Паспорт](sources/chapter-03-followup/README.md); кадры/опоры в ChapterThreeArt; раздел строк y480, равная нарезка обрезает голову |
| [ichiroVillageRoad](../../public/art/locations/ichiro-village-road.webp) |1536 ×1024, непрозрачный | Деревня впереди слева, город позади справа; глава4,20–22; повозка движется влево | [Паспорт](sources/chapter-04-followup/README.md); фон без персонажей, не зеркалить маршрут |
| [tantrumDayMeadow](../../public/art/locations/tantrum-day-meadow.webp) |1536 ×1024, непрозрачный | Дневной луг между деревней слева и Тантрумом справа; глава4,33–38 | [Паспорт](sources/chapter-04-followup/README.md); герой слева, кролик справа; книжный итог охоты сохраняется |
| [tavernService](../../public/art/characters/tantrum/tavern-service.webp) |1254 ×1254;2 ×2 по627, прозрачный |0 налив,1 подача кружки,2 взрослая пара,3 новая пара у стойки; глава4,48–50/75–84 | [Паспорт](sources/chapter-04-followup/README.md); опоры tavernServiceFrames, персонажи не перекрывают выход и волшебницу |
| [rabbitFallen](../../public/art/characters/rabbit/fallen.webp) |1254 ×1254, прозрачный | Поверженный рогатый кролик; глава2, победы70–83 | [Паспорт](sources/chapter-02-followup/README.md); результат смерти, затем растворение, reducedmotion сразу показывает добычу |
| [hunterStrike](../../public/art/characters/tantrum/hunter-strike.webp) |1536 ×1024, прозрачный;2 неравных прямоугольника | Молодой охотник, замах/удар ножом вправо; глава2,80 | [Паспорт](sources/chapter-02-followup/README.md); кадры/опоры в ChapterTwoArt, не делить лист поровну |
| [machHillRun](../../public/art/characters/mach/hill-run.webp) |1536 ×1024;2 ×1 по768 ×1024, прозрачный | Мач бежит вправо: наклон вперед в гору / назад на спуске; глава2,89–92 | [Паспорт](sources/chapter-02-followup/README.md); стопы определяют масштаб, холм→река сохраняет маршрут |
| [ichiroOffended](../../public/art/characters/tantrum/ichiro-offended.webp) |2172 ×724, прозрачный; одна повозка | Обиженный Ичиро, семья и Мач в той же повозке вправо; глава2,27 | [Паспорт](sources/chapter-02-followup/README.md); отдельная постановка по опорам колес, не считать равной сеткой2 ×2 |

Старый `electrician` остается историческим общим рисунком, в текущем прологе заменен чистой квартирой и отдельными эффектами. `kyoto` используется в0–1/3, абзац2 показывает Игараси. Рисунок поверженного кролика не входит в старый четырехкадровый `rabbit`, это самостоятельный зарегистрированный ресурс.

## Глава 5: 06.10.2026

| ID / игровой путь | Фактический размер / кадры | Содержание, направление и использование | Источник / ограничения |
| --- | --- | --- | --- |
| chapterFiveDuel · characters/tantrum/duel-v2.webp | 1881×836, прозрачный, 8 неравных кадров | Уогунн: указание влево, замах, поражение, падение; Мач: уклонение влево, кулак вправо; удар магички локтем и превращение. Глава 5, 0–38 | [Паспорт и промпты](sources/chapter-05/README.md), `duelFrames` в ChapterFiveArt; исходный меч, заходивший в соседнюю колонку, исправлен |
| chapterFiveCast · characters/tantrum/temple-cast-clean.webp | 1024×1536, прозрачный, 6 кадров | Хао, проводница, послушница до/после назначения, бабушка до/после; бабушка вправо. Глава 5, 61–91 | [Паспорт](sources/chapter-05/README.md), `templeCastFrames`/`templeCastClips`; плащи и руки требуют неравных границ |
| machTemple · characters/mach/temple-actions-clean.webp | 1536×1024, прозрачный, 6 кадров | Стойка к алтарю справа, удержание двери слева, поднят за ноги, ползёт влево, раненый лежит, прозрачные руки. Глава 5, 67–93 | [Паспорт](sources/chapter-05/README.md), `templeHeroFrames`, строки 575/449; руки отдельным слоем, верёвка черновика удалена |
| chapterFiveClose · characters/mach/duel-close-clean.webp | 1536×1024, прозрачный, 4 кадра | Выбивание меча, удар лбом, колено; подъём лесов. Глава 5, 34/61 | [Паспорт](sources/chapter-05/README.md), `closeFrames`; парные действия заменяют отдельные фигуры, четвёртый кадр с маской соседних деталей |
| tantrumTempleInside · locations/tantrum-temple-inside-v2.webp | 1672×941, непрозрачный | Двери слева, большой зал, белый прямоугольный алтарь справа. Глава 5, 67–91 | [Паспорт](sources/chapter-05/README.md); без портала/людей, версия 2 убирает резной декор алтаря |
| tantrumTempleOutside · locations/tantrum-temple-outside.webp | 1536×1024, непрозрачный | Малый храм с округлой крышей и входом справа, площадь слева. Глава 5, 63–66/91–93 | [Паспорт](sources/chapter-05/README.md); герой после побега слева от того же порога |
| travelItems · items/duel-and-travel.webp | 1774×887, прозрачный, 2 неравных кадра | axe: простой железно-деревянный топор; lighter: магическая зажигалка. Глава 5, 47–59, сумка | [Паспорт](sources/chapter-05/README.md), `travelItemFrames` в ChapterTwoMenus; не делить лист пополам, лезвие выходит за середину |
| machMageContact · characters/mach/mage-contact.webp | 1536×1024, прозрачный, одна парная поза | Мач слева касается пальцем бедра стоящей магички справа через одежду. Глава 5, 28–29 | [Паспорт](sources/chapter-05/README.md), `contactFrames`; заменяет обоих участников, общий масштаб и опора стоп |
