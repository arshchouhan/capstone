import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RecoveryCheck from './RecoveryCheck'
import useApiData from '../hooks/useApiData'
import { api, askScanChat, fileData, formatScanConfidence, mediaUrl, scanChat, uploadPhoto } from '../services/api'

import { Alert, Box, Button, Chip, Checkbox, CircularProgress, Dialog, IconButton, LinearProgress, Typography } from '@mui/material'

import { MdOutlineTaskAlt, MdOutlineSchedule, MdOutlineSentimentSatisfied, MdOutlineHealthAndSafety, MdOutlineCenterFocusStrong, MdOutlineDescription, MdOutlineCameraAlt, MdOutlineOpenInFull, MdOutlineVisibility, MdOutlineVisibilityOff, MdOutlineAutoAwesome, MdClose, MdAttachFile, MdOutlineCheckCircle, MdOutlineLocationOn, MdOutlineOpenInNew, MdOutlineTravelExplore, MdOutlineStar, MdOutlineThermostat, MdOutlineWbSunny, MdOutlineLandscape, MdOutlineWarningAmber, MdOutlinePhone, MdOutlineLanguage, MdOutlineVerified } from 'react-icons/md'
export default function PlantAnalysis({ plantId, plant, photos = [], photoIndex = 0, onRecoveryComplete, historical = false, showScanActions = false }) {
  const navigate = useNavigate()
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showMarks, setShowMarks] = useState(true)
  const [selected, setSelected] = useState(null)
  const [liveReference, setLiveReference] = useState(null)
  const [plantReference, setPlantReference] = useState(null)
  const [referenceLoading, setReferenceLoading] = useState(Boolean(plant.scanId))
  const analysisGridRef = useRef(null)
  const [analysisScrollActive, setAnalysisScrollActive] = useState(false)
  const workspaceStorageKey = `plantaexa:scan-workspace:${plantId}`
  const [workspaceOpen, setWorkspaceOpen] = useState(() => showScanActions && window.localStorage.getItem(workspaceStorageKey) === 'open')
  const openWorkspace = () => {
    window.localStorage.setItem(workspaceStorageKey, 'open')
    setWorkspaceOpen(true)
  }
  const closeWorkspace = () => {
    window.localStorage.removeItem(workspaceStorageKey)
    setWorkspaceOpen(false)
  }
  const registerSavedScan = () => {
    if (!plant.scanId) return
    navigate('/farm/dashboard/crops/register', { state: { scan: {
      id: plant.scanId,
      kind: 'Disease Identifier',
      name: plant.name,
      scientific: plant.scientific,
      type: plant.type,
      light: plant.light,
      watering: plant.watering,
      notes: plant.notes,
      summary: plant.summary,
      source: plant.source,
      status: plant.status,
      confidence: plant.confidence,
      score: plant.score,
      aiCareRequirements: plant.aiCareRequirements,
    } } })
  }
  const root = `/plants/${plantId}/treatment-plans`
  const {data:plans,reload:reloadPlan} = useApiData(historical ? null : root)
  const completedTasks = historical ? [] : plans[0]?.completed || []
  const [taskSaveError, setTaskSaveError] = useState(false)
  const treatmentTasks = [
    { id: 'light', title: 'Review the growing spot', timing: 'Today', description: 'Check your saved light reading and compare the placement with this plant’s care requirements. If leaves appear scorched, review exposure before changing its location.' },
    { id: 'moisture', title: 'Check soil moisture and drainage', timing: 'Today', description: 'Check the top layer of soil before watering. Follow the plant’s watering schedule and check that the pot drains freely; avoid leaving water collected at the base.' },
    { id: 'leaves', title: 'Inspect faded or damaged leaves', timing: 'In 3 days', description: 'Look closely at older leaves and new growth. Photograph any changes and review which leaves are damaged before deciding whether pruning is needed.' },
    { id: 'followup', title: 'Review recovery and new growth', timing: 'In 7 days', description: 'Compare a new photo with this one, note changes in leaf colour and growth, and update the plant’s notes. Reassess the care plan if symptoms continue.' },
  ]
  const toggleTask = async taskId => {
    const completed=completedTasks.includes(taskId)?completedTasks.filter(id=>id!==taskId):[...completedTasks,taskId]
    try{await api(plans[0]?`${root}/${plans[0].id}`:root,{method:plans[0]?'PATCH':'POST',body:{completed}});await reloadPlan();setTaskSaveError(false)}catch{setTaskSaveError(true)}
  }
  const scan = plant.scanResults?.['Disease Identifier']
  const score = Number.isFinite(plant.score) ? Math.max(0, Math.min(100, plant.score)) : null
  const confidence = Number.isFinite(plant.confidence) ? Math.max(0, Math.min(100, plant.confidence)) : null
  const confidenceLabel = formatScanConfidence(confidence)
  const scanNeedsReview = plant.modelNeedsReview || ['Needs review', 'Needs better photo'].includes(plant.status)
  const scoreMessage = scanNeedsReview
    ? confidence === null
      ? 'The model could not assess this scan. Try a well-lit close-up of one leaf.'
      : 'The model returned competing or weak matches. Any scores shown are tentative.'
    : 'This saved scan has no usable confidence score. Run a new scan to check the photo again.'
  const progressConfidence = confidence === null ? 0 : confidence
  const isAi = plant.source === 'ai' || plant.aiCareRequirements?.source?.startsWith('Hugging Face')
  const [displayScore, setDisplayScore] = useState(0)
  useEffect(() => {
    if (score === null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplayScore(score); return }
    setDisplayScore(0)
    let frame
    const started = performance.now()
    const animate = now => {
      const progress = Math.min((now - started) / 1800, 1)
      setDisplayScore(Math.round(score * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])
  useEffect(() => {
    const updateScrollMode = () => {
      const rect = analysisGridRef.current?.getBoundingClientRect()
      if (!rect) return
      setAnalysisScrollActive(rect.top <= 18 && rect.bottom > Math.min(window.innerHeight, 260))
    }
    updateScrollMode()
    window.addEventListener('scroll', updateScrollMode, { passive: true })
    window.addEventListener('resize', updateScrollMode)
    return () => { window.removeEventListener('scroll', updateScrollMode); window.removeEventListener('resize', updateScrollMode) }
  }, [])
  const findings = Array.isArray(scan?.findings) ? scan.findings : (Array.isArray(plant.notes) ? plant.notes.map(note => ({ label: note })) : [])
  const photo = plant.analysisPhoto || photos[photoIndex] || plant.image
  const needsCare = ['Needs Care','At Risk'].includes(plant.status)
  const healthBadge = needsCare
    ? { label: 'Needs attention', tone: 'is-warning', icon: <MdOutlineWarningAmber /> }
    : plant.status === 'Healthy'
      ? { label: 'Healthy', tone: 'is-healthy', icon: <MdOutlineCheckCircle /> }
      : { label: plant.status || 'Awaiting scan', tone: 'is-pending', icon: <MdOutlineSchedule /> }
  const care = plant.aiCareRequirements || {}
  const analysisFields = [
    ['Diagnosis', findings[0]?.label || 'Not confirmed'],
    ['Status', plant.status || 'Not assessed'],
    ['Confidence', confidenceLabel || 'Not available'],
    ['Plant type', plant.type || 'Not confirmed'],
    ['Light', care.light || plant.light || 'Not assessed'],
    ['Watering', care.watering || plant.watering || 'Not assessed'],
    ['Temperature', care.temperature || 'Not assessed'],
    ['Soil', care.soil || 'Not assessed'],
  ]
  const imageReview = <Box className="analysis-photo-stage">{photo ? <img src={photo} alt={`${plant.name || 'Plant'} being reviewed`} /> : <Typography>No scan photo saved yet.</Typography>}{showMarks && findings.map((finding, index) => finding.region && <button key={index} className={`analysis-region ${selected === index ? 'selected' : ''}`} aria-label={`Review finding ${index + 1}: ${finding.label}`} onClick={() => setSelected(index)} style={{ left: `${finding.region.x}%`, top: `${finding.region.y}%`, width: `${finding.region.width}%`, height: `${finding.region.height}%` }}><span className="analysis-region-pin">{index + 1}</span><span className="analysis-region-label">{finding.label}</span></button>)}</Box>
  if (showScanActions && workspaceOpen) return <ScanWorkspace plant={plant} findings={findings} photo={photo} onClose={closeWorkspace} />
  return <Box className="plant-diagnosis">
    <Box className="diagnosis-title">
      <Box>
        <Typography component="h2">{historical ? 'Saved scan result' : 'Diagnosis results'}</Typography>
        <Typography>{historical ? 'Review this scan as its own complete result.' : 'Review your plant’s health and next care step.'}</Typography>
      </Box>
      {showScanActions ? (
        <Box className="diagnosis-title-actions">
          {plant.scanId && !plant.registeredPlantId && (
            <Button className="register-scan-action" variant="outlined" startIcon={<MdOutlineCheckCircle />} onClick={registerSavedScan}>Register</Button>
          )}
          <Button className="open-scan-workspace" startIcon={<MdOutlineAutoAwesome />} onClick={openWorkspace}>Ask AI</Button>
        </Box>
      ) : !historical && (
        <Box className="diagnosis-title-actions">
          <Chip size="small" label={isAi ? 'Pretrained AI scan' : 'Demo scan'} />
        </Box>
      )}
    </Box>
    <Box className={`diagnosis-health ${needsCare ? 'needs-care' : ''}`}><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineHealthAndSafety /></span><Typography component="h3">Plant health assessment</Typography><Chip className={`diagnosis-health-status ${healthBadge.tone}`} variant="outlined" size="small" icon={healthBadge.icon} label={healthBadge.label} /></Box><Box className="diagnosis-health-body"><Box className="diagnosis-score"><Box className="diagnosis-score-ring" title={score !== null && isAi ? 'Model support for a healthy leaf among the identified crop’s classes' : undefined}><CircularProgress variant="determinate" value={100} size={104} thickness={4} className="score-track" /><CircularProgress variant="determinate" value={score === null ? 0 : displayScore} size={104} thickness={4} /><Box><strong>{score === null ? '—' : displayScore}</strong>{score !== null && <Typography>/100</Typography>}</Box></Box><Typography>{score === null ? 'Health score unavailable' : scanNeedsReview ? 'Tentative health score' : isAi ? 'AI health score' : 'Sample health score'}</Typography></Box><Box className="diagnosis-health-meta"><Box className="diagnosis-confidence"><Box className="confidence-heading"><MdOutlineAutoAwesome aria-hidden="true" /><Typography>Analysis<br />confidence</Typography><Chip size="small" label={confidenceLabel ? `${confidenceLabel} · ${scanNeedsReview ? 'Tentative' : isAi ? 'Pretrained AI' : 'Demo'}` : 'Not available'} /></Box><LinearProgress variant="determinate" value={progressConfidence} aria-label={confidenceLabel ? `Analysis confidence ${confidenceLabel}` : 'Analysis confidence unavailable'} /></Box><Chip size="small" icon={<MdOutlineCameraAlt />} label={`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} available`} /></Box></Box>{isAi && (confidence === null || scanNeedsReview) && <Alert severity="info">{scoreMessage}</Alert>}</Box>
    <Box ref={analysisGridRef} className={`diagnosis-content-grid ${analysisScrollActive ? 'analysis-scroll-active' : ''}`}><Box className="diagnosis-card"><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineCenterFocusStrong /></span><Typography component="h3">Where we see it</Typography><IconButton aria-label={showMarks ? 'Hide marked areas' : 'Show marked areas'} onClick={() => setShowMarks(value => !value)}>{showMarks ? <MdOutlineVisibility /> : <MdOutlineVisibilityOff />}</IconButton><IconButton aria-label="Expand review photo" onClick={() => setExpanded(true)} disabled={!photo}><MdOutlineOpenInFull /></IconButton></Box>{imageReview}<Typography className="diagnosis-help">{findings.some(finding => finding.region) ? 'The highlighted area is an approximate model region. Select it or a finding below for details.' : 'Photo reference only. This scan did not return a precise location.'}</Typography></Box>
    <Box className="diagnosis-detail-stack">
      <PlantOverview scanId={plant.status === 'Needs review' || plant.status === 'Needs better photo' ? undefined : plant.scanId} plantName={plant.name} diagnosis={findings[0]?.label} onProfile={setLiveReference} onPlantProfile={setPlantReference} onLoading={setReferenceLoading} />
      <Box className="diagnosis-card diagnosis-summary">
        <Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineDescription /></span><Typography component="h3">Analysis summary</Typography><Chip className={`analysis-summary-status ${healthBadge.tone}`} size="small" icon={healthBadge.icon} label={needsCare ? 'Action needed' : plant.status === 'Healthy' ? 'Healthy' : 'Review results'} /></Box>
        <Typography className="diagnosis-summary-label"><MdOutlineAutoAwesome /> {historical ? 'Scan analysis' : 'AI analysis'}</Typography>
        {referenceLoading && diseaseName(findings[0]?.label) && <Box className="diagnosis-disease-brief diagnosis-disease-loading"><span className="diagnosis-disease-icon"><CircularProgress size={15} /></span><Typography>Loading disease overview…</Typography></Box>}
        {liveReference?.kind === 'disease' && <><Box className="diagnosis-disease-brief"><span className="diagnosis-disease-icon"><MdOutlineHealthAndSafety /></span><Box><Typography component="h4">About {liveReference.commonName}</Typography><Typography>{liveReference.overview}</Typography></Box>{liveReference.sourceUrl && <Button component="a" href={liveReference.sourceUrl} target="_blank" rel="noreferrer" size="small" endIcon={<MdOutlineOpenInNew />}>Learn more</Button>}</Box><ScientificClassification classification={plantReference?.classification} /></>}
        {liveReference?.kind !== 'disease' && <Box className="diagnosis-fact-grid diagnosis-result-fields">{analysisFields.map(([label, value]) => <Box key={label}><strong>{label}</strong><span>{value}</span></Box>)}</Box>}
        {care.source?.startsWith('AgriSmart') && (
          <Box className="diagnosis-help">
            {findings[0]?.description && <Typography>{findings[0].description}</Typography>}
            {typeof plant.notes === 'string' && plant.notes && <Typography>{plant.notes}</Typography>}
          </Box>
        )}
        <CareRequirements care={care} plant={plant} />
      </Box>
      {plant.scanId && <BotanistRecommendations scanId={plant.scanId} plantName={plant.name} diagnosis={findings[0]?.label || plant.status} />}
    </Box></Box>
    {!historical && <Box component="section" className="diagnosis-treatment"><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineTaskAlt /></span><Box><Typography component="h3">Treatment plan</Typography><Typography className="diagnosis-help">Sample care checklist · review for your plant</Typography></Box><Chip size="small" label={`${treatmentTasks.filter(task => completedTasks.includes(task.id)).length}/${treatmentTasks.length} complete`} /></Box><Box className="treatment-task-grid">{treatmentTasks.map(task => <Box key={task.id} className={`treatment-task ${completedTasks.includes(task.id) ? 'is-complete' : ''}`}><Checkbox size="small" checked={completedTasks.includes(task.id)} onChange={() => toggleTask(task.id)} inputProps={{ 'aria-label': `Complete: ${task.title}` }} /><Box className="treatment-task-content"><Box className="treatment-task-heading"><Typography component="h4">{task.title}</Typography><Chip size="small" icon={<MdOutlineSchedule />} label={task.timing} /></Box><Typography>{task.description}</Typography></Box></Box>)}</Box>{taskSaveError && <Typography role="alert" className="diagnosis-help">Could not save progress. Please retry.</Typography>}</Box>}
{!historical && <><Box className="analysis-recovery-actions"><Button variant="contained" startIcon={<MdOutlineCameraAlt />} onClick={() => setRecoveryOpen(true)}>Check on recovery</Button><Button component={Link} to="/farm/dashboard/scan">Check another plant</Button></Box><RecoveryCheck plantId={plantId} onComplete={result => { setRecoveryOpen(false); onRecoveryComplete?.(result) }} completedTasks={treatmentTasks.filter(task => completedTasks.includes(task.id)).length} totalTasks={treatmentTasks.length} plant={plant} open={recoveryOpen} onClose={() => setRecoveryOpen(false)} /></>}
    <Dialog open={expanded} onClose={() => setExpanded(false)} maxWidth="md" fullWidth><Box sx={{ p: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography>Plant photo review</Typography><IconButton aria-label="Close photo review" onClick={() => setExpanded(false)}><MdClose /></IconButton></Box>{imageReview}</Box></Dialog>
  </Box>
}

function PlantOverview({ scanId, plantName, diagnosis, onProfile, onPlantProfile, onLoading }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(scanId))
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    if (!scanId) { setLoading(false); setProfile(null); onProfile?.(null); onPlantProfile?.(null); onLoading?.(false); return () => { active = false } }
    setLoading(true)
    onLoading?.(true)
    setError('')
    setProfile(null)
    onProfile?.(null)
    onPlantProfile?.(null)
    api(`/scans/${scanId}/overview`).then(async result => {
      const resultProfile = result?.profile || null
      const detectedDisease = diseaseName(diagnosis)
      const diseaseProfile = detectedDisease ? (resultProfile?.kind === 'disease' ? resultProfile : await publicDiseaseReference(detectedDisease)) : null
      const nextProfile = detectedDisease ? await publicPlantReference(plantName) : resultProfile
      if (active) { setProfile(nextProfile); onProfile?.(diseaseProfile || nextProfile); onPlantProfile?.(nextProfile) }
    }).catch(err => {
      Promise.all([publicPlantReference(plantName), publicDiseaseReference(diseaseName(diagnosis))]).then(([plantProfile, diseaseProfile]) => {
        if (active && (plantProfile || diseaseProfile)) { setProfile(plantProfile); onProfile?.(diseaseProfile || plantProfile); onPlantProfile?.(plantProfile) }
        else if (active) { setError(err.message || 'Could not load the botanical reference.'); onProfile?.(null); onPlantProfile?.(null) }
      }).catch(() => { if (active) { setError(err.message || 'Could not load the botanical reference.'); onProfile?.(null); onPlantProfile?.(null) } })
    }).finally(() => { if (active) { setLoading(false); onLoading?.(false) } })
    return () => { active = false }
  }, [scanId, plantName, diagnosis, attempt])
  const heading = (label, title = 'Plant overview') => <Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineHealthAndSafety /></span><Typography component="h3">{title}</Typography><Chip size="small" label={label} /></Box>
  if (loading) return <Box className="diagnosis-card plant-overview-card plant-overview-pending">{heading('Loading')}<Box className="plant-overview-loading"><CircularProgress size={16} /><Typography>Loading…</Typography></Box></Box>
  if (!profile) return <Box className="diagnosis-card plant-overview-card plant-overview-pending">{heading('Awaiting crop ID')}<Typography className="plant-overview-copy">{error || (scanId ? 'A botanical reference is unavailable for this crop.' : 'A botanical overview appears once a crop is identified.')}</Typography>{error && <Button size="small" variant="text" onClick={() => setAttempt(value => value + 1)}>Try again</Button>}</Box>
  return <Box className="diagnosis-card plant-overview-card">{heading('Live reference')}<Typography className="plant-overview-identity"><strong>{profile.commonName}</strong>{profile.scientificName && <em>{profile.scientificName}</em>}</Typography><Typography className="plant-overview-copy">{profile.overview}</Typography><Box className="plant-overview-meta">{profile.family && <span><strong>Family</strong>{profile.family}</span>}{profile.growthForm && <span><strong>Taxonomic rank</strong>{profile.growthForm}</span>}</Box>{profile.sourceUrl && <Box className="plant-overview-footer"><Button component="a" href={profile.sourceUrl} target="_blank" rel="noreferrer" size="small" endIcon={<MdOutlineOpenInNew />}>Learn more</Button></Box>}</Box>
}

function CareRequirements({ care = {}, plant = {} }) {
  const value = (...values) => values.find(item => typeof item === 'string' && item.trim()) || 'Not assessed'
  const details = [
    ['Temperature', value(care.temperature, plant.temperature), MdOutlineThermostat, 'care-requirement-compact'],
    ['Hardiness zone', value(care.hardinessZone, care.hardiness, plant.hardinessZone), MdOutlineLandscape, 'care-requirement-compact'],
    ['Sunlight', value(care.light, plant.light), MdOutlineWbSunny],
    ['Soil', value(care.soil, plant.soil), MdOutlineLandscape],
    ['Location', value(care.location, plant.location, plant.placement), MdOutlineLocationOn],
  ]
  return <Box component="section" className="care-requirements" aria-label="Care requirements"><Typography component="h3">Care requirements</Typography><Box className="care-requirements-grid">{details.map(([label, detail, Icon, className = '']) => <Box key={label} className={`care-requirement ${className}`}><span className="care-requirement-icon"><Icon /></span><Box><Typography component="h4">{label}</Typography><Typography>{detail}</Typography></Box></Box>)}</Box></Box>
}

const diseaseName = label => {
  const value = String(label || '').trim()
  if (!value || /healthy|no reliable diagnosis|clear plant photo|^tentative match:/i.test(value)) return ''
  return value.includes('–') ? value.split('–').pop().trim() : value
}

async function publicDiseaseReference(name) {
  return publicWikipediaReference(name, 'disease')
}

async function publicPlantReference(name) {
  const profile = await publicWikipediaReference(name, 'plant')
  if (!profile) return null
  const classification = await publicClassification([...(profile.taxonHints || []), name])
  return { ...profile, classification }
}

async function publicWikipediaReference(name, kind) {
  if (!name) return null
  const search = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`)
  const searchData = await search.json()
  const title = searchData?.query?.search?.[0]?.title
  if (!title || (kind === 'plant' && !title.toLowerCase().includes(name.toLowerCase()))) return null
  const page = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`)
  const pageData = await page.json()
  const extract = Object.values(pageData?.query?.pages || {})[0]?.extract?.replace(/\s+/g, ' ').trim()
  if (!extract) return null
  const clipped = extract.length > 380 ? `${extract.slice(0, extract.lastIndexOf('. ', 380) || 380).trim()}…` : extract
  const taxonHints = [...extract.matchAll(/\(([A-Z][a-z]+(?:\s+[a-z.]+){1,2})\)/g)].map(match => match[1]).filter(value => !/\bspp?\.?$/i.test(value))
  return { commonName: title, kind, overview: clipped, taxonHints, sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}` }
}

async function publicClassification(candidates) {
  for (const candidate of candidates) {
    try {
      const response = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(candidate)}`)
      const match = await response.json()
      if (!match?.usageKey || match.matchType === 'NONE' || !match?.kingdom?.toLowerCase().includes('plantae')) continue
      const classification = { Order: match.order, Genus: match.genus, Family: match.family, Class: match.class, Phylum: match.phylum }
      if (Object.values(classification).some(Boolean)) return classification
    } catch {}
  }
  return null
}

