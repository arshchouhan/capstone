import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#">Dummy</a>
          <a href="#">Dummy</a>
          <a href="#">Dummy</a>
          <a href="#">Dummy</a>
          <a href="#">Dummy</a>
        </nav>

        <div className="auth-actions">
          <Link to="/signup" className="text-btn link-btn">Sign Up</Link>
          <Link to="/signin" className="text-btn link-btn">Sign In</Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
