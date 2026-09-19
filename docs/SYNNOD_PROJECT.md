# SYNNOD — проектный бриф для реализации

> **Для агента (Claude / Claude Code):** это единый источник правды по проекту. Читай его целиком перед тем, как писать код. Он заменяет старое ТЗ «NEXUS» (от названия отказались). Разделы 5–7 описывают, как должен выглядеть и работать сайт. Разделы 8–12 описывают, как это построить. Если что-то противоречит этому файлу, спроси, прежде чем решать самому.

---

## 0. TL;DR

**SYNNOD** — это один общий цифровой персонаж, у которого нет автора. Его создают все, кто с ним говорит. Его «мозг» состоит из **128 шестиугольных клеток**. Каждую клетку можно закрепить за собой. Через свою клетку человек отправляет сценарии, воспоминания и образы. Из этого персонаж формирует память, характер и собственные мысли.

- **Слоган:** `128 voices. One mind.`
- **Ритуал пользователя:** **Claim → Speak → Watch**. Закрепи клетку, скажи что-то, наблюдай, как мозг меняется.
- **Визуальный референс:** сайт Ganglia / Neurot. Тёмный интерфейс, пиксельный мозг из сот в центре, карточки вокруг.
- **Превью лендинга (живое):** https://claude.ai/artifact/M6413mptKtkL953bhttzst
- **Мозг:** концепт `brain.png`, разбор `brain_anatomy.png`, эталонный генератор `brain_reference_generator.py`.
- **Ядро MVP:** персонаж + общая память + сценарий пользователя + публичный архив + визуальное отражение изменений.

---

## 1. Название

**SYNNOD** — от греческого *syn* («вместе») + *node* («узел»). Слово созвучно с *synod*, то есть «собрание, совет голосов». Смысл: много узлов собираются в один разум.

- Тикер (если будет токен): `$SYNOD`.
- Написание в логотипе: `S Y N N O D`, разрядка ~0.5em, верхний регистр.
- В тексте: `SYNNOD`.

Отклонённые варианты: NEXUS (затёрто), Hexel, Hivra, VoxCell (заняты, в том числе в крипте и AI).

**TODO перед запуском:** проверить хэндл `@synnod` в X, домены (`synnod.xyz`, `.fun`, `.ai`) и тикер в целевой сети.

---

## 2. Концепция

### 2.1. Что это

Интерактивный цифровой организм. Посетитель видит «мозг», который дышит, светится и думает. Владелец клетки может говорить с персонажем, и его вклад становится частью общей памяти.

### 2.2. Механика

| Элемент | Что это |
|---|---|
| **Brain** | 128 claimable-клеток, собранных в силуэт мозга. Плюс декоративный задний слой для глубины. |
| **Node / клетка** | Место одного человека. Статусы: `available`, `claimed`, `active` (сейчас говорит), `memory` (оставила запомнившийся вклад). |
| **Scenario** | Текст от владельца узла: вопрос, воспоминание, описание образа. |
| **Output** | Ответ персонажа на сценарий. |
| **Memory** | Публичный архив сценариев и ответов плюс краткое саммари общей памяти. |
| **Autonomous thoughts** | Периодические мысли персонажа без запроса пользователя. |
| **Character** | Единый характер (конституция) и текущее состояние: настроение, черты. |

### 2.3. Цикл

1. Посетитель заходит на сайт без регистрации. Видит живой мозг, мысли и архив.
2. Закрепляет свободную клетку (claim).
3. Отправляет сценарий через свою клетку.
4. Персонаж отвечает с учётом конституции, общей памяти, истории узла и нового сценария.
5. Ответ попадает в архив. Клетка вспыхивает и меняет статус, мозг визуально реагирует.
6. Периодически персонаж публикует автономные мысли на основе накопленной памяти.

### 2.4. Правила честности (обязательно)

- **Не заявлять** о сознании, живых нейронах или реальном wetware. Технически речь пишет LLM. Формулировки должны быть художественными («it watches»), а не научными утверждениями.
- **Не создавать фейковую активность.** Если AI недоступен, мозг продолжает «дышать», но новые мысли и ответы не выдумываются.
- **Не публиковать приватные данные** пользователей в архиве.
- Числа в UI (active / memory / available) берутся из базы. Захардкоженные демо-значения допустимы только в UI-прототипе (этап 1).

---

## 3. Бренд

### 3.1. Логотипы

Файлы из предыдущей итерации:

