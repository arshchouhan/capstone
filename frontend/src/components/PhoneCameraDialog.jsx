import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { MdOutlineCameraAlt, MdOutlineSmartphone, MdRefresh } from 'react-icons/md'
import { api } from '../services/api'
import './PhoneCameraDialog.css'

export default function PhoneCameraDialog({open,onClose,onCapture}) {
  const [mode,setMode]=useState('phone'),[session,setSession]=useState(null),[qr,setQr]=useState(''),[preview,setPreview]=useState(''),[connected,setConnected]=useState(false),[photoReady,setPhotoReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[cameraReady,setCameraReady]=useState(false)
  const active=useRef(null),generation=useRef(0),captureAbort=useRef(null),video=useRef(null)
  useEffect(()=>{
    if(!open||mode!=='laptop')return
    let disposed=false,stream
    setError('');setCameraReady(false)
    navigator.mediaDevices?.getUserMedia({video:true,audio:false}).then(value=>{if(disposed){value.getTracks().forEach(track=>track.stop());return}stream=value;video.current.srcObject=value;video.current.play().catch(()=>setError('Could not start the camera. Try again.'))}).catch(()=>setError('Allow camera access, or choose a photo from your gallery.'))
    if(!navigator.mediaDevices)setError('Open this website on localhost to use your laptop camera.')
    return()=>{disposed=true;stream?.getTracks().forEach(track=>track.stop());setCameraReady(false)}
  },[open,mode])
  useEffect(()=>{
    if(!open||mode!=='phone')return
    const current=++generation.current,controller=new AbortController();let timer,ownedSession,frameId=0
    setSession(null);setQr('');setPreview('');setConnected(false);setPhotoReady(false);setError('');setBusy(false)
    const poll=async()=>{try{const value=await api(`/camera-sessions/${ownedSession.id}?after=${frameId}`,{signal:controller.signal});if(current!==generation.current)return;setConnected(value.connected);setPhotoReady(value.photoReady);if(value.pairExpired)setError('This QR code expired. Select New QR code to connect.');if(value.image){frameId=value.frameId;setPreview(value.image)}if(!value.connected)setPreview('');timer=setTimeout(poll,250)}catch(err){if(!controller.signal.aborted){setError(err.message);setConnected(false)}}}
    async function initialize(){try{ownedSession=await api('/camera-sessions',{method:'POST',body:{},signal:controller.signal});if(current!==generation.current){api(`/camera-sessions/${ownedSession.id}`,{method:'DELETE'}).catch(()=>{});return}active.current=ownedSession;setSession(ownedSession);const code=await QRCode.toDataURL(ownedSession.url,{width:280,margin:3,errorCorrectionLevel:'M',color:{dark:'#172846',light:'#ffffff'}});if(current!==generation.current)return;setQr(code);poll()}catch(err){if(!controller.signal.aborted)setError(err.message)}}
    initialize()
    return()=>{generation.current++;controller.abort();captureAbort.current?.abort();clearTimeout(timer);if(ownedSession)api(`/camera-sessions/${ownedSession.id}`,{method:'DELETE',keepalive:true}).catch(()=>{});active.current=null}
  },[open,retry,mode])
  const capture=async()=>{
    if(mode==='laptop'){
      const source=video.current
      if(!source?.videoWidth||source.readyState<2)return
      const canvas=document.createElement('canvas');canvas.width=source.videoWidth;canvas.height=source.videoHeight;canvas.getContext('2d').drawImage(source,0,0);onCapture(canvas.toDataURL('image/jpeg',.9));onClose();return
    }
    const current=generation.current,controller=new AbortController();captureAbort.current=controller;setBusy(true);setError('')
    try{const value=await api(`/camera-sessions/${active.current.id}/capture`,{method:'POST',signal:controller.signal});const started=Date.now();while(Date.now()-started<15000){const photo=await api(`/camera-sessions/${active.current.id}/capture/${value.captureId}`,{signal:controller.signal});if(current!==generation.current)return;if(photo.ready){onCapture(photo.image);onClose();return}await new Promise(resolve=>setTimeout(resolve,300))}throw new Error('Keep the phone page open and try taking the photo again.')}catch(err){if(!controller.signal.aborted)setError(err.message)}finally{if(current===generation.current)setBusy(false)}
  }
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth><DialogTitle sx={{display:'flex',alignItems:'center',gap:1}}><MdOutlineCameraAlt />Take a plant photo</DialogTitle><DialogContent><Box sx={{display:'flex',gap:1,mb:2}}><Button startIcon={<MdOutlineSmartphone />} variant={mode==='phone'?'contained':'text'} onClick={()=>setMode('phone')}>Use phone</Button><Button startIcon={<MdOutlineCameraAlt />} variant={mode==='laptop'?'contained':'text'} onClick={()=>setMode('laptop')}>Use laptop camera</Button></Box>{mode==='phone'?<Box className="phone-camera-layout"><Box className="phone-camera-pairing">{qr?<img className="phone-camera-qr" src={qr} alt="Scan this QR code with your phone to connect its camera" />:!error&&<CircularProgress size={32}/>}<Typography component="h3">Scan to take a photo</Typography><Typography>Connect both devices to the same Wi-Fi. Scan the code, open the link, and tap Take photo.</Typography><Chip size="small" label={photoReady?'Photo received':connected?'Phone connected':'Waiting for your phone'} />{session&&<Button size="small" onClick={()=>navigator.clipboard?.writeText(session.url).catch(()=>setError('Could not copy the camera link.'))}>Copy camera link</Button>}<Button startIcon={<MdRefresh />} size="small" onClick={()=>setRetry(value=>value+1)} disabled={busy}>New QR code</Button></Box><Box className="phone-camera-preview">{preview&&connected?<img src={preview} alt={photoReady?'Photo from your phone':'Live view from your phone camera'} onError={()=>{setPreview('');setError('Could not display the photo. Take another photo on your phone.')}}/>:<Box><MdOutlineCameraAlt/><Typography>Your phone photo will appear here</Typography></Box>}</Box></Box>:<Box className="phone-camera-preview"><video ref={video} autoPlay muted playsInline onLoadedData={()=>setCameraReady(true)} /></Box>}{error&&<Alert severity="warning" sx={{mt:2}}>{error}</Alert>}</DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" startIcon={<MdOutlineCameraAlt />} disabled={busy||(mode==='phone'? !connected||!preview:!cameraReady)} onClick={capture}>{busy?'Capturing…':photoReady&&mode==='phone'?'Use photo':'Capture photo'}</Button></DialogActions></Dialog>
}
