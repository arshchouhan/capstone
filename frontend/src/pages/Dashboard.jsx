import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Box, Button, Card, CardContent, Checkbox, Chip, Divider, Stack, Typography } from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { FaArrowRight, FaCamera, FaCheckCircle, FaCommentDots, FaExclamationCircle, FaRegCalendarAlt, FaSeedling, FaShoppingCart, FaUserAlt } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import './Dashboard.css'
import useApiData from '../hooks/useApiData'
import { api, mediaUrl } from '../services/api'
import EmptyState from '../components/EmptyState'

const actionSx = { color: '#087d68', fontSize: 12, fontWeight: 700, '&:hover': { textDecoration: 'underline', background: 'transparent' } }

function Summary({ icon, value, label, alert }) {
  return <Box className="mui-summary-item"><Box className={`mui-summary-icon${alert ? ' alert' : ''}`}>{icon}</Box><Box className="mui-summary-copy"><Typography component="strong">{value}</Typography><Typography component="span">{label}</Typography></Box></Box>
}

function PanelTitle({ icon, title, to }) {
  return <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, gap: 1 }}><Typography className="mui-panel-title">{icon}{title}</Typography><Button component={Link} to={to} endIcon={<FaArrowRight />} sx={{ ...actionSx, whiteSpace:'nowrap', textTransform:'none' }}>View all</Button></Stack>
}