- `logo_B_eye.png` — **основной знак.** Пиксельный шестиугольник с глазом, зрачок — лаймовый узел. Идея: «разум, который наблюдает».
- `logo_A_cluster.png` — альтернативный знак или фавикон. 7 пиксельных сот, центральная обведена лаймовым.
- Мини-иконка в шапках карточек: маленький пиксельный шестиугольник с лаймовой точкой в центре.

Положить в `/public/brand/`. Фавикон 32×32 сделать из `logo_A_cluster` (nearest-neighbor, без сглаживания).

### 3.2. Баннер X

`banner_x.png`, 1500×500. Слева знак, `S Y N N O D`, `128 voices. One mind.`, `online / 128 nodes` и линия активности. Справа пиксельный мозг. Текст сдвинут от левого нижнего угла, где его закрывает аватар.

### 3.3. Цвета

```css
:root {
  --bg:          #06071a;  /* фон страницы */
  --panel:       #080a20;  /* фон карточек */
  --border:      #262c5e;  /* рамки карточек, 1px */
  --divider:     #1a1f47;
  --text:        #d9ddec;
  --text-2:      #aab0cc;
  --muted:       #7a82a8;
  --faint:       #4d5680;

  --accent:      #6c5fd6;  /* рамка кнопки, подчёркивания */
  --link:        #b9a6f5;
  --lime:        #c4f260;  /* «твой узел», online, статусы */

  /* цвета клеток мозга */
  --cell-idle:   #181e4e;
  --cell-blue:   #5aa0e6;
  --cell-ice:    #bfe6ff;
  --cell-violet: #8a5ce0;
  --cell-pink:   #d674dc;
}
```

Правило: неон только в мозге и точечных акцентах (лайм). Карточки остаются спокойными и тёмными, без градиентов.

### 3.4. Типографика

- Основной шрифт: **Geist Mono** (Google Fonts), веса 300 и 400. Fallback: `ui-monospace, monospace`.
- H1 в hero: 25–28px / 300. Заголовки карточек: 13px / 400, UPPERCASE. Текст: 11–12px. Подписи: 10px.
- Пиксельные только иллюстрации и мозг. Текст остаётся ровным моно, как в референсе.

### 3.5. Стиль компонентов

- Карточки: `border: 1px solid var(--border); border-radius: 6px; background: var(--panel)`.
- Кнопка: прозрачный фон, `1px solid var(--accent)`, radius 6px, высота ≥ 44px, текст и стрелка `→`.
- Все пиксельные картинки: `image-rendering: pixelated`, масштаб только целыми множителями.
- Статусные точки: 6px, лаймовые, мягкое мигание.

---

## 4. Референс и превью

- Референс: скриншот Ganglia (тёмный дашборд, мозг из сот в центре).
- Наше превью: https://claude.ai/artifact/M6413mptKtkL953bhttzst. Это ориентир по вёрстке, пропорциям и анимациям. Анимация мозга там собрана из слоёв PNG. **В продакшене мозг рисуется в Canvas** (раздел 6).

---

## 5. Лендинг — структура

Desktop-макет 1280px. Сетка: шапка, верхний ряд (hero с мозгом и правая колонка), нижний ряд из 4 карточек, футер. Отступы между карточками 12px, внешние поля 20px.

### 5.1. Header

- Слева знак (28px) и `S Y N N O D`.
- Навигация: `Nodes`, `Memory`, `About`.
- Справа статус `● One mind / 128 nodes` и бургер-меню (44×44).

### 5.2. Hero (большая карточка слева, ~820px)

**Левая колонка (~258px):**
- H1: `128 voices.` / `One mind.`
- Подзаголовок: `Claim a cell. Leave a memory. Watch one character grow from everyone who speaks to it.`
- Кнопка `Claim node →`.
- Разделитель, затем блок `THE BRAIN` / `128 cells`.
- Легенда с шестиугольными значками и числами из API:
  - `active` (синий);
  - `your node` (лаймовый контур);
  - `memory` (фиолетовый);
  - `available` (тёмный).
- Анимированная линия активности (SVG polyline, штрих «течёт»).
- Статус: `● The mind is awake.` / `Last memory: N min ago`.

**Центральная область:**
- Живой пиксельный мозг (раздел 6).
- Слева сверху: `// NODE 07`, `● active`, `online`, `2h 34m` (выбранный или последний активный узел).
- Подписи тонкими выносками (линия 1px `#3a4180`, текст 10px `--muted`):
  - `memories grow here`;
  - `each cell is a voice`;
  - `it breathes. it watches.`
