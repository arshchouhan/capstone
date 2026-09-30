import { useState } from 'react'
import { Box, Button, Chip, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { FaCamera, FaChevronLeft, FaChevronRight, FaLeaf, FaUndo } from 'react-icons/fa'

export default function PlantPhoto({ plant, photos, photoIndex, setPhotoIndex, addPhoto }) {
  const [flipped, setFlipped] = useState(false)
  const hasProfile = photoIndex === 0
  return <Box className={`plant-image-stage plant-flip-stage${flipped ? ' is-flipped' : ''}`}>
    <Box className="plant-flip-inner">
      <Box className="plant-flip-front" inert={flipped}>
        <img src={photos[photoIndex]} alt={`${plant.name} photo ${photoIndex + 1}`} />
        <Button className="plant-image-back" aria-label="Previous plant photo" disabled={photos.length < 2} onClick={() => setPhotoIndex(current => (current - 1 + photos.length) % photos.length)}><FaChevronLeft /></Button>
        <Button className="plant-image-next" aria-label="Next plant photo" disabled={photos.length < 2} onClick={() => setPhotoIndex(current => (current + 1) % photos.length)}><FaChevronRight /></Button>
        <Button className="plant-analysis-toggle" startIcon={<FaLeaf />} onClick={() => setFlipped(true)} aria-expanded={flipped}>AI analysis</Button>
        <Button component="label" className="plant-new-image" startIcon={<FaCamera />}>New image<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={addPhoto} /></Button>
      </Box>
      <Box className="plant-flip-back" inert={!flipped}>
        <Box className="plant-analysis-header"><Box><Typography className="plant-analysis-eyebrow">PLANT HEALTH REVIEW</Typography><Typography component="h2">Disease analysis</Typography></Box><Button startIcon={<FaUndo />} onClick={() => setFlipped(false)}>Back to photo</Button></Box>
        <Chip size="small" label={hasProfile ? 'Profile preview · no live AI result' : 'This photo has not been analyzed'} />
        {hasProfile ? <><Box className="plant-analysis-summary"><Box><Typography>Recorded condition</Typography><strong>{plant.status}</strong></Box><Box><Typography>Possible disease</Typography><strong>{plant.status === 'Needs care' ? 'Early blight · unconfirmed' : 'None recorded'}</strong></Box><Box><Typography>Model confidence</Typography><strong>Not available</strong></Box></Box><Typography component="h3">Visible observations</Typography><ul>{plant.notes.map(note => <li key={note}>{note}</li>)}</ul><Typography component="h3">Summary & next step</Typography><Typography className="plant-analysis-copy">{plant.summary}</Typography></> : <Typography className="plant-analysis-copy">Run a scan for this image to get a disease prediction, supporting observations, confidence, and follow-up guidance.</Typography>}
        <section className="plant-related-crops" aria-labelledby="related-crops-heading"><h2 id="related-crops-heading">Can also be found in</h2><div className="plant-related-crop-list"><span><span aria-hidden="true">🍂</span> Almond</span><span><span aria-hidden="true">🍋</span> Apricot</span><span><span aria-hidden="true">🍒</span> Cherry</span></div></section>
        <Button component={Link} to="/farm/dashboard/scan" variant="contained" startIcon={<FaCamera />} className="plant-analysis-scan">Open plant scan</Button>
      </Box>
    </Box>
  </Box>
}
