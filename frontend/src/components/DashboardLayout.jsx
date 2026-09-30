import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FaLeaf,
  FaUsers,
  FaStore,
  FaCamera,
  FaSearch,
  FaBell,
  FaChevronDown,
  FaSeedling,
  FaRegCalendarAlt,
  FaThLarge,
  FaSignOutAlt,
  FaCheckCircle,
  FaChartBar,
  FaTimes
} from 'react-icons/fa'

import sidebarPlantImg from '../assets/sidebar_plant_decor.jpg'

const PanelSkeleton = () => <div className="right-panel-skeleton" aria-label="Loading panel content"><span className="skeleton-line short" /><span className="skeleton-line" /><span className="skeleton-card" /><span className="skeleton-line" /><span className="skeleton-card" /></div>

const DashboardLayout = ({ children, className = '', dashboardPath }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [rightPanel, setRightPanel] = useState(null)
  const [rightPanelLoading, setRightPanelLoading] = useState(false)
  const panelTimer = useRef(null)

  useEffect(() => () => { if (panelTimer.current) clearTimeout(panelTimer.current) }, [])

  const openRightPanel = (panel) => {
    if (panelTimer.current) clearTimeout(panelTimer.current)
    setRightPanel(panel)
    setRightPanelLoading(true)
    panelTimer.current = setTimeout(() => {
      setRightPanelLoading(false)
      panelTimer.current = null
    }, 1000)
  }

  const closeRightPanel = () => {
    if (panelTimer.current) clearTimeout(panelTimer.current)
    setRightPanelLoading(false)
    setRightPanel(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  const userName = user?.name || user?.fullName || 'Arsh'
  const userInitial = userName.charAt(0).toUpperCase()
  const basePath = dashboardPath || (location.pathname.startsWith('/dr/dashboard') ? '/dr/dashboard' : '/farm/dashboard')

  const isActive = (path) => location.pathname === path

  return (
    <main className={`dashboard-shell modern-dashboard ${className}`}>
      {/* Top Navigation Bar */}
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <div className="brand-logo" onClick={() => navigate(basePath)}>
            <span className="brand-leaf-icon">
              <FaLeaf />
            </span>
            <span className="brand-title">Plantaexa</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="search-bar-wrap">
            <FaSearch className="search-icon-svg" />
            <input
              type="text"
              placeholder="Search plants, diseases, or solutions..."
              className="top-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="icon-badge-btn" aria-label="Notifications">
            <FaBell />
            <span className="notification-dot" />
          </button>

          <div className="user-profile-menu">
            <button
              className="user-profile-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User profile menu"
            >
              <span className="user-avatar">{userInitial}</span>
              <span className="user-name">{userName}</span>
              <FaChevronDown className="user-chevron" />
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-card">
                <div className="dropdown-user-info">
                  <strong>{userName}</strong>
                  <span>{user?.email || 'user@plantaexa.com'}</span>
                </div>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    setUserMenuOpen(false)
                    handleLogout()
                  }}
                >
                  <FaSignOutAlt /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Left Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div className={`nav-item ${isActive(basePath) ? 'active' : ''}`} onClick={() => navigate(basePath)}>
              <FaThLarge className="nav-icon" />
              <span>Dashboard</span>
            </div>
            <div className={`nav-item ${isActive(`${basePath}/scan`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/scan`)}>
              <FaCamera className="nav-icon" />
              <span>Scan Plant</span>
            </div>
            <div className={`nav-item ${isActive(`${basePath}/crops`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/crops`)}>
              <FaSeedling className="nav-icon" />
              <span>My Plants</span>
            </div>
            <div className={`nav-item ${isActive(`${basePath}/schedule`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/schedule`)}>
              <FaRegCalendarAlt className="nav-icon" />
              <span>Care Schedule</span>
            </div>
            <div className={`nav-item ${isActive(`${basePath}/community`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/community`)}>
              <FaUsers className="nav-icon" />
              <span>Community</span>
            </div>
            <div className={`nav-item ${isActive(`${basePath}/market`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/market`)}>
              <FaStore className="nav-icon" />
              <span>Market</span>
            </div>
          </nav>

          {/* Sidebar Promo Card */}
          <div className="sidebar-promo-card">
            <div className="promo-badge-icon">
              <FaLeaf />
            </div>
            <h3>Healthy Plants<br />Brighter Tomorrows</h3>
            <p>Detect. Treat. Prevent. Grow with AI.</p>
            <div className="promo-leaf-art">
              <img src={sidebarPlantImg} alt="Botanical leaf foliage" />
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main Scrollable Content */}
        <section className="dashboard-main">
          {children}
        </section>

        {rightPanel && <aside className="right-slide-panel" aria-label="Dashboard side panel">
          <header className="right-slide-panel-header"><div><span>{rightPanel === 'schedule' ? 'CARE' : rightPanel === 'completed' ? 'TASKS' : rightPanel === 'analytics' ? 'INSIGHTS' : 'PROFILE'}</span><h2>{rightPanel === 'schedule' ? 'Upcoming care' : rightPanel === 'completed' ? 'Completed tasks' : rightPanel === 'analytics' ? 'Garden insights' : userName}</h2></div><button aria-label="Close side panel" onClick={closeRightPanel}><FaTimes /></button></header>
          {rightPanelLoading ? <PanelSkeleton /> : <>{rightPanel === 'schedule' && <div className="right-slide-panel-content"><button className="panel-primary-action" onClick={() => navigate(`${basePath}/schedule`)}><FaRegCalendarAlt /> Open care schedule</button><article className="panel-task"><span>Today</span><div><strong>Apply fungicide</strong><p>Tomato plant</p></div></article><article className="panel-task"><span>In 7 days</span><div><strong>Re-scan plant</strong><p>Check for improvement</p></div></article></div>}
          {rightPanel === 'completed' && <div className="right-slide-panel-content"><article className="panel-task"><FaCheckCircle /><div><strong>Watered basil</strong><p>Completed yesterday</p></div></article><article className="panel-task"><FaCheckCircle /><div><strong>Checked chili plant</strong><p>Completed 3 days ago</p></div></article><p className="panel-empty-copy">Complete a care task to see it here.</p></div>}
          {rightPanel === 'analytics' && <div className="right-slide-panel-content"><div className="panel-stat"><span>Plant health score</span><strong>78%</strong><div><i style={{ width: '78%' }} /></div></div><div className="panel-stat"><span>Care tasks completed</span><strong>2 / 4</strong><div><i style={{ width: '50%' }} /></div></div><p className="panel-empty-copy">Your tomato plant needs attention. Open its scan result for treatment guidance.</p></div>}
          {rightPanel === 'profile' && <div className="right-slide-panel-content"><div className="panel-profile-avatar">{userInitial}</div><strong className="panel-profile-name">{userName}</strong><p className="panel-profile-email">{user?.email || 'user@plantaexa.com'}</p><button className="panel-primary-action" onClick={() => { setRightPanel(null); setUserMenuOpen(true) }}>Account options</button></div>}</>}
        </aside>}

        <aside className="far-right-toolbar">
          <button className={`right-tool-btn ${rightPanel === 'schedule' ? 'active' : ''}`} title="Care schedule" aria-pressed={rightPanel === 'schedule'} onClick={() => openRightPanel('schedule')}>
            <FaRegCalendarAlt />
          </button>
          <button className={`right-tool-btn ${rightPanel === 'completed' ? 'active' : ''}`} title="Completed tasks" aria-pressed={rightPanel === 'completed'} onClick={() => openRightPanel('completed')}>
            <FaCheckCircle />
          </button>
          <button className={`right-tool-btn ${rightPanel === 'analytics' ? 'active' : ''}`} title="Garden insights" aria-pressed={rightPanel === 'analytics'} onClick={() => openRightPanel('analytics')}>
            <FaChartBar />
          </button>
          <button className={`right-tool-btn ${rightPanel === 'profile' ? 'active' : ''}`} title="Profile" aria-pressed={rightPanel === 'profile'} onClick={() => openRightPanel('profile')}>
            <FaUsers />
          </button>
        </aside>

      </div>
    </main>
  )
}

export default DashboardLayout
