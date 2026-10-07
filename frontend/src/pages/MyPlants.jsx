import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Button, Chip, InputAdornment, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography, Select, MenuItem, ButtonBase } from '@mui/material'
import { FaLeaf, FaPlus, FaSearch, FaTint } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import useApiData from '../hooks/useApiData'
import EmptyState from '../components/EmptyState'
import './MyPlants.css'
import herbIllustration from '../assets/plant-types/herb.png'
import vegetableIllustration from '../assets/plant-types/vegetable.png'
import floweringIllustration from '../assets/plant-types/flowering.png'
import indoorIllustration from '../assets/plant-types/indoor.png'
const typeImages = { Herb: herbIllustration, Vegetable: vegetableIllustration, Flowering: floweringIllustration, Indoor: indoorIllustration }

export const registeredPlantsKey = 'plantaexa-registered-plants'

const priority = { 'At Risk': 0, 'Needs Care': 1, Healthy: 2 }
const statusClass = status => status.toLowerCase().replace(' ', '-')

export default function MyPlants() {
  const navigate = useNavigate()
  const { data: rawPlants, error: loadError, loading } = useApiData('/plants')
  const plants = rawPlants.map(plant => ({...plant, scan:plant.updatedAt ? new Date(plant.updatedAt).toLocaleDateString() : 'Not scanned', ago:'', care:'Review care plan', due:'', initials:plant.name?.slice(0,2).toUpperCase(), status:plant.status || 'Not assessed'}))
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All Plants')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('priority')

  const filtered = useMemo(() => plants.filter(plant => `${plant.name} ${plant.scientific} ${plant.type}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All Plants' || plant.status === filter)).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'scan' ? new Date(b.scan) - new Date(a.scan) : (priority[a.status] ?? 3) - (priority[b.status] ?? 3)), [plants, query, filter, sort])
  return <DashboardLayout className="plants-dashboard" dashboardPath="/farm/dashboard"><Box className="plants-page">
    <Stack className="plants-header" direction="row" alignItems="center" sx={{ width: '100%' }}><Box><Typography variant="h4" fontWeight={800}>My Plants</Typography><Typography color="text.secondary">Your collection, health updates, and next care steps in one place</Typography></Box><Button variant="contained" startIcon={<FaPlus />} onClick={() => navigate('/farm/dashboard/crops/register')} className="plants-add" sx={{ ml: 'auto' }}>Register New Plant</Button></Stack>
    <Box className="plants-overview" aria-label="Filter plants by health">{[{ label: 'All Plants', caption: 'In your collection', icon: <FaLeaf /> }, { label: 'Healthy', caption: 'Growing well', icon: <i className="status-dot healthy" /> }, { label: 'Needs Care', caption: 'Give a little attention', icon: <i className="status-dot needs-care" /> }, { label: 'At Risk', caption: 'Review these first', icon: <i className="status-dot at-risk" /> }].map(item => <ButtonBase key={item.label} className={`plants-summary ${filter === item.label ? 'active' : ''}`} aria-pressed={filter === item.label} onClick={() => { setFilter(item.label); setPage(0) }}><Typography component="span">{item.label}</Typography><Box component="span" className="plants-tab-count">{item.label === 'All Plants' ? plants.length : plants.filter(plant => plant.status === item.label).length}</Box></ButtonBase>)}</Box>    <Box className="plants-surface"><Stack className="plants-controls" direction="row" spacing={1.25} alignItems="center"><TextField size="small" placeholder="Search your plants..." value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch /></InputAdornment> }, htmlInput: { 'aria-label': 'Search your plants' } }} /><Select size="small" MenuProps={{ slotProps: { paper: { sx: { borderRadius: 2, mt: 0.5, border: '1px solid #d7e5ea', boxShadow: '0 6px 20px #17284614', '& .MuiMenuItem-root': { fontSize: '12px', minHeight: 34, py: 0.75, px: 1.5 }, '& .MuiMenuItem-root.Mui-selected': { backgroundColor: '#e8f4f8' } } } } }} value={sort} onChange={event => { setSort(event.target.value); setPage(0) }} inputProps={{ 'aria-label': 'Sort plants' }} className="plants-sort"><MenuItem value="priority">Care priority</MenuItem><MenuItem value="name">Name A–Z</MenuItem><MenuItem value="scan">Latest scan</MenuItem></Select><Typography className="plants-result-count">{filtered.length} {filtered.length === 1 ? 'plant' : 'plants'}{filter !== 'All Plants' ? ` · ${filter}` : ''}</Typography></Stack>
      <TableContainer className="plants-table-wrap"><Table size="small" stickyHeader aria-label="Your plants and care priorities"><TableHead><TableRow>{['Plant', 'Type', 'Health status', 'Last scan', 'Next care', 'Actions'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{filtered.slice(page * 5, page * 5 + 5).map(plant => <TableRow key={plant.id}><TableCell><Stack direction="row" alignItems="center" spacing={1.5}><Avatar variant="rounded" src={plant.image} className="plant-image">{plant.initials}</Avatar><Box><Typography fontWeight={800} fontSize={13}>{plant.name}</Typography><Typography variant="caption" color="text.secondary">{plant.scientific}</Typography></Box></Stack></TableCell><TableCell><Chip size="small" className={`plant-type ${plant.type.toLowerCase()}`} avatar={typeImages[plant.type] ? <Avatar src={typeImages[plant.type]} alt="" className="plant-type-illustration" /> : undefined} label={plant.type} /></TableCell><TableCell><Chip size="small" className={`plant-status ${statusClass(plant.status)}`} icon={<i className={`status-dot ${statusClass(plant.status)}`} />} label={plant.status} /></TableCell><TableCell><Typography fontSize={12} fontWeight={700}>{plant.scan}</Typography><Typography variant="caption" color="text.secondary">{plant.ago}</Typography></TableCell><TableCell><Stack direction="row" alignItems="center" spacing={1}><Box className="care-symbol">{plant.care === 'Water' ? <FaTint /> : plant.icon || <FaLeaf />}</Box><Box><Typography fontSize={12} fontWeight={700}>{plant.care}</Typography><Typography variant="caption" color="text.secondary">{plant.due}</Typography></Box></Stack></TableCell><TableCell><Button size="small" className="plant-view-details" onClick={() => navigate(`/farm/dashboard/crops/${plant.id}`)}>View details</Button></TableCell></TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={6}><EmptyState kind="plants" title={loadError ? 'Could not load plants' : loading ? 'Loading your plants…' : 'No plants yet'} description={loadError || 'Register your first plant to start its care journey.'} /></TableCell></TableRow>}</TableBody></Table></TableContainer>
      <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={5} rowsPerPageOptions={[5]} />
    </Box>
  </Box></DashboardLayout>
}
