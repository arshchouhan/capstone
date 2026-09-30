import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Box, Button, Card, CardContent, Checkbox, Chip, Divider, Stack, Typography } from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { FaArrowRight, FaCamera, FaCheckCircle, FaCommentDots, FaExclamationCircle, FaLeaf, FaRegCalendarAlt, FaSeedling, FaShoppingCart, FaUserAlt } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import blight from '../assets/early_blight_leaf.jpg'
import tomato from '../assets/plant_tomato.jpg'
import basil from '../assets/plant_basil.jpg'
import chili from '../assets/plant_chili.jpg'
import './Dashboard.css'

const plants = [
  { name: 'Tomato', image: tomato, status: 'Needs attention', alert: true },
  { name: 'Basil', image: basil, status: 'Healthy' },
  { name: 'Chili', image: chili, status: 'Healthy' },
]
const tasks = [
  { id: 'fungicide', label: 'Apply fungicide', detail: 'Tomato plant', when: 'Today' },
  { id: 'rescan', label: 'Re-scan plant', detail: 'Check for improvement', when: 'In 7 days' },
]
const actionSx = { color: '#087d68', fontSize: 12, fontWeight: 700, '&:hover': { textDecoration: 'underline', background: 'transparent' } }

function Summary({ icon, value, label, alert }) {
  return <Box className="mui-summary-item"><Box className={`mui-summary-icon${alert ? ' alert' : ''}`}>{icon}</Box><Box><Typography component="span" fontWeight={800} fontSize={22}>{value}</Typography><Typography component="span" fontWeight={700} fontSize={11} ml={0.5}>{label}</Typography></Box></Box>
}

function PanelTitle({ icon, title, to }) {
  return <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}><Typography className="mui-panel-title">{icon}{title}</Typography><Button component={Link} to={to} endIcon={<FaArrowRight />} sx={actionSx}>View all</Button></Stack>
}

export default function Dashboard({ dashboardPrefix = 'farm' }) {
  const { user } = useAuth()
  const [completed, setCompleted] = useState([])
  const dashboardPath = `/${dashboardPrefix}/dashboard`
  const firstName = (user?.name || user?.fullName || 'Arsh').trim().split(' ')[0]
  const pending = tasks.length - completed.length
  const toggleTask = id => setCompleted(current => current.includes(id) ? current.filter(task => task !== id) : [...current, id])

  return <DashboardLayout className="mui-dashboard" dashboardPath={dashboardPath}>
    <Box className="mui-dashboard-page">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} className="mui-dashboard-header">
        <Box><Typography variant="h4" fontWeight={800}>Good morning, {firstName} <FaSeedling className="mui-heading-leaf" /></Typography><Typography color="text.secondary">Your garden at a glance</Typography></Box>
        <Button component={Link} to={`${dashboardPath}/scan`} variant="contained" startIcon={<FaCamera />} endIcon={<FaArrowRight />} className="mui-scan-button">Scan a Plant</Button>
      </Stack>

      <Card className="mui-summary-card" elevation={0}><Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider flexItem orientation="vertical" />} spacing={0}>
        <Summary icon={<FaSeedling />} value={plants.length} label="plants in your garden" />
        <Summary icon={<FaExclamationCircle />} value="1" label="needs attention" alert />
        <Summary icon={<FaRegCalendarAlt />} value={pending} label={pending === 1 ? 'care task upcoming' : 'care tasks upcoming'} />
      </Stack></Card>

      <Box className="mui-overview-grid">
        <Card className="mui-panel" elevation={0}><CardContent><PanelTitle icon={<FaExclamationCircle />} title="Needs your attention" to={`${dashboardPath}/scan`} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} className="mui-attention-content">
            <Avatar variant="rounded" src={blight} alt="Tomato leaf with early blight" className="mui-diagnosis-image" />
            <Box flex={1}><Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={800}>Tomato · Early blight</Typography><Chip label="Detected" size="small" color="error" variant="outlined" /></Stack><Typography variant="body2" color="text.secondary" fontStyle="italic">(Alternaria solani)</Typography><Typography variant="body2" color="text.secondary" mt={1}>Treat the infected leaves today to help stop the disease from spreading.</Typography><Button component={Link} to={`${dashboardPath}/scan`} size="small" startIcon={<FaLeaf />} endIcon={<FaArrowRight />} sx={{ ...actionSx, mt: 1 }}>View treatment plan</Button></Box>
          </Stack>
        </CardContent></Card>

        <Card className="mui-panel" elevation={0}><CardContent><PanelTitle icon={<FaRegCalendarAlt />} title="Next up" to={`${dashboardPath}/schedule`} />
          <Stack divider={<Divider flexItem />}>{tasks.map(task => <Box key={task.id} className="mui-task-row"><Box className="mui-task-date">{task.when}</Box><Box flex={1}><Typography fontWeight={700} variant="body2" sx={{ textDecoration: completed.includes(task.id) ? 'line-through' : 'none' }}>{task.label}</Typography><Typography variant="caption" color="text.secondary">{task.detail}</Typography></Box><Checkbox checked={completed.includes(task.id)} onChange={() => toggleTask(task.id)} inputProps={{ 'aria-label': `Mark ${task.label} complete` }} color="success" /></Box>)}</Stack>
        </CardContent></Card>
      </Box>

      <Card className="mui-panel mui-plants-panel" elevation={0}><CardContent><PanelTitle icon={<FaSeedling />} title="Your plants" to={`${dashboardPath}/crops`} />
        <Box className="mui-plant-grid">{plants.map(plant => <Box component={Link} to={`${dashboardPath}/${plant.alert ? 'scan' : 'crops'}`} key={plant.name} className="mui-plant-card"><Avatar variant="rounded" src={plant.image} alt={plant.name} /><Box flex={1}><Typography fontWeight={800} variant="body2">{plant.name}</Typography><Typography variant="caption" color="text.secondary">{plant.status}</Typography></Box>{plant.alert ? <FaExclamationCircle className="mui-alert-icon" aria-label="Needs attention" /> : <FaCheckCircle className="mui-healthy-icon" aria-label="Healthy" />}</Box>)}</Box>
      </CardContent></Card>

      <Card className="mui-panel mui-explore-panel" elevation={0}><CardContent><Box className="mui-explore-grid">
        <Box className="mui-explore-item"><FaUserAlt /><Box><Typography fontWeight={800} variant="body2">Meet an expert</Typography><Typography variant="caption" color="text.secondary">Get one-on-one plant care advice.</Typography><Button component={Link} to={`${dashboardPath}/schedule`} endIcon={<FaArrowRight />} sx={actionSx}>Book a session</Button></Box></Box>
        <Box className="mui-explore-item"><FaCommentDots /><Box><Typography fontWeight={800} variant="body2">Community</Typography><Typography variant="caption" color="text.secondary">Ask questions and learn with other plant owners.</Typography><Button component={Link} to={`${dashboardPath}/community`} endIcon={<FaArrowRight />} sx={actionSx}>View discussions</Button></Box></Box>
        <Box className="mui-explore-item"><FaShoppingCart /><Box><Typography fontWeight={800} variant="body2">Market</Typography><Typography variant="caption" color="text.secondary">Find plant care essentials and supplies.</Typography><Button component={Link} to={`${dashboardPath}/market`} endIcon={<FaArrowRight />} sx={actionSx}>Shop now</Button></Box></Box>
      </Box></CardContent></Card>
    </Box>
  </DashboardLayout>
}
