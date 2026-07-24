import type { Metadata } from "next";
import Image from "next/image";
import {
  MODPACK_DOWNLOAD_URL,
  SERVER_ADDRESS,
  TELEGRAM_URL,
} from "../lib/site-config";
import { CopyAddress } from "./CopyAddress";
import { ServerStatus } from "./ServerStatus";

export const metadata: Metadata = {
  title: "TiramisuCraft — механика, небо и магия",
  description:
    "Приключенческий Minecraft-сервер с Create Aeronautics, воздушными кораблями, оружием, магией и живой экономикой.",
};

const directions = [
  {
    number: "01",
    tag: "CREATE · AERONAUTICS",
    title: "Строй машины. Поднимай города в небо.",
    text: "Собирай производственные линии, проектируй дирижабли и превращай чертежи в работающие механизмы.",
    image: "/images/aeronautics-workshop.webp",
    className: "direction-card direction-card--large",
  },
  {
    number: "02",
    tag: "CREATE: GUNSMITHG",
    title: "Оружие с характером",
    text: "Собирай механическое оружие на станках, улучшай детали и испытывай инженерный арсенал в экспедициях.",
    image: "/images/gunsmith-workshop.webp",
    className: "direction-card direction-card--arsenal",
  },
  {
    number: "03",
    tag: "ТАЙНЫ МИРА",
    title: "Магия просыпается",
    text: "Изучай школы заклинаний, открывай древние обсерватории и удерживай нестабильные разломы.",
    image: "/images/magic-combat.webp",
    className: "direction-card direction-card--magic",
  },
];

