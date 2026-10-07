import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CssBaseline, FormControl, InputLabel, MenuItem, Select, Stack, TextField, ThemeProvider, Typography, createTheme, Chip, CardActionArea, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { FaArrowLeft, FaLeaf, FaPlus } from 'react-icons/fa'
import { MdOutlineCenterFocusStrong, MdOutlineHealthAndSafety, MdOutlineGrass, MdOutlineWaterDrop, MdOutlineSearch, MdOutlineWbSunny } from 'react-icons/md'
import PlantLightMeter from '../components/PlantLightMeter'
import InlinePlantScanner from '../components/InlinePlantScanner'
import DashboardLayout from '../components/DashboardLayout'

import './MyPlants.css'
import chooseToolsIllustration from '../assets/choose-plant-tools.png'
import { api } from '../services/api'

const theme = createTheme({ palette: { primary: { main: '#355b7a' }, text: { primary: '#172846', secondary: '#71819c' } }, typography: { fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 13, h4: { fontSize: '28px', lineHeight: 1.15 } }, shape: { borderRadius: 10 } })
const requiredScans = ['Plant Identifier', 'Disease Identifier', 'Weed Identifier']
const types = ['Herb', 'Vegetable', 'Indoor', 'Flowering', 'Succulent', 'Other']

