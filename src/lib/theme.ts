import { createSignal } from 'solid-js'
import { getCookieDomain } from './cookieSession'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_COOKIE_NAME = 'kariyer_theme'
export const THEME_STORAGE_KEY = 'kariyer-theme-storage'
export const LEGACY_STORAGE_KEY = 'kz-theme'

function readCookieTheme(): 'light' | 'dark' | null {
  try {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + THEME_COOKIE_NAME + '=([^;]*)'))
    const val = match ? decodeURIComponent(match[1]) : null
    return val === 'dark' || val === 'light' ? val : null
  } catch {
    return null
  }
}

function writeCookieTheme(t: 'light' | 'dark'): void {
  try {
    const domain = getCookieDomain()
    const domainAttr = domain ? `; domain=${domain}` : ''
    const secureAttr = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${THEME_COOKIE_NAME}=${t}${domainAttr}; path=/; max-age=31536000; SameSite=Lax${secureAttr}`
  } catch {
    /* ignore */
  }
}

function readStored(): Theme {
  try {
    const cookieTheme = readCookieTheme()
    if (cookieTheme) return cookieTheme

    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)?.state?.theme
      if (parsed === 'dark' || parsed === 'light') return parsed
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === 'light' || legacy === 'dark' || legacy === 'system') return legacy
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

const [theme, setThemeSignal] = createSignal<Theme>(readStored())

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
  const resolved = resolvedTheme()
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

export function setTheme(next: Theme) {
  setThemeSignal(next)
  try {
    const concrete = next === 'system' ? (prefersDark() ? 'dark' : 'light') : next
    writeCookieTheme(concrete)
    localStorage.setItem(LEGACY_STORAGE_KEY, next)
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ state: { theme: concrete }, version: 0 }))
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
    if (theme() === 'system') {
      apply()
      writeCookieTheme(prefersDark() ? 'dark' : 'light')
    }
  })
}

export { theme }
