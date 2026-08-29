import Navbar from '../components/Navbar'

const SignupPage = () => {
  return (
    <main className="signup-page">
      <Navbar />

      <section className="signup-shell">
        <div className="signup-layout">
          <div className="signup-form-panel">
            <h1>Start Your Free Trial</h1>
            <p className="signup-intro">
              Join hundreds of microgreen farmers using our platform
            </p>

            <div className="signup-trust-row">
              <span>✓ 30-day free trial</span>
              <span>✓ No credit card required</span>
            </div>

            <form className="signup-form">
              <div className="field-row two-col">
                <label>
                  <span>First Name *</span>
                  <input type="text" name="firstName" />
                </label>

                <label>
                  <span>Last Name *</span>
                  <input type="text" name="lastName" />
                </label>
              </div>

              <label>
                <span>Farm Name</span>
                <input type="text" name="farmName" />
              </label>

              <label>
                <span>Email *</span>
                <input type="email" name="email" />
              </label>

              <label>
                <span>Confirm Email *</span>
                <input type="email" name="confirmEmail" />
              </label>

              <label>
                <span>Password *</span>
                <input type="password" name="password" />
              </label>

              <label>
                <span>Confirm Password *</span>
                <input type="password" name="confirmPassword" />
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="newsletter" />
                <span>Send me email updates about Microgreen Manager</span>
              </label>

              <button type="button" className="google-auth-btn">
                <span className="google-glyph">G</span>
                Sign up with Google
              </button>

              <button type="submit" className="signup-submit">
                SIGN UP
              </button>
            </form>
          </div>

          <div className="signup-visual-panel" aria-label="Empty placeholder panel">
            <div className="empty-visual-frame" />
          </div>
        </div>
      </section>
    </main>
  )
}

export default SignupPage