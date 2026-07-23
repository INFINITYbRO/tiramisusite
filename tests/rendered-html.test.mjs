import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const output =
    pathname === "/"
      ? new URL("../.next/server/app/index.html", import.meta.url)
      : new URL(`../.next/server/app${pathname}.html`, import.meta.url);
  const html = await readFile(output, "utf8");
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status: 200,
  });
}

test("server-renders the finished TiramisuCraft landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /TiramisuCraft/);
  assert.match(html, /Подними свой/);
  assert.match(html, /play\.tiramisucraft\.ru/);
  assert.match(html, /Create Aeronautics/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("server-renders the account portal route", async () => {
  const response = await render("/account");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Личный кабинет|Твой профиль/);
  assert.match(html, /TiramisuSkins/);
  assert.match(html, /Steve/);
  assert.match(html, /Alex/);
});

test("keeps deployment metadata and all generated artwork", async () => {
  const [layout, page, vercel] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /openGraph/);
  assert.match(layout, /\/og\.jpg/);
  assert.match(page, /hero-airship\.webp/);
  assert.match(page, /aeronautics-workshop\.webp/);
  assert.match(page, /gunsmith-workshop\.webp/);
  assert.match(page, /magic-combat\.webp/);
  assert.match(vercel, /"framework": "nextjs"/);

  await Promise.all([
    access(new URL("../public/og.jpg", import.meta.url)),
    access(new URL("../public/images/hero-airship.webp", import.meta.url)),
    access(new URL("../public/images/aeronautics-workshop.webp", import.meta.url)),
    access(new URL("../public/images/gunsmith-workshop.webp", import.meta.url)),
    access(new URL("../public/images/magic-combat.webp", import.meta.url)),
  ]);
});

test("account client uses the authenticated TiramisuSkins API contract", async () => {
  const [portal, environment] = await Promise.all([
    readFile(new URL("../app/account/AccountPortal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(portal, /\/api\/auth\/csrf/);
  assert.match(portal, /\/api\/auth\/me/);
  assert.match(portal, /\/api\/auth\/\$\{mode\}/);
  assert.match(portal, /\/api\/auth\/logout/);
  assert.match(portal, /\/api\/account\/skin/);
  assert.match(portal, /credentials:\s*"include"/);
  assert.match(environment, /DATABASE_URL=/);
  assert.match(environment, /BLOB_READ_WRITE_TOKEN=/);
  assert.doesNotMatch(environment, /NEXT_PUBLIC_SKINS_API_URL=/);
});

test("does not retain the disposable starter preview", async () => {
  await assert.rejects(access(new URL("app/_sites-preview", root)));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
