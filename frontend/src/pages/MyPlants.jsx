import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Button, Chip, IconButton, InputAdornment, Menu, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material'
import { FaEllipsisV, FaEye, FaLeaf, FaPlus, FaSearch, FaTint } from 'react-icons/fa'
import { GiPlantRoots, GiShears } from 'react-icons/gi'
import DashboardLayout from '../components/DashboardLayout'
import basil from '../assets/plant_basil.jpg'
import tomato from '../assets/plant_tomato.jpg'
import chili from '../assets/plant_chili.jpg'
import './MyPlants.css'

const initialPlants = [
  { id: 1, name: 'Basil', scientific: 'Ocimum basilicum', type: 'Herb', status: 'Healthy', scan: 'Sep 20, 2026', ago: '3 days ago', care: 'Water', due: 'in 2 days', image: basil, icon: <FaLeaf /> },
  { id: 2, name: 'Tomato', scientific: 'Solanum lycopersicum', type: 'Vegetable', status: 'Needs Care', scan: 'Sep 18, 2026', ago: '5 days ago', care: 'Fertilize', due: 'in 1 day', image: tomato, icon: <GiPlantRoots /> },
  { id: 3, name: 'Chili', scientific: 'Capsicum annuum', type: 'Vegetable', status: 'Healthy', scan: 'Sep 15, 2026', ago: '8 days ago', care: 'Water', due: 'in 5 days', image: chili, icon: <FaTint /> },
  { id: 4, name: 'Money Plant', scientific: 'Epipremnum aureum', type: 'Indoor', status: 'Healthy', scan: 'Sep 10, 2026', ago: '13 days ago', care: 'Prune', due: 'in 6 days', initials: 'MP', icon: <GiShears /> },
  { id: 5, name: 'Rose', scientific: 'Rosa spp.', type: 'Flowering', status: 'At Risk', scan: 'Sep 08, 2026', ago: '15 days ago', care: 'Check for pests', due: 'in 1 day', initials: 'RO', icon: <GiPlantRoots /> },
]
export const registeredPlantsKey = 'plantaexa-registered-plants'

const statusClass = status => status.toLowerCase().replace(' ', '-')

export default function MyPlants() {
  const navigate = useNavigate()
  const [plants] = useState(() => { try { const added = JSON.parse(sessionStorage.getItem(registeredPlantsKey)); return [...initialPlants, ...(Array.isArray(added) ? added : [])] } catch { return initialPlants } })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All Plants')
  const [page, setPage] = useState(0)
  const [anchor, setAnchor] = useState(null)
  const [chosen, setChosen] = useState(null)
  const filtered = useMemo(() => plants.filter(plant => `${plant.name} ${plant.scientific} ${plant.type}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All Plants' || plant.status === filter)), [plants, query, filter])
  return <DashboardLayout className="plants-dashboard" dashboardPath="/farm/dashboard"><Box className="plants-page">
    <Stack className="plants-header" direction="row" alignItems="center" sx={{ width: '100%' }}><Box><Typography variant="h4" fontWeight={800}>My Plants</Typography><Typography color="text.secondary">Manage and track all your registered plants</Typography></Box><Button variant="contained" startIcon={<FaPlus />} onClick={() => navigate('/farm/dashboard/crops/register')} className="plants-add" sx={{ ml: 'auto' }}>Register New Plant</Button></Stack>
    <Paper elevation={0} className="plants-surface"><Stack className="plants-controls" direction="row" spacing={1.25} alignItems="center"><TextField size="small" placeholder="Search your plants..." value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} InputProps={{ startAdornment: <InputAdornment position="start"><FaSearch /></InputAdornment> }} /><Box className="plants-filters">{['All Plants', 'Healthy', 'Needs Care', 'At Risk'].map(item => <Button key={item} className={filter === item ? 'selected' : ''} onClick={() => { setFilter(item); setPage(0) }} startIcon={item === 'All Plants' ? <FaLeaf /> : <i className={`status-dot ${statusClass(item)}`} />}>{item}</Button>)}</Box></Stack>
      <TableContainer className="plants-table-wrap"><Table size="small"><TableHead><TableRow>{['Plant', 'Type', 'Health status', 'Last scan', 'Next care', 'Actions'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{filtered.slice(page * 5, page * 5 + 5).map(plant => <TableRow key={plant.id}><TableCell><Stack direction="row" alignItems="center" spacing={1.5}><Avatar variant="rounded" src={plant.image} className="plant-image">{plant.initials}</Avatar><Box><Typography fontWeight={800} fontSize={13}>{plant.name}</Typography><Typography variant="caption" color="text.secondary">{plant.scientific}</Typography></Box></Stack></TableCell><TableCell><Chip size="small" className={`plant-type ${plant.type.toLowerCase()}`} icon={plant.icon || <FaLeaf />} label={plant.type} /></TableCell><TableCell><Chip size="small" className={`plant-status ${statusClass(plant.status)}`} icon={<i className={`status-dot ${statusClass(plant.status)}`} />} label={plant.status} /></TableCell><TableCell><Typography fontSize={12} fontWeight={700}>{plant.scan}</Typography><Typography variant="caption" color="text.secondary">{plant.ago}</Typography></TableCell><TableCell><Stack direction="row" alignItems="center" spacing={1}><Box className="care-symbol">{plant.care === 'Water' ? <FaTint /> : plant.icon || <FaLeaf />}</Box><Box><Typography fontSize={12} fontWeight={700}>{plant.care}</Typography><Typography variant="caption" color="text.secondary">{plant.due}</Typography></Box></Stack></TableCell><TableCell><IconButton size="small" aria-label={`View ${plant.name}`} onClick={() => navigate(`/farm/dashboard/crops/${plant.id}`)}><FaEye /></IconButton><IconButton size="small" aria-label={`Actions for ${plant.name}`} onClick={event => { setAnchor(event.currentTarget); setChosen(plant) }}><FaEllipsisV /></IconButton></TableCell></TableRow>)}</TableBody></Table></TableContainer>
      <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={5} rowsPerPageOptions={[5]} />
    </Paper>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={() => { setAnchor(null); navigate(`/farm/dashboard/crops/${chosen?.id}`) }}>View plant details</MenuItem><MenuItem onClick={() => setAnchor(null)}>Edit {chosen?.name}</MenuItem><MenuItem onClick={() => { setAnchor(null); navigate('/farm/dashboard/schedule') }}>Schedule care</MenuItem></Menu>
  </Box></DashboardLayout>
}
