import Navbar from '../components/Navbar'

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

          <button className="cta-btn">Start Your Free Trial</button>
          <p className="trial-note">No credit card required. Cancel anytime.</p>
        </div>

        <div className="hero-visual" aria-label="Product preview placeholder">
          <div className="image-placeholder" />
        </div>
      </section>
    </main>
  )
}

export default LandingPage
