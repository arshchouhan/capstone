import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DashboardPageSkeleton from './DashboardPageSkeleton'
import { useAuth } from '../context/AuthContext'
import useApiData from '../hooks/useApiData'
import { api } from '../services/api'
import EmptyState from './EmptyState'
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
  FaSignOutAlt,
  FaCheckCircle,
  FaChartBar,
  FaTimes,
  FaRobot
} from 'react-icons/fa'


const PanelSkeleton = () => <div className="right-panel-skeleton" aria-label="Loading panel content"><span className="skeleton-line short" /><span className="skeleton-line" /><span className="skeleton-card" /><span className="skeleton-line" /><span className="skeleton-card" /></div>

const DashboardLayout = ({ children, className = '', dashboardPath }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [pageLoading, setPageLoading] = useState(true)
  useEffect(() => {
    setPageLoading(true)
    const transitionTimer = setTimeout(() => setPageLoading(false), 550)
    return () => clearTimeout(transitionTimer)
  }, [location.pathname])
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [rightPanel, setRightPanel] = useState(null)
  const {data: overview} = useApiData('/dashboard', {plants:[],tasks:[],recentScans:[]})
  const {data: notifications,reload:reloadNotifications} = useApiData('/notifications')
  const completedTasks = overview.tasks.filter(task=>task.lastCompleted)
  const markRead = async notification => {try {await api(`/notifications/${notification.id}/read`,{method:'PUT'});await reloadNotifications()}catch{/* Retry on next open. */}}
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

  const isDoctorPortal = basePath === '/dr/dashboard'
  const isActive = (path) => location.pathname === path

  return (
    <main className={`dashboard-shell modern-dashboard ${className}`}>
      {/* Top Navigation Bar */}
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <button type="button" className="brand-logo" aria-label="Open dashboard" onClick={() => navigate(basePath)}>
            <span className="brand-leaf-icon">
              <FaLeaf />
            </span>
            <span className="brand-title">Plantaexa</span>
          </button>
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
            {notifications.some(notification=>!notification.readAt) && <span className="notification-dot" />}
          </button>
          <button type="button" className="topbar-ai-button" onClick={()=>openRightPanel('ai')}><FaRobot /><span>Your AI</span></button>

        </div>
      </header>

      <div className="dashboard-body">
        {/* Left Sidebar */}
        <aside id="dashboard-sidebar" className="dashboard-sidebar">
          {!isDoctorPortal && <button type="button" className={`sidebar-scan-action ${isActive(`${basePath}/scan`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/scan`)}><FaCamera /><span>Scan Plant</span></button>}
          <nav className="sidebar-nav">{isDoctorPortal ? <><button type="button" className={`nav-item ${isActive(`${basePath}/connections`) ? 'active' : ''}`} onClick={()=>navigate(`${basePath}/connections`)}><FaUsers className="nav-icon"/><span>My Connections</span></button><button type="button" className={`nav-item ${location.pathname.startsWith(`${basePath}/community`) ? 'active' : ''}`} onClick={()=>navigate(`${basePath}/community`)}><FaUsers className="nav-icon"/><span>Community</span></button></> : <>
            <div className={`nav-item ${isActive(`${basePath}/crops`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/crops`)}>
              <FaSeedling className="nav-icon" />
              <span>My Plants</span>
            </div>



            <div className={`nav-item ${isActive(`${basePath}/schedule`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/schedule`)}>
              <FaRegCalendarAlt className="nav-icon" />
              <span>Experts</span>
            </div>
            <div className={`nav-item ${isActive(`${basePath}/community`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/community`)}>
              <FaUsers className="nav-icon" />
              <span>Community</span>
            </div>
            <div className={`nav-item ${isActive(`${basePath}/market`) ? 'active' : ''}`} onClick={() => navigate(`${basePath}/market`)}>
              <FaStore className="nav-icon" />
              <span>Market</span>
            </div>
          </>}</nav>
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
        </aside>

        {/* Main Scrollable Content */}
        <section className="dashboard-main">
          {pageLoading ? <DashboardPageSkeleton path={location.pathname} /> : children}
        </section>

        {rightPanel === 'ai' && <aside className="right-slide-panel" aria-label="Your AI"><header className="right-slide-panel-header"><h2>Your AI</h2><button aria-label="Close AI panel" onClick={closeRightPanel}><FaTimes /></button></header><div className="right-slide-panel-content"><p>{isDoctorPortal?'Review the plant concerns shared by your growers.':'Choose a plant to review its latest analysis and care recommendations.'}</p><button type="button" className="panel-primary-action" onClick={()=>{closeRightPanel();navigate(isDoctorPortal?'/dr/dashboard/connections':'/farm/dashboard/crops')}}>{isDoctorPortal?'View your connections':'View my plants'}</button></div></aside>}
        {rightPanel && rightPanel !== 'ai' && <aside className="right-slide-panel" aria-label="Dashboard side panel">
          <header className="right-slide-panel-header"><div><span>{rightPanel === 'schedule' ? 'CARE' : rightPanel === 'completed' ? 'TASKS' : rightPanel === 'analytics' ? 'INSIGHTS' : 'PROFILE'}</span><h2>{rightPanel === 'schedule' ? 'Upcoming care' : rightPanel === 'completed' ? 'Completed tasks' : rightPanel === 'analytics' ? 'Garden insights' : userName}</h2></div><button aria-label="Close side panel" onClick={closeRightPanel}><FaTimes /></button></header>
          {rightPanelLoading ? <PanelSkeleton /> : <>{rightPanel === 'schedule' && <div className="right-slide-panel-content">{overview.tasks.map(task=><article key={task.id} className="panel-task"><span>{new Date(task.due).toLocaleDateString()}</span><div><strong>{task.type}</strong><p>{task.plant?.name}</p></div></article>)}{!overview.tasks.length && <EmptyState kind="care" title="No tasks scheduled" description="Add care tasks from a plant’s Care tab." />}{notifications.map(notification=><article key={notification.id} className="panel-task" onClick={()=>markRead(notification)}><FaBell /><div><strong>{notification.title}</strong><p>{notification.body}</p>{!notification.readAt && <button onClick={()=>markRead(notification)}>Mark read</button>}</div></article>)}</div>}
          {rightPanel === 'completed' && <div className="right-slide-panel-content">{completedTasks.map(task=><article key={task.id} className="panel-task"><FaCheckCircle /><div><strong>{task.type} · {task.plant?.name}</strong><p>{new Date(task.lastCompleted).toLocaleDateString()}</p></div></article>)}{!completedTasks.length && <EmptyState kind="care" title="No completed tasks yet" description="Completed care tasks appear here." />}</div>}
          {rightPanel === 'analytics' && <div className="right-slide-panel-content"><div className="panel-stat"><span>Plants in your garden</span><strong>{overview.plants.length}</strong></div><div className="panel-stat"><span>Plants needing care</span><strong>{overview.plants.filter(plant=>['Needs Care','At Risk'].includes(plant.status)).length}</strong></div><div className="panel-stat"><span>Recently completed scans</span><strong>{overview.recentScans.length}</strong></div><div className="panel-stat"><span>Care tasks completed</span><strong>{completedTasks.length} / {overview.tasks.length}</strong></div></div>}
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
