import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, TextField, Tooltip, Typography } from '@mui/material'
import { MdArrowBack, MdClose, MdOutlineCameraAlt, MdOutlinePhotoLibrary, MdOutlineCenterFocusStrong, MdOutlineAutoAwesome, MdOutlineDeleteOutline } from 'react-icons/md'
import DashboardLayout from '../components/DashboardLayout'
import PlantAnalysis from '../components/PlantAnalysis'
import PhoneCameraDialog from '../components/PhoneCameraDialog'
import { api, formatScanConfidence, mediaUrl, runScan, scanDetails, scanHistory } from '../services/api'
import './ScanPlant.css'
const scanSessionStorageKey = 'plantaexa:standalone-scan-session'
const scanStages = {
  loading: ['Opening saved scan', 'Getting the saved photos ready for a new diagnosis.'],
  uploading: ['Uploading photos', 'Sending your photos for analysis.'],
  analyzing: ['Analyzing plant health', 'The model is looking for the plant type and signs of disease.'],
}

function ScanProgress({ stage }) {
  const heading = useRef(null)
  useEffect(() => { heading.current?.focus() }, [])
  const [title, description] = scanStages[stage]

  return (
    <Box component="section" className="scan-progress-view" aria-labelledby="scan-progress-title">
      <Box className="scan-progress-content">
        <span className="scan-progress-icon"><MdOutlineAutoAwesome aria-hidden="true" /></span>
        <Box role="status" aria-atomic="true">
          <Typography component="h1" id="scan-progress-title" ref={heading} tabIndex={-1}>{title}</Typography>
          <Typography className="scan-progress-description">{description}</Typography>
        </Box>
        <LinearProgress aria-label={title} />
      </Box>
    </Box>
  )
}

