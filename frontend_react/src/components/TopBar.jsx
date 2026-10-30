import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import ThemeToggle from './ThemeToggle'
import './TopBar.css'

function TopBar({ onToggleSidebar }) {
  const location = useLocation()
  const [isOnline, setIsOnline] = useState(true)

  const routeNameMap = {
    '/': 'Home',
    '/upload': 'Upload',
    '/dashboard': 'Dashboard',
    '/history': 'History',
    '/fix-dataset': 'Fix Dataset'
  }

  const currentPage = routeNameMap[location.pathname] || 'Overview'

  useEffect(() => {
    let mounted = true
    const checkStatus = async () => {
      try {
        const res = await axios.get('http://localhost:8000/', { timeout: 3000 })
        if (mounted) {
          setIsOnline(res.data?.status === 'online' || res.status === 200)
        }
      } catch {
        if (mounted) setIsOnline(false)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button
            className="mobile-sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            type="button"
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>
        )}
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-root">Poison Detector</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current">{currentPage}</span>
        </nav>
      </div>

      <div className="topbar-right">
        <ThemeToggle />
        <div className={`status-pill ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'FastAPI backend running' : 'Connecting to backend...'}>
          <span className="status-dot"></span>
          <span className="status-label">{isOnline ? 'Backend online' : 'Backend offline'}</span>
        </div>
      </div>
    </header>
  )
}

export default TopBar
