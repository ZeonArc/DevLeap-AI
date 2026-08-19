"use client";

import { useCallback, useSyncExternalStore } from "react";

export const THEMES = [
  { id: "carbon",    label: "Carbon",    hint: "cool graphite",  swatch: "#f2b43a", base: "#0d1117" },
  { id: "blueprint", label: "Blueprint", hint: "drafting navy",  swatch: "#4cc4f0", base: "#071320" },
  { id: "ember",     label: "Ember",     hint: "warm dark",      swatch: "#ff5c39", base: "#121010" },
  { id: "paper",     label: "Paper",     hint: "daylight",       swatch: "#3448d8", base: "#f4f6f9" },
] as const;

export type Theme = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: Theme = "carbon";
export const STORAGE_KEY = "devleap-theme";
const CHANGE_EVENT = "devleap:themechange";

function isTheme(value: string | null): value is Theme {
  return THEMES.some((t) => t.id === value);
}

/**
 * The <html data-theme> attribute is the single source of truth. It is set by
 * the inline boot script before first paint, so there is never a flash of the
 * wrong theme, and React reads from it rather than owning a duplicate copy.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  const current = document.documentElement.getAttribute("data-theme");
  return isTheme(current) ? current : DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage — the theme still applies for
      // this session, it just will not be remembered.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { theme, setTheme };
}

/**
 * Runs before first paint to avoid a flash of the default theme. Kept as a
 * string because it must execute inline, ahead of the React bundle.
 */
export const THEME_BOOT_SCRIPT = `(function(){
var d=document.documentElement;
var fallback=${JSON.stringify(DEFAULT_THEME)};
try{
var allowed=${JSON.stringify(THEMES.map((t) => t.id))};
var t=null;
// ?theme= previews a theme for this visit only, without overwriting the
// visitor's saved choice.
var m=location.search.match(/[?&]theme=([^&]*)/);
if(m){t=decodeURIComponent(m[1]);}
if(allowed.indexOf(t)===-1){t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});}
if(allowed.indexOf(t)===-1){
  t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'paper':fallback;
}
d.setAttribute('data-theme',t);
}catch(e){d.setAttribute('data-theme',fallback);}})();`;
