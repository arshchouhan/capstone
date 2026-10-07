import { Box, Button } from '@mui/material'
import { FaCamera, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import EmptyState from './EmptyState'
export default function PlantPhoto({ plant, photos, photoIndex, setPhotoIndex, addPhoto }) {
  return <Box className="plant-image-stage">
    {photos[photoIndex] ? <img src={photos[photoIndex]} alt={`${plant.name} photo ${photoIndex + 1}`} /> : <EmptyState kind="scans" title="No plant photo yet" description="Add a photo to your plant profile." />}
    <Button className="plant-image-back" aria-label="Previous plant photo" disabled={photos.length < 2} onClick={() => setPhotoIndex(current => (current - 1 + photos.length) % photos.length)}><FaChevronLeft /></Button>
    <Button className="plant-image-next" aria-label="Next plant photo" disabled={photos.length < 2} onClick={() => setPhotoIndex(current => (current + 1) % photos.length)}><FaChevronRight /></Button>
    <Button component="label" className="plant-new-image" startIcon={<FaCamera />}>New image<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={addPhoto} /></Button>
  </Box>
}
