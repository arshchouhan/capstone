import { useState } from 'react'
import { api } from '../services/api'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material'
import { MdOutlineWaterDrop, MdOutlineWbSunny, MdOutlinePlace, MdOutlineGrass } from 'react-icons/md'
const fields = [['notes', 'Overview / notes'], ['watering', 'Watering schedule'], ['location', 'Growing location']]
export default function PlantProfileInfo({ plantId, plant }) {
  const [profile, setProfile] = useState(plant)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [error, setError] = useState('')
  const weed = plant.scanResults?.['Weed Identifier']
  const lightReading = plant.lightReading
  const otherDetails = [
    ['Weed scan', weed ? 'Completed · demo scan' : 'No weed scan saved'],
    ['Identified weed', weed?.name || 'Awaiting weed scan'],
    ['Weed scientific name', weed?.scientific || 'Awaiting weed scan'],
    ['Weed scan notes', weed?.notes || 'No scan notes yet'],
    ['Light level', lightReading?.category || 'No light measurement saved'],
    ['Light reading', lightReading ? lightReading.source === 'webcam-estimate' ? `${lightReading.brightness}/100 brightness · webcam estimate` : `${lightReading.lux} lux` : 'Awaiting light check'],
    ['Light checked', lightReading?.measuredAt ? new Date(lightReading.measuredAt).toLocaleString() : 'Not measured yet'],
  ]
  const aiCare = plant.aiCareRequirements
  const careValue = key => aiCare?.[key] || 'Awaiting scan recommendations'
  const value = key => profile[key] || 'Not provided'
  const save = async () => { try { const updated=await api(`/plants/${plantId}`,{method:'PATCH',body:draft});setProfile(updated);setEditing(false);setError('') }catch(err){setError(err.message)} }
  return <Box className="plant-profile-info"><Box className="plant-profile-heading"><Typography component="h2">Plant info</Typography><Button onClick={() => { setDraft(profile); setEditing(true) }}>Edit details</Button></Box><Typography className="plant-profile-source">Your plant profile · details you provide</Typography><Box className="plant-profile-section"><Typography component="h3">Overview</Typography><Typography>{profile.notes || 'Add notes about this plant, its growth, and your observations.'}</Typography></Box><Box className="plant-profile-section"><Typography component="h3">Watering</Typography><Box className="plant-info-inline"><MdOutlineWaterDrop /><Typography>{value('watering')}</Typography></Box></Box><Box className="plant-profile-section"><Typography component="h3">AI care requirements</Typography><Typography className="plant-profile-source">{aiCare?.source === 'demo' ? 'Demo scan recommendations · verify before applying' : aiCare ? 'From your latest plant scan' : 'Scan this plant to receive care recommendations'}</Typography><Box className="plant-requirements-grid"><Box><Typography component="h4">Temperature</Typography><Typography>{careValue('temperature')}</Typography></Box><Box><Typography component="h4">Hardiness zone</Typography><Typography>{careValue('hardiness')}</Typography></Box>{[['light', 'Sunlight', MdOutlineWbSunny], ['soil', 'Soil', MdOutlineGrass], ['location', 'Location', MdOutlinePlace]].map(([key, label, Icon]) => <Box className="plant-requirement-wide" key={key}><span><Icon /></span><Box><Typography component="h4">{label}</Typography><Typography>{careValue(key)}</Typography></Box></Box>)}</Box></Box><Box className="plant-profile-section"><Typography component="h3">Other details</Typography><Typography className="plant-profile-source">Results from your weed scan and light check</Typography><Box component="dl" className="plant-classifications">{otherDetails.map(([label, detail]) => <Box key={label}><Typography component="dt">{label}</Typography><Typography component="dd">{detail}</Typography></Box>)}</Box></Box><Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="sm"><DialogTitle>Edit plant information</DialogTitle><DialogContent><Typography sx={{ mb: 2 }} fontSize={12}>Add your own care preferences and known plant details.</Typography><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>{fields.map(([key, label]) => <TextField key={key} size="small" label={label} value={draft[key] || ''} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} multiline={key === 'notes'} minRows={key === 'notes' ? 2 : undefined} />)}</Box>{error && <Typography color="error">{error}</Typography>}</DialogContent><DialogActions><Button onClick={() => setEditing(false)}>Cancel</Button><Button onClick={save}>Save details</Button></DialogActions></Dialog></Box>
}

