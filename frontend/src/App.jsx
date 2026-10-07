import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import SignupPage from './pages/SignupPage'
import DoctorSignup from './pages/DoctorSignup'
import SigninPage from './pages/SigninPage'
import FarmDashboard from './pages/FarmDashboard'
import DrDashboard from './pages/DrDashboard'
import MyConnections from './pages/MyConnections'
import ComingSoon from './pages/ComingSoon'
import Market from './pages/Market'
import ScanPlant from './pages/ScanPlant'
import CareSchedule from './pages/CareSchedule'
import Community from './pages/Community'
import CommunityQuestion from './pages/CommunityQuestion'
import MyPlants from './pages/MyPlants'
import RegisterPlant from './pages/RegisterPlant'
import PlantDetails from './pages/PlantDetails'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// Component to handle redirect for authenticated users trying to access auth pages
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div>Loading...</div>
  }

  if (isAuthenticated) {
    return <Navigate to={user?.accountType === 'doctor' ? '/dr/dashboard' : '/farm/dashboard'} replace />
  }

  return children
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} /><Route path="/grower/login" element={<AuthRedirect><SigninPage portal="grower"/></AuthRedirect>} /><Route path="/doctor/login" element={<AuthRedirect><SigninPage portal="doctor"/></AuthRedirect>} /><Route path="/grower/register" element={<AuthRedirect><SignupPage/></AuthRedirect>} /><Route path="/doctor/register" element={<AuthRedirect><DoctorSignup /></AuthRedirect>} />
      <Route
        path="/signup"
        element={
          <AuthRedirect>
            <SignupPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/signin"
        element={
          <AuthRedirect>
            <SigninPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/farm/dashboard"
        element={
          <ProtectedRoute>
            <FarmDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/dr/dashboard" element={<ProtectedRoute><DrDashboard /></ProtectedRoute>} />
      <Route path="/dr/dashboard/connections" element={<ProtectedRoute><MyConnections /></ProtectedRoute>} />
      <Route path="/dr/dashboard/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/dr/dashboard/community/ask" element={<ProtectedRoute><CommunityQuestion /></ProtectedRoute>} />
      <Route path="/dashboard" element={<Navigate to="/farm/dashboard" replace />} />
      <Route path="/dashboard/crops" element={<ProtectedRoute><MyPlants /></ProtectedRoute>} />
      <Route
        path="/farm/dashboard/scan"
        element={
          <ProtectedRoute>
            <ScanPlant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/dashboard/library"
        element={
          <ProtectedRoute>
            <ComingSoon pageName="Disease Library" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/dashboard/treatment"
        element={
          <ProtectedRoute>
            <ComingSoon pageName="Treatment Plans" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/dashboard/crops"
        element={
          <ProtectedRoute>
            <MyPlants />
          </ProtectedRoute>
        }
      />
      <Route path="/farm/dashboard/crops/register" element={<ProtectedRoute><RegisterPlant /></ProtectedRoute>} />
      <Route path="/farm/dashboard/crops/:id" element={<ProtectedRoute><PlantDetails /></ProtectedRoute>} />
      <Route
        path="/farm/dashboard/schedule"
        element={
          <ProtectedRoute>
            <CareSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/dashboard/analytics"
        element={
          <ProtectedRoute>
            <ComingSoon pageName="Analytics" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/dashboard/community"
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/dashboard/community/ask"
        element={
          <ProtectedRoute>
            <CommunityQuestion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farm/dashboard/market"
        element={
          <ProtectedRoute>
            <Market />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
