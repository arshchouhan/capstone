import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { MdOutlineAddPhotoAlternate, MdOutlineArrowBack, MdOutlineCenterFocusStrong } from 'react-icons/md'
import { runScan, fileData } from '../services/api'

export default function InlinePlantScanner({ title, onBack, onScanComplete, remainingScans = [], onNextScan }) {
  const input = useRef(null)
  const timer = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanStage, setScanStage] = useState(0)
  useEffect(() => {
    if (!loading) return
    const stages = setInterval(() => setScanStage(stage => Math.min(stage + 1, 2)), 3000)
    return () => clearInterval(stages)
  }, [loading])
  const stageLabels = ['Preparing the image', 'Reviewing sample plant features', 'Preparing editable profile details']
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  useEffect(() => () => { if (photo?.url) URL.revokeObjectURL(photo.url) }, [photo])
  useEffect(() => () => clearTimeout(timer.current), [])
  const choose = file => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Choose a JPG, PNG or WebP image under 10 MB.'); return }
    clearTimeout(timer.current); setLoading(false); setPhoto({ file, url: URL.createObjectURL(file) }); setResult(null); setError('')
  }
  const scan = () => {
    setScanStage(0); setLoading(true); setError('')
    timer.current = setTimeout(async () => {
      try {
      const demo = title === 'Weed Identifier' ? { name: 'Dandelion', scientific: 'Taraxacum officinale', type: 'Other', light: 'Full sun', watering: 'When top soil is dry', notes: 'Demo weed identification. Review details before registering.' } : { name: 'Basil', scientific: 'Ocimum basilicum', type: 'Herb', light: 'Bright indirect light', watering: 'When top soil is dry', notes: title === 'Disease Identifier' ? 'Demo disease scan complete. No real diagnosis has been made; inspect the plant and verify its condition.' : 'Demo plant identification. Review details before registering.' }
      demo.aiCareRequirements = { temperature: '18–28 °C', hardiness: 'Not assessed in this demo', light: demo.light, soil: 'Well-draining potting mix', location: title === 'Weed Identifier' ? 'Outdoor' : 'Bright, sheltered growing spot', source: 'demo' }
      demo.scannedAt = new Date().toISOString()
      const saved = await runScan({kind:title,images:[await fileData(photo.file)]})
      const details = {...saved.result, scannedAt:saved.completedAt,scanId:saved.id,photos:saved.photos}
      setResult(details); onScanComplete(details); setLoading(false)
      } catch(err) { setError(err.message); setLoading(false) }
    }, 9000)
  }
  const edit = (field, value) => { const updated = { ...result, [field]: value }; setResult(updated); onScanComplete(updated) }
  return <Box className="inline-tool-scanner"><Button startIcon={<MdOutlineArrowBack />} onClick={onBack}>Back to tools</Button><Typography component="h2">{result ? 'Scan details' : title}</Typography><Alert severity="info" sx={{ mb: 2 }}>Demo scan · sample results, not live AI identification.</Alert>{result ? <Stack spacing={1.5}><Typography className="inline-scanner-description">These editable details have filled the registration form.</Typography><TextField size="small" label="Plant name" required value={result.name} onChange={event => edit('name', event.target.value)} /><TextField size="small" label="Scientific name" value={result.scientific} onChange={event => edit('scientific', event.target.value)} /><TextField select size="small" label="Plant type" value={result.type} onChange={event => edit('type', event.target.value)}>{['Herb', 'Vegetable', 'Indoor', 'Flowering', 'Succulent', 'Other'].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField><TextField size="small" label="Light conditions" value={result.light} onChange={event => edit('light', event.target.value)} /><TextField size="small" label="Watering schedule" value={result.watering} onChange={event => edit('watering', event.target.value)} /><TextField size="small" multiline minRows={2} label="Scan notes" value={result.notes} onChange={event => edit('notes', event.target.value)} /><Alert severity={remainingScans.length ? 'info' : 'success'}>{remainingScans.length ? `Still required: ${remainingScans.map(tool => tool.replace(' Identifier', '')).join(', ')}.` : 'All required scans complete. You can register your plant.'}</Alert>{remainingScans.length > 0 && <Button variant="contained" onClick={() => onNextScan?.(remainingScans[0])}>Continue to {remainingScans[0]}</Button>}<Button onClick={() => setResult(null)}>Scan another photo</Button></Stack> : <><Typography className="inline-scanner-description">Choose a clear, well-lit photo to try the scan flow.</Typography><input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { choose(event.target.files?.[0]); event.target.value = '' }} /><Box className={`inline-scanner-stage ${loading ? 'is-scanning' : ''}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!loading) choose(event.dataTransfer.files[0]) }}>{photo ? <><Box component="img" src={photo.url} alt="Selected plant for demo scan" />{loading && <><span className="inline-scan-beam" aria-hidden="true" /><Box className="inline-scan-overlay"><span className="inline-scan-pulse" /><Typography>{stageLabels[scanStage]}</Typography><Typography variant="caption">Demo scan</Typography></Box></>}</> : <><MdOutlineCenterFocusStrong /><Typography>Drop a plant photo here</Typography><Typography variant="caption">JPG, PNG or WebP · up to 10 MB</Typography></>}</Box><Stack direction="row" spacing={1} sx={{ my: 2 }}><Button variant="outlined" startIcon={<MdOutlineAddPhotoAlternate />} disabled={loading} onClick={() => input.current.click()}>{photo ? 'Change photo' : 'Choose photo'}</Button>{photo && <Button variant="contained" disabled={loading} onClick={scan}>{loading ? 'Scanning…' : 'Run demo scan'}</Button>}</Stack>{loading && <Box role="status" aria-label="Demo scan in progress"><Box className="inline-scan-stages">{stageLabels.map((label, index) => <Box key={label} className={index < scanStage ? 'complete' : index === scanStage ? 'active' : ''}><span>{index < scanStage ? '✓' : index + 1}</span><Typography>{label}</Typography></Box>)}</Box><Skeleton height={44} /><Skeleton height={44} /><Skeleton height={44} /></Box>}{error && <Alert severity="info">{error}</Alert>}</>}</Box>
}
