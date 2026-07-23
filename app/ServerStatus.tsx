"use client";

import { useEffect, useState } from "react";

type StatusState = {
  status: "loading" | "online" | "offline" | "unknown";
  playersOnline: number | null;
  playersMax: number | null;
};

const initialState: StatusState = {
  status: "loading",
  playersOnline: null,
  playersMax: null,
};

function statusText(status: StatusState["status"]): string {
  if (status === "online") return "Сервер онлайн";
  if (status === "offline") return "Сервер офлайн";
  if (status === "unknown") return "Статус недоступен";
  return "Проверяем сервер";
}

function playersText(state: StatusState): string {
  if (state.status === "online") {
    return `${state.playersOnline ?? 0} / ${state.playersMax ?? "—"} игроков`;
  }
  if (state.status === "offline") return "0 игроков";
  return "нет данных";
}

export function ServerStatus() {
  const [state, setState] = useState<StatusState>(initialState);

  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;

    async function updateStatus() {
      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch("/api/server-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Status request failed");

        const data = (await response.json()) as Omit<StatusState, "status"> & {
          status: "online" | "offline" | "unknown";
        };
        if (active) setState(data);
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) {
          setState({
            status: "unknown",
            playersOnline: null,
            playersMax: null,
          });
        }
      }
    }

    void updateStatus();
    const interval = window.setInterval(updateStatus, 30_000);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`server-status server-status--${state.status}`}
      aria-live="polite"
    >
      <span className="server-status-state">
        <i aria-hidden="true" />
        {statusText(state.status)}
      </span>
      <strong>{playersText(state)}</strong>
    </div>
  );
}

