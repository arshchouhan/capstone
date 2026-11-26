import { useState } from 'react'
import { Alert, Box, Button, Chip, Typography } from '@mui/material'
import useApiData from '../hooks/useApiData'
import { api } from '../services/api'
import './MeetRequests.css'

export default function MeetRequestInbox() {
  const { data: requests, loading, error, reload } = useApiData('/meet-requests')
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)

  const decide = async (id, decision) => {
    setBusy(id)
    setNotice(null)
    try {
      const result = await api('/meet-requests/' + id, { method: 'PATCH', body: { decision } })
      setNotice({ text: decision === 'declined' ? 'Request declined.' : result.demo ? 'Demo request accepted.' : 'Request accepted. The meeting link is available when Google returns it.' })
      await reload()
    } catch (err) { setNotice({ error: true, text: err.message }) }
    finally { setBusy('') }
  }

  return (
    <Box component="section" className="meet-flow-card" aria-label="Google Meet requests">
      <Box className="meet-flow-row">
        <Box><Typography component="h3">Google Meet requests</Typography><Typography className="meet-flow-secondary">{requests.filter(request => request.status === 'pending').length} pending</Typography></Box>
        <Button variant="outlined" size="small" disabled={loading} onClick={reload}>Refresh</Button>
      </Box>
      {notice && <Alert severity={notice.error ? 'error' : 'success'}>{notice.text}</Alert>}
      {error ? <Alert severity="error">{error}</Alert> : loading ? <Typography role="status">Loading requests…</Typography> : !requests.length ? <Typography className="meet-flow-secondary">No meeting requests yet.</Typography> : requests.map(request => {
        const id = request.id || request._id
        return <Box key={id} className="meet-flow-record">
          <Box className="meet-flow-row"><strong>{request.owner?.fullName || 'Plant grower'}</strong><Chip size="small" label={request.demo ? `${request.status} · demo` : request.status} color={request.status === 'accepted' ? 'success' : 'default'} /></Box>
          <Typography className="meet-flow-secondary">{new Date(request.startsAt).toLocaleString()}</Typography>
          {request.message && <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{request.message}</Typography>}
          {request.status === 'pending' ? <Box className="meet-flow-actions">
            <Button variant="outlined" disabled={Boolean(busy)} onClick={() => decide(id, 'declined')}>Decline</Button>
            <Button variant="contained" disableElevation disabled={Boolean(busy)} onClick={() => decide(id, 'accepted')}>{busy === id ? 'Saving…' : request.demo ? 'Accept demo request' : 'Accept & create Meet'}</Button>
          </Box> : request.meetUrl && <Button variant="outlined" href={request.meetUrl} target="_blank" rel="noreferrer">Join Google Meet</Button>}
        </Box>
      })}
    </Box>
  )
}
