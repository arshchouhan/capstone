import { useEffect, useState } from 'react'
import { Box, Button, Card, InputBase, Stack, Typography } from '@mui/material'
import { FaMoon, FaSun, FaCloud, FaCloudRain } from 'react-icons/fa'

import { assessSprayingWeather } from './sprayingWeather'

const locationKey = 'plantaexa-weather-location'
async function fetchJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Weather service is unavailable. Please retry.')
  return response.json()
}
export default function PlantWeather() {
  const [location, setLocation] = useState(() => { try { const value = JSON.parse(localStorage.getItem(locationKey)); return value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) ? value : null } catch { return null } })
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [cities, setCities] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [revision, setRevision] = useState(0)
  const choose = city => { setWeather(null); setStatus(''); setLocation(city); setCities([]); setError(''); try { localStorage.setItem(locationKey, JSON.stringify(city)) } catch { /* Location still works for this visit. */ } }
  useEffect(() => {
    if (!location) return
    const controller = new AbortController()
    let refreshController
    const refresh = async () => {
      refreshController?.abort()
      refreshController = new AbortController()
      const signal = refreshController.signal
      setLoading(true); setError(''); setWeather(null); setStatus('')
      try {
        const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, current: 'temperature_2m,is_day,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,relative_humidity_2m', hourly: 'precipitation_probability,precipitation', forecast_days: '2', wind_speed_unit: 'kmh', timezone: 'auto' })
        const data = await fetchJson(`${import.meta.env.VITE_WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast'}?${params}`, signal)
        if (!Number.isFinite(data.current?.temperature_2m) || !data.current.time) throw new Error('The weather service returned incomplete data.')
        if (!signal.aborted) setWeather(data)
        // A crop/product-specific spraying service can provide the assessment.
        if (import.meta.env.VITE_SPRAYING_API_URL) {
          const assessment = await fetchJson(`${import.meta.env.VITE_SPRAYING_API_URL}?${new URLSearchParams({ latitude: location.latitude, longitude: location.longitude })}`, signal)
          if (!signal.aborted && typeof assessment.status === 'string') setStatus(assessment.status)
        }
      } catch (err) { if (!signal.aborted) setError(err.message) }
      finally { if (!signal.aborted) setLoading(false) }
    }
    refresh()
    const timer = setInterval(refresh, 15 * 60 * 1000)
    controller.signal.addEventListener('abort', () => refreshController?.abort())
    return () => { controller.abort(); clearInterval(timer) }
  }, [location, revision])
  const search = async event => {
    event.preventDefault()
    if (query.trim().length < 2) return
    setSearching(true); setError('')
    try {
      const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: query.trim(), count: '5', language: 'en', format: 'json' })}`)
      setCities(data.results || [])
      if (!data.results?.length) setError('No matching places found. Try a nearby city.')
    } catch (err) { setError(err.message) }
    finally { setSearching(false) }
  }
  const locate = () => {
    if (!navigator.geolocation) { setError('Location is unavailable. Search for a city instead.'); return }
    setSearching(true)
    navigator.geolocation.getCurrentPosition(position => { choose({ latitude: position.coords.latitude, longitude: position.coords.longitude, name: 'Your location' }); setSearching(false) }, () => { setError('Could not access your location. Search for a city instead.'); setSearching(false) }, { timeout: 10000 })
  }
  const assessment = assessSprayingWeather(weather)
  const current = weather?.current
  const Icon = current?.weather_code >= 51 ? FaCloudRain : current?.weather_code >= 2 ? FaCloud : current?.is_day ? FaSun : FaMoon
  return <Card variant="outlined" className="plant-care-path plant-weather-card">
    <Box className="plant-weather-summary"><Box className="plant-weather-date"><Typography>{current ? new Date(`${current.time.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : 'Local weather'}</Typography><Typography component="strong">{loading ? 'Loading…' : current ? `${Math.round(current.temperature_2m)} °C` : '— °C'}</Typography></Box><Box className="plant-weather-icon" aria-hidden="true"><Icon /></Box></Box>
    <Box className="plant-spraying-summary"><Typography>Spraying conditions</Typography><Typography component="strong" className="spraying-status">{loading ? 'Loading…' : status || (current ? assessment.status : 'Choose location')}</Typography>{current && <Box className="weather-metrics">{[['Wind', current.wind_speed_10m, 'km/h'], ['Rain', current.precipitation, 'mm'], ['Humidity', current.relative_humidity_2m, '%'], ['Gusts', current.wind_gusts_10m, 'km/h']].map(([label, value, unit]) => <Box key={label}><Typography component="span" className="weather-metric-label">{label}</Typography><Typography component="strong" className="weather-metric-value">{Number.isFinite(value) ? value : '—'} <span>{unit}</span></Typography></Box>)}</Box>}{current && !status && <Typography className="weather-assessment-reason">{assessment.reason}</Typography>}{current && <Typography className="weather-forecast-period">Next 3 hours · Updated {current.time.slice(11, 16)} local</Typography>}</Box>
    <Box component="form" className="weather-location-form" onSubmit={search}><InputBase placeholder="Search city" value={query} onChange={event => setQuery(event.target.value)} inputProps={{ 'aria-label': 'Weather location', minLength: 2 }} /><Button type="submit" disabled={searching}>Search</Button></Box>
    {cities.map(city => <Button key={city.id} className="weather-city" onClick={() => choose(city)}>{city.name}, {city.admin1 || city.country}</Button>)}
    <Stack direction="row" spacing={1}><Button size="small" onClick={locate} disabled={searching}>Use my location</Button>{location && <Button size="small" onClick={() => setRevision(value => value + 1)} disabled={loading}>Refresh</Button>}</Stack>
    {error && <Typography role="alert" className="weather-error">{error}</Typography>}
    <Typography className="plant-weather-preview">{location?.name || 'Select your growing location'} · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>{current && !status ? ' · Live forecast · Next 3 hours' : ''}</Typography>
  </Card>
}
