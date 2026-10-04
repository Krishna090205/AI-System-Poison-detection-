import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home', description: 'Overview' },
    { path: '/upload', icon: '📤', label: 'Upload', description: 'Add Dataset' },
    { path: '/dashboard', icon: '📊', label: 'Dashboard', description: 'Analysis' },
    { path: '/history', icon: '📋', label: 'History', description: 'Past Analyses' },
    { path: '/fix-dataset', icon: '🔧', label: 'Fix Dataset', description: 'Clean Data' }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <div className="logo-icon">🛡️</div>
            <div className="logo-content">
              <div className="logo-title">Poison Detector</div>
              <div className="logo-subtitle">AI Detection</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            {navItems.slice(0, 2).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
                {isActive(item.path) && <div className="nav-indicator"></div>}
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Analysis</div>
            {navItems.slice(2).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
                {isActive(item.path) && <div className="nav-indicator"></div>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="footer-card">
            <div className="footer-icon">⚡</div>
            <div className="footer-content">
              <div className="footer-title">Pro Tip</div>
              <div className="footer-text">Use keyboard shortcuts for faster navigation</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
