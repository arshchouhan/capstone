import Navbar from '../components/Navbar'

const SigninPage = () => {
  return (
    <main className="signup-page">
      <Navbar />

      <section className="signup-shell">
        <div className="signup-layout">
          <div className="signup-form-panel">
            <h1>Sign In</h1>
            <p className="signup-intro">
              Welcome back. Access your farm dashboard and keep your growing plan on track.
            </p>

            <form className="signup-form">
              <label>
                <span>Email *</span>
                <input type="email" name="email" />
              </label>

              <label>
                <span>Password *</span>
                <input type="password" name="password" />
              </label>

              <button type="button" className="google-auth-btn">
                <span className="google-glyph">G</span>
                Sign in with Google
              </button>

              <button type="submit" className="signup-submit">
                SIGN IN
              </button>

              <p className="signup-intro" style={{ marginTop: '8px' }}>
                Need to create an account? <strong>Sign up.</strong>
              </p>

              <p className="signup-intro" style={{ marginTop: '4px' }}>
                Forgot your password? <strong>Reset your password.</strong>
              </p>
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

export default SigninPage
