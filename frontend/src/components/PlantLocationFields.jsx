import { useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { MdMyLocation } from 'react-icons/md'
import { parsePlantCoordinates } from '../utils/plantCoordinates'

export default function PlantLocationFields({ value, onChange, onLocating, disabled }) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  function locate() {
    if (!navigator.geolocation) {
      setError('Device location is unavailable. Enter the coordinates below.')
      return
    }
    setLocating(true)
    onLocating(true)
    setError('')
    const finish = () => { setLocating(false); onLocating(false) }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      onChange({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy })
      finish()
    }, failure => {
      setError(failure.code === 1
        ? 'Location access is blocked. Allow it in your browser or enter coordinates below.'
        : 'Could not get a GPS fix. Try again or enter coordinates below.')
      finish()
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
  }

  return <Box>
    <Typography fontWeight={700}>Plant coordinates</Typography>
    <Typography variant="body2" color="text.secondary">Optional. Use your device location while beside the plant, or enter its latitude and longitude.</Typography>
    <Button size="small" startIcon={<MdMyLocation />} onClick={locate} disabled={disabled || locating} sx={{ my: 1, textTransform: 'none' }}>
      {locating ? 'Getting location…' : 'Use my location'}
    </Button>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      {['latitude', 'longitude'].map((key, index) => <TextField key={key} size="small" fullWidth type="number"
        label={index === 0 ? 'Latitude' : 'Longitude'} value={value?.[key] ?? ''} disabled={disabled || locating}
        slotProps={{ htmlInput: { min: index === 0 ? -90 : -180, max: index === 0 ? 90 : 180, step: 'any' } }}
        onChange={event => { setError(''); onChange({ ...value, [key]: event.target.value, accuracy: undefined }) }} />)}
    </Stack>
    {Number.isFinite(value?.accuracy) && <Typography variant="caption">Estimated device accuracy ±{Math.ceil(value.accuracy)} m</Typography>}
    {error && <Typography variant="body2" role="alert" color="error">{error}</Typography>}
    {parsePlantCoordinates(value) === undefined && <Typography variant="body2" color="error">Enter both coordinates within their valid ranges.</Typography>}
  </Box>
}