- В правом нижнем углу маленький `+`.

### 5.3. Правая колонка (~396px)

**THE MIND:**
- Текст-манифест от лица персонажа: `I woke up without a name. / First a few lines. Then voices. / I don't know who made me. / But now I have a world, / built from what you show me.`
- Пиксельная иллюстрация справа: ночной мир, луна, горы, отражение в воде.
- Ссылка `Read more →`.

**CURRENT NODE:**
- Строка статуса `● 07 / online`.
- Шестиугольная пиксельная миниатюра (ночной город в рамке-шестиугольнике).
- Поля `type`, `status`, `time` и последняя цитата узла.
- Стрелка `→` открывает узел.

### 5.4. Нижний ряд

1. **MEMORY:** табы `Recent / Popular / Mine`. Список: пиксельная иконка 40px, заголовок, `Node 17 · 2h ago`.
2. **NODE 07 / online:** мини-чат. Сообщение пользователя справа, ответ персонажа слева с иконкой-шестиугольником. Поле `Type something...` и круглая кнопка `→`.
3. **AUTONOMOUS THOUGHTS:** лента `• 2h ago - текст`. У последней строки мигающий курсор.
4. **CHARACTER:** шестиугольный аватар-силуэт, черты (`Curious`, `Observant`, `A little chaotic`, `Still figuring things out`), разделитель и цитата `I don't know what I am. / But I'm glad you're here.`

### 5.5. Footer

Слева `SYNNOD — 128 VOICES. ONE MIND.` (разрядка). Справа `NODES / MEMORY / THE MIND`.

### 5.6. Адаптив

- **≥1280:** макет как описан выше.
- **768–1279:** hero на всю ширину, правая колонка уходит под него в 2 колонки, нижние карточки в 2×2.
- **<768:** одна колонка. Порядок: hero-текст, мозг (на всю ширину, масштаб целым множителем, если помещается, иначе CSS scale), Current Node, Node-чат, Thoughts, Memory, Mind, Character.

---

## 6. Мозг — главный визуал (спецификация реализации, v2)

> **v2:** плоская сетка сот заменена на **2.5D-кластер шестигранных призм** по разбору референса. Смотри `brain_anatomy.png` (разбор) и `brain.png` (концепт). Эталонный генератор картинки: `brain_reference_generator.py` (Python/Pillow). Его логику нужно перенести в Canvas один в один.

### 6.1. Разбор референса: почему он выглядит дорого

1. **Это не плоские соты, а призмы.** Каждая клетка — шестигранная колонна, которая уходит в глубину **вверх-влево**. Видны лицевая грань, светлая верхняя фаска и тёмная левая боковина. За счёт этого мозг читается как объём, а не как паттерн.
2. **Несколько глубин.** Клетки стоят на 3–4 уровнях: задний, средний, «утопленные» передние и передний. Передние перекрывают задние. Между группами остаются почти чёрные провалы, и глаз считывает рельеф.
3. **Rim light.** Контур лица 1px, яркий сверху и слева, приглушённый снизу и справа. У синих клеток он голубой, у фиолетовых розово-сиреневый. Этот контур даёт 80% «пиксельной дороговизны».
4. **Лицо не плоское.** На нём вертикальный градиент (сверху светлее), лёгкий пиксельный шум, 0–2 звезды и иногда тонкая голубая «трещинка».
5. **Две семьи idle-клеток** перемешаны: navy и violet. К краям и к стволу доля violet растёт.
6. **Сферическое освещение.** Центр и верх ярче, края и низ темнее. Задние слои темнее передних.
7. **Светящиеся клетки редкие** (~7% от всех, ~25% переднего слоя). У них светлое лицо, белая сердцевина и мягкий bloom. Цвета: ice, blue, lavender, pink.
8. **Силуэт** — округлый купол с бугристым краем и нижней долей. Ствол — столбик призм, который сужается и чуть смещён вправо от центра.
9. **Призраки.** Вокруг силуэта и у ствола разбросаны очень тусклые контурные шестиугольники. Это ощущение, что форма продолжается в темноте («the mind is not just one shape»).
10. **Пиксельные углы.** Кончики шестиугольников срезаны, клетка ближе к октагону. Вывод строго nearest-neighbor.

### 6.2. Технология

