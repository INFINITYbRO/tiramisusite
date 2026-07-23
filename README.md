# TiramisuCraft website

Одностраничный сайт игрового сервера TiramisuCraft: Create Aeronautics,
воздушные корабли, оружие, магия и сезонный сюжет.

## Локальный запуск

Нужен Node.js 22.13 или новее.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Откройте `http://127.0.0.1:3000`. Личный кабинет находится по адресу
`http://127.0.0.1:3000/account`.

Кабинет и API TiramisuSkins входят в этот же Next.js-проект. Для их работы
скопируйте `.env.example` в `.env.local` и укажите тестовую Neon-базу,
локальный Vercel Blob token и `PUBLIC_BASE_URL=http://127.0.0.1:3000`.
На самом Vercel Blob авторизуется автоматически через OIDC.

Публичная регистрация управляется переменной `REGISTRATION_ENABLED`. На
offline-mode сервере ник нельзя криптографически подтвердить, поэтому перед
открытием регистрации продумайте подтверждение владения ником или выдавайте
аккаунты администрацией.

## Проверка

```bash
npm test
npx next build
```

Первая команда проверяет сборку и серверный HTML. Вторая повторяет сборку,
которую будет выполнять Vercel.

## Что изменить перед публикацией

- Адрес `play.tiramisucraft.ru` находится в `app/page.tsx`.
- Основной домен `https://tiramisucraft.ru` находится в `app/layout.tsx`.
- Тексты и секции находятся в `app/page.tsx`.
- Оформление находится в `app/globals.css`.
- Изображения находятся в `public/images/`.
- API кабинета использует тот же домен, что и сайт; публичной переменной с
  отдельным backend URL больше нет.

## GitHub

```bash
git init
git add .
git commit -m "Initial TiramisuCraft website"
git branch -M main
git remote add origin https://github.com/USERNAME/tiramisucraft.git
git push -u origin main
```

Репозиторий на GitHub нужно создать заранее. Замените `USERNAME` на имя
аккаунта.

## Vercel

1. В Vercel выберите **Add New → Project**.
2. Импортируйте репозиторий GitHub.
3. Оставьте Framework Preset: **Next.js**.
4. Build Command уже задан в `vercel.json`.
5. В разделе **Storage** подключите Neon Postgres к проекту. Интеграция должна
   добавить `DATABASE_URL`.
6. Там же создайте публичный Vercel Blob store и подключите его к проекту.
   Для нового OIDC-подключения появятся `BLOB_STORE_ID` и
   `BLOB_WEBHOOK_PUBLIC_KEY`; `BLOB_READ_WRITE_TOKEN` не требуется.
7. В **Settings → Environment Variables** добавьте:
   `PUBLIC_BASE_URL=https://ваш-домен`, `REGISTRATION_ENABLED=true` и, если
   нужен административный API, случайный `ADMIN_API_KEY`.
8. Выполните новый production deploy.

Схема Neon создаётся API автоматически при первом обращении. Аккаунты, сессии,
лимиты и метаданные скинов хранятся в Postgres, а PNG — в Vercel Blob.
Файловая система Vercel Functions не используется. Для локального запуска
вне Vercel всё ещё можно указать `BLOB_READ_WRITE_TOKEN`.

Публичный контракт для мода:

- `GET /api/skins/{username}` — метаданные и SHA-256;
- `GET /skins/{username}.png` — PNG через стабильный домен сайта.

В `tiramisu_skins-server.toml` и `tiramisu_skins-client.toml` укажите этот
production-домен в `apiUrl`, `directSkinUrl` и `allowedHosts`.

## Изображения

Иллюстрации созданы специально для TiramisuCraft и сохранены непосредственно
в проекте:

- `public/images/hero-airship.webp`;
- `public/images/aeronautics-workshop.webp`;
- `public/images/gunsmith-workshop.webp`;
- `public/images/magic-combat.webp`;
- `public/og.jpg` для превью ссылки.