function ScientificClassification({ classification }) {
  const rows = Object.entries(classification || {}).filter(([, value]) => value)
  return <Box className="scientific-classification"><Typography component="h4">Scientific classification</Typography>{rows.length ? <Box className="scientific-classification-list">{rows.map(([label, value]) => <Box key={label}><span>{label}</span><strong>{value}</strong></Box>)}</Box> : <Typography className="scientific-classification-empty">Classification details are unavailable for this reference.</Typography>}</Box>
}

function BotanistRecommendations({ scanId, plantName, diagnosis }) {
  const [loading, setLoading] = useState(false)
  const [directory, setDirectory] = useState(null)
  const [error, setError] = useState('')
  const findNearby = () => {
    setError('')
    if (!navigator.geolocation) { setError('Location is unavailable in this browser.'); return }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const { latitude, longitude } = position.coords
        const result = await api(`/scans/${scanId}/botanists?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`)
        setDirectory(result)
      } catch (err) { setError(err.message) } finally { setLoading(false) }
    }, () => { setLoading(false); setError('Allow location access to find real botanists near you.') }, { timeout: 10000, maximumAge: 900000 })
  }
  const providers = directory?.providers || []
  const distanceLabel = value => {
    const distance = Number(value)
    if (!Number.isFinite(distance) || distance < 0) return ''
    return distance < 1000 ? `${Math.round(distance)} m away` : `${(distance / 1000).toFixed(1)} km away`
  }
  return <Box className="botanist-directory">
    <Box className="botanist-directory-heading"><Box><Box className="botanist-title"><span><MdOutlineTravelExplore /></span><Box><Typography component="h4">Nearby plant-care listings</Typography><Typography>{directory?.configured ? `${providers.length} ${providers.length === 1 ? 'listing' : 'listings'} found for ${plantName || 'this plant'}${diagnosis ? ` · ${diagnosis}` : ''}` : `Search around your location for ${plantName || 'this plant'}`}</Typography></Box></Box></Box><Chip size="small" label="Geoapify" /></Box>
    {!directory && <Box className="botanist-empty"><Box className="botanist-empty-illustration"><MdOutlineTravelExplore /><MdOutlineHealthAndSafety /></Box><Typography component="h5">Find local plant care</Typography><Typography>Nearby garden and agricultural services will appear here after a search.</Typography><Button className="botanist-search-button" variant="outlined" startIcon={loading ? <CircularProgress size={16} /> : <MdOutlineTravelExplore />} onClick={findNearby} disabled={loading}>{loading ? 'Finding nearby services…' : 'Find nearby botanists'}</Button></Box>}
    {directory?.configured === false && <Box className="botanist-unavailable"><Typography className="botanist-directory-message">The directory was unavailable when this scan was opened. Start the backend after adding the Geoapify key, then retry the search.</Typography><Button className="botanist-search-button" variant="outlined" startIcon={loading ? <CircularProgress size={16} /> : <MdOutlineTravelExplore />} onClick={findNearby} disabled={loading}>{loading ? 'Finding nearby services…' : 'Retry nearby search'}</Button></Box>}
    {directory?.configured && <>{providers.length ? <Box className="botanist-results">{providers.map(provider => { const distance = distanceLabel(provider.distance); return <Box className="botanist-result" key={provider.id}><Box className="botanist-result-main">{provider.categories?.length > 0 && <Box className="botanist-result-type"><MdOutlineHealthAndSafety /> <span>{provider.categories[0]}</span></Box>}<Typography component="h5">{provider.name}</Typography><Typography className="botanist-address"><MdOutlineLocationOn /> {provider.address}</Typography><Box className="botanist-place-facts">{distance && <span>{distance}</span>}{provider.openingHours && <span>{provider.openingHours}</span>}{provider.locality && <span>{provider.locality}{provider.country ? `, ${provider.country}` : ''}</span>}</Box>{provider.rating !== null && <Typography className="botanist-rating"><MdOutlineStar /> {provider.rating.toFixed(1)} · {provider.reviews} reviews</Typography>}</Box><Box className="botanist-result-actions">{provider.phone && <Button component="a" href={`tel:${provider.phone}`} aria-label={`Call ${provider.name}`} startIcon={<MdOutlinePhone />}>Call</Button>}{provider.website && <Button component="a" href={provider.website} target="_blank" rel="noreferrer" aria-label={`Visit ${provider.name} website`} startIcon={<MdOutlineLanguage />}>Website</Button>}{provider.mapsUrl && <Button component="a" href={provider.mapsUrl} target="_blank" rel="noreferrer" variant="contained" endIcon={<MdOutlineOpenInNew />}>Directions</Button>}</Box>{provider.source && <Typography className="botanist-source">Source: {provider.source}</Typography>}</Box> })}</Box> : <Typography className="botanist-directory-message">No matching local listings were found. Try again from a different location.</Typography>}</>}
    {error && <Typography role="alert" className="botanist-directory-message">{error}</Typography>}
  </Box>
}