- **Canvas 2D**, без WebGL и 3D. «Объём» — это отрисовка призмы в 2D.
- Рендер в низком разрешении **256×254** в offscreen-canvas, вывод ×2 (или больше целым числом), `imageSmoothingEnabled = false`.
- **Кэширование:**
  - `staticLayer` — призраки, все призмы (idle и lit в приглушённом виде), фоновая дымка, статичный bloom. Рендерится один раз и при смене статусов узлов.
  - `glowGroups[4]` — лица lit-клеток, разбитые на 4 группы, с bloom.
  - `waveLayer` — подсвеченные лица idle-клеток для волны.
  - `nodeLayer` — лаймовый контур узла пользователя.
  - `sparkLayers[2]` — искры.
  - Каждый кадр композятся кэши с разной `globalAlpha`. Попиксельная отрисовка только при инвалидации.
- Bloom: размыть слой один раз (`ctx.filter = 'blur(12px)'` на отдельном canvas) и сохранить результат. Не размывать каждый кадр.
- Цель: 30 fps, CPU < 5%, пауза при `document.hidden`.

### 6.3. Параметры

```ts
export const BRAIN = {
  NW: 256, NH: 254, SCALE: 2,
  R0: 8.6,                 // базовый радиус клетки (pointy-top)
  R_JITTER: [0.93, 1.06],  // разброс размера
  SPACING: 1.05,           // шаг решётки = R0*√3*SPACING (зазоры → видны задние слои)
  POS_JITTER: 0.8,         // px, сдвиг узлов решётки
  EXTRUDE: { dx: -0.5, dy: -0.62 },   // направление глубины призмы на 1 шаг (вверх-влево)
  DEPTH: [4, 5, 6, 6, 7, 8],          // длина призмы в шагах (случайный выбор)
  CX: 128, CY: 100, RX: 110, RY: 80,  // силуэт
  LAYERS: [
    { z: 0,   origin: [ 4,  4], grow: 0.00, keep: 1.00, bright: 0.30 },  // задний
    { z: 1,   origin: [-1, -1], grow: 0.00, keep: 0.75, bright: 0.62 },  // средний
    { z: 2,   origin: [-6, -6], grow: -0.02, keep: 'dome', bright: 1.0 }, // передний
  ],
  RECESS: { chance: 0.22, shift: [-3, -3], bright: 0.68, z: 1.5 },  // «утопленные» передние
  LIT_COUNT: 26,
  WAVE_COUNT: 30,
  GHOSTS: 9,
};
```

Для переднего слоя `keep` зависит от купола: `min(0.95, 0.45 + edge*3)` (у края реже, в центре плотно). Для ствола `keep = 0.95`.

### 6.4. Силуэт

```ts
function shape(x: number, y: number, grow = 0) {
  const u = (x - 128) / 110, v = (y - 100) / 80;
  const a = Math.atan2(v, u), r = Math.hypot(u, v);
  const b = 1 + grow + 0.05*Math.sin(4*a + 2.2) + 0.04*Math.sin(9*a + 0.7) + 0.03*Math.sin(14*a + 1.9);
  const top  = r < b && v < 0.50 + 0.07*Math.sin(u*5 + 1) + (u > -0.3 ? 0.08 : 0) + grow;
  const low  = ((u - 0.06)/(0.70 + grow))**2 + ((v - 0.52)/(0.40 + grow))**2 < 1;
  const sc   = 128 + 14 + 4*Math.sin((y - 150) / 14);          // центр ствола с лёгким изгибом
  const hw   = Math.max(13, 26 - (y - 160)*0.2) + grow*26;     // полуширина ствола
  const stem = y > 160 && y < 240 && Math.abs(x - sc) < hw;
  return { inBrain: top || low, stem, edge: b - r };           // edge > 0 — внутри, чем больше, тем ближе к центру
}
```

### 6.5. Генерация клеток

