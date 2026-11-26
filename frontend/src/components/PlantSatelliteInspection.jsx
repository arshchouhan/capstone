import { useState } from 'react'
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { MdOutlinePlace, MdOutlineSatelliteAlt } from 'react-icons/md'
import { api } from '../services/api'
import './PlantSatelliteInspection.css'

const imageryHosts = ['server.arcgisonline.com', 'services.arcgisonline.com']

function imageryUrl({ latitude, longitude }, host) {
  const radians = latitude * Math.PI / 180
  const radius = 6378137
  const x = radius * longitude * Math.PI / 180
  const y = radius * Math.asinh(Math.tan(radians))
  const offset = 160 / Math.cos(radians)
  const params = new URLSearchParams({
    bbox: [x - offset, y - offset, x + offset, y + offset].join(','),
    bboxSR: 3857, imageSR: 3857, size: '640,640', format: 'jpg', f: 'image',
  })
  return `https://${host}/ArcGIS/rest/services/World_Imagery/MapServer/export?${params}`
}

function ImageryCredit() {
  return <a href="https://doc.arcgis.com/en/data-appliance/2024/maps/world-imagery.htm" target="_blank" rel="noreferrer" className="plant-satellite-credit">Esri, Maxar, Earthstar Geographics &amp; GIS User Community</a>
}

function mapEmbedUrl(coordinates) {
  const params = new URLSearchParams({ bbox: '-180,-76,180,76', layer: 'mapnik' })
  if (coordinates) {
    const { latitude, longitude } = coordinates
    const mapLat = Math.max(-85, Math.min(85, latitude))
    const delta = .004
    const lonDelta = delta / Math.cos(mapLat * Math.PI / 180)
    params.set('bbox', [Math.max(-180, longitude - lonDelta), Math.max(-85, mapLat - delta),
      Math.min(180, longitude + lonDelta), Math.min(85, mapLat + delta)].join(','))
    params.set('marker', `${latitude},${longitude}`)
  }
  return `https://www.openstreetmap.org/export/embed.html?${params}`
}

const statusMessages = {
  unconfigured: 'Vegetation imagery is unavailable on this server.',
  'no-data': 'No usable Sentinel-2 readings were found for this area in the last 30 days.',
  'outside-coverage': 'This location is outside the coverage of the in-app vegetation preview.',
}
const formatDate = value => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))

