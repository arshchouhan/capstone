import {useState} from 'react'
import {Button,Alert,Box} from '@mui/material'
import {api} from '../services/api'
export default function MeetActions({appointment,doctor=false,onChange}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const schedule=async()=>{setBusy(true);setError('');try{const result=await api('/appointments/'+(appointment.id||appointment._id)+'/google-meet',{method:'POST',body:{}});await onChange?.();if(result.pending)setError('Google is preparing the Meet link. Refresh the meeting shortly.')}catch(err){setError(err.message)}finally{setBusy(false)}}
 const upcoming=appointment.status==='booked'&&new Date(appointment.startsAt)>new Date()
 return <Box sx={{mt:1}}>{appointment.meetUrl&&appointment.status==='booked'&&<Button component="a" href={appointment.meetUrl} target="_blank" rel="noopener noreferrer" size="small">Open Google Meet</Button>}{doctor&&upcoming&&<Button size="small" disabled={busy} onClick={schedule}>{busy?'Scheduling…':appointment.meetUrl?'Refresh meeting':'Schedule Google Meet'}</Button>}{error&&<Alert severity="info">{error}</Alert>}</Box>
}
