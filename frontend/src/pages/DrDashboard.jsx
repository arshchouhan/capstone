import { Alert, Avatar, Box, Chip, Typography } from '@mui/material'
import DashboardLayout from '../components/DashboardLayout'
import GoogleConnection from '../components/GoogleConnection'
import MeetRequestInbox from '../components/MeetRequestInbox'
import useApiData from '../hooks/useApiData'
import { mediaUrl } from '../services/api'
import './Dashboard.css'

export default function DrDashboard() {
  const { data: profile, loading, error } = useApiData('/expert/profile', null)

  return <DashboardLayout className="mui-dashboard dr-dashboard" dashboardPath="/dr/dashboard">
    <Box className="mui-dashboard-page dr-dashboard-page" aria-label="Doctor dashboard">
      <Box className="dr-meet-workspace">
        <Typography component="h2" variant="h5">Doctor workspace</Typography>
        {loading && <Typography role="status">Loading profile…</Typography>}
        {error && <Alert severity="error">{error}</Alert>}
        {profile && <Box className="meet-flow-card">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={mediaUrl(profile.avatarUrl)} alt="">{profile.name?.split(' ').slice(-2).map(word => word[0]).join('')}</Avatar>
            <Box sx={{ flex: 1 }}><Typography component="h3">{profile.name}</Typography><Typography className="meet-flow-secondary">{profile.specialty}</Typography></Box>
            {profile.demo && <Chip size="small" label="Demo profile" />}
          </Box>
          {profile.description && <Typography>{profile.description}</Typography>}
          <Typography className="meet-flow-secondary">{[profile.qualifications, profile.location, profile.languages?.join(', ')].filter(Boolean).join(' · ')}</Typography>
        </Box>}
        {profile?.demo ? <Alert severity="info">You can accept and decline demo requests here. Demo requests don’t send invitations or create meeting links.</Alert> : !loading && <GoogleConnection portal="doctor" />}
        <MeetRequestInbox />
      </Box>
    </Box>
  </DashboardLayout>
}
