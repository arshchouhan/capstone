import { useState } from 'react'
import useApiData from '../hooks/useApiData'
import { api } from '../services/api'
import { Box, Button, Chip, LinearProgress, MenuItem, TextField, Typography } from '@mui/material'
import { MdOutlineTrendingUp, MdOutlineTrendingFlat, MdOutlineTrendingDown, MdOutlinePhotoLibrary } from 'react-icons/md'
const conditions = [[ 'Improving', MdOutlineTrendingUp ], [ 'Unchanged', MdOutlineTrendingFlat ], [ 'Worsening', MdOutlineTrendingDown ]]
export function RecoveryProgress({ plantId, history = [], photo, baselinePhoto, completedTasks = 0, totalTasks = 4, onReviewCare }) {
  const root = `/plants/${plantId}/recovery-observations`
  const {data:observations,reload} = useApiData(root)
  const [condition, setCondition] = useState(observations[0]?.condition || ''), [notes, setNotes] = useState(''), [message, setMessage] = useState('')
  const [reference, setReference] = useState('baseline')
  const taskProgress = totalTasks ? Math.min(100, Math.round(completedTasks / totalTasks * 100)) : 0
  const latest = photo || history[0]?.photo
  const earlier = reference === 'baseline' ? baselinePhoto : history[Number(reference)]?.photo
  const dates = history.map(entry => Date.parse(entry.checkedAt)).filter(Number.isFinite)
  const firstCheck = dates.length ? Math.min(...dates) : null
  const days = firstCheck ? Math.max(0, Math.floor((Date.now() - firstCheck) / 86400000)) : 0
  const save = async () => {
    try { await api(root,{method:'POST',body:{condition,notes:notes.trim(),scan:history[0]?.id}});await reload();setNotes('');setMessage('Observation saved.') }catch(err){setMessage(err.message)}
  }
  const image = (source, label) => <Box className="recovery-photo-frame">{source ? <img src={source} alt={label} /> : <Box className="recovery-photo-empty"><MdOutlinePhotoLibrary /><Typography>No saved photo for this check</Typography></Box>}</Box>
  return <Box component="section" className="recovery-progress-section"><Box className="recovery-section-heading"><Box><Typography component="h3">Recovery progress</Typography><Typography className="recovery-progress-caption">Latest check · {history[0] ? new Date(history[0].checkedAt).toLocaleString() : 'Not checked yet'}</Typography></Box><Chip size="small" label={observations[0]?.condition || 'Add an observation'} /></Box>
    <Box className="recovery-comparison"><Box>{image(earlier,'Earlier plant reference')}<TextField select size="small" fullWidth value={reference} label="Compare with" onChange={event => setReference(event.target.value)} sx={{ mt: 1 }}><MenuItem value="baseline">Original reference</MenuItem>{history.slice(1).map((entry, index) => entry.photo && <MenuItem key={entry.id || index} value={String(index + 1)}>{new Date(entry.checkedAt).toLocaleString()}</MenuItem>)}</TextField></Box><Box>{image(latest,'Latest recovery photo')}<Typography>Latest recovery check</Typography></Box></Box>
    <Box className="recovery-progress-metrics"><Box><Typography>Care tasks</Typography><strong>{completedTasks}/{totalTasks}</strong></Box><Box><Typography>Recovery checks</Typography><strong>{history.length}</strong></Box><Box><Typography>Days tracked</Typography><strong>{days}</strong></Box></Box><LinearProgress variant="determinate" value={taskProgress} aria-label="Care task completion" /><Box className="recovery-task-summary"><Typography>{Math.max(0,totalTasks-completedTasks)} care tasks remaining</Typography><Button size="small" onClick={onReviewCare}>Review care plan</Button></Box>
    <Box className="recovery-observation-form"><Typography component="h4">How is your plant recovering?</Typography><Typography className="recovery-progress-caption">Compare leaf colour, damaged areas, and new growth in the photos.</Typography><Box className="recovery-condition-options">{conditions.map(([label, Icon]) => <Button key={label} variant={condition === label ? 'contained' : 'outlined'} startIcon={<Icon />} aria-pressed={condition === label} onClick={() => { setCondition(label); setMessage('') }}>{label}</Button>)}</Box><TextField size="small" fullWidth multiline minRows={2} label="Recovery notes" placeholder="Describe changes in leaves, symptoms, or new growth…" value={notes} onChange={event => { setNotes(event.target.value); setMessage('') }} /><Box className="recovery-save-row"><Typography role="status" className="recovery-progress-caption">{message}</Typography><Button variant="contained" disabled={!condition} onClick={save}>Save observation</Button></Box></Box>
    <Typography component="h4">Recovery timeline</Typography>{observations.length ? <Box component="ol" className="recovery-observation-timeline">{observations.map((entry,index) => <Box component="li" key={`${entry.recordedAt}-${index}`}><Box><Chip size="small" label={entry.condition} /><Typography>{new Date(entry.recordedAt).toLocaleString()}</Typography></Box>{entry.notes && <Typography>{entry.notes}</Typography>}</Box>)}</Box> : <Typography className="recovery-progress-caption">Record your first observation to start tracking changes.</Typography>}
  </Box>
}