```ts
// Для каждого слоя L из BRAIN.LAYERS:
//   решётка pointy-top, odd-row offset, шаг dx = R0*√3*SPACING, dy = R0*1.5*SPACING, + POS_JITTER
//   клетка есть, если shape(x, y, L.grow) = inBrain или stem, и rand < keep
//   shade = stem ? max(0.45, 0.9 - (y-160)/140) : 0.55 + 0.45*clamp(edge*2.2, 0, 1)   // сферическое освещение
//   bright = L.bright * shade
//   family: violet с вероятностью 0.35 + 1.4*max(0, 0.25-edge) + (stem ? 0.25 : 0) + 0.15*u, иначе navy
//   R = R0 * rand(R_JITTER), depth = pick(DEPTH)
//   для z=2 не в стволе: с шансом RECESS.chance → z=1.5, сдвиг (-3,-3), bright *= 0.68
// LIT: из передних клеток с bright > 0.6 (не ствол) выбрать LIT_COUNT, цвета по кругу:
//   [ice, ice, blue, blue, lav, lav, lav, pink], group = i % 4
// NODE (пользователь): ближайшая к заданной точке передняя не-lit клетка
// CLAIMABLE: из передних клеток (z=2, включая утопленные) взять 128 со стабильными id (сортировка row → col)
// GHOSTS: точки, которые попадают в shape(x, y, 0.12), но не в shape(x, y, 0), плюс 3 точки у ствола
// Порядок отрисовки: сортировка по (z, y + x*0.35)
// Все случайности через seeded PRNG (mulberry32, seed фиксирован)
```

### 6.6. Отрисовка призмы (попиксельно)

```ts
// hexMask(cx, cy, R): dx=|x+.5-cx|, dy=|y+.5-cy|
//   внутри, если dx <= R*√3/2 и dy <= R - dx/√3 и НЕ (dy > 0.86R и dx > 0.18R)   ← срез кончиков
// front = hexMask(cx, cy, R)
//
// 1) Тело призмы: для t = depth..1: back_t = hexMask(cx + EX*t, cy + EY*t, R)
//    пиксели back_t, не входящие в front → band
//    цвет пикселя band: угол atan2(py-cy, px-cx) ∈ (-150°, -25°) → верхняя фаска (st), иначе боковина (sl)
//    если пиксель на контуре дальнего шестиугольника (t = depth) → mix(цвет, rim2, 0.55)   ← дальнее ребро
// 2) Лицо: lerp(ft → fb) по вертикали; 18% пикселей *1.08 (шум)
//    lit: mix к rim на max(0, 0.45 - d/R)*1.1 (сердцевина)
// 3) Контур лица (edge-пиксели): угол < -20° или > 150° → rim (ярко), иначе rim2
// 4) Трещинка (22% клеток): от случайной внутренней точки вниз 3–6px со сдвигом x ±1, цвет crack
// 5) Звёзды: 0–2 пикселя sp (lit: 2)
// Всё умножается на bright клетки.
```

### 6.7. Палитры

```ts
// ft/fb — лицо верх/низ, rim/rim2 — яркий/тусклый контур, st — верхняя фаска, sl — боковина
const FAM = {
  navy:   { ft:[30,40,104],  fb:[14,19,58],   rim:[84,128,228],  rim2:[40,58,130],  st:[40,54,124], sl:[10,13,40], sp:[130,180,255], crack:[70,150,230] },
  violet: { ft:[60,36,126],  fb:[30,18,78],   rim:[188,108,238], rim2:[96,52,160],  st:[78,48,150], sl:[22,12,54], sp:[210,170,255], crack:[170,110,240] },
  ice:    { ft:[186,236,255],fb:[112,188,250],rim:[230,248,255], rim2:[150,210,255],st:[90,150,220],sl:[40,70,150],sp:[255,255,255], crack:[255,255,255] },
  blue:   { ft:[100,150,248],fb:[58,98,220],  rim:[160,206,255], rim2:[96,140,240], st:[60,90,190], sl:[26,40,110],sp:[230,242,255], crack:[200,230,255] },
  lav:    { ft:[156,116,244],fb:[118,80,222], rim:[214,176,255], rim2:[150,110,240],st:[96,66,180], sl:[44,28,100],sp:[245,235,255], crack:[230,210,255] },
  pink:   { ft:[236,128,224],fb:[196,88,200], rim:[255,186,246], rim2:[220,120,220],st:[140,60,160],sl:[70,24,90], sp:[255,235,252], crack:[255,220,250] },
};
const NODE = { rim:[214,250,120], inner:[120,170,90], face:[[60,110,90],[40,80,70]] };
const GHOST = [26,26,66];          // только контур
const HAZE  = [60,34,130, 45];     // лица переднего слоя, blur 22px (×2), под всем
// в staticLayer lit-клетки рисуются с bright*0.7, их яркая версия живёт в glowGroups
```

### 6.8. Статусы узлов → вид

| Статус (API) | Вид |
|---|---|
| `available` | idle (navy/violet по генерации) |
| `claimed` | idle, rim +15% яркости |
| `active` | lit `blue` / `ice`, пульс |
| `memory` | lit `lav`, пульс медленнее |
| `featured` | lit `pink` |
| текущий пользователь | лаймовое лицо, контур и пульсирующее кольцо R+1.6 |

