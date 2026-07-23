import type { Metadata } from "next";
import Link from "next/link";
import { AccountPortal } from "./AccountPortal";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description:
    "Личный кабинет TiramisuCraft: вход, регистрация и смена игрового скина через TiramisuSkins.",
};

export default function AccountPage() {
  return (
    <main className="account-page">
      <nav className="nav nav--solid" aria-label="Навигация личного кабинета">
        <Link className="brand" href="/" aria-label="TiramisuCraft — на главную">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>
            TIRAMISU
            <small>CRAFT</small>
          </span>
        </Link>

        <div className="nav-links">
          <Link href="/#world">Мир</Link>
          <Link href="/#journey">Путь игрока</Link>
          <Link href="/#join">Подключиться</Link>
        </div>

        <Link className="nav-cta" href="/">
          На главную <span aria-hidden="true">↗</span>
        </Link>
      </nav>

      <div className="account-atmosphere" aria-hidden="true" />
      <div className="account-grid" aria-hidden="true" />

      <section className="account-layout">
        <div className="account-intro">
          <span className="section-index">TIRAMISU ID / 01</span>
          <p className="account-kicker">ОДИН НИК · ОДИН ОБРАЗ</p>
          <h1>
            Твой профиль.
            <br />
            <em>Твой скин.</em>
          </h1>
          <p>
            Аккаунт привязан к Minecraft-нику. Загруженный здесь скин автоматически
            увидят все игроки, у которых установлен TiramisuSkins.
          </p>
          <ul className="account-features">
            <li>
              <span>01</span>
              PNG 64×64 или классический 64×32
            </li>
            <li>
              <span>02</span>
              Модели Steve и Alex
            </li>
            <li>
              <span>03</span>
              Обновление без переустановки сборки
            </li>
          </ul>
        </div>

        <AccountPortal />
      </section>

      <footer className="account-footer">
        <p>© 2026 TiramisuCraft</p>
        <span>TiramisuSkins account service</span>
      </footer>
    </main>
  );
}
