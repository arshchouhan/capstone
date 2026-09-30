import { FaTools } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'

const ComingSoon = ({ pageName }) => (
  <DashboardLayout>
    <div className="main-canvas-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <FaTools style={{ fontSize: '4rem', color: '#4CAF50', marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#333' }}>{pageName}</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>This feature is coming soon! Stay tuned.</p>
    </div>
  </DashboardLayout>
)

export default ComingSoon
