import DashboardLayout from '../components/DashboardLayout'
import './Dashboard.css'

// Doctor-facing dashboard shell. Doctor content will be added independently.
export default function DrDashboard() {
  return <DashboardLayout className="mui-dashboard dr-dashboard" dashboardPath="/dr/dashboard">
    <div className="mui-dashboard-page dr-dashboard-page" aria-label="Doctor dashboard" />
  </DashboardLayout>
}
