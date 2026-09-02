import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaLeaf, FaUsers, FaStore, FaCog } from 'react-icons/fa'

const Market = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand-mini" onClick={() => navigate('/dashboard')}>
          <div className="brand-icon" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate('/dashboard/crops')}>
            <FaLeaf className="nav-icon" />
            <span>Your Crops</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/dashboard/community')}>
            <FaUsers className="nav-icon" />
            <span>Community</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/dashboard/market')}>
            <FaStore className="nav-icon" />
            <span>Market</span>
          </div>
          <div className="nav-item">
            <FaCog className="nav-icon" />
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
            <input type="text" placeholder="Search" className="search-input" />
          </div>

          <div className="top-actions">
            <button className="top-action">Dummy</button>
            <button className="top-action">Dummy</button>
            <button className="small-round">◔</button>
            <button className="small-round">D</button>
          </div>
        </header>

        <div className="content-panel">
          <div className="center-mark">🏪</div>
          <h1>Market</h1>
          <p>Buy and sell crops in the marketplace</p>
        </div>
      </section>
    </main>
  )
}

export default Market