export default function Dashboard({ dashboardPrefix = 'farm' }) {
  const { user } = useAuth()
  const [completed, setCompleted] = useState([])
  const { data, loading, error, reload } = useApiData('/dashboard', { plants: [], tasks: [], recentScans: [] })
  const [taskError, setTaskError] = useState('')
  const plants = data.plants.map(plant => ({ ...plant, image: mediaUrl(plant.image), alert: ['Needs Care', 'At Risk'].includes(plant.status) }))
  const tasks = data.tasks.map(task => ({ ...task, id: task.id || task._id, label: task.type, detail: task.plant?.name, when: new Date(task.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }))
  const attention = plants.filter(plant => plant.alert).slice(0, 2)
  const upcomingTasks = tasks.filter(task => !completed.includes(task.id)).slice(0, 3)
  const [savingTask, setSavingTask] = useState(null)
  const dashboardPath = `/${dashboardPrefix}/dashboard`
  const firstName = (user?.name || user?.fullName || 'Arsh').trim().split(' ')[0]
  const pending = data.taskCount ?? tasks.length
  const toggleTask = async id => { const task=tasks.find(item=>item.id===id); setSavingTask(id); try { await api(`/plants/${task.plant.id || task.plant._id}/care-tasks/${id}/complete`, {method:'POST'}); setCompleted(current=>[...current,id]); await reload(); setTaskError('') } catch(err) {setTaskError(err.message)} finally {setSavingTask(null)} }

  return <DashboardLayout className="mui-dashboard" dashboardPath={dashboardPath}>
    <Box className="mui-dashboard-page">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} className="mui-dashboard-header">
        <Box><Typography variant="h4" fontWeight={800}>Good morning, {firstName} <FaSeedling className="mui-heading-leaf" /></Typography><Typography color="text.secondary">Your garden at a glance</Typography></Box>
        <Button component={Link} to={`${dashboardPath}/scan`} variant="contained" startIcon={<FaCamera />} endIcon={<FaArrowRight />} className="mui-scan-button">Scan a Plant</Button>
      </Stack>

      <Card className="mui-summary-card" elevation={0}><Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider flexItem orientation="vertical" />} spacing={0}>
        <Summary icon={<FaSeedling />} value={plants.length} label="plants in your garden" />
        <Summary icon={<FaExclamationCircle />} value={plants.filter(plant => plant.alert).length} label="needs attention" alert />
        <Summary icon={<FaRegCalendarAlt />} value={pending} label={pending === 1 ? 'care task scheduled' : 'care tasks scheduled'} />
      </Stack></Card>

      {(error || taskError) && <Typography role="alert" color="error">{error || taskError}</Typography>}
      <Box className="mui-overview-grid">
        <Card className="mui-panel" elevation={0}><CardContent><PanelTitle icon={<FaExclamationCircle />} title="Needs your attention" to={`${dashboardPath}/scan`} />
          {attention.length ? <Stack spacing={1.5}>{attention.map(plant=><Stack key={plant.id || plant._id} direction="row" spacing={1.5} className="mui-attention-content"><Avatar variant="rounded" src={plant.image} alt={plant.name} className="mui-diagnosis-image" /><Box sx={{ minWidth:0, flex:1 }}><Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}><Typography sx={{fontWeight:700}}>{plant.name}</Typography><Chip label={plant.status} size="small" /></Stack><Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>Review its latest scan and care plan.</Typography><Button component={Link} to={`${dashboardPath}/crops/${plant.id || plant._id}`} sx={{...actionSx,p:0,mt:0.5,textTransform:'none'}}>View plant</Button></Box></Stack>)}</Stack> : <EmptyState kind="plants" title={loading ? 'Loading your garden' : 'Your garden is up to date'} description="Your plants and their latest checks appear here." />}
        </CardContent></Card>

        <Card className="mui-panel" elevation={0}><CardContent><PanelTitle icon={<FaRegCalendarAlt />} title="Next up" to={`${dashboardPath}/crops`} />
          {!tasks.length && <EmptyState kind="care" title="No care tasks yet" description="Add a schedule from the Care tab." />}
          <Stack divider={<Divider flexItem />}>{upcomingTasks.map(task => <Box key={task.id} className="mui-task-row"><Box className="mui-task-date">{task.when}</Box><Box sx={{flex:1,minWidth:0}}><Typography sx={{fontWeight:700}} variant="body2">{task.label}</Typography><Typography variant="caption" color="text.secondary">{task.detail}</Typography></Box><Checkbox checked={false} disabled={savingTask!==null} onChange={() => toggleTask(task.id)} slotProps={{input:{'aria-label':`Mark ${task.label} for ${task.detail} complete`}}} color="success" /></Box>)}</Stack>
          {pending > 3 && <Typography className="mui-task-more">{pending - 3} more tasks in your plants’ care schedules</Typography>}
        </CardContent></Card>
      </Box>

      <Card className="mui-panel mui-plants-panel" elevation={0}><CardContent><PanelTitle icon={<FaSeedling />} title="Your plants" to={`${dashboardPath}/crops`} />
        {!plants.length && <EmptyState kind="plants" title="Start your garden" description="Register a plant to save its photos, scans, and care." />}
        <Box className="mui-plant-grid">{plants.map(plant => <Box component={Link} to={`${dashboardPath}/crops/${plant.id || plant._id}`} key={plant.name} className="mui-plant-card"><Avatar variant="rounded" src={plant.image} alt={plant.name} /><Box flex={1}><Typography fontWeight={800} variant="body2">{plant.name}</Typography><Typography variant="caption" color="text.secondary">{plant.status}</Typography></Box>{plant.alert ? <FaExclamationCircle className="mui-alert-icon" aria-label="Needs attention" /> : <FaCheckCircle className="mui-healthy-icon" aria-label="Healthy" />}</Box>)}</Box>
      </CardContent></Card>

      <Card className="mui-panel mui-explore-panel" elevation={0}><CardContent><Box className="mui-explore-grid">
        <Box className="mui-explore-item"><FaUserAlt /><Box><Typography fontWeight={800} variant="body2">Meet an expert</Typography><Typography variant="caption" color="text.secondary">Get one-on-one plant care advice.</Typography><Button component={Link} to={`${dashboardPath}/schedule`} endIcon={<FaArrowRight />} sx={actionSx}>Book a session</Button></Box></Box>
        <Box className="mui-explore-item"><FaCommentDots /><Box><Typography fontWeight={800} variant="body2">Community</Typography><Typography variant="caption" color="text.secondary">Ask questions and learn with other plant owners.</Typography><Button component={Link} to={`${dashboardPath}/community`} endIcon={<FaArrowRight />} sx={actionSx}>View discussions</Button></Box></Box>
        <Box className="mui-explore-item"><FaShoppingCart /><Box><Typography fontWeight={800} variant="body2">Market</Typography><Typography variant="caption" color="text.secondary">Find plant care essentials and supplies.</Typography><Button component={Link} to={`${dashboardPath}/market`} endIcon={<FaArrowRight />} sx={actionSx}>Shop now</Button></Box></Box>
      </Box></CardContent></Card>
    </Box>
  </DashboardLayout>
}
