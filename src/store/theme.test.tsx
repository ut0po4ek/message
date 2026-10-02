import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '../components/ThemeToggle'
import { initTheme } from './theme'

function mockSystemTheme(dark: boolean) {
  let onChange: ((event: { matches: boolean }) => void) | undefined
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: dark,
      addEventListener: (_: string, listener: typeof onChange) => (onChange = listener),
    })),
  )

  return (matches: boolean) => act(() => onChange?.({ matches }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
})

describe('theme', () => {
  it('follows the system theme until the user picks one', () => {
    const changeSystemTheme = mockSystemTheme(true)

    initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')

    changeSystemTheme(false)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('prefers the saved choice over the system theme', () => {
    const changeSystemTheme = mockSystemTheme(true)
    localStorage.setItem('green-chat:theme', 'light')

    initTheme()
    changeSystemTheme(true)

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('toggles and remembers the theme', async () => {
    const user = userEvent.setup()
    mockSystemTheme(false)
    initTheme()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Тёмная тема' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('green-chat:theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Светлая тема' })).toBeInTheDocument()
  })
})
