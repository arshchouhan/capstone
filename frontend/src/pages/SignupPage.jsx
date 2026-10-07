import { apiBase } from '../services/api'
import { readAuthResponse } from '../services/authResponse'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SignupPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    farmName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    newsletter: false,
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
    const details = { ...formData, firstName: formData.firstName.trim(), lastName: formData.lastName.trim(), email: formData.email.trim().toLowerCase(), confirmEmail: formData.confirmEmail.trim().toLowerCase(), farmName: formData.farmName.trim() }
    if (!details.firstName || !details.lastName) { setError('Enter your first and last name.'); return }
    if (details.email !== details.confirmEmail) { setError('Emails do not match.'); return }
    if (details.password !== details.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(details),
      })

      const data = await readAuthResponse(response)

      if (!data.success) {
        throw new Error(data.message || 'Signup failed')
      }

      // Use auth context to login
      if (data.token && data.data) {
        login(data.data, data.token)
      }

      // Redirect to dashboard
      navigate('/farm/dashboard')
    } catch (err) {
      console.error('Signup error:', err)
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
            <h1>Create your grower account</h1><p className="signup-intro">Plant expert? <Link to="/doctor/register">Register as a doctor</Link></p>
            <p className="signup-intro">
              Keep your plants, care routines, and consultations together.
            </p>

            <div className="signup-trust-row">
              <span>Plant care and scan history</span>
              <span>Connect with plant experts</span>
            </div>

            {error && <div role="alert" className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}{/already registered/i.test(error) && <> <Link to="/signin">Sign in</Link></>}</div>}

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="field-row two-col">
                <label>
                  <span>First Name *</span>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  <span>Last Name *</span>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label>
                <span>Farm Name</span>
                <input 
                  type="text" 
                  name="farmName" 
                  value={formData.farmName}
                  onChange={handleChange}
                />
              </label>

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
                <span>Confirm Email *</span>
                <input 
                  type="email" 
                  name="confirmEmail" 
                  value={formData.confirmEmail}
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

              <label>
                <span>Confirm Password *</span>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="checkbox-row">
                <input 
                  type="checkbox" 
                  name="newsletter" 
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
                <span>Send me email updates about Crop Keeper</span>
              </label>

              <button type="button" className="google-auth-btn">
                <span className="google-glyph">G</span>
                Sign up with Google
              </button>

              <button type="submit" className="signup-submit" disabled={loading}>
                {loading ? 'SIGNING UP...' : 'SIGN UP'}
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
