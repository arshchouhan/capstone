import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CssBaseline, FormControl, InputLabel, MenuItem, Select, Stack, TextField, ThemeProvider, Typography, createTheme } from '@mui/material'
import { FaArrowLeft, FaCamera, FaLeaf, FaPlus } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import { registeredPlantsKey } from './MyPlants'
import './MyPlants.css'

const theme = createTheme({ palette: { primary: { main: '#008b73' }, text: { primary: '#172846', secondary: '#71819c' } }, typography: { fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 13, h4: { fontSize: '28px', lineHeight: 1.15 } }, shape: { borderRadius: 10 } })
const types = ['Herb', 'Vegetable', 'Indoor', 'Flowering', 'Succulent', 'Other']

export default function RegisterPlant() {
  const navigate = useNavigate()
  const photoInput = useRef(null)
  const draft = (() => { try { return JSON.parse(sessionStorage.getItem('plant-registration-draft')) || {} } catch { return {} } })()
  const [name, setName] = useState(draft.name || '')
  const [type, setType] = useState(draft.type || 'Indoor')
  const [scientific, setScientific] = useState(draft.scientific || '')
  const [variety, setVariety] = useState(draft.variety || '')
  const [location, setLocation] = useState(draft.location || '')
  const [acquired, setAcquired] = useState(draft.acquired || '')
  const [light, setLight] = useState(draft.light || 'Bright indirect light')
  const [watering, setWatering] = useState(draft.watering || 'When top soil is dry')
  const [notes, setNotes] = useState(draft.notes || '')
  const [scanned, setScanned] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [photo, setPhoto] = useState(null)
  const submit = () => {
    if (!name.trim()) return
    const item = { id: Date.now(), name: name.trim(), scientific: scientific.trim() || 'Plant profile', type, status: 'Healthy', scan: 'Not scanned', ago: 'Add a scan', care: 'Set a care task', due: 'Not scheduled', initials: name.trim().split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase(), variety, location, acquired, light, watering, notes }
    try { const current = JSON.parse(sessionStorage.getItem(registeredPlantsKey)) || []; sessionStorage.setItem(registeredPlantsKey, JSON.stringify([...current, item])) } catch { /* Registration remains usable without storage. */ }
    navigate('/farm/dashboard/crops')
  }
  const choosePhoto = event => { const file = event.target.files?.[0]; if (file) { setPhoto({ name: file.name, url: URL.createObjectURL(file) }); setScanned(false) } }
  const startScan = () => { if (!photo) return; setScanning(true); window.setTimeout(() => { setScanning(false); setScanned(true); setName(current => current || 'Basil'); setType(current => current === 'Indoor' ? 'Herb' : current); setScientific(current => current || 'Ocimum basilicum'); setLight(current => current || 'Bright indirect light') }, 3200) }
  return <DashboardLayout className="plants-dashboard" dashboardPath="/farm/dashboard"><ThemeProvider theme={theme}><CssBaseline /><Box className="plant-register-page">
    <Box className="plant-register-header"><Button size="small" startIcon={<FaArrowLeft />} onClick={() => navigate('/farm/dashboard/crops')} sx={{ px: 0, mb: .5, textTransform: 'none', fontWeight: 700, fontSize: 12 }}>Back to My Plants</Button><Typography variant="h4" fontWeight={800}>Register a new plant</Typography></Box>
    <Card variant="outlined" className="plant-register-form" sx={{ borderColor: '#e3eaf2', p: 0, '& .MuiInputBase-input, & .MuiSelect-select': { fontSize: 13 }, '& .MuiInputLabel-root': { fontSize: 12 } }}><Box className="plant-register-grid">
      <Box className="plant-form-section"><Typography className="plant-section-title"><FaLeaf /> Plant profile</Typography><Stack spacing={1.5}><TextField autoFocus required size="small" label="Plant name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Balcony basil" fullWidth /><Stack direction="row" spacing={1.5}><FormControl size="small" fullWidth><InputLabel id="plant-type-label">Plant type</InputLabel><Select labelId="plant-type-label" value={type} label="Plant type" onChange={event => setType(event.target.value)}>{types.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><TextField size="small" label="Variety" value={variety} onChange={event => setVariety(event.target.value)} placeholder="Optional" fullWidth /></Stack><TextField size="small" label="Scientific name" value={scientific} onChange={event => setScientific(event.target.value)} placeholder="Optional" fullWidth /><TextField size="small" label="Where is it growing?" value={location} onChange={event => setLocation(event.target.value)} placeholder="e.g. Sunny balcony" fullWidth /><TextField size="small" type="date" label="Date acquired" value={acquired} onChange={event => setAcquired(event.target.value)} slotProps={{ inputLabel: { shrink: true, sx: { backgroundColor: '#fff', px: .5 } }, htmlInput: { sx: { pt: '14px', pb: '6px' } } }} fullWidth /></Stack></Box>
      <Box className="plant-form-section"><Typography className="plant-section-title"><FaLeaf /> Care preferences</Typography><Stack spacing={1.5}><FormControl size="small" fullWidth><InputLabel id="light-label">Light conditions</InputLabel><Select labelId="light-label" value={light} label="Light conditions" onChange={event => setLight(event.target.value)}>{['Full sun', 'Bright indirect light', 'Partial shade', 'Low light'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><FormControl size="small" fullWidth><InputLabel id="watering-label">Watering schedule</InputLabel><Select labelId="watering-label" value={watering} label="Watering schedule" onChange={event => setWatering(event.target.value)}>{['Daily', 'Every 2–3 days', 'When top soil is dry', 'Weekly'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><TextField size="small" label="Notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Care notes, current condition, or anything useful to remember…" multiline minRows={2} fullWidth /><Box className={`plant-inline-scan${scanning ? ' scanning' : ''}${scanned ? ' complete' : ''}`}>{photo && <Box component="img" className="plant-scan-preview" src={photo.url} alt="Plant scan preview" />}<FaCamera /><Box flex={1}>{scanning ? <><Typography fontWeight={700} fontSize={13}>Identifying plant details…</Typography><Typography variant="caption">Reading leaf structure, plant type, and growing needs.</Typography><span className="plant-scan-progress" /></> : scanned ? <><Typography fontWeight={700} fontSize={13}>Plant profile identified</Typography><Typography variant="caption">Basil · Ocimum basilicum · Herb. The detected details were added to the form.</Typography></> : photo ? <><Typography fontWeight={700} fontSize={13}>Plant photo ready</Typography><Typography variant="caption">{photo.name}. Start the scan to identify this plant.</Typography></> : <><Typography fontWeight={700} fontSize={13}>Upload a plant photo <Typography component="span" color="error" fontSize="inherit">*</Typography></Typography><Typography variant="caption">A clear leaf photo is required before this plant can be scanned.</Typography></>}</Box><input ref={photoInput} type="file" accept="image/*" hidden onChange={choosePhoto} />{!scanned && <Button size="small" variant="contained" disabled={scanning} onClick={() => photo ? startScan() : photoInput.current?.click()} sx={{ textTransform: 'none', fontWeight: 700 }}>{scanning ? 'Scanning…' : photo ? 'Scan photo' : 'Upload photo'}</Button>}</Box></Stack></Box>
      <Stack className="plant-register-actions" direction="row" justifyContent="flex-end" spacing={1.5}><Button color="inherit" onClick={() => navigate('/farm/dashboard/crops')}>Cancel</Button><Button variant="contained" disabled={!name.trim() || !scanned} onClick={submit} startIcon={<FaPlus />} sx={{ textTransform: 'none', fontWeight: 700 }}>Register plant</Button></Stack>
    </Box></Card>
  </Box></ThemeProvider></DashboardLayout>
}
