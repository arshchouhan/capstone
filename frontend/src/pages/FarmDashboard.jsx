import Dashboard from './Dashboard'

// Farmer-facing dashboard. Kept as a dedicated entry point for farm routes.
export default function FarmDashboard() {
  return <Dashboard dashboardPrefix="farm" />
}