export default function PlantSatelliteInspection({ plantId, coordinates, onEdit }) {
  const [layer, setLayer] = useState('map')
  const [vegetation, setVegetation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageryAttempt, setImageryAttempt] = useState(0)

  async function selectLayer(next) {
    if (!next) return
    setLayer(next)
    if (next === 'map' || next === 'satellite' || vegetation || loading) return
    setLoading(true)
    setError('')
    try { setVegetation(await api(`/plants/${plantId}/satellite`)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const { latitude, longitude, accuracy } = coordinates || {}
  const index = vegetation?.[layer]
  const showMap = layer === 'map'
  const showIndex = layer === 'ndvi' || layer === 'ndre'
  const showImagery = layer === 'satellite' || showIndex
  const imageryHost = imageryHosts[imageryAttempt]
  const hasImagery = coordinates && imageryHost && Math.abs(latitude) <= 84
  const imageryDate = vegetation?.status === 'available' && (vegetation.from === vegetation.to
    ? formatDate(vegetation.from) : `${formatDate(vegetation.from)} – ${formatDate(vegetation.to)}`)
  const details = [
    ['Coordinates', coordinates && `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`],
    ['NDVI average', vegetation?.ndvi?.average?.toFixed(2)],
    ['Chlorophyll (NDRE) average', vegetation?.ndre?.average?.toFixed(2)],
    ['Vegetation imagery date', imageryDate],
  ]

  return <Box component="section" className="plant-satellite" aria-labelledby="plant-satellite-title">
    <Box className="plant-satellite-header">
      <span className="plant-satellite-icon"><MdOutlineSatelliteAlt aria-hidden /></span>
      <Box>
        <Typography id="plant-satellite-title" component="h2">Satellite inspection</Typography>
        <Typography variant="body2" color="text.secondary">{coordinates ? 'Inspect the area around this plant.' : 'Add a plant location to unlock Satellite, NDVI, and NDRE.'}</Typography>
      </Box>
      <Button className="plant-satellite-edit" onClick={onEdit}>{coordinates ? 'Edit location' : 'Add location'}</Button>
    </Box>
    <ToggleButtonGroup className="plant-satellite-toolbar" size="small" exclusive value={layer} onChange={(_, next) => selectLayer(next)} aria-label="Satellite layer">
      <ToggleButton value="map">Map</ToggleButton>
      <ToggleButton value="satellite" disabled={!coordinates}>Satellite</ToggleButton>
      <ToggleButton value="ndvi" disabled={!coordinates}>NDVI</ToggleButton>
      <ToggleButton value="ndre" disabled={!coordinates}>NDRE</ToggleButton>
    </ToggleButtonGroup>
    <Box className="plant-satellite-content">
      {showMap && <iframe className="plant-satellite-frame" title={coordinates ? 'Map of saved plant location' : 'World map'} src={mapEmbedUrl(coordinates)} loading="lazy" />}
      {showImagery && (hasImagery || index ? <Box className="plant-satellite-map">
          {hasImagery && <img src={imageryUrl(coordinates, imageryHost)} alt="Aerial imagery centered on the saved plant coordinates" onError={() => setImageryAttempt(current => current + 1)} referrerPolicy="no-referrer" />}
          {index && <img className={`plant-satellite-raster${hasImagery ? ' plant-satellite-raster-overlay' : ''}`} src={index.image} alt={`${layer.toUpperCase()} raster for the area around the plant`} />}
          <MdOutlinePlace className="plant-satellite-pin" aria-label="Saved plant location" />
          {hasImagery && <ImageryCredit />}
        </Box> : <Box className="plant-satellite-map-status"><Box>
          <Typography role="status">Aerial imagery is unavailable for this view.</Typography>
          {!imageryHost && <Button onClick={() => setImageryAttempt(0)}>Retry aerial imagery</Button>}
        </Box></Box>)}
      <Stack component="aside" spacing={1.5} className="plant-satellite-details">
        <Typography component="h4" fontWeight={700}>Inspection details</Typography>
        <Box component="dl" className="plant-satellite-readings">
          {details.map(([label, value]) => <Box key={label}>
            <Typography component="dt" variant="body2">{label}</Typography>
            <Typography component="dd" variant="body2" color={value ? 'text.primary' : 'text.secondary'}>
              {value || (!coordinates ? 'Awaiting location' : vegetation ? 'Unavailable' : 'Awaiting imagery')}
            </Typography>
          </Box>)}
        </Box>
        {Number.isFinite(accuracy) && <Typography variant="caption" color="text.secondary">Estimated device accuracy ±{Math.ceil(accuracy)} m</Typography>}
        {showIndex && loading && <Typography role="status" variant="body2">Loading Sentinel-2 imagery…</Typography>}
        {showIndex && error && <Box><Typography role="alert" variant="body2">{error}</Typography><Button onClick={() => selectLayer(layer)}>Retry</Button></Box>}
        {showIndex && statusMessages[vegetation?.status] && <Typography role="status" variant="body2">{statusMessages[vegetation.status]}</Typography>}
        {index && <>
          <Box><Box className="plant-satellite-legend" /><Box className="plant-satellite-legend-labels"><span>−1 · Low</span><span>+1 · High</span></Box></Box>
          <Typography variant="caption" color="text.secondary">Sentinel-2{vegetation.source ? ` via ${vegetation.source}` : ''} · {vegetation.coverage}% usable pixels. Readings describe the surrounding area.</Typography>
        </>}
      </Stack>
    </Box>
  </Box>
}
