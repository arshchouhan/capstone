import { useEffect, useState, useRef } from 'react'
import useApiData from '../hooks/useApiData'
import { api, mediaUrl, uploadPhoto, fileData, scanDetails, scanHistory } from '../services/api'
import EmptyState from '../components/EmptyState'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import { FaCheckCircle, FaExclamationCircle, FaShareAlt } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import FarmingTools from '../components/FarmingTools'
import PlantCareSchedule from '../components/PlantCareSchedule'

import PlantProfileInfo from '../components/PlantProfileInfo'
import { PlantDetailTabs } from '../components/PlantDetailTabs.jsx'
import PlantWeather from '../components/PlantWeather'
import PlantPhoto from '../components/PlantPhoto'
import PlantAnalysis from '../components/PlantAnalysis'
import { RecoveryProgress } from '../components/RecoveryProgress.jsx'
import DiagnosisHistory from '../components/DiagnosisHistory'
import './PlantDetails.css'


export default function PlantDetails() {
  const { id } = useParams()
  const pageRef = useRef(null)
  const detailTabStorageKey = `plantaexa:plant-tab:${id}`
  const [detailTab, setDetailTab] = useState(() => {
    const savedTab = Number(window.localStorage.getItem(detailTabStorageKey))
    return Number.isInteger(savedTab) && savedTab >= 0 && savedTab <= 3 ? savedTab : 0
  })
  const [recoveryResult, setRecoveryResult] = useState(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [addedPhotos, setAddedPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const {data: fetchedPlant,setData:setFetchedPlant,error:plantError,loading:plantLoading,reload:reloadPlant} = useApiData(`/plants/${id}`,null)
  const {data: fetchedScans,reload:reloadScans} = useApiData(`/plants/${id}/scans`)
  const {data: careTasks} = useApiData(`/plants/${id}/care-tasks`)
  const latestScan = fetchedScans.find(scan => scan.state === 'complete' && !scan.sample && ['Disease Identifier','Recovery check'].includes(scan.kind))
  const plant = {...(fetchedPlant || {}), ...(latestScan ? scanDetails(latestScan) : {})}
  const activeRecovery = {history:fetchedScans.filter(scan=>scan.state==='complete'&&scan.kind!=='Insect Identifier').map(scanHistory),photo:recoveryResult?.plantId===id ? recoveryResult.photo : ''}
  const recoveryChecks = activeRecovery.history.filter(scan => scan.kind === 'Recovery check')
  const actualChecks = recoveryChecks.filter(scan => !scan.sample)
  const recoveryHistory = actualChecks.length ? actualChecks : recoveryChecks
  const taskCount = careTasks.filter(task=>task.lastCompleted).length
  const needsCare = ['Needs Care','At Risk'].includes(plant.status)
  const photos = [mediaUrl(plant.image), ...fetchedScans.filter(scan=>scan.kind!=='Insect Identifier').flatMap(scan=>scan.photos || []).map(mediaUrl), ...addedPhotos.filter(photo => photo.plantId === id).map(photo => photo.url)].filter((image, index, all) => image && all.indexOf(image) === index)
  const addPhoto = async event => {
    const file=event.target.files?.[0]; event.target.value=''; if(!file)return
    try { const url=await uploadPhoto(await fileData(file)); await api(`/plants/${id}`,{method:'PATCH',body:{image:url}}); setAddedPhotos(current=>[...current,{plantId:id,url:mediaUrl(url)}]); setPhotoIndex(0); setPhotoError(''); reloadPlant() } catch(err) { setPhotoError(err.message) }
  }
  const [toolExpanded, setToolExpanded] = useState(false)
  useEffect(() => {
    window.localStorage.setItem(detailTabStorageKey, String(detailTab))
  }, [detailTab, detailTabStorageKey])
  if(!fetchedPlant) return <DashboardLayout className="plant-details-dashboard"><EmptyState kind="plants" title={plantLoading ? 'Loading plant…' : 'Plant unavailable'} description={plantError || 'Loading your plant profile.'} /></DashboardLayout>
  return <DashboardLayout className="plant-details-dashboard" dashboardPath="/farm/dashboard"><Box ref={pageRef} className={`plant-details-page ${toolExpanded ? 'plant-tool-expanded' : ''}`}>
    <Box className="plant-reference-layout"><aside className="plant-reference-side"><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="h5" fontWeight={800}>{plant.name}</Typography><Typography color="text.secondary" fontStyle="italic">{plant.scientific}</Typography><Chip className={needsCare ? 'details-alert' : 'details-healthy'} icon={needsCare ? <FaExclamationCircle /> : <FaCheckCircle />} label={plant.status} size="small" /></Box><Button className="plant-share" aria-label="Share plant details"><FaShareAlt /></Button></Stack><PlantDetailTabs key={id} plantId={id} plant={fetchedPlant} tab={detailTab} onTabChange={setDetailTab} /><PlantWeather /></aside>
      <main className="plant-reference-main"><PlantPhoto key={`photo-${id}`} plant={plant} photos={photos} photoIndex={photoIndex} setPhotoIndex={setPhotoIndex} addPhoto={addPhoto} />{photoError && <Typography role="alert" color="error" fontSize={12}>{photoError}</Typography>}{detailTab === 0 && <PlantProfileInfo key={`info-${id}`} plantId={id} plant={fetchedPlant} onUpdated={updated => setFetchedPlant(current => ({ ...current, ...(typeof updated === 'function' ? updated(current) : updated) }))} />}{detailTab === 1 && <PlantAnalysis key={`analysis-${id}`} onRecoveryComplete={result => { setRecoveryResult({ ...result, plantId: id }); reloadScans(); reloadPlant(); setDetailTab(3) }} plantId={id} plant={plant} photos={photos} photoIndex={photoIndex} />}{detailTab === 2 && <>{!toolExpanded && <PlantCareSchedule key={`schedule-${id}`} plantId={id} onTasksChanged={reloadPlant} />}<FarmingTools key={`calculators-${id}`} plantId={id} plant={plant} onActiveChange={expanded => { setToolExpanded(expanded); pageRef.current?.scrollTo({ top: 0, behavior: 'instant' }) }} /></>}{detailTab === 3 && <Box className="plant-care-guide-content"><Typography component="h2">Diagnosis</Typography><DiagnosisHistory key={`history-${id}`} plant={plant} history={activeRecovery.history} latestPhoto={activeRecovery.photo} referencePhoto={photos[photoIndex]} /><RecoveryProgress key={`progress-${id}`} plantId={id} onReviewCare={() => setDetailTab(1)} history={recoveryHistory} photo={activeRecovery.photo} baselinePhoto={photos[photoIndex]} completedTasks={taskCount} totalTasks={careTasks.length} /></Box>}</main></Box>
  </Box></DashboardLayout>
}
