"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SkinModel = "default" | "slim";

interface SkinInfo {
  skinUrl: string;
  model: SkinModel;
  updatedAt: number;
  hash: string;
}

interface AccountUser {
  username: string;
  createdAt?: number;
  skin?: SkinInfo | null;
}

interface ApiError {
  error?: string;
  message?: string;
}

const translatedErrors: Record<string, string> = {
  "Public registration is disabled":
    "Регистрация временно закрыта. Получите аккаунт у администрации сервера.",
  "An account with this username already exists":
    "Аккаунт с таким Minecraft-ником уже существует.",
  "Invalid username or password": "Неверный ник или пароль.",
  "Invalid username or password format": "Проверьте формат ника и пароля.",
  "Authentication required": "Сессия закончилась. Войдите снова.",
  "Invalid CSRF token": "Сессия безопасности устарела. Повторите действие.",
  "Request origin is not allowed": "Этот адрес сайта не разрешён сервером скинов.",
  "A trusted Origin header is required": "Сервер не смог проверить адрес сайта.",
};

const apiBase = (
  process.env.NEXT_PUBLIC_SKINS_API_URL ?? "http://127.0.0.1:3001"
).replace(/\/+$/, "");

function errorText(value: unknown): string {
  if (value && typeof value === "object") {
    const error = value as ApiError;
    if (typeof error.error === "string") {
      return translatedErrors[error.error] ?? error.error;
    }
    if (typeof error.message === "string") {
      return translatedErrors[error.message] ?? error.message;
    }
  }
  return "Сервис временно недоступен. Попробуйте ещё раз.";
}

async function parseResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(errorText(body));
  }
  return body;
}

