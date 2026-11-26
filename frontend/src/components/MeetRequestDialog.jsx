import { useState } from 'react'
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material'
import { FaArrowLeft, FaVideo } from 'react-icons/fa'
import { api } from '../services/api'
import useApiData from '../hooks/useApiData'
import './MeetRequests.css'

const localInput = date => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)

export default function MeetRequestPanel({ expert, onClose }) {
  const expertId = expert.id || expert._id
  const { data: requests, loading, error: loadError, reload } = useApiData('/meet-requests')
  const [startsAt, setStartsAt] = useState(() => localInput(new Date(Date.now() + 3600_000)))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const matching = requests.filter(request => (request.expert?.id || request.expert?._id) === expertId)

  const send = async event => {
    event.preventDefault()
    const date = new Date(startsAt)
    if (!Number.isFinite(date.getTime()) || date <= new Date()) { setError('Choose a time in the future.'); return }
    setBusy(true)
    setError('')
    try {
      await api(`/experts/${expertId}/meet-requests`, { method: 'POST', body: { startsAt: date.toISOString(), message: message.trim() } })
      setSent(true)
      setMessage('')
      await reload()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <Box className="meet-request-panel meet-flow">
      <Box className="meet-flow-heading">
        <span className="meet-flow-icon"><FaVideo aria-hidden="true" /></span>
        <Box><Typography component="h3">Request a Google Meet</Typography><Typography>{expert.name}</Typography></Box>
        <Button variant="outlined" startIcon={<FaArrowLeft />} onClick={onClose}>Back to profile</Button>
      </Box>
      <Box className="meet-flow-card" component="form" onSubmit={send}>
        <Typography component="h4">Choose a time</Typography>
        <Typography className="meet-flow-secondary">{expert.demo ? 'This demo request can be accepted in the doctor portal. Demo requests don’t create a Google event.' : 'Your expert reviews the requested time. Once accepted, the Meet link appears below.'}</Typography>
        <TextField type="datetime-local" label="Preferred time" required value={startsAt} onChange={event => { setStartsAt(event.target.value); setSent(false) }} slotProps={{ htmlInput: { min: localInput(new Date()) }, inputLabel: { shrink: true } }} fullWidth />
        <TextField label="Message for the expert (optional)" multiline minRows={3} fullWidth value={message} onChange={event => setMessage(event.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        {error && <Alert severity="error">{error}</Alert>}
        {sent && <Alert severity="success">Request sent. Check its status below.</Alert>}
        <Box className="meet-flow-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disableElevation disabled={busy || sent || !startsAt}>{busy ? 'Sending…' : 'Send request'}</Button>
        </Box>
      </Box>
      <Box className="meet-flow-card">
        <Box className="meet-flow-row"><Typography component="h4">Your requests</Typography><Button size="small" variant="outlined" disabled={loading} onClick={reload}>Refresh</Button></Box>
        {loadError ? <Alert severity="error">{loadError}</Alert> : loading ? <Typography role="status">Loading requests…</Typography> : matching.length === 0 ? <Typography className="meet-flow-secondary">No requests for this expert yet.</Typography> : matching.map(request => (
          <Box key={request.id || request._id} className="meet-flow-record">
            <Box className="meet-flow-row"><Typography>{new Date(request.startsAt).toLocaleString()}</Typography><Chip label={request.status} color={request.status === 'accepted' ? 'success' : 'default'} size="small" /></Box>
            {request.meetUrl && <Button href={request.meetUrl} target="_blank" rel="noreferrer" variant="outlined">Join Google Meet</Button>}
            {request.demo && request.status === 'accepted' && <Typography className="meet-flow-secondary">Demo accepted. No meeting link was created.</Typography>}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
