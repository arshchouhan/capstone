import { useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import { FaCheckCircle, FaExclamationCircle, FaShareAlt } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import FarmingTools from '../components/FarmingTools'
import PlantWeather from '../components/PlantWeather'
import PlantPhoto from '../components/PlantPhoto'
import basil from '../assets/plant_basil.jpg'
import tomato from '../assets/plant_tomato.jpg'
import chili from '../assets/plant_chili.jpg'
import './PlantDetails.css'

const details = {
  1: { name: 'Basil', scientific: 'Ocimum basilicum', image: basil, status: 'Healthy', score: 92, next: 'Water in 2 days', notes: ['Leaves are full and evenly green.', 'No visible pest damage or disease symptoms.', 'New growth is developing normally.'], summary: 'Your basil is in good condition. Keep the soil lightly moist and place it where it receives bright, indirect light.' },
  2: { name: 'Tomato', scientific: 'Solanum lycopersicum', image: tomato, status: 'Needs care', score: 58, next: 'Fertilize tomorrow', notes: ['Early blight symptoms were detected on lower leaves.', 'Remove affected leaves to reduce spread.', 'Avoid wetting foliage while watering.'], summary: 'Your tomato needs treatment. Remove damaged leaves, apply a suitable fungicide, and re-scan in seven days.' },
  3: { name: 'Chili', scientific: 'Capsicum annuum', image: chili, status: 'Healthy', score: 88, next: 'Water in 5 days', notes: ['Foliage is dense with consistent color.', 'No high-risk symptoms detected.', 'Continue regular sun and watering care.'], summary: 'Your chili plant is growing well. Continue regular checks and keep an eye on new growth.' },
}

export default function PlantDetails() {
  const { id } = useParams()
  const [photoIndex, setPhotoIndex] = useState(0)
  const [addedPhotos, setAddedPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const plant = details[id] || { name: 'Money Plant', scientific: 'Epipremnum aureum', status: 'Healthy', score: 84, next: 'Prune in 6 days', notes: ['Healthy leaves and steady growth.', 'Indoor placement is suitable.', 'Wipe leaves regularly to remove dust.'], summary: 'Your plant looks healthy. Keep its care routine consistent and re-scan if its leaves change.' }
  const needsCare = plant.status === 'Needs care'
  const photos = [plant.image, basil, tomato, chili, ...addedPhotos.filter(photo => photo.plantId === id).map(photo => photo.url)].filter((image, index, all) => image && all.indexOf(image) === index)
  const addPhoto = event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setPhotoError('Choose a JPG, PNG, or WebP image under 10 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => { setAddedPhotos(current => [...current, { plantId: id, url: reader.result }]); setPhotoIndex(photos.length); setPhotoError('') }
    reader.onerror = () => setPhotoError('Could not open this image. Try another file.')
    reader.readAsDataURL(file)
    event.target.value = ''
  }
  return <DashboardLayout className="plant-details-dashboard" dashboardPath="/farm/dashboard"><Box className="plant-details-page">
    <Box className="plant-reference-layout"><aside className="plant-reference-side"><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="h5" fontWeight={800}>{plant.name}</Typography><Typography color="text.secondary" fontStyle="italic">{plant.scientific}</Typography><Chip className={needsCare ? 'details-alert' : 'details-healthy'} icon={needsCare ? <FaExclamationCircle /> : <FaCheckCircle />} label={plant.status} size="small" /></Box><Button className="plant-share" aria-label="Share plant details"><FaShareAlt /></Button></Stack><PlantWeather /></aside>
      <main className="plant-reference-main"><PlantPhoto key={id} plant={plant} photos={photos} photoIndex={photoIndex} setPhotoIndex={setPhotoIndex} addPhoto={addPhoto} />{photoError && <Typography role="alert" color="error" fontSize={12}>{photoError}</Typography>}<Typography className="plant-content-heading">Latest observations</Typography><Typography className="plant-content-copy">{plant.summary}</Typography><FarmingTools key={id} plantId={id} plant={plant} /></main></Box>
  </Box></DashboardLayout>
}