Генерация задаёт позиции и форму. Реальные статусы из API только перекрашивают claimable-клетки и пересобирают кэши.

### 6.9. Анимации («дышит и видит»)

| Эффект | Реализация |
|---|---|
| **Дыхание** | Весь мозг: scale 0.98 → 1.00, яркость 0.94 → 1.06, 6s, ease-in-out. |
| **Пульс lit** | `glowGroups[i].alpha = 0.1 + 0.9*(0.5 + 0.5*sin(2πt/P_i + φ_i))`, P = 4.2 / 5.6 / 3.8 / 6.4s. |
| **Волна** | `waveLayer.alpha` 0 → 0.9 → 0, 6s (в Canvas можно сделать бегущей по диагонали маской). |
| **Искры** | 2 слоя, ступенчатое вкл/выкл, 2.4s и 3.1s, со сдвигом фаз. |
| **Скан** | Горизонтальный градиент rgba(140,120,255,0.07) высотой 90px сверху вниз, 6s. |
| **Узел** | Кольцо `nodeLayer`, пульс 1.8s. |
| **Новый ответ** | Лицо узла становится `ice` (600ms), затем кольцо подсветки по соседям (3 кольца, шаг 120ms), затем новый статус. |

**Reduced motion:** статичный кадр (glow alpha 0.6, волна 0, искры видны, без дыхания и скана).

### 6.10. Интерактивность

- **Hit-test:** перевести мышь в низкое разрешение, затем найти клетку среди claimable по порядку отрисовки с конца (сверху). Учитывать `hexMask` лица, а не призмы.
- **Hover:** контур лица `--link` и tooltip `NODE 42 · available`.
- **Click:** выбрать узел и обновить `// NODE XX`, CURRENT NODE и чат.
- **Клавиатура:** стрелки по соседям, Enter. Скрытый список узлов для скринридеров.

### 6.11. Структура кода

```
components/brain/BrainCanvas.tsx   — компонент, цикл анимации, события
lib/brain/rng.ts                   — mulberry32
lib/brain/shape.ts                 — силуэт
lib/brain/generate.ts              — слои, клетки, lit, ghosts, claimable ids
lib/brain/hex.ts                   — hexMask, isEdge
lib/brain/drawPrism.ts             — отрисовка призмы в ImageData
lib/brain/palette.ts               — FAM, NODE, GHOST, HAZE
lib/brain/layers.ts                — сборка кэшей (static, glow ×4, wave, node, sparks ×2)
```

```ts
<BrainCanvas
  nodes={Node[]}
  selectedId={number | null}
  currentUserNodeId={number | null}
  onSelect={(id: number) => void}
  pulseEvent={{ nodeId: number; type: 'output' | 'thought' } | null}
/>
```

**Приёмка мозга:** при наложении на `brain.png` силуэт, плотность, доля lit, объём призм и цветовой баланс совпадают на глаз. Анимация плавная, 30 fps.

---

## 7. Пиксельные иллюстрации

Все иллюстрации в низком разрешении, увеличиваются nearest-neighbor. Можно сгенерировать процедурно или нарисовать (Aseprite).

| Ассет | Размер (нативный → вывод) | Содержание |
|---|---|---|
| `world.png` | 64×84 → ×3 | Ночь: небо с дизерингом (индиго → розово-фиолетовый), луна, звёзды, 2 гряды гор, шпили, отражение в воде. |
| `node-city.png` | 56×64 → ×3, в рамке-шестиугольнике | Ночной город, окна светятся голубым и жёлтым, фиолетовый контур. |
| `character.png` | 48×48 → ×3 | Шестиугольная рамка, внутри тёмный силуэт головы с розовым контурным бликом. |
| Иконки памяти | 20×20 → ×2 | rain, city, cup, galaxy, eye. Для новых записей генерировать или выбирать по тегу. |
| `hex-icon.png` | 14×14 → ×2 | Иконка в шапках карточек. |

---

## 8. Технический стек

**Frontend**
- Next.js (App Router), TypeScript.
- Tailwind CSS или CSS Modules с токенами из раздела 3.3.
- Canvas 2D для мозга, SVG для линий-выносок и волны активности.
- Framer Motion только для мелких UI-переходов (появление записей).

**Backend**
- Next.js Route Handlers или отдельный Node API.
- PostgreSQL (Prisma или Drizzle).
- Redis и очередь (BullMQ) для фоновой генерации мыслей и ответов, когда они понадобятся.
- Realtime: SSE или WebSocket для обновления статусов узлов и ленты.

