import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <main className="landing-page">
      <Navbar />

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-brand-wrap">
            <div className="brand-name hero-brand">Crop Keeper</div>
            <div className="brand-tag hero-tag">Plant more. Plan less.</div>
          </div>
          <p className="eyebrow">CROP FARM SOFTWARE</p>
          <h1>
            Plan and Manage Your
            <span>Crop Growing</span>
            Effortlessly
          </h1>
          <p className="subtitle">
            Crop Keeper helps you track everything in your farm so you
            always grow the right amount at the right time.
          </p>

          <div className="role-login-actions">
            <Link className="cta-btn" to="/signin?role=farm">Farm login</Link>
            <Link className="doctor-login-btn" to="/signin?role=dr">Doctor login</Link>
          </div>
          <p className="trial-note">Choose the workspace that matches your role.</p>
        </div>

        <div className="hero-visual" aria-label="Product preview placeholder">
          <div className="image-placeholder" />
        </div>
      </section>
    </main>
  )
}

export default LandingPage