function ScanWorkspace({ plant, findings, photo, onClose }) {
  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachmentBusy, setAttachmentBusy] = useState(false)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(Boolean(plant.scanId))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!plant.scanId) {
      setLoading(false)
      setError('This result has no saved scan record, so AI chat cannot be persisted.')
      return
    }
    scanChat(plant.scanId).then(records => {
      setMessages(records.map(message => ({role:message.role, text:message.body, attachment:message.attachment ? mediaUrl(message.attachment) : ''})))
    }).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [plant.scanId])
  const chooseAttachment = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a JPG, PNG, or WebP image under 10 MB.')
      return
    }
    try {
      setAttachmentBusy(true)
      setError('')
      setAttachment({name:file.name, url:await uploadPhoto(await fileData(file))})
    } catch (err) {
      setError(err.message)
    } finally {
      setAttachmentBusy(false)
    }
  }
  const send = async event => {
    event.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    setError('')
    setSending(true)
    setMessages(current => [...current, { role: 'user', text, attachment: attachment?.url ? mediaUrl(attachment.url) : '' }, { role: 'assistant', loading: true }])
    try {
      const saved = await Promise.race([
        askScanChat(plant.scanId, text, attachment?.url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('The local AI is taking too long. The first response may be downloading the model; please retry in a moment.')), 100000)),
      ])
      setMessages(current => [...current.slice(0, -2), { role: 'user', text, attachment: saved[0]?.attachment ? mediaUrl(saved[0].attachment) : (attachment?.url ? mediaUrl(attachment.url) : '') }, { role: 'assistant', text: saved[1]?.body || saved.at(-1)?.body || 'The assistant returned no answer.' }])
      setAttachment(null)
    } catch (err) {
      setError(err.message)
      setMessages(current => current.slice(0, -2))
    } finally {
      setSending(false)
    }
  }
  return <Box className="scan-ai-workspace">
    <Box className="scan-workspace-fixed-context">
      {photo ? <img src={photo} alt={`${plant.name || 'Plant'} scan reference`} /> : <Typography>No scan photo saved yet.</Typography>}
    </Box>
    <Box className="scan-workspace-body"><Box className="scan-workspace-chat">{loading ? <Typography className="scan-workspace-state">Loading saved conversation…</Typography> : messages.length ? messages.map((message, index) => <Box key={`${message.role}-${index}`} className={`scan-workspace-message ${message.role}`}>{message.loading ? <Box className="scan-workspace-loader" role="status" aria-label="Plantaexa assistant is reviewing your scan"><MdOutlineAutoAwesome /><Box><strong>Reviewing your scan</strong><span>Preparing a clear answer</span></Box><i><b /><b /><b /></i></Box> : <>{message.attachment && <img className="scan-message-attachment" src={message.attachment} alt="Attached scan reference" />}{message.role === 'assistant' ? <AssistantReply text={message.text} /> : <Typography>{message.text}</Typography>}</>}</Box>) : <Typography className="scan-workspace-state">No questions yet. Ask about the result, care, or the next check.</Typography>}</Box></Box>
    {error && <Typography role="alert" className="scan-workspace-error">{error}</Typography>}
    <form className="scan-workspace-composer" onSubmit={send}>{<Box className="scan-workspace-prompts"><button type="button" onClick={() => setInput('Explain this scan in simple terms')}>Explain this scan</button><button type="button" onClick={() => setInput('Create a care checklist')}>Create care checklist</button><button type="button" onClick={() => setInput('What should I check next?')}>What should I check next?</button><button type="button" onClick={() => setInput('Could this be pests or a disease? What signs should I look for?')}>Check for pests</button><button type="button" onClick={() => setInput('How much light and water does this plant need right now?')}>Light & watering</button><button type="button" onClick={() => setInput('What should I ask an expert about this scan?')}>Prepare expert questions</button></Box>}{attachment && <Box className="scan-attachment-preview"><img src={mediaUrl(attachment.url)} alt="" /><span>{attachment.name}</span><button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}><MdClose /></button></Box>}<label className="scan-attach-button" title="Attach an image"><MdAttachFile /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAttachment} disabled={sending || attachmentBusy || !plant.scanId} /></label><input aria-label="Ask about this scan" placeholder={plant.scanId ? 'Ask about this scan...' : 'Saved scan required for AI chat'} value={input} onChange={event => setInput(event.target.value)} disabled={sending || attachmentBusy || !plant.scanId} /><Button type="submit" variant="contained" disabled={!input.trim() || sending || attachmentBusy || !plant.scanId} endIcon={<MdOutlineAutoAwesome />}>{sending ? 'Thinking…' : 'Ask AI'}</Button></form>
  </Box>
}

