import { createSignal } from 'solid-js'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'kz-theme'

const [theme, setThemeSignal] = createSignal<Theme>(readStored())

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

function prefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

/** Resolves 'system' to the concrete theme currently in effect. */
export function resolvedTheme(): 'light' | 'dark' {
  const t = theme()
  return t === 'system' ? (prefersDark() ? 'dark' : 'light') : t
}

function apply() {
  const root = document.documentElement
  root.classList.toggle('dark', resolvedTheme() === 'dark')
  root.style.colorScheme = resolvedTheme()
}

export function setTheme(next: Theme) {
  setThemeSignal(next)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* storage unavailable */
  }
  apply()
}

export function toggleTheme() {
  setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark')
}

/** Call once at app start. Applies the stored theme and tracks OS changes while on 'system'. */
export function initTheme() {
  apply()
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme() === 'system') apply()
  })
}

export { theme }
