import { useEffect, useState } from 'react'
import { Box, Card, Typography, Skeleton, Button } from '@mui/material'
import { FaMoon, FaSun, FaCloud, FaCloudRain } from 'react-icons/fa'
import { assessSprayingWeather } from './sprayingWeather'
import { api } from '../services/api'
export default function PlantWeather() {
  const [location, setLocation] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const status = ''
  useEffect(() => { let alive=true; api('/preferences').then(value=>{if(alive && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) setLocation({...value,name:'Your location'})}).catch(err=>{if(alive)setError(err.message)}).finally(()=>{if(alive)setLoading(false)}); return ()=>{alive=false} },[])
  const locate = () => {
    if (!navigator.geolocation) {setError('Location is unavailable in this browser.');return}
    setLoading(true); setError('')
    navigator.geolocation.getCurrentPosition(async position=>{try{const coordinates={latitude:position.coords.latitude,longitude:position.coords.longitude};await api('/preferences',{method:'PUT',body:coordinates});setLocation({...coordinates,name:'Your location'})}catch(err){setError(err.message)}finally{setLoading(false)}},()=>{setLoading(false);setError('Enable location to see your local forecast.')},{timeout:10000,maximumAge:900000})
  }
  useEffect(() => {
    if (!location) return
    const controller = new AbortController()
    const refresh = async () => {setLoading(true);setError('');try{const value=await api(`/weather?${new URLSearchParams({latitude:location.latitude,longitude:location.longitude})}`,{signal:controller.signal});if(!controller.signal.aborted)setWeather(value)}catch(err){if(!controller.signal.aborted)setError(err.message)}finally{if(!controller.signal.aborted)setLoading(false)}}
    refresh(); const timer=setInterval(refresh,900000)
    return ()=>{controller.abort();clearInterval(timer)}
  },[location])
  const assessment = assessSprayingWeather(weather)
  const current = weather?.current
  const Icon = current?.weather_code >= 51 ? FaCloudRain : current?.weather_code >= 2 ? FaCloud : current?.is_day ? FaSun : FaMoon
  return <Card variant="outlined" className="plant-care-path plant-weather-card" aria-busy={loading}>
    <Box className="plant-weather-summary"><Box className="plant-weather-date"><Typography>{loading ? <Skeleton width={65} /> : current ? new Date(`${current.time.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : 'Local weather'}</Typography><Typography component="strong">{loading ? <Skeleton width={85} height={30} /> : current ? `${Math.round(current.temperature_2m)} °C` : '— °C'}</Typography></Box><Box className={`plant-weather-icon ${loading ? 'weather-icon-loading' : ''}`} aria-hidden="true">{loading ? <Skeleton variant="circular" width={48} height={48} /> : <Icon />}</Box></Box>
    <Box className="plant-spraying-summary"><Typography>{loading ? <Skeleton width={140} /> : 'Spraying conditions'}</Typography><Typography component="strong" className="spraying-status">{loading ? <Skeleton width={150} /> : status || (current ? assessment.status : 'Location required')}</Typography><Box className="weather-metrics">{[['Wind', current?.wind_speed_10m, 'km/h'], ['Rain', current?.precipitation, 'mm'], ['Humidity', current?.relative_humidity_2m, '%'], ['Gusts', current?.wind_gusts_10m, 'km/h']].map(([label, value, unit]) => <Box key={label}><Typography component="span" className="weather-metric-label">{loading ? <Skeleton width={55} /> : label}</Typography><Typography component="strong" className="weather-metric-value">{loading ? <Skeleton width={80} /> : <>{Number.isFinite(value) ? value : '—'} <span>{unit}</span></>}</Typography></Box>)}</Box><Typography className="weather-assessment-reason">{loading ? <><Skeleton width="100%" /><Skeleton width="75%" /></> : current && !status ? assessment.reason : 'Local spraying conditions will appear when weather is available.'}</Typography><Typography className="weather-forecast-period">{loading ? <Skeleton width="80%" /> : current ? `Next 3 hours · Updated ${current.time.slice(11, 16)} local` : 'Next 3 hours · Awaiting local forecast'}</Typography></Box>
    {!location && <Button onClick={locate} disabled={loading}>Use my location</Button>}
    {error && <Typography role="alert" className="weather-error">{error}</Typography>}
    <Typography className="plant-weather-preview">{loading ? <Skeleton width="90%" /> : <>{location?.name || 'Local weather'} · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>{current && !status ? ' · Live forecast · Next 3 hours' : ''}</>}</Typography>
  </Card>
}