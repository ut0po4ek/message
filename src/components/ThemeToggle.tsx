import { setTheme, useTheme } from '../store/theme'
import { MoonIcon, SunIcon } from './icons'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'dark' ? 'Тёмная тема' : 'Светлая тема'

  return (
    <button type="button" className={className} onClick={() => setTheme(next)} title={label}>
      {next === 'dark' ? <MoonIcon size={22} /> : <SunIcon size={22} />}
      <span className="visually-hidden">{label}</span>
    </button>
  )
}
