import { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
export default function PlantNotes({ plantId }) {
  const [note, setNote] = useState(() => { try { return localStorage.getItem(`plant-note-${plantId}`) || '' } catch { return '' } })
  const [message, setMessage] = useState('')
  const save = () => { try { localStorage.setItem(`plant-note-${plantId}`, note); setMessage('Saved on this device.') } catch { setMessage('Unable to save on this device.') } }
  return <Box className="plant-notes-content"><Typography component="h2">Plant notes</Typography><TextField fullWidth multiline minRows={5} size="small" label="Your notes" placeholder="Record growth, watering, or changes you notice…" value={note} onChange={event => { setNote(event.target.value); setMessage('') }} /><Button variant="outlined" onClick={save}>Save notes</Button>{message && <Typography role="status">{message}</Typography>}</Box>
}