export default function ScanPlant() {
  const navigate = useNavigate()
  const location = useLocation()
  const [photos, setPhotos] = useState([]), [notes, setNotes] = useState(''), [error, setError] = useState(''), [result, setResult] = useState(null), [cameraOpen, setCameraOpen] = useState(false), [savedScans, setSavedScans] = useState([]), [savedScan, setSavedScan] = useState(null), [deleteTarget, setDeleteTarget] = useState(null), [deleteError, setDeleteError] = useState(''), [deleting, setDeleting] = useState(false)
  const [scanStage, setScanStage] = useState(null)
  const generation = useRef(0)
  useEffect(() => {
    api('/scans/unsaved').then(scans => setSavedScans(scans.map(scanHistory))).catch(() => {})
    if (location.state?.newScan) {
      window.localStorage.removeItem(scanSessionStorageKey)
      window.localStorage.removeItem('plantaexa:scan-workspace:standalone-scan')
      navigate(location.pathname, { replace: true, state: {} })
      return
    }
    const savedSession = window.localStorage.getItem(scanSessionStorageKey)
    if (!savedSession) return
    try {
      const { scanId } = JSON.parse(savedSession)
      if (!scanId) throw new Error('Invalid saved scan session.')
      const currentGeneration = generation.current
      api(`/scans/${scanId}`).then(full => {
        if (generation.current === currentGeneration) setSavedScan({ ...scanDetails(full), photos: full.photos.map(mediaUrl) })
      }).catch(err => {
        if (generation.current !== currentGeneration) return
        window.localStorage.removeItem(scanSessionStorageKey)
        setError(err.message)
      })
    } catch {
      window.localStorage.removeItem(scanSessionStorageKey)
    }
  }, [location.state?.newScan])
  useEffect(() => () => { generation.current++ }, [])
  const addFiles = async event => {
    const files = Array.from(event.target.files || []); event.target.value = ''; const current = generation.current
    if (photos.length + files.length > 3) { setError('Select up to three photos.'); return }
    if (files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024)) { setError('Choose JPG, PNG or WebP photos under 10 MB each.'); return }
    try { const images = await Promise.all(files.map(file => new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve({ id: crypto.randomUUID(), image: reader.result, name: file.name }); reader.onerror = reject; reader.readAsDataURL(file) }))); if (current !== generation.current) return; setPhotos(previous => [...previous,...images].slice(0,3)); setResult(null); setError('') } catch { setError('Could not open the photo. Please try again.') }
  }
  const closeCamera = () => setCameraOpen(false)
  const openCamera = () => { setCameraOpen(true); setError('') }
  const capture = image => { setPhotos(previous => [...previous,{ id:crypto.randomUUID(),image,name:'Phone camera photo' }].slice(0,3)); setResult(null) }
  const clear = () => { generation.current++; window.localStorage.removeItem(scanSessionStorageKey); window.localStorage.removeItem('plantaexa:scan-workspace:standalone-scan'); setPhotos([]); setNotes(''); setResult(null); setSavedScan(null); setScanStage(null); setError('') }
  const openSavedScan = async scan => { try { const full = await api(`/scans/${scan.id}`); window.localStorage.setItem(scanSessionStorageKey, JSON.stringify({scanId:scan.id})); setSavedScan({ ...scanDetails(full), photos:full.photos.map(mediaUrl) }); setResult(null) } catch(err) { setError(err.message) } }
  const registerScan = scan => {
    if (cannotRegisterScan(scan)) { setError('This scan cannot be registered because AI could not confirm that the uploaded image is a plant.'); return }
    window.localStorage.removeItem(scanSessionStorageKey)
    window.localStorage.removeItem('plantaexa:scan-workspace:standalone-scan')
    navigate('/farm/dashboard/crops/register', { state: { scan } })
  }
  const requestDelete = scan => { setDeleteError(''); setDeleteTarget(scan) }
  const deleteScan = async () => {
    if (!deleteTarget || deleting) return
    try {
      setDeleting(true)
      await api(`/scans/${deleteTarget.id}`, { method: 'DELETE' })
      setSavedScans(previous => previous.filter(item => item.id !== deleteTarget.id))
      if (savedScan?.scanId === deleteTarget.id) clear()
      setDeleteTarget(null)
      setError('')
    } catch (err) { setDeleteError(err.message) } finally { setDeleting(false) }
  }
  const goToScan = () => { clear(); navigate('/farm/dashboard/scan', { replace: true, state: {} }) }
  const currentScan = result || savedScan
  const submitScan = async (savedScanId) => {
    if (scanStage || (!savedScanId && !photos.length)) return
    const currentGeneration = ++generation.current
    setScanStage(savedScanId ? 'loading' : 'uploading')
    setError('')
    try {
      const previous = savedScanId ? await api(`/scans/${savedScanId}`) : null
      if (generation.current !== currentGeneration) return
      const updated = await runScan({
        kind: previous?.kind || 'Disease Identifier',
        images: previous ? previous.photos : photos.map(photo => photo.image),
        notes: previous ? previous.notes : notes,
        onAnalysisStart: () => {
          if (generation.current === currentGeneration) setScanStage('analyzing')
        },
      })
      if (generation.current !== currentGeneration) return
      window.localStorage.setItem(scanSessionStorageKey, JSON.stringify({ scanId: updated.id }))
      if (savedScanId) {
        setResult(null)
        setSavedScan({ ...scanDetails(updated), photos: updated.photos.map(mediaUrl) })
      } else {
        setResult(scanDetails(updated))
      }
      setSavedScans(scans => [scanHistory(updated), ...scans.filter(scan => scan.id !== updated.id)])
    } catch (err) {
      if (generation.current === currentGeneration) setError(err.message)
    } finally {
      if (generation.current === currentGeneration) setScanStage(null)
    }
  }
  const confidenceLabel = formatScanConfidence(currentScan?.confidence)
  return (
    <DashboardLayout className="scan-dashboard">
      <Box className="scan-capture-page">
        {scanStage ? <ScanProgress stage={scanStage} /> : (
          <>
            <Box className="scan-capture-header">
              {currentScan ? (
                <>
                  <Button startIcon={<MdArrowBack />} onClick={goToScan}>Go scan</Button>
                  {currentScan.scanId && (
                    <Button onClick={() => submitScan(currentScan.scanId)}>Reanalyze saved photo</Button>
                  )}
                  <Box className="scan-header-context">
                    {(photos[0]?.image || savedScan?.photos?.[0]) && <img src={photos[0]?.image || savedScan?.photos?.[0]} alt="" />}
                    <Box>
                      <strong>{currentScan.name || 'Plant scan'}</strong>
                      <small>{currentScan.status || 'Not assessed'}{confidenceLabel ? ` · ${confidenceLabel} confidence` : ''}</small>
                    </Box>
                  </Box>
                </>
              ) : (
                <Button onClick={clear} disabled={!photos.length && !notes}>Clear all</Button>
              )}
            </Box>
            <Box className="scan-capture-title">
              <Typography component="h1">Scan your plant</Typography>
              <Typography>Add up to three clear photos of leaves, stems, or the whole plant.</Typography>
            </Box>
            {error && <Alert severity="info" sx={{ mt: 2 }}>{error}</Alert>}
            {currentScan ? (
              <PlantAnalysis
                plantId="standalone-scan"
                plant={currentScan}
                photos={result ? photos.map(photo => photo.image) : savedScan.photos}
                historical
                showScanActions
              />
            ) : (
              <>
                <Box className="scan-capture-card">
                  <Box className={`scan-selected-photos ${photos.length > 1 ? 'multiple' : ''}`}>
                    {photos.length ? photos.map(photo => (
                      <Box className="scan-photo-preview" key={photo.id}>
                        <img src={photo.image} alt={photo.name} />
                        <IconButton
                          aria-label={`Remove ${photo.name}`}
                          onClick={() => setPhotos(previous => previous.filter(item => item.id !== photo.id))}
                        >
                          <MdClose />
                        </IconButton>
                      </Box>
                    )) : (
                      <Box className="scan-photo-placeholder">
                        <MdOutlineCenterFocusStrong />
                        <Typography>Your plant photos go here</Typography>
                        <Typography>Start with a whole-plant photo, then add a close-up.</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box className="scan-capture-options">
                    <Button onClick={openCamera} disabled={photos.length >= 3}>
                      <MdOutlineCameraAlt /><span>Take photo</span>
                    </Button>
                    <Button component="label" disabled={photos.length >= 3}>
                      <MdOutlinePhotoLibrary /><span>From gallery</span>
                      <input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" disabled={photos.length >= 3} onChange={addFiles} />
                    </Button>
                  </Box>
                  <TextField
                    className="scan-care-notes"
                    fullWidth
                    multiline
                    minRows={6}
                    size="small"
                    label="Anything we should know?"
                    placeholder="Describe leaf changes, watering, or recent care…"
                    value={notes}
                    onChange={event => setNotes(event.target.value)}
                  />
                  <Chip className="scan-photo-count" icon={<MdOutlinePhotoLibrary />} size="small" label={`Selected photos (${photos.length}/3)`} />
                  <Button
                    fullWidth
                    variant="contained"
                    className="scan-diagnose-button"
                    startIcon={<MdOutlineAutoAwesome />}
                    disabled={!photos.length}
                    onClick={() => submitScan()}
                  >
                    Diagnose
                  </Button>
                  <Typography className="scan-capture-caption">Saved here as an unregistered scan until you register this plant.</Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography component="h2" variant="h5">Unregistered scans</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1.5 }}>Open previous scans that are not linked to a registered plant.</Typography>
                  {savedScans.length ? savedScans.map(scan => (
                    <Box key={scan.id} sx={{ display: 'flex', gap: 1, alignItems: 'stretch', mb: 1, border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Button fullWidth onClick={() => openSavedScan(scan)} sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 0 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: '100%' }}>
                          {scan.photo && <Box component="img" src={scan.photo} alt="" sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1 }} />}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={700}>{scan.name || 'Plant scan'}</Typography>
                            <Typography variant="body2" color="text.secondary">{scan.checkedAt ? new Date(scan.checkedAt).toLocaleString() : 'Saved scan'} · {scan.status || 'Complete'}</Typography>
                            <Typography variant="body2" noWrap>{scan.summary}</Typography>
                          </Box>
                        </Box>
                      </Button>
                      <ScanActions scan={scan} onRegister={registerScan} onDelete={requestDelete} />
                    </Box>
                  )) : <Typography color="text.secondary">No unregistered scans yet.</Typography>}
                </Box>
              </>
            )}
            <PhoneCameraDialog open={cameraOpen} onClose={closeCamera} onCapture={capture} />
            <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
              <DialogTitle>Delete this scan?</DialogTitle>
              <DialogContent>
                <Typography>This removes the unregistered scan for <strong>{deleteTarget?.name || 'this plant'}</strong>. This cannot be undone.</Typography>
                {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
                <Button color="error" variant="contained" onClick={deleteScan} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete scan'}</Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Box>
    </DashboardLayout>
  )
}

const cannotRegisterScan = scan => scan.isPlant === false || scan.status === 'Needs better photo' || /not suitable for plant analysis|does not appear to show a plant/i.test(scan.summary || '')
function ScanActions({ scan, onRegister, onDelete }) {
  const register = cannotRegisterScan(scan)
    ? <Tooltip title="AI could not confirm this image is a plant. Upload a clear plant photo to register it."><span><Button variant="outlined" size="small" disabled startIcon={<MdOutlineAutoAwesome />} sx={{whiteSpace:'nowrap','&.Mui-disabled':{color:'#6d8292',borderColor:'#c9d8df'}}}>Can’t register</Button></span></Tooltip>
    : <Button variant="outlined" size="small" onClick={() => onRegister(scan)} sx={{whiteSpace:'nowrap'}}>Register</Button>
  return <Box sx={{alignSelf:'center',display:'flex',alignItems:'center',gap:.75}}>{register}<Tooltip title="Delete scan"><Button size="small" color="error" aria-label={`Delete ${scan.name || 'scan'}`} onClick={() => onDelete(scan)} sx={{minWidth:34,p:.7,border:'1px solid',borderColor:'error.light'}}><MdOutlineDeleteOutline /></Button></Tooltip></Box>
}
