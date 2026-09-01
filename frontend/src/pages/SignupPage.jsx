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
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(formData),
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
      console.log('Signup response:', data)

      if (!data.success) {
        throw new Error(data.message || 'Signup failed')
      }

      // Use auth context to login
      if (data.token && data.data) {
        login(data.data, data.token)
      }

      // Redirect to dashboard
      navigate('/dashboard')
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
            <h1>Start Your Free Trial</h1>
            <p className="signup-intro">
              Join hundreds of crop farmers using our platform
            </p>

            <div className="signup-trust-row">
              <span>✓ 30-day free trial</span>
              <span>✓ No credit card required</span>
            </div>

            {error && <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

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