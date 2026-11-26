import {useState} from 'react'
import {Box,Button,Typography,Alert} from '@mui/material'
import {FaGoogle} from 'react-icons/fa'
import useApiData from '../hooks/useApiData'
import {api} from '../services/api'
export default function GoogleConnection({portal}){
 const {data,statusError,error,reload}=useApiData('/google/status',{}),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const act=async(disconnect=false)=>{setBusy(true);setMessage('');try{if(disconnect){await api('/google/connection',{method:'DELETE'});await reload()}else{const result=await api('/google/connect',{method:'POST',body:{portal}});window.location.assign(result.url)}}catch(err){setMessage(err.message)}finally{setBusy(false)}}
 return <Box sx={{my:2,p:1.5,border:'1px solid #d7e5ea',borderRadius:2,bgcolor:'#f7fbfe'}}><Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:1,flexWrap:'wrap'}}><Box><Typography sx={{fontSize:12,fontWeight:650}}>Google Calendar &amp; Meet</Typography><Typography sx={{fontSize:11,color:'#648097'}}>{data.connected?data.email:'Connect your Google account for consultation scheduling.'}</Typography></Box><Button size="small" startIcon={<FaGoogle/>} disabled={busy||data.configured===false} onClick={()=>act(!!data.connected)} sx={{textTransform:'none',fontSize:11,color:'#355b7a'}}>{busy?'Please wait…':data.connected?'Disconnect':'Connect Google'}</Button></Box>{data.configured===false&&<Typography sx={{fontSize:11,color:'#648097',mt:1}}>Google connection setup is not configured yet.</Typography>}{(message||error)&&<Alert severity="warning" sx={{mt:1}}>{message||error}</Alert>}{new URLSearchParams(window.location.search).get('google')==='failed'&&<Alert severity="warning" sx={{mt:1}}>Google connection was not completed. Try again and allow Calendar access.</Alert>}</Box>
}
