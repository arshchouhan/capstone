import { useState } from 'react'
import PlantLocationFields from './PlantLocationFields'
import { parsePlantCoordinates } from '../utils/plantCoordinates'
import PlantSatelliteInspection from './PlantSatelliteInspection'
import PlantLightMeter from './PlantLightMeter'
import InsectPhotoScanner from './InsectPhotoScanner'
import { api, formatScanConfidence } from '../services/api'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Link, TextField, Typography } from '@mui/material'
import { MdOutlineWaterDrop, MdOutlineWbSunny, MdOutlinePlace, MdOutlineGrass, MdOutlineBugReport } from 'react-icons/md'
const fields = [['notes', 'Overview / notes'], ['watering', 'Watering schedule'], ['location', 'Growing location']]
function formatDate(value, includeTime = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return ''
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
}

function DetailRows({ rows }) {
  return <Box component="dl" className="plant-classifications">
    {rows.map(([label, value]) => <Box key={label}>
      <Typography component="dt">{label}</Typography>
      <Typography component="dd">{value || 'Not recorded'}</Typography>
    </Box>)}
  </Box>
}

export default function PlantProfileInfo({ plantId, plant, onUpdated }) {
  const [editing, setEditing] = useState('')
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(plant)
  const [error, setError] = useState('')
  const [check, setCheck] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')
  const example = plant.exampleProfile
  const scan = plant.scanResults?.['Weed Identifier']
  const weed = scan || example?.weed
  const lightReading = plant.lightReading
  const insect = plant.scanResults?.['Insect Identifier']
  const diagnosis = plant.scanResults?.['Disease Identifier']?.findings?.[0]?.label
  const brightness = lightReading?.source === 'webcam-estimate' && Number.isFinite(lightReading.brightness)
    ? `${lightReading.brightness}/100 brightness · ${lightReading.sample ? 'example reading' : 'webcam estimate'}`
    : Number.isFinite(lightReading?.lux) ? `${lightReading.lux} lux` : ''
  const due = formatDate(plant.nextCare?.due)
  const plantDetails = [
    ['Plant name', plant.name], ['Scientific name', plant.scientific], ['Plant type', plant.type],
    ['Variety', plant.variety || (example?.variety && `${example.variety} · Sample variety`)],
    ['Family', example?.family], ['Growth habit', example?.growthForm], ['Date acquired', formatDate(plant.acquired)],
    ['Growing location', plant.location], ['Saved light conditions', plant.light], ['Health status', plant.status],
    ['Latest diagnosis', diagnosis],
    ['Last scan', formatDate(plant.lastScannedAt, true)],
    ['Next care', plant.nextCare?.type && due && `${plant.nextCare.type} · ${due}`],
  ].filter(([label, value]) => value || !['Family', 'Growth habit'].includes(label))
  const otherDetails = [
    ['Weed check', scan ? (scan.sample || scan.source === 'demo' ? 'Sample scan' : 'Completed') : weed ? 'Sample observation' : 'No weed scan saved'],
    ['Weed name', weed?.name],
    ['Weed scientific name', weed?.scientific],
    ['Weed scan notes', weed?.notes || 'No scan notes yet'],
  ]
  const checks = [
    { title: 'Light', Icon: MdOutlineWbSunny, action: 'Check light', rows: [
      ['Light level', lightReading && `${lightReading.category}${lightReading.sample ? ' · Sample' : ''}`],
      ['Reading', brightness], ['Checked', lightReading?.sample ? 'Sample reading' : formatDate(lightReading?.measuredAt, true)],
    ] },
    { title: 'Insect Identifier', Icon: MdOutlineBugReport, action: 'Scan for insects', rows: [
      ['Result', insect?.name ? `Possible match: ${insect.name}` : insect ? 'Insect not identified' : ''],
      ['Model confidence', formatScanConfidence(insect?.confidence)], ['Scanned', formatDate(insect?.scannedAt, true)],
      ...(insect?.notes ? [['Notes', insect.notes]] : []),
    ] },
  ]
  const aiCare = plant.aiCareRequirements
  const careValue = (key, guideKey = key) => aiCare?.[key] || example?.[guideKey] || 'Awaiting scan recommendations'
  const hasScanGuide = ['temperature', 'hardiness', 'light', 'soil', 'location'].some(key => aiCare?.[key])
  const coordinates = parsePlantCoordinates(draft.coordinates)
  function edit(section) {
    setDraft(plant)
    setError('')
    setEditing(section)
  }
  function closeEditor() {
    if (!locating && !saving) setEditing('')
  }
  function closeCheck() {
    if (!checking) setCheck('')
  }
  async function saveLight(reading) {
    setChecking(true)
    setCheckError('')
    try {
      const saved = await api(`/plants/${plantId}/light-readings`, { method: 'POST', body: reading })
      onUpdated({ lightReading: saved })
      setCheck('')
    } catch (err) { setCheckError(err.message) }
    finally { setChecking(false) }
  }
  async function save() {
    if (locating || saving || (editing === 'location' && coordinates === undefined)) return
    const body = editing === 'location'
      ? { location: draft.location, coordinates }
      : Object.fromEntries(fields.map(([key]) => [key, draft[key]]))
    setSaving(true)
    setError('')
    try {
      const updated = await api(`/plants/${plantId}`, { method: 'PATCH', body })
      onUpdated(updated)
      setEditing('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  return <>
    <Box className="plant-profile-info">
      <Box className="plant-profile-heading"><Typography component="h2">Plant info</Typography><Button onClick={() => edit('details')}>Edit details</Button></Box>
      <Box className="plant-profile-section">
        <Typography component="h3">Overview</Typography>
        {example?.overview && <Typography>{example.overview}</Typography>}
        <DetailRows rows={plantDetails} />
      </Box>
      {(!plant.notes || plant.notes !== diagnosis) && <Box className="plant-profile-section">
        <Typography component="h3">Plant notes</Typography>
        <Typography>{plant.notes || 'Add notes about this plant, its growth, and your observations.'}</Typography>
      </Box>}
      <Box className="plant-profile-section">
        <Typography component="h3">Watering schedule</Typography>
        <Box className="plant-info-inline"><MdOutlineWaterDrop /><Typography>{plant.watering || 'Not recorded'}</Typography></Box>
      </Box>
      <Box className="plant-profile-section">
        <Typography component="h3">Growing guide</Typography>
        <Typography className="plant-profile-source">
          {hasScanGuide ? (aiCare.source === 'demo' ? 'Sample scan recommendations' : 'From your latest plant scan') :
            example ? 'General care for this crop' : 'Scan this plant to receive care recommendations'}
        </Typography>
        <Box className="plant-requirements-grid">
          <Box><Typography component="h4">Temperature</Typography><Typography>{careValue('temperature')}</Typography></Box>
          <Box><Typography component="h4">Hardiness</Typography><Typography>{careValue('hardiness')}</Typography></Box>
          {[
            ['Sunlight', MdOutlineWbSunny, careValue('light')], ['Soil', MdOutlineGrass, careValue('soil')],
            ['Growing site', MdOutlinePlace, careValue('location', 'site')],
            ...(example?.watering ? [['Watering guidance', MdOutlineWaterDrop, example.watering]] : []),
          ].map(([label, Icon, detail]) => <Box className="plant-requirement-wide" key={label}>
            <span><Icon /></span><Box><Typography component="h4">{label}</Typography><Typography>{detail}</Typography></Box>
          </Box>)}
        </Box>
        {example?.sourceUrl && <Typography sx={{ mt: 1 }}><Link href={example.sourceUrl} target="_blank" rel="noreferrer">University of Minnesota Extension growing guide</Link></Typography>}
      </Box>
      <Box className="plant-profile-section">
        <Typography component="h3">Other details</Typography>
        <DetailRows rows={otherDetails} />
      </Box>
      <Box className="plant-profile-section">
        <Typography component="h3">Plant checks</Typography>
        <Box className="plant-profile-checks">
          {checks.map(({ title, Icon, action, rows }) => <Box className="plant-profile-check" key={title}>
            <Box className="plant-info-inline"><Icon aria-hidden /><Typography component="h4">{title}</Typography></Box>
            <DetailRows rows={rows} />
            <Button size="small" variant="outlined" onClick={() => { setCheckError(''); setCheck(title) }}>{action}</Button>
          </Box>)}
        </Box>
      </Box>
      <Dialog open={Boolean(check)} onClose={closeCheck} fullWidth maxWidth="sm">
        <DialogTitle>{check === 'Light' ? 'Light check' : check}</DialogTitle>
        <DialogContent>
          {check === 'Light' && <PlantLightMeter initialReading={lightReading} onMeasured={saveLight} onBack={closeCheck} saving={checking} />}
          {check === 'Insect Identifier' && <InsectPhotoScanner plantId={plantId} initial={insect} onBusyChange={setChecking}
            onComplete={record => onUpdated(current => ({ scanResults: { ...current.scanResults, 'Insect Identifier': record } }))} />}
          {checkError && <Typography role="alert" color="error">{checkError}</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={closeCheck} disabled={checking}>Close</Button></DialogActions>
      </Dialog>
      <Dialog open={Boolean(editing)} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editing === 'location' ? 'Plant location' : 'Edit plant information'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            {(editing === 'location' ? fields.filter(([key]) => key === 'location') : fields).map(([key, label]) =>
              <TextField key={key} size="small" label={label} value={draft[key] || ''} disabled={saving}
                onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))}
                multiline={key === 'notes'} minRows={key === 'notes' ? 2 : undefined} />)}
            {editing === 'location' && <PlantLocationFields value={draft.coordinates} disabled={saving} onLocating={setLocating}
              onChange={value => setDraft(current => ({ ...current, coordinates: value }))} />}
          </Box>
          {error && <Typography role="alert" color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={locating || saving}>Cancel</Button>
          <Button onClick={save} disabled={locating || saving || (editing === 'location' && coordinates === undefined)}>
            {saving ? 'Saving…' : editing === 'location' ? 'Save location' : 'Save details'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    <PlantSatelliteInspection
      key={`${plant.coordinates?.latitude},${plant.coordinates?.longitude}`}
      plantId={plantId} coordinates={plant.coordinates} onEdit={() => edit('location')} />
  </>
}
