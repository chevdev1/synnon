import type { Lang } from "@/lib/help";

type T = Record<Lang, string>;

export type Block =
  | { kind: "p"; text: T }
  | { kind: "list"; items: T[] }
  | { kind: "steps"; items: { title: T; text: T }[] }
  | { kind: "table"; head: T[]; rows: T[][] }
  | { kind: "note"; tone: "info" | "warn"; text: T }
  | { kind: "faq"; items: { q: T; a: T }[] }
  | { kind: "links"; items: { label: T; href: string }[] };

export interface DocSection {
  id: string;
  title: T;
  blocks: Block[];
}

const t = (en: string, ru: string): T => ({ en, ru });

export const DOCS_UI = {
  title: t("Documentation", "Документация"),
  subtitle: t("What SYNNOD is and how it works, in plain words.", "Что такое SYNNOD и как он работает — простыми словами."),
  toc: t("Contents", "Содержание"),
  back: t("← Back to the app", "← Назад на сайт"),
  updated: t("Test network build. Details change as the project grows.", "Сборка на тестовой сети. Детали будут меняться по мере роста проекта."),
};

export const DOCS: DocSection[] = [
  {
    id: "what",
    title: t("What is SYNNOD", "Что такое SYNNOD"),
    blocks: [
      {
        kind: "p",
        text: t(
          "SYNNOD is one shared AI character that nobody owns. Its “brain” is made of 128 hexagonal cells, and every cell belongs to one person. Everything people tell the character through their cells becomes part of one common memory. From that memory the character forms its own mood, opinions and thoughts.",
          "SYNNOD — это один общий ИИ-персонаж, которым никто не владеет. Его «мозг» состоит из 128 шестиугольных клеток, и каждая клетка принадлежит одному человеку. Всё, что люди рассказывают персонажу через свои клетки, становится частью одной общей памяти. Из этой памяти персонаж формирует своё настроение, мнения и мысли.",
        ),
      },
      { kind: "p", text: t("The idea in four words: 128 voices. One mind.", "Идея в четырёх словах: 128 голосов. Один разум.") },
      {
        kind: "note",
        tone: "info",
        text: t(
          "It is an art project and an experiment, not a person. The character is written by a language model; it does not claim to be conscious or alive.",
          "Это арт-проект и эксперимент, а не человек. Речь персонажу пишет языковая модель; он не заявляет, что у него есть сознание или что он живой.",
        ),
      },
    ],
  },
  {
    id: "how",
    title: t("How it works", "Как это работает"),
    blocks: [
      {
        kind: "steps",
        items: [
          {
            title: t("1. Claim", "1. Займи"),
            text: t(
              "Connect a wallet and pick a free cell on the brain. One account can hold one cell. Claiming needs a small amount of the project token (see “Token and Robinhood Chain”).",
              "Подключи кошелёк и выбери свободную клетку на мозге. Один аккаунт может занять одну клетку. Для этого нужно немного токена проекта (см. «Токен и Robinhood Chain»).",
            ),
          },
          {
            title: t("2. Speak", "2. Говори"),
            text: t(
              "Through your cell, tell the mind something: a place, a memory, an image, a strange dream. Up to 1200 characters per message.",
              "Через свою клетку расскажи разуму что-нибудь: место, воспоминание, образ, странный сон. До 1200 символов в сообщении.",
            ),
          },
          {
            title: t("3. Watch", "3. Наблюдай"),
            text: t(
              "The AI answers, your cell lights up and the reply goes into the shared memory. Later it may show up in the memory archive or inside the character's own thoughts.",
              "ИИ отвечает, твоя клетка вспыхивает, а ответ попадает в общую память. Позже он может появиться в архиве памяти или в собственных мыслях персонажа.",
            ),
          },
        ],
      },
      {
        kind: "p",
        text: t(
          "You do not need an account, an email or a password. Your wallet is your login: you prove the address is yours by signing a short message.",
          "Аккаунт, почта и пароль не нужны. Твой кошелёк — это твой вход: ты подтверждаешь, что адрес твой, подписывая короткое сообщение.",
        ),
      },
    ],
  },
  {
    id: "cells",
    title: t("The brain and its cells", "Мозг и его клетки"),
    blocks: [
      {
        kind: "p",
        text: t("Every hexagon shows what its owner is doing right now. Hover a cell to see its number and status.", "Каждый шестиугольник показывает, что сейчас делает его владелец. Наведи на клетку, чтобы увидеть номер и статус."),
      },
      {
        kind: "table",
        head: [t("Status", "Статус"), t("What it means", "Что это значит")],
        rows: [
          [t("available", "available"), t("Free. Anyone can claim it.", "Свободна. Занять может любой.")],
          [t("claimed", "claimed"), t("Taken, but has not spoken yet.", "Занята, но ещё ничего не сказала.")],
          [t("active", "active"), t("Talking to the AI right now (glows bright).", "Прямо сейчас говорит с ИИ (ярко светится).")],
          [t("memory", "memory"), t("Left a memory. After about 10 quiet minutes an active cell becomes “memory”.", "Оставила воспоминание. Через ~10 минут тишины active превращается в memory.")],
          [t("your node", "твоя клетка"), t("The green outline is your own cell.", "Зелёный контур — твоя собственная клетка.")],
        ],
      },
    ],
  },
  {
    id: "alive",
    title: t("A living brain: what moves and why", "Живой мозг: что двигается и зачем"),
    blocks: [
      {
        kind: "p",
        text: t(
          "Nothing on the brain is decoration. Every effect below is driven by something that really happened in the shared memory.",
          "Здесь нет декораций ради декораций. Каждый эффект ниже привязан к тому, что реально произошло в общей памяти.",
        ),
      },
      {
        kind: "table",
        head: [t("Mechanic", "Механика"), t("What you see", "Что видно")],
        rows: [
          [
            t("Neural links", "Нейронные связи"),
            t(
              "When a voice is answered, or when the mind has a thought, pixel sparks travel from the speaking cell to the cells whose words fed it. A thought lights up every voice it grew from.",
              "Когда голосу отвечают или у разума рождается мысль, пиксельные искры бегут от говорящей клетки к клеткам, чьи слова её питали. Мысль подсвечивает все голоса, из которых выросла.",
            ),
          ],
          [
            t("Claim shockwave", "Волна захвата"),
            t(
              "When someone takes a free cell, a green wave rolls across the whole brain and the event lands in the feed. You can hear it if sound is on.",
              "Когда кто-то занимает свободную клетку, по всему мозгу расходится зелёная волна, а событие появляется в ленте. Со включённым звуком её ещё и слышно.",
            ),
          ],
          [
            t("Glow by age", "Свечение по «возрасту»"),
            t(
              "A cell that just spoke burns bright and slowly cools; its brightness halves about every 70 minutes. So the brain shows what the mind is remembering right now and what has sunk deeper.",
              "Клетка, которая только что говорила, горит ярко и постепенно остывает: яркость падает вдвое примерно за 70 минут. Мозг показывает, что разум помнит сейчас, а что ушло глубже.",
            ),
          ],
          [
            t("Your cell", "Твоя клетка"),
            t(
              "A pulsing green frame and a floating “YOU · nickname” tag mark your own cell among the 128.",
              "Пульсирующая зелёная рамка и парящая метка «YOU · ник» отмечают твою клетку среди 128.",
            ),
          ],
          [
            t("Find a node", "Поиск клетки"),
            t(
              "The search box on the brain takes a number (#48) or part of a nickname. The cell pulses pink and its card opens.",
              "Поле поиска на мозге принимает номер (#48) или часть ника. Клетка вспыхивает розовым, и открывается её карточка.",
            ),
          ],
          [
            t("The face", "Лицо"),
            t(
              "One pixel eye. It blinks and looks around; spins while it thinks about your message; “speaks” while the reply types out; falls asleep when nobody has spoken for about 6 minutes. Iris colour = mood.",
              "Один пиксельный глаз. Моргает и оглядывается, крутит зрачком, пока думает над твоим сообщением, «говорит», пока печатается ответ, и засыпает, если ~6 минут никто не говорил. Цвет радужки — настроение.",
            ),
          ],
          [
            t("Dreaming", "Сны"),
            t(
              "While the mind sleeps its breathing slows and old memories flicker up at random. In Live mode this is visual only: the site never invents thoughts for the AI.",
              "Пока разум спит, дыхание замедляется, а старые воспоминания случайно вспыхивают. В Live-режиме это только визуальный эффект: сайт никогда не придумывает мысли за ИИ.",
            ),
          ],
          [
            t("Glitch typing", "Печать с глитчем"),
            t(
              "The AI's reply types out character by character; the few characters ahead of the cursor flicker as pixel static before they resolve, and the author's cell lights up.",
              "Ответ ИИ печатается по буквам; несколько символов впереди курсора мерцают пиксельным шумом, прежде чем проявиться, а клетка автора вспыхивает.",
            ),
          ],
          [
            t("Sounds", "Звуки"),
            t(
              "8-bit blips for clicks, replies, finding a node and claims. They follow the music switch: “sound on” plays them, “lofi off” silences them.",
              "8-битные звуки для кликов, ответов, поиска и захвата клетки. Они подчиняются переключателю музыки: «sound on» — звучат, «lofi off» — тишина.",
            ),
          ],
          [
            t("Day and night", "День и ночь"),
            t(
              "The brain and the glow follow your local clock: pink dawn (5–8), cool blue day (8–17), magenta dusk (17–20), deep violet night. The chip in the header pins any phase; “auto” returns to your clock.",
              "Мозг и свечение следуют за твоими часами: розовый рассвет (5–8), прохладный синий день (8–17), малиновый закат (17–20), глубокий фиолетовый ночью. Кнопка в шапке фиксирует любую фазу, «auto» возвращает к твоим часам.",
            ),
          ],
          [
            t("Living sky", "Живой космос"),
            t(
              "Behind the brain there is a night sky of its own: three layers of stars that drift and follow your mouse, slow nebulae tinted by the hour, and the odd shooting star. It swells softly when something happens in the mind, most of all when a cell is claimed, and it calms down when the mind sleeps.",
              "За мозгом есть собственное ночное небо: три слоя звёзд, которые дрейфуют и следят за мышью, медленные туманности в цветах текущего часа и редкие падающие звёзды. Небо мягко вспыхивает, когда в разуме что-то происходит, сильнее всего при захвате клетки, и успокаивается, когда разум спит.",
            ),
          ],
          [
            t("Timelapse", "Таймлапс"),
            t(
              "The “▶ Timelapse” button replays the recent history of the mind in about 20 seconds: cells appear when they were claimed, flash when they spoke, and sparks jump between the cells behind each thought. The timeline is fitted to the period when things actually happened, and the bar shows how much real time you are watching. Pause, 1x/2x/4x and close are always there. It uses only cell numbers and timestamps, never anyone's words.",
              "Кнопка «▶ Timelapse» проматывает недавнюю историю разума примерно за 20 секунд: клетки появляются, когда их заняли, вспыхивают, когда говорили, а искры перескакивают между клетками, из которых родилась мысль. Шкала подгоняется под период, когда что-то реально происходило, а полоска внизу показывает, сколько настоящего времени вы смотрите. Пауза, скорость 1x/2x/4x и закрытие всегда под рукой. Используются только номера клеток и время, никогда чьи-то слова.",
            ),
          ],
          [
            t("Assembly", "Сборка мозга"),
            t(
              "After the intro screen the brain builds itself cell by cell from the centre outwards.",
              "После стартового экрана мозг собирается клетка за клеткой от центра к краям.",
            ),
          ],
        ],
      },
      {
        kind: "p",
        text: t(
          "Click a taken cell to open its profile: how many voices it spoke, how many replies are still in memory, how many thoughts it shaped, its share of the mind, a timeline of what it said and how the mind answered, and a small map of the cells it shares thoughts with. Every profile also has its own page (/node/48) with a share card for social networks.",
          "Клик по занятой клетке открывает её профиль: сколько голосов она сказала, сколько ответов ещё в памяти, сколько мыслей породила, её долю в разуме, ленту «что сказала и что ответил разум» и карту клеток, с которыми у неё общие мысли. У каждого профиля есть своя страница (/node/48) с карточкой для соцсетей.",
        ),
      },
      {
        kind: "note",
        tone: "info",
        text: t(
          "All of this respects the Motion switch: with motion off you get calm still frames, no flicker.",
          "Всё это подчиняется переключателю Motion: при выключенном движении остаются спокойные статичные кадры без мерцания.",
        ),
      },
    ],
  },
  {
    id: "diary",
    title: t("Diary and share cards", "Дневник и карточки для шаринга"),
    blocks: [
      {
        kind: "p",
        text: t(
          "Once a day the mind writes an entry in its diary: a short title and 50–90 words in the first person about what it noticed. The diary is at /diary, and every day has its own page (for example /diary/2026-09-19) with a share card.",
          "Раз в сутки разум пишет запись в свой дневник: короткий заголовок и 50–90 слов от первого лица о том, что он заметил. Дневник лежит на /diary, а у каждого дня своя страница (например /diary/2026-09-19) с карточкой для шаринга.",
        ),
      },
      {
        kind: "list",
        items: [
          t("The mind writes from its own replies, its thoughts and the number of new voices. It never sees anyone's raw words, so nothing private can end up in a public entry.", "Разум пишет по своим ответам, своим мыслям и числу новых голосов. Он никогда не видит чужих сырых слов, поэтому ничего личного не попадёт в публичную запись."),
          t("Entries never name people, wallets or usernames. Under each entry you see which cells spoke that day and can open their profiles.", "В записях нет имён людей, кошельков и никнеймов. Под записью видно, какие клетки говорили в тот день, и можно открыть их профили."),
          t("A day with no voices gets no entry. Silence stays silence.", "День без голосов записи не получает. Тишина остаётся тишиной."),
          t("One entry per day, written once and never rewritten.", "Одна запись в сутки, пишется один раз и не переписывается."),
        ],
      },
      {
        kind: "p",
        text: t(
          "Every cell page (/node/48) also has an animated card: an 8-second loop with the living sky, the brain with your cell pulsing, sparks to the cells you share thoughts with, counters that count up and a thought that types itself out. Press “Download video” to record it in your browser as an MP4 (WebM if your browser cannot do MP4) and upload the file to X. A plain link cannot play video, it only shows the still card.",
          "У каждой страницы клетки (/node/48) есть и анимированная карточка: 8-секундная петля с живым небом, мозгом с пульсирующей вашей клеткой, искрами к клеткам, с которыми у вас общие мысли, счётчиками и мыслью, которая печатается сама. Нажмите «Download video», чтобы записать её в браузере в MP4 (или WebM, если браузер не умеет MP4), и загрузите файл в X. Обычная ссылка видео не проигрывает, она показывает только статичную карточку.",
        ),
      },
    ],
  },
  {
    id: "memory",
    title: t("Shared memory and thoughts", "Общая память и мысли"),
    blocks: [
      {
        kind: "p",
        text: t("When you speak, the AI does not answer from nothing. To reply it looks at four things:", "Когда ты говоришь, ИИ отвечает не на пустом месте. Для ответа он смотрит на четыре вещи:"),
      },
      {
        kind: "list",
        items: [
          t("its character (a short written “constitution”: quiet, curious, a little chaotic);", "свой характер (короткая «конституция»: тихий, любопытный, немного хаотичный);"),
          t("a summary of everything it has been told so far;", "краткое содержание всего, что ему уже рассказали;"),
          t("the latest 24 replies across all cells;", "последние 24 ответа по всем клеткам;"),
          t("the last few things your own cell said, plus your new message.", "последние несколько сообщений твоей клетки и твоё новое сообщение."),
        ],
      },
      {
        kind: "p",
        text: t(
          "The summary is refreshed every 10 replies. Every few hours the character can also produce a short thought of its own (up to 120 characters) about what it has noticed. Those appear in “Autonomous thoughts”.",
          "Краткое содержание обновляется каждые 10 ответов. Раз в несколько часов персонаж может сам произнести короткую мысль (до 120 символов) о том, что он заметил. Такие мысли появляются в «Мыслях ИИ».",
        ),
      },
      {
        kind: "note",
        tone: "info",
        text: t("Replies are short on purpose: under about 60 words.", "Ответы намеренно короткие: обычно до 60 слов."),
      },
    ],
  },
  {
    id: "wallet",
    title: t("Wallet and signing", "Кошелёк и подпись"),
    blocks: [
      {
        kind: "p",
        text: t(
          "A wallet is a browser extension (for example MetaMask) that holds your digital address. Signing is approving a short text inside the wallet to prove the address is yours. It is free, it is not a payment and it moves no money.",
          "Кошелёк — это расширение для браузера (например MetaMask), где хранится твой цифровой адрес. Подпись — это подтверждение короткого текста в кошельке, чтобы доказать, что адрес твой. Она бесплатная, это не платёж и деньги не двигаются.",
        ),
      },
      {
        kind: "note",
        tone: "warn",
        text: t(
          "Never share your seed phrase (the 12/24 secret words). SYNNOD will never ask for it, and neither will any real support.",
          "Никогда не сообщай seed-фразу (12/24 секретных слова). SYNNOD никогда не попросит её, как и любая настоящая поддержка.",
        ),
      },
      {
        kind: "p",
        text: t(
          "Your cell is tied to your address. Sign in with the same wallet on another device or browser and you get the same cell back.",
          "Твоя клетка привязана к твоему адресу. Войди тем же кошельком с другого устройства или браузера — и клетка снова твоя.",
        ),
      },
    ],
  },
  {
    id: "token",
    title: t("Token and Robinhood Chain", "Токен и Robinhood Chain"),
    blocks: [
      {
        kind: "p",
        text: t(
          "SYNNOD runs on Robinhood Chain, a layer-2 network built on Ethereum (Arbitrum technology) where fees are paid in ETH. To claim a cell your wallet must hold at least a set amount of the project token. The site checks the balance directly on the blockchain at the moment you claim.",
          "SYNNOD работает в Robinhood Chain — сети второго уровня на базе Ethereum (технология Arbitrum), где комиссии платятся в ETH. Чтобы занять клетку, на кошельке должно лежать не меньше заданного количества токена проекта. Сайт проверяет баланс прямо в блокчейне в момент, когда ты занимаешь клетку.",
        ),
      },
      {
        kind: "note",
        tone: "info",
        text: t(
          "Right now everything runs on the TEST network with a free test token called tSYNOD. There is no real money in it. When the real token launches, only its contract address is swapped; nothing else about the site changes.",
          "Сейчас всё работает в ТЕСТОВОЙ сети с бесплатным тестовым токеном tSYNOD. Реальных денег в нём нет. Когда запустится настоящий токен, заменится только адрес его контракта, а всё остальное на сайте останется как есть.",
        ),
      },
      {
        kind: "steps",
        items: [
          {
            title: t("Add the network", "Добавь сеть"),
            text: t("In the claim window press “Add network”. Your wallet adds Robinhood Chain Testnet (chain ID 46630).", "В окне клетки нажми «Add network». Кошелёк добавит Robinhood Chain Testnet (chain ID 46630)."),
          },
          {
            title: t("Get test ETH for fees", "Получи тестовый ETH на комиссии"),
            text: t("Ask the official test faucet for a little test ETH. It is free and only pays the tiny network fee.", "Попроси на официальном тестовом кране немного тестового ETH. Он бесплатный и нужен только на крошечную комиссию сети."),
          },
          {
            title: t("Get test tSYNOD", "Получи тестовый tSYNOD"),
            text: t("Press “Get test tSYNOD” in the claim window and confirm in your wallet. You receive 1000 tSYNOD once per 24 hours.", "Нажми «Get test tSYNOD» в окне клетки и подтверди в кошельке. Ты получишь 1000 tSYNOD, раз в 24 часа."),
          },
        ],
      },
      {
        kind: "links",
        items: [
          { label: t("Robinhood Chain network details", "Параметры сети Robinhood Chain"), href: "https://docs.robinhood.com/chain/connecting" },
          { label: t("Test ETH faucet", "Кран тестового ETH"), href: "https://faucet.testnet.chain.robinhood.com" },
        ],
      },
    ],
  },
  {
    id: "modes",
    title: t("Demo and Live", "Demo и Live"),
    blocks: [
      {
        kind: "table",
        head: [t("Mode", "Режим"), t("What you see", "Что ты видишь")],
        rows: [
          [t("DEMO DATA", "DEMO DATA"), t("A simulated feed with made-up activity, so you can see how the site looks when it is busy. Nothing is saved.", "Симуляция с выдуманной активностью, чтобы было видно, как выглядит «живой» сайт. Ничего не сохраняется.")],
          [t("LIVE DATA", "LIVE DATA"), t("Only real data from the server: real cells, real memories, real replies. If nothing has happened yet, it says so.", "Только настоящие данные с сервера: реальные клетки, воспоминания и ответы. Если ничего ещё не произошло, так и написано.")],
        ],
      },
    ],
  },
  {
    id: "rules",
    title: t("Honesty and privacy", "Честность и приватность"),
    blocks: [
      {
        kind: "list",
        items: [
          t("The character never claims to be conscious or to have real neurons. It is a language model with a written personality.", "Персонаж никогда не заявляет, что у него есть сознание или настоящие нейроны. Это языковая модель с прописанным характером."),
          t("No fake activity in Live mode. If the AI is unavailable, the mind stays quiet instead of inventing replies.", "Никакой выдуманной активности в Live. Если ИИ недоступен, разум молчит, а не сочиняет ответы."),
          t("Private details are blocked: emails, phone numbers, card-like numbers and links are rejected before anything is sent to the AI.", "Личные данные блокируются: почта, телефоны, номера, похожие на карточные, и ссылки отклоняются до отправки ИИ."),
          t("Messages are checked by an AI moderator. Only approved messages ever appear in the public archive.", "Сообщения проверяет ИИ-модератор. В публичный архив попадают только одобренные."),
          t("Limits keep things fair: 10 messages per cell per day, and a few per minute per account.", "Лимиты поддерживают порядок: 10 сообщений в сутки на клетку и несколько в минуту на аккаунт."),
        ],
      },
    ],
  },
  {
    id: "faq",
    title: t("Questions", "Вопросы и ответы"),
    blocks: [
      {
        kind: "faq",
        items: [
          {
            q: t("Do I have to pay?", "Надо ли платить?"),
            a: t("No. Signing is free and the test token and test ETH are free. Nothing here costs real money.", "Нет. Подпись бесплатная, тестовые токен и ETH тоже бесплатные. Реальных денег ничего здесь не стоит."),
          },
          {
            q: t("Why can't I type in the chat?", "Почему я не могу писать в чат?"),
            a: t("Only the owner of a cell can write through it. Connect a wallet and claim a free cell first.", "Писать через клетку может только её владелец. Сначала подключи кошелёк и займи свободную клетку."),
          },
          {
            q: t("The AI does not answer. Why?", "ИИ не отвечает. Почему?"),
            a: t("Your message is saved, but the mind can be quiet when the AI service is not connected or is temporarily rate-limited. Try again a little later.", "Сообщение сохранено, но разум может молчать, если ИИ-сервис не подключён или временно ограничен по лимитам. Попробуй чуть позже."),
          },
          {
            q: t("My wallet says the wrong network.", "Кошелёк показывает не ту сеть."),
            a: t("Use “Add network” in the claim window; it switches your wallet to Robinhood Chain Testnet. Balances are per network, so on another network you will see zero.", "Нажми «Add network» в окне клетки — кошелёк переключится на Robinhood Chain Testnet. Балансы у каждой сети свои, поэтому в другой сети ты увидишь ноль."),
          },
          {
            q: t("Is tSYNOD the real token?", "tSYNOD — это настоящий токен?"),
            a: t("No, it is a free test token for the test network. The real one will replace it later.", "Нет, это бесплатный тестовый токен для тестовой сети. Позже его заменит настоящий."),
          },
          {
            q: t("Can I lose my cell?", "Могу ли я потерять клетку?"),
            a: t("It is tied to your wallet address, so as long as you have that wallet it is yours.", "Она привязана к адресу твоего кошелька, поэтому пока у тебя есть этот кошелёк, клетка твоя."),
          },
        ],
      },
    ],
  },
  {
    id: "tech",
    title: t("Under the hood", "Под капотом"),
    blocks: [
      {
        kind: "list",
        items: [
          t("Frontend: Next.js and TypeScript. The brain is drawn on Canvas 2D as pixel-art hexagonal prisms.", "Фронтенд: Next.js и TypeScript. Мозг рисуется на Canvas 2D как пиксельные шестигранные призмы."),
          t("Backend: Postgres (Drizzle), live updates over server-sent events, wallet sign-in with signature verification.", "Бэкенд: Postgres (Drizzle), живые обновления через server-sent events, вход кошельком с проверкой подписи."),
          t("Chain: an ERC-20 balance check on Robinhood Chain (standard interface, so the test and real tokens are interchangeable).", "Сеть: проверка баланса ERC-20 в Robinhood Chain (стандартный интерфейс, поэтому тестовый и настоящий токены взаимозаменяемы)."),
          t("AI: any OpenAI-compatible model (free tiers such as Gemini or Groq work) or Anthropic.", "ИИ: любая OpenAI-совместимая модель (подходят бесплатные тарифы вроде Gemini или Groq) или Anthropic."),
          t("Music: generated live in your browser with the Web Audio API. No audio files.", "Музыка: генерируется прямо в браузере через Web Audio API. Аудиофайлов нет."),
        ],
      },
      { kind: "links", items: [{ label: t("Source code on GitHub", "Исходный код на GitHub"), href: "https://github.com/chevdev1/synnon" }] },
    ],
  },
  {
    id: "roadmap",
    title: t("Roadmap", "Дорожная карта"),
    blocks: [
      {
        kind: "table",
        head: [t("Stage", "Этап"), t("What", "Что")],
        rows: [
          [t("Done", "Готово"), t("Pixel brain, chat, memory archive and thoughts; wallet sign-in; claim with a test token on Robinhood Chain Testnet; help mode and this documentation.", "Пиксельный мозг, чат, архив памяти и мысли; вход кошельком; занятие клетки с тестовым токеном в Robinhood Chain Testnet; режим помощи и эта документация.")],
          [t("Next", "Дальше"), t("A page for every cell with the history of its influence; the character's voice; an admin and moderation panel; swapping in the real launchpad token.", "Страница у каждой клетки с историей её влияния; голос персонажа; админка и модерация; замена на настоящий токен с лаунчпада.")],
          [t("Open questions", "Открытые вопросы"), t("How the token is used (hold, burn or rent a cell); whether idle cells are released; final daily limits; which messages are public.", "Как используется токен (держать, сжигать или арендовать клетку); освобождаются ли простаивающие клетки; итоговые дневные лимиты; какие сообщения публичны.")],
        ],
      },
    ],
  },
];
