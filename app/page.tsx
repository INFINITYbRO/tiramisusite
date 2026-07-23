import type { Metadata } from "next";
import Image from "next/image";
import { CopyAddress } from "./CopyAddress";

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
          <span className="section-index">02 / ФИЛОСОФИЯ</span>
          <blockquote>
            Не проходи чужой сюжет.
            <br />
            <em>Построй собственный.</em>
          </blockquote>
          <p>
            Никаких ежедневных заданий ради галочки. Мир реагирует на торговлю,
            войны, открытия и амбиции сообществ. Твоя фабрика, город или корабль
            могут стать частью общей хроники.
          </p>
        </div>
        <div className="manifesto-notes">
          <div>
            <strong>01</strong>
            <span>Честная прогрессия без pay-to-win</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Сезонный сюжет меняется от действий игроков</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Командная игра полезна, но не обязательна</span>
          </div>
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
          <CopyAddress address="play.tiramisucraft.ru" />
          <div className="join-meta">
            <span>Minecraft 1.21.1</span>
            <span>NeoForge</span>
            <span>Лицензия не обязательна</span>
          </div>
          <a className="button button--primary button--full" href="#faq">
            Как начать играть <span aria-hidden="true">→</span>
          </a>
          <small>
            Адрес можно будет заменить на реальный перед публикацией.
          </small>
        </div>
      </section>

      <section className="section faq" id="faq">
        <div className="faq-heading">
          <span className="section-index">04 / ПЕРЕД СТАРТОМ</span>
          <h2>Коротко о главном</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>Как установить сборку?</summary>
            <p>
              Перед запуском мы добавим ссылку на готовый архив и отдельную
              инструкцию для популярных лаунчеров.
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
