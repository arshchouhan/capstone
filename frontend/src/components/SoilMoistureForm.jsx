import { useState } from 'react'
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material'

export default function SoilMoistureForm({ initial, onSave }) {
  const [condition, setCondition] = useState(initial?.condition || '')
  const [meterPercent, setMeterPercent] = useState(initial?.meterPercent ?? '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const value = meterPercent === '' ? undefined : Number(meterPercent)
  const valid = value === undefined || (Number.isFinite(value) && value >= 0 && value <= 100)

  async function submit(event) {
    event.preventDefault()
    if (!condition || !valid || saving) return
    setSaving(true)
    setError('')
    try { await onSave({ condition, meterPercent: value, notes: notes.trim(), checkedAt: new Date().toISOString() }) }
    catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return <Stack component="form" spacing={2} onSubmit={submit} sx={{ pt: 1, pb: 1 }}>
    <Typography variant="body2">Feel the soil and record its condition. If your moisture meter displays a percentage, you can enter that reading too.</Typography>
    <TextField select required label="Soil condition" value={condition} onChange={e => setCondition(e.target.value)} disabled={saving}>
      {['Dry', 'Moist', 'Wet'].map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
    </TextField>
    <TextField label="Meter reading (%)" type="number" value={meterPercent} onChange={e => setMeterPercent(e.target.value)}
      error={!valid} helperText={valid ? 'Optional' : 'Enter a value from 0 to 100.'} disabled={saving}
      slotProps={{ htmlInput: { min: 0, max: 100, step: 'any' } }} />
    <TextField label="Notes" value={notes} onChange={e => setNotes(e.target.value)} multiline minRows={2}
      slotProps={{ htmlInput: { maxLength: 500 } }} disabled={saving} />
    {error && <Typography role="alert" color="error">{error}</Typography>}
    <Button type="submit" variant="contained" disabled={!condition || !valid || saving}>{saving ? 'Saving…' : 'Save moisture check'}</Button>
  </Stack>
}
