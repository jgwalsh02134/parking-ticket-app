// Client-only, best-effort session persistence for the in-progress appeal.
//
// IMPORTANT: this app can run inside a cross-origin sandbox iframe where
// localStorage access throws (see client/src/main.tsx). Every call here is
// wrapped so a blocked/unavailable store simply no-ops — the feature degrades
// to "no resume" rather than crashing the app. Nothing is ever sent to a
// server; the saved object lives only in the visitor's own browser.

const KEY = "albany-appeal-state";
// Bump VERSION whenever the shape below changes incompatibly; older blobs are
// then ignored on load instead of being merged into a mismatched schema.
const VERSION = 1;

export type PersistedState = {
  v: number;
  step: number;
  sit: string | null;
  f: unknown;
  foil: unknown;
  fap: unknown;
  // Optional (added after v1; older blobs simply lack them and default cleanly).
  scanValues?: Record<string, string>;
  scanSourced?: boolean;
};

export function storageAvailable(): boolean {
  try {
    const k = "__albany_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function loadState(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.v !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(s: Omit<PersistedState, "v">): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...s }));
  } catch {
    /* storage blocked or full — no-op */
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}