export default function RegisterPlant() {
  const navigate = useNavigate()
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
  const [aiCareRequirements, setAiCareRequirements] = useState(null)
  const [lightReading, setLightReading] = useState(null)
  const [scanResults, setScanResults] = useState({})
  const remainingScans = requiredScans.filter(tool => !scanResults[tool])
  const scanCompleted = remainingScans.length === 0
  const [scannerTool, setScannerTool] = useState('')
  const [leaveAfterEnd, setLeaveAfterEnd] = useState(false)
  const [endToolOpen, setEndToolOpen] = useState(false)
  useEffect(() => {
    if (!scannerTool) return
    const guardReload = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', guardReload)
    return () => window.removeEventListener('beforeunload', guardReload)
  }, [scannerTool])
  const [waterOpen, setWaterOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const submit = async () => {
    if (!name.trim() || !scanCompleted) return
    const item = { id: Date.now(), name: name.trim(), scientific: scientific.trim() || 'Plant profile', type, status: 'Healthy', scan: 'Not scanned', ago: 'Add a scan', care: 'Set a care task', due: 'Not scheduled', initials: name.trim().split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase(), variety, location, acquired, light, watering, notes, aiCareRequirements, scanResults, lightReading }
    setSaving(true); setSaveError('')
    try { await api('/plants',{method:'POST',body:{...item,scanIds:Object.values(scanResults).map(scan=>scan.scanId), lightReading}}); navigate('/farm/dashboard/crops') }
    catch(err) { setSaveError(err.message) } finally { setSaving(false) }
  }
  return <DashboardLayout className="plants-dashboard" dashboardPath="/farm/dashboard"><ThemeProvider theme={theme}><CssBaseline /><Box className="plant-register-page">
    <Box className="plant-register-header"><Button size="small" startIcon={<FaArrowLeft />} onClick={() => { if (scannerTool) { setLeaveAfterEnd(true); setEndToolOpen(true) } else navigate('/farm/dashboard/crops') }} sx={{ px: 0, mb: .5, textTransform: 'none', fontWeight: 700, fontSize: 12 }}>Back to My Plants</Button></Box>
    <Card variant="outlined" className="plant-register-form" sx={{ borderColor: '#e3eaf2', p: 0, '& .MuiInputBase-input, & .MuiSelect-select': { fontSize: 13 }, '& .MuiInputLabel-root': { fontSize: 12 } }}><Box className="plant-register-grid"><Box className="plant-register-fields">
      <Box className="plant-form-section"><Typography className="plant-section-title"><FaLeaf /> Plant profile</Typography><Stack spacing={1.5}><TextField autoFocus required size="small" label="Plant name" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Balcony basil" fullWidth /><Stack direction="row" spacing={1.5}><FormControl size="small" fullWidth><InputLabel id="plant-type-label">Plant type</InputLabel><Select labelId="plant-type-label" value={type} label="Plant type" onChange={event => setType(event.target.value)}>{types.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><TextField size="small" label="Variety" value={variety} onChange={event => setVariety(event.target.value)} placeholder="Optional" fullWidth /></Stack><TextField size="small" label="Scientific name" value={scientific} onChange={event => setScientific(event.target.value)} placeholder="Optional" fullWidth /><TextField size="small" label="Where is it growing?" value={location} onChange={event => setLocation(event.target.value)} placeholder="e.g. Sunny balcony" fullWidth /><TextField size="small" type="date" label="Date acquired" value={acquired} onChange={event => setAcquired(event.target.value)} slotProps={{ inputLabel: { shrink: true, sx: { backgroundColor: '#fff', px: .5 } }, htmlInput: { sx: { pt: '14px', pb: '6px' } } }} fullWidth /></Stack></Box>
      <Box className="plant-form-section"><Typography className="plant-section-title"><FaLeaf /> Care preferences</Typography><Stack spacing={1.5}><FormControl size="small" fullWidth><InputLabel id="light-label">Light conditions</InputLabel><Select labelId="light-label" value={light} label="Light conditions" onChange={event => setLight(event.target.value)}>{['Full sun', 'Bright indirect light', 'Partial shade', 'Low light'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><FormControl size="small" fullWidth><InputLabel id="watering-label">Watering schedule</InputLabel><Select labelId="watering-label" value={watering} label="Watering schedule" onChange={event => setWatering(event.target.value)}>{['Daily', 'Every 2–3 days', 'When top soil is dry', 'Weekly'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl><TextField size="small" label="Notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Care notes, current condition, or anything useful to remember…" multiline minRows={2} fullWidth /></Stack></Box>
</Box><Box className="plant-register-tools"><Box className="required-scan-progress"><Typography>Required scans · {3 - remainingScans.length}/3 complete</Typography><Box>{requiredScans.map((tool, index) => <Chip key={tool} size="small" label={`${scanResults[tool] ? '✓' : index + 1} ${tool.replace(' Identifier', '')}`} onClick={() => setScannerTool(tool)} variant={scanResults[tool] ? 'filled' : 'outlined'} />)}</Box></Box>{scannerTool === 'Light' ? <PlantLightMeter initialReading={lightReading} onMeasured={setLightReading} onBack={() => { setLeaveAfterEnd(false); setEndToolOpen(true) }} /> : scannerTool ? <InlinePlantScanner key={scannerTool} title={scannerTool} remainingScans={remainingScans} onNextScan={setScannerTool} onScanComplete={details => { setScanResults(current => ({ ...current, [scannerTool]: details })); if (scannerTool === 'Plant Identifier' || scannerTool === 'Plant Finder') { setName(details.name); setScientific(details.scientific); setType(details.type); setLight(details.light); setWatering(details.watering); setNotes(details.notes); setAiCareRequirements(details.aiCareRequirements) } }} onBack={() => { setLeaveAfterEnd(false); setEndToolOpen(true) }} /> : <><Box className="plant-tools-intro"><Box component="img" src={chooseToolsIllustration} alt="" /><Box><Typography component="h2">Choose a tool</Typography><Typography>Identify your plant, check its health, or explore care tools.</Typography></Box></Box><Box className="plant-register-tools-grid">{[
['Plant Identifier', MdOutlineCenterFocusStrong, '#087e73', 'scan'], ['Disease Identifier', MdOutlineHealthAndSafety, '#087e73', 'scan'], ['Weed Identifier', MdOutlineGrass, '#087e73', 'scan'], ['Water Meter', MdOutlineWaterDrop, '#087e73', 'water'], ['Plant Finder', MdOutlineSearch, '#087e73', 'future'], ['Light', MdOutlineWbSunny, '#087e73', 'light'],
].map(([label, Icon, color, action]) => <Card key={label} elevation={0}><CardActionArea disabled={action === 'future'} onClick={() => action === 'water' ? setWaterOpen(true) : action === 'expert' ? navigate('/farm/dashboard/schedule') : setScannerTool(label)}><Box className="plant-tool-icon"><Icon style={{ color }} /></Box><Typography component="h3">{label}</Typography>{action === 'future' && <Typography className="tool-required-label">Coming soon · Future scope</Typography>}{requiredScans.includes(label) && <Typography className="tool-required-label">{scanResults[label] ? 'Scan complete' : 'Required scan'}</Typography>}</CardActionArea></Card>)}</Box></>}</Box>      {saveError && <Typography role="alert" color="error">{saveError}</Typography>}<Stack className="plant-register-actions" direction="row" justifyContent="flex-end" spacing={1.5}><Button color="inherit" onClick={() => { if (scannerTool) { setLeaveAfterEnd(true); setEndToolOpen(true) } else navigate('/farm/dashboard/crops') }}>Cancel</Button><Button variant="contained" disabled={saving || !name.trim() || !scanCompleted} onClick={submit} startIcon={<FaPlus />} sx={{ textTransform: 'none', fontWeight: 700 }}>{saving ? 'Saving…' : 'Register plant'}</Button></Stack>
    </Box></Card>
<Dialog open={endToolOpen} onClose={() => setEndToolOpen(false)}><DialogTitle>End this tool session?</DialogTitle><DialogContent><Typography>Returning to tools closes the scanner. Details already filled into your plant profile will remain.</Typography></DialogContent><DialogActions><Button onClick={() => setEndToolOpen(false)}>Keep working</Button><Button variant="contained" onClick={() => { setEndToolOpen(false); setScannerTool(''); if (leaveAfterEnd) navigate('/farm/dashboard/crops') }}>End session</Button></DialogActions></Dialog><Dialog open={waterOpen} onClose={() => setWaterOpen(false)}><DialogTitle>Check soil moisture</DialogTitle><DialogContent><Typography>Check the top layer of soil by touch before watering, using the care needs of your plant. This is a manual check; no moisture sensor is connected.</Typography></DialogContent><DialogActions><Button onClick={() => setWaterOpen(false)}>Done</Button></DialogActions></Dialog></Box></ThemeProvider></DashboardLayout>
}
