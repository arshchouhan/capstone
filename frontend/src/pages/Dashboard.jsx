import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand-mini">
          <div className="brand-icon" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item">
            <span className="nav-mark">›</span>
            <span>Dummy</span>
          </div>
          <div className="nav-item">
            <span className="nav-mark">›</span>
            <span>Dummy</span>
          </div>
          <div className="nav-item">
            <span className="nav-mark">›</span>
            <span>Dummy</span>
          </div>
          <div className="nav-item">
            <span className="nav-mark">›</span>
            <span>Dummy</span>
          </div>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <span>Farm:</span>
          </div>

          <div className="top-actions">
            <button className="top-action">Dummy</button>
            <button className="top-action">Dummy</button>
            <button className="small-round">◔</button>
            <button className="small-round">D</button>
          </div>
        </header>

        <div className="content-panel">
          <div className="center-mark">✦</div>
          <h1>Demo Data</h1>
          <p>dummy content sample</p>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
