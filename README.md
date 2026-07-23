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

Для регистрации, входа и смены скина одновременно запустите API:

```bash
cd ..\TiramisuSkins\backend
npm install
copy .env.example .env
npm run dev
```

Для локальной разработки в `backend/.env` установите
`SESSION_COOKIE_SECURE=false`. Публичная регистрация по умолчанию отключена:
включайте `REGISTRATION_ENABLED=true` только после выбора способа подтверждения
владения Minecraft-ником.

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
- Адрес TiramisuSkins API находится в `.env.local`:
  `NEXT_PUBLIC_SKINS_API_URL=http://127.0.0.1:3001`.

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
5. Добавьте переменную
   `NEXT_PUBLIC_SKINS_API_URL=https://skins.tiramisucraft.ru`.
6. Нажмите **Deploy**.

Сам сайт не хранит секреты. Backend TiramisuSkins необходимо размещать
отдельно на VPS/Docker с постоянным volume: файловое хранилище PNG нельзя
размещать в эфемерной файловой системе Vercel.

## Изображения

Иллюстрации созданы специально для TiramisuCraft и сохранены непосредственно
в проекте:

- `public/images/hero-airship.webp`;
- `public/images/aeronautics-workshop.webp`;
- `public/images/gunsmith-workshop.webp`;
- `public/images/magic-combat.webp`;
- `public/og.jpg` для превью ссылки.