export function AccountPortal() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [model, setModel] = useState<SkinModel>("default");
  const [skinFile, setSkinFile] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const previewUrl = useMemo(
    () => (skinFile ? URL.createObjectURL(skinFile) : ""),
    [skinFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const request = useCallback(
    async (
      path: string,
      init: RequestInit = {},
      needsCsrf = false,
    ): Promise<Record<string, unknown>> => {
      const headers = new Headers(init.headers);
      if (needsCsrf) {
        const csrfResponse = await fetch(`${apiBase}/api/auth/csrf`, {
          credentials: "include",
          cache: "no-store",
        });
        const csrfBody = await parseResponse(csrfResponse);
        const token =
          typeof csrfBody.csrfToken === "string" ? csrfBody.csrfToken : "";
        if (!token) {
          throw new Error("Не удалось подтвердить безопасную сессию");
        }
        headers.set("x-csrf-token", token);
      }

      const response = await fetch(`${apiBase}${path}`, {
        ...init,
        headers,
        credentials: "include",
        cache: "no-store",
      });
      return parseResponse(response);
    },
    [],
  );

  const refreshAccount = useCallback(async () => {
    try {
      const body = await request("/api/auth/me");
      const nextUser = (body.user ?? body) as unknown as AccountUser;
      if (!nextUser.username) {
        setUser(null);
        return;
      }

      try {
        const skin = (await request(
          `/api/skins/${encodeURIComponent(nextUser.username)}`,
        )) as unknown as SkinInfo;
        setUser({ ...nextUser, skin });
      } catch {
        setUser({ ...nextUser, skin: null });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    // Loading an external authenticated session is the synchronization this effect owns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshAccount();
  }, [refreshAccount]);

  async function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await request(
        `/api/auth/${mode}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
        true,
      );
      setPassword("");
      setNotice(mode === "register" ? "Аккаунт создан" : "Вход выполнен");
      await refreshAccount();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : errorText(requestError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    setSubmitting(true);
    setError("");
    try {
      await request("/api/auth/logout", { method: "POST" }, true);
      setUser(null);
      setNotice("Вы вышли из аккаунта");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : errorText(requestError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadSkin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!skinFile) {
      setError("Выберите PNG-файл");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("skin", skinFile);
      form.set("model", model);
      await request(
        "/api/account/skin",
        {
          method: "POST",
          body: form,
        },
        true,
      );
      setSkinFile(null);
      setNotice("Скин сохранён. В игре используйте /skin reload");
      await refreshAccount();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : errorText(requestError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="account-panel account-panel--loading" aria-live="polite">
        <span className="account-loader" />
        <p>Проверяем сессию…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="account-panel">
        <div className="account-tabs" aria-label="Вход или регистрация">
          <button
            className={mode === "login" ? "is-active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
            type="button"
          >
            Вход
          </button>
          <button
            className={mode === "register" ? "is-active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
            type="button"
          >
            Регистрация
          </button>
        </div>

        <div className="account-panel-heading">
          <span>{mode === "login" ? "С возвращением" : "Новый пилот"}</span>
          <h2>{mode === "login" ? "Войти в кабинет" : "Создать аккаунт"}</h2>
          <p>
            Ник должен полностью совпадать с ником, который используется на сервере.
          </p>
        </div>

        <form className="account-form" onSubmit={submitCredentials}>
          <label>
            Minecraft-ник
            <input
              autoComplete="username"
              maxLength={16}
              minLength={3}
              onChange={(event) => setUsername(event.target.value)}
              pattern="[A-Za-z0-9_]{3,16}"
              placeholder="Player123"
              required
              spellCheck={false}
              value={username}
            />
          </label>
          <label>
            Пароль
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={10}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Минимум 10 символов"
              required
              type="password"
              value={password}
            />
          </label>

          {error && <p className="form-message form-message--error">{error}</p>}
          {notice && <p className="form-message form-message--ok">{notice}</p>}

          <button className="button button--primary button--full" disabled={submitting}>
            {submitting
              ? "Подождите…"
              : mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>
        </form>
      </section>
    );
  }

  const activeSkin = user.skin;
  const skinSource = previewUrl || activeSkin?.skinUrl || "";

  return (
    <section className="account-panel account-panel--dashboard">
      <header className="profile-header">
        <div className="profile-avatar" aria-hidden="true">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <span>Игровой профиль</span>
          <h2>{user.username}</h2>
        </div>
        <button disabled={submitting} onClick={logout} type="button">
          Выйти
        </button>
      </header>

      <form className="skin-editor" onSubmit={uploadSkin}>
        <div className="skin-preview">
          {skinSource ? (
            // The source can be an object URL or the separately deployed skin API.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`Скин ${user.username}`} src={skinSource} />
          ) : (
            <div className="skin-empty">
              <strong>Нет скина</strong>
              <span>Загрузите первый PNG</span>
            </div>
          )}
          <span className="skin-preview-label">
            {previewUrl ? "Новый файл" : activeSkin ? "Текущий скин" : "Пусто"}
          </span>
        </div>

        <div className="skin-controls">
          <div className="skin-heading">
            <span>Редактор образа</span>
            <h3>Сменить скин</h3>
            <p>PNG 64×64 или 64×32, не больше 1 МБ.</p>
          </div>

          <label className="file-picker">
            <input
              accept="image/png,.png"
              onChange={(event) => setSkinFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span>{skinFile ? skinFile.name : "Выбрать PNG"}</span>
            <strong>ОБЗОР ↗</strong>
          </label>

          <fieldset className="model-picker">
            <legend>Модель рук</legend>
            <label className={model === "default" ? "is-active" : ""}>
              <input
                checked={model === "default"}
                name="model"
                onChange={() => setModel("default")}
                type="radio"
              />
              <strong>Steve</strong>
              <span>Обычные руки</span>
            </label>
            <label className={model === "slim" ? "is-active" : ""}>
              <input
                checked={model === "slim"}
                name="model"
                onChange={() => setModel("slim")}
                type="radio"
              />
              <strong>Alex</strong>
              <span>Тонкие руки</span>
            </label>
          </fieldset>

          {error && <p className="form-message form-message--error">{error}</p>}
          {notice && <p className="form-message form-message--ok">{notice}</p>}

          <button
            className="button button--primary button--full"
            disabled={submitting || !skinFile}
          >
            {submitting ? "Сохраняем…" : "Установить скин"}
          </button>
        </div>
      </form>

      <p className="skin-refresh-note">
        После загрузки введите в игре <code>/skin reload</code>. Остальные игроки
        увидят обновление через TiramisuSkins.
      </p>
    </section>
  );
}
