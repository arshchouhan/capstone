import { useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { fileData, mediaUrl, runScan } from '../services/api'

export default function InsectPhotoScanner({ plantId, initial, onComplete, onBusyChange }) {
  const [image, setImage] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(initial)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  async function choose(event) {
    const photo = event.target.files?.[0]
    event.target.value = ''
    if (!photo) return
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 10 * 1024 * 1024) {
      setError('Choose a JPG, PNG, or WebP photo under 10 MB.')
      return
    }
    try { setImage(await fileData(photo)) }
    catch { setError('Could not open the selected photo.') }
  }

  async function scan() {
    if (!image || scanning) return
    setScanning(true)
    onBusyChange?.(true)
    setError('')
    try {
      const saved = await runScan({ plantId, kind: 'Insect Identifier', images: [image], notes: notes.trim() })
      const record = { ...saved.result, scanId: saved.id, scannedAt: saved.completedAt, photo: saved.photos[0] }
      setResult(record)
      setImage('')
      onComplete(record)
    } catch (err) { setError(err.message) }
    finally { setScanning(false); onBusyChange?.(false) }
  }

  const preview = image || mediaUrl(result?.photo)
  return <Stack spacing={1.5} sx={{ pt: 1 }}>
    <Typography variant="body2">Use a close-up with one insect in focus. The scan can suggest a match for common insects.</Typography>
    {preview && <Box component="img" src={preview} alt="Insect photo" sx={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'contain', bgcolor: '#edf4f7', borderRadius: 2 }} />}
    <Stack direction="row" spacing={1}>
      <Button component="label" variant="outlined" disabled={scanning}>Take photo<input type="file" hidden accept="image/*" capture="environment" onChange={choose} disabled={scanning} /></Button>
      <Button component="label" variant="outlined" disabled={scanning}>Choose photo<input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={choose} disabled={scanning} /></Button>
    </Stack>
    {image && <>
      <TextField size="small" label="Observation notes" value={notes} onChange={e => setNotes(e.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} disabled={scanning} />
      <Button variant="contained" onClick={scan} disabled={scanning}>{scanning ? 'Scanning insect…' : 'Scan insect'}</Button>
    </>}
    {!image && result && <Box role="status">
      <Typography fontWeight={700}>{result.name ? `Possible match: ${result.name}` : 'Insect not identified'}</Typography>
      <Typography variant="body2">{result.summary}</Typography>
    </Box>}
    {error && <Typography role="alert" color="error">{error}</Typography>}
  </Stack>
}