function AssistantReply({ text = '' }) {
  const lines = String(text).split('\n').map(line => line.trim()).filter(Boolean)
  const sections = []
  let current = null
  const inline = value => value.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part)
  lines.forEach((line, index) => {
    const title = line.match(/^\*\*(.+)\*\*$/)
    if (title) { current = { title: title[1], items: [], copy: [] }; sections.push(current); return }
    if (!current) { current = { title: index === 0 ? 'Scan guidance' : '', items: [], copy: [] }; sections.push(current) }
    if (/^-\s+/.test(line)) current.items.push(line.replace(/^-\s+/, ''))
    else current.copy.push(line)
  })
  return <Box className="scan-assistant-reply"><Box className="scan-assistant-reply-label"><MdOutlineAutoAwesome />Plantaexa assistant</Box>{sections.map((section, index) => <Box className="scan-assistant-section" key={`${section.title}-${index}`}>{section.title && <Typography component="h4">{section.title}</Typography>}{section.copy.map((copy, copyIndex) => <Typography key={copyIndex}>{inline(copy)}</Typography>)}{section.items.length > 0 && <Box component="ul">{section.items.map((item, itemIndex) => <li key={itemIndex}><MdOutlineCheckCircle /> <span>{inline(item)}</span></li>)}</Box>}</Box>)}</Box>
}
