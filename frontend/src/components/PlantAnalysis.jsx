import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RecoveryCheck from './RecoveryCheck'
import useApiData from '../hooks/useApiData'
import { api } from '../services/api'

import { Box, Button, Chip, Checkbox, CircularProgress, Dialog, IconButton, LinearProgress, Typography } from '@mui/material'

import { MdOutlineTaskAlt, MdOutlineSchedule, MdOutlineSentimentSatisfied, MdOutlineHealthAndSafety, MdOutlineCenterFocusStrong, MdOutlineDescription, MdOutlineCameraAlt, MdOutlineOpenInFull, MdOutlineVisibility, MdOutlineVisibilityOff, MdOutlineAutoAwesome, MdClose } from 'react-icons/md'
export default function PlantAnalysis({ plantId, plant, photos = [], photoIndex = 0, onRecoveryComplete, historical = false }) {
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showMarks, setShowMarks] = useState(true)
  const [selected, setSelected] = useState(null)
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
  const findings = Array.isArray(scan?.findings) ? scan.findings : (Array.isArray(plant.notes) ? plant.notes.map(note => ({ label: note })) : [])
  const photo = photos[photoIndex] || plant.image
  const needsCare = ['Needs Care','At Risk'].includes(plant.status)
  const sampleAnalysis = plant.summary ? [plant.summary] : [
    `This profile is recorded as ${plant.name}${plant.scientific ? ` (${plant.scientific})` : ''}. Its current recorded condition is ${plant.status || 'not assessed'}. This sample review demonstrates how a detailed AI report will appear; it has not analysed the photo.`,
    needsCare
      ? 'In this example, the review would describe discoloured or damaged leaves, where the changes occur, and whether older foliage or new growth is affected. Leaf spotting can have several causes, so a photo alone would not confirm a disease. A live report would distinguish visible symptoms from possible causes.'
      : 'In a healthy-plant example, the review would look for even leaf colour, firm foliage, and developing new growth. It would also check for yellowing, curled edges, spots, and visible pest damage. These are example checks, not findings confirmed from this image.',
    'The report would consider the growing conditions alongside the image. Strong light, changes in watering, poor drainage, and recent relocation can produce similar signs of stress. A saved light check and your notes can provide useful context, while a webcam brightness estimate cannot establish the plant’s daily light exposure.',
    'For the next review, take a clear whole-plant photo and a close-up of any affected leaves. Record recent changes in watering or placement and compare new growth over time. The completed AI report will connect its findings to a suggested next step and show uncertainty where the evidence is limited.',
  ]
  const imageReview = <Box className="analysis-photo-stage">{photo ? <img src={photo} alt={`${plant.name} being reviewed`} /> : <Typography>No scan photo saved yet.</Typography>}{showMarks && findings.map((finding, index) => finding.region && <button key={index} className={`analysis-region ${selected === index ? 'selected' : ''}`} aria-label={`Review finding ${index + 1}: ${finding.label}`} onClick={() => setSelected(index)} style={{ left: `${finding.region.x}%`, top: `${finding.region.y}%`, width: `${finding.region.width}%`, height: `${finding.region.height}%` }}>{index + 1}</button>)}</Box>
  return <Box className="plant-diagnosis"><Box className="diagnosis-title"><Box><Typography component="h2">Diagnosis results</Typography><Typography>Review your plant’s health and next care step.</Typography></Box><Chip size="small" label="Demo scan" /></Box>
    <Box className={`diagnosis-health ${needsCare ? 'needs-care' : ''}`}><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineHealthAndSafety /></span><Typography component="h3">Plant health assessment</Typography><Chip className="diagnosis-health-status" variant="outlined" size="small" icon={<MdOutlineSentimentSatisfied />} label={needsCare ? 'Needs attention' : plant.status === 'Healthy' ? 'Good' : plant.status || 'Awaiting scan'} /></Box><Box className="diagnosis-health-body"><Box className="diagnosis-score"><Box className="diagnosis-score-ring"><CircularProgress variant="determinate" value={100} size={104} thickness={4} className="score-track" /><CircularProgress variant="determinate" value={score === null ? 0 : displayScore} size={104} thickness={4} /><Box><strong>{score === null ? '—' : displayScore}</strong><Typography>/100</Typography></Box></Box><Typography>{score === null ? 'No health score yet' : 'Sample health score'}</Typography></Box><Box className="diagnosis-health-meta"><Box className="diagnosis-confidence"><Box className="confidence-heading"><MdOutlineAutoAwesome aria-hidden="true" /><Typography>Analysis<br />confidence</Typography><Chip size="small" label="Pending · Live AI" /></Box><LinearProgress variant="determinate" value={0} aria-label="Analysis confidence pending" /></Box><Chip size="small" icon={<MdOutlineCameraAlt />} label={`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} available`} /></Box></Box></Box>
    <Box className="diagnosis-content-grid"><Box className="diagnosis-card"><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineCenterFocusStrong /></span><Typography component="h3">Where we see it</Typography><IconButton aria-label={showMarks ? 'Hide marked areas' : 'Show marked areas'} onClick={() => setShowMarks(value => !value)}>{showMarks ? <MdOutlineVisibility /> : <MdOutlineVisibilityOff />}</IconButton><IconButton aria-label="Expand review photo" onClick={() => setExpanded(true)} disabled={!photo}><MdOutlineOpenInFull /></IconButton></Box>{imageReview}<Typography className="diagnosis-help">{findings.some(finding => finding.region) ? 'Select a marked area or finding to review it. AI locations are approximate.' : 'Photo reference only. Marked areas will appear when a scan provides finding locations.'}</Typography></Box>
    <Box className="diagnosis-card diagnosis-summary"><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineDescription /></span><Typography component="h3">Analysis summary</Typography><Chip size="small" label={needsCare ? 'Action needed' : 'Review results'} /></Box><Box className="diagnosis-summary-copy"><Typography className="diagnosis-summary-label"><MdOutlineAutoAwesome /> {historical ? 'Scan analysis' : 'Sample AI analysis'}</Typography>{sampleAnalysis.map((paragraph, index) => <Typography key={index}>{paragraph}</Typography>)}</Box><Box className="diagnosis-findings">{findings.map((finding, index) => <Button key={index} variant="outlined" className={selected === index ? 'selected' : ''} startIcon={<MdOutlineCenterFocusStrong />} onClick={() => setSelected(index)}>{finding.label}</Button>)}</Box>{selected !== null && findings[selected] && <Typography className="diagnosis-help">{findings[selected].description || findings[selected].label}</Typography>}</Box></Box>
    {!historical && <Box component="section" className="diagnosis-treatment"><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineTaskAlt /></span><Box><Typography component="h3">Treatment plan</Typography><Typography className="diagnosis-help">Sample care checklist · review for your plant</Typography></Box><Chip size="small" label={`${treatmentTasks.filter(task => completedTasks.includes(task.id)).length}/${treatmentTasks.length} complete`} /></Box><Box className="treatment-task-grid">{treatmentTasks.map(task => <Box key={task.id} className={`treatment-task ${completedTasks.includes(task.id) ? 'is-complete' : ''}`}><Checkbox size="small" checked={completedTasks.includes(task.id)} onChange={() => toggleTask(task.id)} inputProps={{ 'aria-label': `Complete: ${task.title}` }} /><Box className="treatment-task-content"><Box className="treatment-task-heading"><Typography component="h4">{task.title}</Typography><Chip size="small" icon={<MdOutlineSchedule />} label={task.timing} /></Box><Typography>{task.description}</Typography></Box></Box>)}</Box>{taskSaveError && <Typography role="alert" className="diagnosis-help">Could not save progress. Please retry.</Typography>}</Box>}
{!historical && <><Box className="analysis-recovery-actions"><Button variant="contained" startIcon={<MdOutlineCameraAlt />} onClick={() => setRecoveryOpen(true)}>Check on recovery</Button><Button component={Link} to="/farm/dashboard/scan">Check another plant</Button></Box><RecoveryCheck plantId={plantId} onComplete={result => { setRecoveryOpen(false); onRecoveryComplete?.(result) }} completedTasks={treatmentTasks.filter(task => completedTasks.includes(task.id)).length} totalTasks={treatmentTasks.length} plant={plant} open={recoveryOpen} onClose={() => setRecoveryOpen(false)} /></>}
    <Dialog open={expanded} onClose={() => setExpanded(false)} maxWidth="md" fullWidth><Box sx={{ p: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography>Plant photo review</Typography><IconButton aria-label="Close photo review" onClick={() => setExpanded(false)}><MdClose /></IconButton></Box>{imageReview}</Box></Dialog>
  </Box>
}
