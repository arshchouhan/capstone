import { useEffect, useRef, useState } from 'react'
import { Box, Button, Avatar, TextField, InputAdornment, Select, MenuItem, Typography, Stack, Tabs, Tab, Divider, Alert, ThemeProvider, createTheme, Skeleton, IconButton } from '@mui/material'
import { FaArrowRight, FaCheckCircle, FaRegCalendarAlt, FaSearch, FaStar, FaRegCommentDots } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import useApiData from '../hooks/useApiData'
import { api, mediaUrl } from '../services/api'
import EmptyState from '../components/EmptyState'
import './CareSchedule.css'

async function getExpertDetails(expert) { return api(`/experts/${expert.id}`) }
const slotLabel = value => new Date(value).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})
const nextSlot = expert => expert.availableSlots?.filter(slot=>new Date(slot)>new Date()).sort((a,b)=>new Date(a)-new Date(b))[0]
const dateKey = date => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`


const theme = createTheme({ palette: { primary: { main: '#355b7a' }, text: { primary: '#172846', secondary: '#6a7e8a' } }, typography: { fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 13 }, shape: { borderRadius: 12 } })

export default function CareSchedule() {
  const {data: experts,error:expertError} = useApiData('/experts')
  const {data: rawAppointments,reload:reloadAppointments} = useApiData('/appointments')
  const specialties = [...new Set(experts.map(expert=>expert.specialty))]
  const [directoryTab,setDirectoryTab]=useState('all')
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [expert, setExpert] = useState(null)
  const [loadingExpert, setLoadingExpert] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('3:00 PM')
  const appointments = rawAppointments.filter(item=>item.status === 'booked').map(item=>({...item,expertId:item.expert?.id,expert:item.expert?.name,date:dateKey(new Date(item.startsAt)),time:new Date(item.startsAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),label:new Date(item.startsAt).toLocaleDateString()}))
  const [notice, setNotice] = useState(''), [noticeError,setNoticeError]=useState(false), [consultationNotes,setConsultationNotes]=useState(''), [bookingBusy,setBookingBusy]=useState(false), [refreshing,setRefreshing]=useState(false)
  const bookingRef = useRef(null)
  const expertRequest = useRef(0)
  const dismissExpert = () => { expertRequest.current++; setDetailsOpen(false); setExpert(null); setLoadingExpert(false); setTime(''); setNotice('') }
  useEffect(()=>{
    if(!expert)return
    const outside=event=>{if(event.target instanceof Element && !event.target.closest('.expert-list-row, .expert-detail-pane, .MuiPopover-root'))dismissExpert()}
    const escape=event=>{if(event.key==='Escape')dismissExpert()}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}
  },[expert])
  const slots=expert?.availableSlots||[]
  const days=[...new Set(slots.map(value=>new Date(value).toDateString()))].slice(0,5).map(value=>new Date(value))
  const times=slots.filter(value=>days[day]&&dateKey(new Date(value))===dateKey(days[day]))
  const available=(_index,slot)=>slots.includes(slot)&&new Date(slot)>new Date()&&!rawAppointments.some(item=>item.status==='booked'&&item.expert?.id===expert?.id&&new Date(item.startsAt).getTime()===new Date(slot).getTime())
  const connectedExpertIds=new Set(rawAppointments.filter(item=>item.status==='booked'||item.status==='completed').map(item=>item.expert?.id||item.expert?._id))
  const filtered = experts.filter(item => (directoryTab==='all'||connectedExpertIds.has(item.id)) && `${item.name} ${item.specialty} ${item.description}`.toLowerCase().includes(query.toLowerCase()) && (specialty === 'all' || specialty === item.specialty) && (availability === 'all' || item.availableSlots?.some(slot=>{const date=new Date(slot),end=new Date();end.setDate(end.getDate()+Number(availability));end.setHours(23,59,59,999);return date>new Date()&&date<=end})))
  const chooseExpert = async (item, booking = false) => {
    const request = ++expertRequest.current
    setDetailsOpen(true); setLoadingExpert(true); setExpert(item); setDay(0); setTime(''); setNotice('');setNoticeError(false);setConsultationNotes('')
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    let details; try { details=await getExpertDetails(item) } catch(err){if(request===expertRequest.current){setNotice(err.message);setLoadingExpert(false)}return}
    if (request !== expertRequest.current) return
    setExpert(details); setDay(0); setLoadingExpert(false); if(booking)setTimeout(()=>document.getElementById('expert-booking-slots')?.scrollIntoView({behavior:'smooth',block:'start'}),250)
  }

  const refreshSlots=async()=>{if(!expert||refreshing)return;const selected=expert.id,request=expertRequest.current;setRefreshing(true);try{const details=await getExpertDetails(expert);if(request!==expertRequest.current)return;setExpert(details);setDay(0);setTime('');await reloadAppointments()}catch(err){setNoticeError(true);setNotice(err.message)}finally{setRefreshing(false)}}
  const book = async () => {
    if(bookingBusy||!time || !available(day,time))return
    const selected=expert.id;setBookingBusy(true);setNotice('');setNoticeError(false)
    try{await api('/appointments',{method:'POST',body:{expert:selected,startsAt:new Date(time).toISOString(),notes:consultationNotes.trim()}});await reloadAppointments();setNotice('Appointment reserved.');setTime('');setConsultationNotes('')}
    catch(err){setNoticeError(true);setNotice(err.message)}finally{setBookingBusy(false)}
  }
  const cancel = async item => {try{await api('/appointments/'+item.id,{method:'DELETE'});await reloadAppointments();setNoticeError(false);setNotice('Appointment cancelled.')}catch(err){setNoticeError(true);setNotice(err.message)}}
  const downloadCalendar=item=>{
    const escape=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g,value=>'\\'+value)
    const stamp=date=>new Date(date).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')
    const duration=item.expertId===expert?.id?expert.consultationMinutes:30
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Plantaexa//Consultation//EN','BEGIN:VEVENT','UID:'+item.id+'@plantaexa','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(item.startsAt),'DTEND:'+stamp(new Date(new Date(item.startsAt).getTime()+(duration||30)*60000)),'SUMMARY:'+escape('Plant consultation with '+item.expert),'DESCRIPTION:'+escape(item.notes),'END:VEVENT','END:VCALENDAR']
    const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='plant-consultation.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return <DashboardLayout className="care-dashboard"><ThemeProvider theme={theme}><Box className="care-page expert-split-page">
    <Box className="care-columns"><Box component="section" className="care-directory" aria-label="Plant experts">
      <Box className="care-directory-heading"><Typography component="h2">Find your plant’s person</Typography><Typography>{filtered.length} experts to explore</Typography></Box>
      <Tabs className="expert-directory-tabs" value={directoryTab} onChange={(_,value)=>{setDirectoryTab(value);dismissExpert()}} aria-label="Expert directory"><Tab value="all" label="All experts"/><Tab value="yours" label="Your doctor"/></Tabs><Box className="care-filters"><TextField size="small" placeholder="Search name or expertise" value={query} onChange={event => setQuery(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch /></InputAdornment> }, htmlInput: { 'aria-label': 'Search experts' } }} /><Select size="small" value={specialty} onChange={event => setSpecialty(event.target.value)} inputProps={{ 'aria-label': 'Specialty' }}><MenuItem value="all">All specialties</MenuItem>{specialties.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select><Select size="small" value={availability} onChange={event => setAvailability(event.target.value)} inputProps={{ 'aria-label': 'Availability' }}><MenuItem value="all">Any time</MenuItem><MenuItem value="0">Today</MenuItem><MenuItem value="1">By tomorrow</MenuItem></Select></Box>
      <Box className="expert-list">{!filtered.length && <EmptyState kind="experts" title={directoryTab==='yours'?'No doctor connected yet':undefined} description={directoryTab==='yours'?'Experts you book consultations with will appear here.':undefined} />}{filtered.map(item=><button type="button" key={item.id} className={`expert-list-row ${expert?.id===item.id?'selected':''}`} aria-pressed={expert?.id===item.id} onClick={()=>chooseExpert(item)}><Avatar src={mediaUrl(item.avatarUrl)||'/images/expert-placeholder.svg'} /><span className="expert-list-copy"><strong>{item.name}</strong><span>{item.specialty}</span><small>{item.reviews ? item.rating+' · '+item.reviews+' reviews' : 'Not rated yet'}</small></span><FaRegCommentDots className="expert-chat-icon" aria-hidden="true" /></button>)}</Box>
    </Box>
    <Box component="section" className="expert-detail-pane" aria-label="Expert details"><Box className="care-drawer-toolbar">{expert && <IconButton aria-label="Close expert details" onClick={dismissExpert}>×</IconButton>}</Box>{!expert ? <Box className="expert-detail-empty"><EmptyState kind="experts" title="Select an expert" description="Choose a specialist from the list to see their profile and appointment times." /></Box> : loadingExpert ? <Box className="care-details-skeleton" role="status" aria-label="Loading expert details"><Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}><Skeleton variant="circular" width={48} height={48} /><Box sx={{ flex: 1 }}><Skeleton width="70%" /><Skeleton width="50%" /></Box></Stack><Skeleton height={70} /><Skeleton width="45%" /><Skeleton variant="rounded" height={64} /><Skeleton sx={{ mt: 3 }} width="45%" /><Skeleton variant="rounded" height={40} /><Skeleton variant="rounded" height={80} sx={{ mt: 3 }} /><Skeleton variant="rounded" height={44} sx={{ mt: 2 }} /></Box> : expert && <Box component="aside" className="care-booking-column"><Box className="care-panel" ref={bookingRef}><Stack className="care-selected-expert" direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><Avatar src={mediaUrl(expert.avatarUrl) || '/images/expert-placeholder.svg'} /><Box><Typography component="h3">{expert.name}</Typography><Typography>{loadingExpert ? 'Loading expert details…' : expert.specialty}</Typography></Box></Stack>
    <Box className="expert-profile-summary"><Typography component="h4" className="expert-section-title">About the expert</Typography><Typography>{expert.description || 'Profile details not provided.'}</Typography><Box component="dl" className="expert-card-facts"><div><dt>Qualifications</dt><dd>{expert.qualifications || 'Not provided'}</dd></div><div><dt>Experience</dt><dd>{expert.experienceYears != null ? expert.experienceYears+' years' : 'Not provided'}</dd></div><div><dt>Location</dt><dd>{expert.location || 'Not provided'}</dd></div><div><dt>Languages</dt><dd>{expert.languages?.join(', ') || 'Not provided'}</dd></div></Box></Box>
    <Box className="expert-appointment-section"><Typography component="h4" className="expert-section-title">Book a consultation</Typography>{!slots.length && <Alert severity="info">No appointment times available. Check back later.</Alert>}<Box id="expert-booking-slots" className="care-booking-step"><Typography component="h3"><span>1</span> Pick a day</Typography><Box className="care-dates">{days.map((date, index) => <Button key={dateKey(date)}  aria-pressed={day === index} className={day === index ? 'selected' : ''} onClick={() => { setDay(index); setTime(''); setNotice('') }}><Typography component="span">{dateKey(date) === dateKey(new Date()) ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })}</Typography><strong>{date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</strong></Button>)}</Box></Box>
    <Box className="care-booking-step"><Typography component="h3"><span>2</span> Find your time</Typography><Box className="care-times">{times.map(slot => <Button key={slot} disabled={!available(day, slot)} aria-pressed={time === slot} className={time === slot ? 'selected' : ''} onClick={() => { setTime(slot); setNotice('') }}>{slotLabel(slot)}</Button>)}</Box><Typography className="care-timezone">Times in your device’s local time zone.</Typography></Box>
    <Box className="expert-slot-actions"><Button size="small" disabled={refreshing||bookingBusy} onClick={refreshSlots}>{refreshing?'Refreshing…':'Refresh availability'}</Button><Button size="small" disabled={!time||bookingBusy} onClick={()=>setTime('')}>Clear selection</Button></Box></Box><Box className="expert-notes-section"><Typography component="h4" className="expert-section-title">What would you like help with?</Typography><TextField label="Consultation notes" placeholder="Describe the plant, symptoms, and care you have tried…" multiline minRows={3} fullWidth size="small" value={consultationNotes} disabled={bookingBusy} onChange={event=>setConsultationNotes(event.target.value)} slotProps={{htmlInput:{maxLength:2000}}} helperText="Shared with your expert when you reserve." sx={{mb:2}} /></Box>{time&&<Typography className="expert-selection-summary" sx={{mb:2,fontSize:12}}>Selected: {new Date(time).toLocaleString()} · {expert.consultationMinutes} minutes</Typography>}<Button variant="contained" disableElevation fullWidth className="care-confirm" disabled={bookingBusy || refreshing || loadingExpert || !time || !available(day, time)} onClick={book} endIcon={<FaArrowRight />}>{bookingBusy?'Reserving…':'Reserve slot'}</Button>{notice && <Alert severity={noticeError?'error':'success'} sx={{ mt: 1.5 }}>{notice}</Alert>}
    </Box>{!!appointments.length && <Box className="care-appointments"><Typography component="h3">Your appointments</Typography>{appointments.filter(item=>item.expertId===expert.id).map(item => <Box key={item.id}><Typography>{item.expert}</Typography><Typography>{item.label} · {item.time}</Typography>{item.notes && <Typography>{item.notes}</Typography>}<Button size="small" onClick={()=>downloadCalendar(item)}>Add to calendar</Button><Button size="small" onClick={() => cancel(item)}>Cancel slot</Button></Box>)}</Box>}</Box>}</Box></Box>
  </Box></ThemeProvider></DashboardLayout>
}