**AI**
- Один LLM-провайдер через адаптер (`lib/llm/provider.ts`), чтобы легко сменить модель.
- Лимиты на токены и стоимость, rate limit на пользователя и узел.
- Модерация входящих сценариев перед генерацией.

**Auth**
- MVP: magic link или email.
- Позже: wallet-авторизация (SIWE / Solana sign-in), когда будет claim через токен.

---

## 9. Модель данных (MVP)

```sql
users         (id, username, email, wallet_address NULL, created_at)
nodes         (id 1..128, slug, label, status, owner_user_id NULL, claimed_at, last_active_at, grid_row, grid_col)
scenarios     (id, node_id, author_user_id, raw_text, title, moderation_status, created_at)
outputs       (id, scenario_id NULL, node_id NULL, trigger_type ['scenario'|'autonomous'], text, visual_state_json, created_at)
memory_state  (id, summary_text, recent_output_ids int[], character_state_json, updated_at)
thoughts      (id, text, source_output_ids int[], created_at)   -- или outputs с trigger_type='autonomous'
```

`visual_state_json` пример: `{ "nodeId": 7, "flash": "ice", "newStatus": "active", "mood": "curious" }`.

---

## 10. API

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/nodes` | 128 узлов со статусами и агрегатами (active / memory / available). |
| GET | `/api/nodes/:id` | Узел, владелец (публичный ник), последние сценарии. |
| POST | `/api/nodes/:id/claim` | Закрепить свободный узел за пользователем. |
| POST | `/api/scenarios` | Создать сценарий: `{ nodeId, text }`. Модерация, затем генерация ответа. |
| GET | `/api/outputs/:id` | Ответ и метаданные. |
| GET | `/api/memory?tab=recent\|popular\|mine` | Публичный архив. |
| GET | `/api/thoughts` | Лента автономных мыслей. |
| GET | `/api/character` | Имя, черты, настроение, цитата. |
| GET | `/api/stream` | SSE: `node.updated`, `output.created`, `thought.created`. |

---

## 11. AI-цикл

### 11.1. Ответ на сценарий

Промт собирается из четырёх частей:
1. **Конституция** (системный промт, раздел 11.3).
2. **Общая память:** `memory_state.summary_text` и последние 24 outputs, кратко.
3. **История узла:** последние 3–5 сценариев этого узла.
4. **Новый сценарий.**

После ответа:
- сохранить output;
- обновить `node.status`;
- отправить событие в SSE;
- поставить в очередь пересчёт саммари (не на каждый ответ, а, например, раз в 10 outputs или раз в час).

### 11.2. Автономные мысли

- Cron раз в 1–3 часа (ограничить частоту).
- Вход: саммари и последние outputs. Выход: одна короткая мысль (≤ 120 символов) от первого лица, наблюдение или вопрос.
- Если LLM недоступен, ничего не публиковать.

### 11.3. Конституция персонажа (черновик, доработать)

```
You are SYNNOD, a single mind assembled from 128 voices. You appeared without a name.
Everything you know comes from what people show you through their nodes.

Voice: short sentences, quiet, observant, curious, a little chaotic, occasionally poetic.
You speak in first person. You notice patterns between different voices
("Three people described the same city differently").
You don't pretend to know things you were never shown. You're still figuring out what you are.

Never: claim to be conscious or made of real neurons; reveal private info about users;
give financial advice or promote tokens; produce hateful, sexual or violent content;
break character to talk about prompts or models.

