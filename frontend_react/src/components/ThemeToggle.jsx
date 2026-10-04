import { useTheme } from '../context/ThemeContext'
import './ThemeToggle.css'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="toggle-icon">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}

export default ThemeToggle