const journey = [
  {
    step: "I",
    title: "Заложи мастерскую",
    text: "Освой Create, автоматизируй ресурсы и собери первую производственную линию.",
  },
  {
    step: "II",
    title: "Собери экипаж",
    text: "Торгуй, объединяйся в города и готовь экспедицию за редкими технологиями.",
  },
  {
    step: "III",
    title: "Подними корабль",
    text: "Построй собственный воздушный флот и отправляйся к островам за границей карт.",
  },
  {
    step: "IV",
    title: "Измени историю",
    text: "Участвуй в мировых событиях: действия игроков определяют следующий сезон.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="Основная навигация">
        <a className="brand" href="#top" aria-label="TiramisuCraft — на главную">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>
            TIRAMISU
            <small>CRAFT</small>
          </span>
        </a>

        <div className="nav-links">
          <a href="#world">Мир</a>
          <a href="#journey">Путь игрока</a>
          <a href="#join">Подключиться</a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
          >
            Telegram
          </a>
          <a href="/account">Кабинет</a>
        </div>

        <a className="nav-cta" href="/account">
          Кабинет <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <section className="hero" id="top">
        <Image
          className="hero-image"
          src="/images/hero-airship.webp"
          alt="Воздушный корабль TiramisuCraft над магическим городом"
          width={1680}
          height={945}
          priority
          quality={95}
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot" />
            Сезон I · сервер открыт
          </div>
          <p className="hero-kicker">МЕХАНИКА · ОРУЖИЕ · МАГИЯ</p>
          <h1>
            Подними свой
            <br />
            мир <em>в небо</em>
          </h1>
          <p className="hero-lead">
            Здесь заводы оживают, дирижабли становятся домом, а за облаками
            начинается история, которую пишут сами игроки.
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href="#join">
              Начать приключение <span aria-hidden="true">→</span>
            </a>
            <a className="button button--ghost" href="#world">
              Исследовать мир
            </a>
          </div>
        </div>

        <div className="hero-stats" aria-label="Основные сведения о сервере">
          <div>
            <strong>1.21.1</strong>
            <span>Версия игры</span>
          </div>
          <div>
            <strong>150+</strong>
            <span>Механизмов</span>
          </div>
          <div>
            <strong>24 / 7</strong>
            <span>Живой мир</span>
          </div>
        </div>

        <a className="scroll-cue" href="#world" aria-label="Прокрутить к миру">
          <span>СМОТРЕТЬ МИР</span>
          <i aria-hidden="true">↓</i>
        </a>
      </section>

      <div className="ticker" aria-label="Особенности сервера">
        <div className="ticker-track">
          <span>CREATE AERONAUTICS</span>
          <i>✦</i>
          <span>ВОЗДУШНЫЕ КОРАБЛИ</span>
          <i>✦</i>
          <span>МАГИЧЕСКИЕ ШКОЛЫ</span>
          <i>✦</i>
          <span>ЖИВАЯ ЭКОНОМИКА</span>
          <i>✦</i>
          <span>CREATE AERONAUTICS</span>
          <i>✦</i>
          <span>ВОЗДУШНЫЕ КОРАБЛИ</span>
        </div>
      </div>

      <section className="section directions" id="world">
        <header className="section-heading">
          <div>
            <span className="section-index">01 / МИР</span>
            <h2>
              Три силы.
              <br />
              <em>Одна история.</em>
            </h2>
          </div>
          <p>
            TiramisuCraft — это не набор модов, а связанный мир, где инженерия,
            сражения и магия постоянно влияют друг на друга.
          </p>
        </header>

        <div className="directions-grid">
          {directions.map((direction) => (
            <article className={direction.className} key={direction.number}>
              {direction.image && (
                <Image
                  src={direction.image}
                  alt=""
                  aria-hidden="true"
                  width={1536}
                  height={1024}
                  quality={95}
                  sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 62vw"
                />
              )}
              <div className="card-overlay" />
              <div className="card-topline">
                <span>{direction.number}</span>
                <span>{direction.tag}</span>
              </div>
              <div className="card-copy">
                <h3>{direction.title}</h3>
                <p>{direction.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-orbit" aria-hidden="true">
          <span>T</span>
        </div>
        <div className="manifesto-copy">
          <span className="section-index">02 / МАГИЧЕСКИЙ ПУТЬ</span>
          <blockquote>
            Открой тайны магии.
            <br />
            <em>Iron&apos;s Spells &apos;n Spellbooks.</em>
          </blockquote>
          <p>
            История TiramisuCraft строится вокруг Iron&apos;s Spells &apos;n
            Spellbooks. Исследуй древние руины и подземелья, сражайся с опасными
            магами, находи свитки и редкие артефакты. Осваивай школы магии и шаг
            за шагом приближайся к тайнам забытого колдовства.
          </p>
        </div>
      </section>

      <section className="section journey" id="journey">
        <header className="section-heading section-heading--compact">
          <div>
            <span className="section-index">03 / ПУТЬ ИГРОКА</span>
            <h2>
              От верстака
              <br />
              <em>до капитанского мостика</em>
            </h2>
          </div>
        </header>

        <div className="journey-list">
          {journey.map((item) => (
            <article key={item.step}>
              <span className="journey-step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="journey-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="join" id="join">
        <div className="join-lines" aria-hidden="true" />
        <div className="join-copy">
          <span className="eyebrow">
            <span className="status-dot" />
            Вход свободный
          </span>
          <h2>
            Небо ждёт
            <br />
            <em>своего капитана</em>
          </h2>
          <p>
            Установи готовую сборку, добавь адрес сервера и начинай строить.
            Для комфортной игры рекомендуем 8 ГБ оперативной памяти.
          </p>
        </div>

        <div className="join-panel">
          <span className="join-label">АДРЕС СЕРВЕРА</span>
          <CopyAddress address={SERVER_ADDRESS} />
          <ServerStatus />
          <div className="join-meta">
            <span>Minecraft 1.21.1</span>
            <span>NeoForge</span>
            <span>Лицензия не обязательна</span>
          </div>
          <div className="join-actions">
            <a
              className="button button--primary button--full"
              href={MODPACK_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
            >
              Скачать сборку <span aria-hidden="true">↓</span>
            </a>
            <div className="join-secondary-actions">
              <a className="button button--outline" href="#install">
                Как установить <span aria-hidden="true">→</span>
              </a>
              <a
                className="button button--telegram"
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
              >
                Telegram <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <small>
            Новости, обновления и ссылка на актуальную сборку публикуются в
            Telegram-канале.
          </small>
        </div>
      </section>

      <section className="section install-guide" id="install">
        <header className="install-heading">
          <div>
            <span className="section-index">04 / УСТАНОВКА</span>
            <h2>
              От архива
              <br />
              <em>до первого входа</em>
            </h2>
          </div>
          <p>
            Сборка рассчитана на Minecraft 1.21.1 и NeoForge 21.1.235.
            Сначала скачай архив с Google Диска, затем выбери свой лаунчер и
            повтори три шага.
          </p>
        </header>

        <div className="install-download">
          <span className="install-download-index">01</span>
          <div>
            <span>Один шаг для всех лаунчеров</span>
            <h3>Скачай и распакуй mods.zip</h3>
            <p>
              Открой Google Диск, нажми «Скачать» и распакуй архив в отдельную
              папку. В лаунчер нужно переносить файлы модов из архива, а не сам
              ZIP.
            </p>
          </div>
          <a
            className="button button--install-download"
            href={MODPACK_DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
          >
            Открыть Google Диск <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="launcher-guide-grid">
          <article className="launcher-guide-card">
            <div className="launcher-guide-media">
              <Image
                src="/images/install/tlauncher-tiramisucraft.webp"
                alt="Создание профиля TiramisuCraft с Minecraft 1.21.1 и NeoForge 21.1.235 в TLauncher"
                width={1459}
                height={1078}
                sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw"
              />
              <span>TLauncher</span>
            </div>
            <div className="launcher-guide-copy">
              <div className="launcher-guide-title">
                <span>Вариант 01</span>
                <h3>TLauncher</h3>
              </div>
              <ol>
                <li>
                  Открой <strong>TL MODS → Создать</strong>. Назови профиль
                  TiramisuCraft, выбери Minecraft 1.21.1, NeoForge и версию
                  загрузчика 21.1.235.
                </li>
                <li>
                  Запусти новый профиль один раз, дождись главного меню и
                  закрой игру. Затем открой папку этого профиля через значок
                  папки в лаунчере.
                </li>
                <li>
                  Открой папку <code>mods</code> и скопируй туда все файлы
                  <code>.jar</code> из распакованного архива. После этого
                  запускай профиль TiramisuCraft.
                </li>
              </ol>
              <a
                className="launcher-guide-source"
                href="https://tlauncher.ru/how-install-neoforge.html"
                target="_blank"
                rel="noreferrer"
              >
                Основа: инструкция TLauncher по NeoForge ↗
              </a>
            </div>
          </article>

          <article className="launcher-guide-card">
            <div className="launcher-guide-media">
              <Image
                src="/images/install/klauncher-tiramisucraft.webp"
                alt="Профиль TiramisuCraft с Minecraft 1.21.1 и NeoForge 21.1.235 в KLauncher"
                width={1538}
                height={1022}
                sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw"
              />
              <span>KLauncher</span>
            </div>
            <div className="launcher-guide-copy">
              <div className="launcher-guide-title">
                <span>Вариант 02</span>
                <h3>KLauncher</h3>
              </div>
              <ol>
                <li>
                  Нажми <strong>«Выбор версии игры»</strong> и создай профиль
                  Minecraft 1.21.1 с загрузчиком NeoForge 21.1.235.
                </li>
                <li>
                  Запусти профиль один раз и закрой Minecraft. На главном
                  экране нажми <strong>«Папка версии»</strong>.
                </li>
                <li>
                  Перейди в <code>mods</code>, перенеси туда все
                  <code>.jar</code> из распакованного mods.zip и нажми
                  «Играть».
                </li>
              </ol>
              <a
                className="launcher-guide-source"
                href="https://klauncher.gg/ru"
                target="_blank"
                rel="noreferrer"
              >
                Интерфейс и поддержка NeoForge: KLauncher ↗
              </a>
            </div>
          </article>

          <article className="launcher-guide-card">
            <div className="launcher-guide-media">
              <Image
                src="/images/install/prism-tiramisucraft.webp"
                alt="Вкладка модов профиля TiramisuCraft с Minecraft 1.21.1 и NeoForge 21.1.235 в Prism Launcher"
                width={1461}
                height={1077}
                sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw"
              />
              <span>Prism Launcher</span>
            </div>
            <div className="launcher-guide-copy">
              <div className="launcher-guide-title">
                <span>Вариант 03</span>
                <h3>Prism Launcher</h3>
              </div>
              <ol>
                <li>
                  Нажми <strong>Add Instance</strong>, создай экземпляр
                  Minecraft 1.21.1 и установи для него NeoForge 21.1.235.
                </li>
                <li>
                  Открой <strong>Edit → Mods → Add file</strong>. Выдели все
                  <code>.jar</code> из распакованного архива — их также можно
                  перетащить прямо в окно Mods.
                </li>
                <li>
                  В настройках Java выдели сборке 6–8 ГБ памяти, если это
                  позволяет компьютер, и запусти экземпляр TiramisuCraft.
                </li>
              </ol>
              <p className="launcher-guide-note">
                Не импортируй mods.zip как готовый Prism‑пак: это архив модов,
                его нужно сначала распаковать.
              </p>
              <a
                className="launcher-guide-source"
                href="https://prismlauncher.org/wiki/help-pages/loader-mods/"
                target="_blank"
                rel="noreferrer"
              >
                Основа: официальная инструкция Prism Launcher ↗
              </a>
            </div>
          </article>
        </div>

        <div className="install-finish">
          <span>Финальный шаг</span>
          <p>
            В Minecraft открой «Сетевая игра», добавь сервер
            <strong>{SERVER_ADDRESS}</strong> и подключайся.
          </p>
          <a href="#join">Вернуться к адресу сервера ↑</a>
        </div>
      </section>

      <section className="section faq" id="faq">
        <div className="faq-heading">
          <span className="section-index">05 / ПЕРЕД СТАРТОМ</span>
          <h2>Коротко о главном</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>Как установить сборку?</summary>
            <p>
              Скачай mods.zip с Google Диска, распакуй его и установи файлы
              модов в профиль Minecraft 1.21.1 с NeoForge 21.1.235.
              <a className="faq-inline-link" href="#install">
                Пошаговая инструкция находится выше.
              </a>
            </p>
          </details>
          <details>
            <summary>Можно играть в одиночку?</summary>
            <p>
              Да. Прогресс не требует клана, но крупные воздушные проекты и
              экспедиции проще проходить вместе.
            </p>
          </details>
          <details>
            <summary>Будут вайпы?</summary>
            <p>
              Только при переходе между крупными сезонами и с переносом
              памятных достижений. Даты всегда объявляются заранее.
            </p>
          </details>
        </div>
      </section>

      <footer>
        <a className="brand brand--footer" href="#top">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>
            TIRAMISU
            <small>CRAFT</small>
          </span>
        </a>
        <p>Мир механизмов, оружия и магии.</p>
        <span>© 2026 TIRAMISUCRAFT</span>
      </footer>
    </main>
  );
}
