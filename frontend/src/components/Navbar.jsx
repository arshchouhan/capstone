import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#">Product</a>
          <a href="#">Team</a>
          <a href="#">Pricing</a>
          <a href="#">Blog</a>
          <a href="#">Free Tools</a>
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
