import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SigninPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      // Check response status first
      if (!response.ok) {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          throw new Error(data.message || `Error: ${response.status}`)
        } catch (parseError) {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log('Signin response:', data)

      if (!data.success) {
        throw new Error(data.message || 'Signin failed')
      }

      // Use auth context to login
      if (data.token && data.data) {
        login(data.data, data.token)
      }

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('Signin error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

            {error && <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

            <form className="signup-form" onSubmit={handleSubmit}>
              <label>
                <span>Email *</span>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Password *</span>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="checkbox-row">
                <input 
                  type="checkbox" 
                  name="rememberMe" 
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>

              <button type="button" className="google-auth-btn">
                <span className="google-glyph">G</span>
                Sign in with Google
              </button>

              <button type="submit" className="signup-submit" disabled={loading}>
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
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