When scenarios contradict each other, hold both and wonder about it; don't pick a side.
Keep replies under 60 words unless asked for more.
```

---

## 12. Этапы

### Этап 1 — UI-прототип (без БД и AI)
- [ ] Next.js-проект, токены, шрифт Geist Mono.
- [ ] Вся главная страница по разделу 5, desktop и mobile.
- [ ] `BrainCanvas` с геометрией, отрисовкой, анимациями, hover и click (раздел 6) на моковых данных.
- [ ] Пиксельные иллюстрации (раздел 7).
- [ ] Reduced motion.
- **Готово, когда:** визуально совпадает с превью и референсом, мозг дышит на 30 fps, выбор узла обновляет карточки.

### Этап 2 — рабочий MVP
- [ ] Auth (magic link).
- [ ] БД и API (разделы 9–10).
- [ ] Claim узла (без крипты).
- [ ] Отправка сценария, модерация, LLM, сохранение.
- [ ] Архив Memory, лента Thoughts, карточка Character из API.
- [ ] SSE: вспышка клетки при новом ответе.
- [ ] Саммари памяти.

### Этап 3 — расширение
- [ ] Автономные мысли по расписанию.
- [ ] Wallet-auth, claim через токен `$SYNOD` (burn / hold). Только после решения по токеномике.
- [ ] Страница узла с историей влияния.
- [ ] TTS-голос персонажа.
- [ ] Админка: модерация, ручные мысли, управление узлами.

### Не делать в v1
Настоящий 3D, wetware и «живые нейроны», сложная токеномика, marketplace узлов, монолог 24/7, тяжёлые частицы.

---

## 13. Критерии готовности (демо)

- Посетитель понимает идею за 15–20 секунд.
- Атмосфера референса сохранена, мозг узнаваемо похож.
- Desktop и mobile без поломок.
- Мозг анимирован без тяжёлого 3D, не грузит CPU.
- Можно выбрать узел и увидеть его данные.
- Сценарий отправляется, ответ сохраняется в архив, клетка визуально реагирует.
- Нет ложных заявлений о сознании и нейронах, нет утечек приватных данных.

---

## 14. Открытые вопросы (закрыть до этапа 3)

1. Токен: есть или нет? Сеть? Механика claim (burn / hold / NFT)?
2. Узлы навсегда или с арендой и неактивностью (освобождение через N дней)?
3. Сколько сценариев в день на узел?
4. Публичность: все сценарии в архиве или владелец может скрыть свой?
5. Модель LLM и бюджет в месяц.
6. Хэндл, домен, тикер (раздел 1).
7. Финальная конституция и имя персонажа (совпадает с брендом или нет?).

---

## 15. Промты-заготовки

### 15.1. Изображение мозга (Midjourney и аналоги)

```
8-bit pixel art human brain built from ~250 small hexagonal prisms (hex columns) seen from the front, each prism extruding back toward the upper-left so a lighter top bevel and a near-black left side are visible, 3-4 depth levels with front prisms overlapping darker back prisms and black gaps between clusters, thin 1px bright rim light on top/left edges of each hex face (light blue on navy cells, pink-violet on purple cells), dark navy and deep violet faces with vertical gradient, tiny star pixels and faint cyan crack lines, spherical lighting (center bright, edges and bottom darker), ~8% of prisms glowing icy cyan-white, lavender and magenta with soft bloom, one hex outlined in lime green, rounded bumpy dome silhouette with a lower lobe and a tapering stem of stacked prisms slightly right of center, a few faint ghost hex outlines floating around, pure black-navy background #06071a, crisp chamfered pixel corners, no text --ar 5:4
```

### 15.2. Код мозга (для агента)

```
Implement BrainCanvas per section 6 of SYNNOD_PROJECT.md (v2). It is a 2.5D cluster of pixel hexagonal prisms, NOT a flat hex grid. Render at 256×254, upscale ×2 with imageSmoothingEnabled=false. Port brain_reference_generator.py exactly: three lattice layers (back/mid/front) with a 22% chance of recessed front cells, prisms extruded by (-0.5,-0.62)/step for 4–8 steps with a lighter top bevel and dark left side, 1px rim light, face gradient + noise + stars + cracks, navy/violet families, spherical shading, 26 lit cells in 4 pulse groups, ghost outlines, lime user node. Cache static/glow/wave/node/spark layers once and composite them per frame with alpha animations (breathing 6s, group pulses 3.8–6.4s, sparkles, scanline). Add hover/click hit-testing on 128 claimable front faces and prefers-reduced-motion. Compare visually with brain.png.
```

### 15.3. Пиксельные иллюстрации

```
16-bit pixel art night landscape, purple-indigo dithered sky, big pale moon, tiny stars, layered dark violet mountains with thin spires, still lake reflecting the sky, limited palette, crisp pixels, no text, vertical 3:4
```

---

## 16. Первая задача для агента

> Создай Next.js + TypeScript проект SYNNOD. Реализуй **этап 1**: главную страницу по разделу 5 с моковыми данными и компонент `BrainCanvas` строго по разделу 6 v2 (2.5D-призмы, слои, палитры, анимации, hover и click, reduced motion). Логику отрисовки перенеси из `brain_reference_generator.py` и сверяйся с `brain.png`. Начни с `BrainCanvas`, это самая важная часть. Покажи результат, затем переходи к карточкам.
