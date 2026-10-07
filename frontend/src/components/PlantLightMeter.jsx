import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { MdOutlineArrowBack, MdOutlineWbSunny } from 'react-icons/md'
const bands = ['Low light', 'Medium light', 'Bright light', 'Strong light']
export default function PlantLightMeter({ onBack, onMeasured, initialReading }) {
  const [reading, setReading] = useState(initialReading || null)
  const [measuring, setMeasuring] = useState(false)
  const [error, setError] = useState('')
  const video = useRef(null), stream = useRef(null), timer = useRef(null), run = useRef(0)
  const stop = () => { clearInterval(timer.current); stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; if (video.current) video.current.srcObject = null }
  useEffect(() => () => { run.current++; stop() }, [])
  const measure = async () => {
    stop(); const attempt = ++run.current; setError(''); setMeasuring(true)
    if (!navigator.mediaDevices?.getUserMedia) { setError('Camera access requires HTTPS or localhost.'); setMeasuring(false); return }
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 } }, audio: false })
      if (attempt !== run.current) { camera.getTracks().forEach(track => track.stop()); return }
      stream.current = camera; video.current.srcObject = camera; await video.current.play()
      if (attempt !== run.current) return
      const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 48
      const context = canvas.getContext('2d', { willReadFrequently: true }); const samples = []; let ticks = 0
      if (!context) throw new Error('Camera image processing unavailable')
      timer.current = setInterval(() => {
        ticks++
        if (video.current?.readyState >= 2 && ticks > 4) {
          context.drawImage(video.current, 0, 0, 64, 48)
          const pixels = context.getImageData(0, 0, 64, 48).data; let sum = 0
          for (let i = 0; i < pixels.length; i += 4) sum += .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2]
          samples.push(sum / (pixels.length / 4) / 255 * 100)
        }
        if (ticks >= 16) {
          stop(); setMeasuring(false)
          if (!samples.length) { setError('No camera frames received. Try again.'); return }
          const brightness = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
          const result = { brightness, category: bands[brightness < 25 ? 0 : brightness < 55 ? 1 : brightness < 80 ? 2 : 3], measuredAt: new Date().toISOString(), source: 'webcam-estimate' }
          setReading(result); onMeasured(result)
        }
      }, 250)
    } catch (err) { if (attempt !== run.current) return; stop(); setMeasuring(false); setError(err.name === 'NotAllowedError' ? 'Allow camera access to check brightness.' : 'Could not open your webcam. Close other camera apps and try again.') }
  }
  return <Box className="plant-light-meter"><Button startIcon={<MdOutlineArrowBack />} onClick={onBack}>Back to tools</Button><Typography component="h2">Light check</Typography><Box component="video" ref={video} autoPlay muted playsInline sx={{ display: measuring ? 'block' : 'none', width: '100%', maxHeight: 180, borderRadius: 2, mt: 2 }} /><Box className="light-meter-dial">{measuring ? <CircularProgress size={36} /> : <MdOutlineWbSunny />}<Typography component="h3">{measuring ? 'Checking brightness…' : reading?.category || 'Check this spot'}</Typography><Typography>{reading ? `${reading.brightness ?? '—'}/100 brightness` : 'Laptop webcam estimate'}</Typography></Box><Box className="light-meter-levels">{bands.map(label => <Box key={label} className={reading?.category === label ? 'selected' : ''}><Typography>{label}</Typography></Box>)}</Box><Typography className="light-meter-help">Point your webcam toward the growing spot. We average image brightness over several frames; video stays on your device.</Typography><Button fullWidth variant="contained" onClick={measure} disabled={measuring}>{measuring ? 'Checking camera brightness' : reading ? 'Measure again' : 'Check with webcam'}</Button>{error && <Alert severity="info" sx={{ mt: 2 }}>{error}</Alert>}<Typography className="light-meter-help">Basic project estimate, not calibrated lux. Camera auto-exposure and surface colours affect the result.</Typography>{reading && <Typography className="light-meter-help">Saved to your plant profile · {new Date(reading.measuredAt).toLocaleString()}</Typography>}</Box>
}
