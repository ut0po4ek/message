import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

/** Ключ продублирован в index.html: там тема ставится до загрузки React */
const THEME_KEY = 'green-chat:theme'

const listeners = new Set<() => void>()

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY)

    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemQuery(): MediaQueryList | undefined {
  return window.matchMedia?.('(prefers-color-scheme: dark)')
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  listeners.forEach((listener) => listener())
}

/** Ставит тему при старте и, пока пользователь не выбрал её сам, следует за системной */
export function initTheme(): void {
  const query = systemQuery()
  applyTheme(savedTheme() ?? (query?.matches ? 'dark' : 'light'))
  query?.addEventListener('change', (event) => {
    if (!savedTheme()) applyTheme(event.matches ? 'dark' : 'light')
  })
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // без storage тема продержится до перезагрузки
  }
  applyTheme(theme)
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme)
}
