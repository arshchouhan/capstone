import GoogleConnection from '../components/GoogleConnection'
import MeetActions from '../components/MeetActions'
import { useEffect, useRef, useState } from 'react'
import { Box, Button, Avatar, Chip, TextField, InputAdornment, Select, MenuItem, Typography, Stack, Alert, ThemeProvider, createTheme, Skeleton, IconButton } from '@mui/material'
import { FaArrowRight, FaSearch, FaRegCommentDots, FaVideo, FaRegCalendarAlt, FaRegClock, FaCheckCircle, FaGraduationCap, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import useApiData from '../hooks/useApiData'
import { api, mediaUrl } from '../services/api'
import EmptyState from '../components/EmptyState'
import ExpertChat from '../components/ExpertChat'
import MeetRequestPanel from '../components/MeetRequestDialog'
import './CareSchedule.css'

async function getExpertDetails(expert) { return api(`/experts/${expert.id}`) }
const slotLabel = value => new Date(value).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})
const nextSlot = expert => expert.availableSlots?.filter(slot=>new Date(slot)>new Date()).sort((a,b)=>new Date(a)-new Date(b))[0]
const dateKey = date => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`


const theme = createTheme({ palette: { primary: { main: '#355b7a' }, text: { primary: '#172846', secondary: '#6a7e8a' } }, typography: { fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 13 }, shape: { borderRadius: 12 } })

function ExpertAvatar({ expert }) {
  const initials = expert.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <Avatar src={mediaUrl(expert.avatarUrl)} alt={expert.name}>{initials}</Avatar>
}

export default function CareSchedule() {
  const {data: experts,error:expertError,loading:expertsLoading} = useApiData('/experts')
  const {data: rawAppointments,reload:reloadAppointments} = useApiData('/appointments')
  const specialties = [...new Set(experts.map(expert=>expert.specialty))]
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [expert, setExpert] = useState(null)
  const [loadingExpert, setLoadingExpert] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [panel,setPanel]=useState('profile')
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('3:00 PM')
  const appointments = rawAppointments.filter(item=>item.status === 'booked').map(item=>({...item,expertId:item.expert?.id,expert:item.expert?.name,date:dateKey(new Date(item.startsAt)),time:new Date(item.startsAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),label:new Date(item.startsAt).toLocaleDateString()}))
  const [notice, setNotice] = useState(''), [noticeError,setNoticeError]=useState(false), [consultationNotes,setConsultationNotes]=useState(''), [bookingBusy,setBookingBusy]=useState(false), [refreshing,setRefreshing]=useState(false)
  const bookingRef = useRef(null)
  const expertRequest = useRef(0)
  const dismissExpert = () => { expertRequest.current++; setDetailsOpen(false); setPanel('profile'); setExpert(null); setLoadingExpert(false); setTime(''); setNotice('') }
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
  const filtered = experts.filter(item => `${item.name} ${item.specialty} ${item.description}`.toLowerCase().includes(query.toLowerCase()) && (specialty === 'all' || specialty === item.specialty) && (availability === 'all' || item.availableSlots?.some(slot=>{const date=new Date(slot),end=new Date();end.setDate(end.getDate()+Number(availability));end.setHours(23,59,59,999);return date>new Date()&&date<=end})))
  const chooseExpert = async (item, booking = false) => {
    const request = ++expertRequest.current
    setDetailsOpen(true); setPanel('profile'); setLoadingExpert(true); setExpert(item); setDay(0); setTime(''); setNotice('');setNoticeError(false);setConsultationNotes('')
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
      <Box className="care-directory-heading">
        <Typography component="h2">Your experts</Typography>
      </Box>
      <GoogleConnection portal="grower" />
      <Box sx={{ mt: 2 }}>
        {expertError && <Alert severity="error">{expertError}</Alert>}
        {expertsLoading && <Typography role="status">Loading experts…</Typography>}
      </Box>
      <Box className="platform-expert-directory"><Box className="care-filters"><TextField size="small" placeholder="Search name or expertise" value={query} onChange={event => setQuery(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch /></InputAdornment> }, htmlInput: { 'aria-label': 'Search experts' } }} /><Select size="small" value={specialty} onChange={event => setSpecialty(event.target.value)} inputProps={{ 'aria-label': 'Specialty' }}><MenuItem value="all">All specialties</MenuItem>{specialties.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select><Select size="small" value={availability} onChange={event => setAvailability(event.target.value)} inputProps={{ 'aria-label': 'Availability' }}><MenuItem value="all">Any time</MenuItem><MenuItem value="0">Today</MenuItem><MenuItem value="1">By tomorrow</MenuItem></Select></Box>
      <Box className="expert-list">{!expertsLoading && !expertError && !filtered.length && <EmptyState kind="experts" title={experts.length ? 'No matching experts' : 'No experts available'} />}{filtered.map(item=><Box key={item.id} className={`expert-list-row ${expert?.id===item.id?'selected':''}`}><button type="button" className="expert-list-main" aria-pressed={expert?.id===item.id} onClick={()=>chooseExpert(item)}><ExpertAvatar expert={item} /><span className="expert-list-copy"><strong>{item.name}</strong><span>{item.specialty}</span><small>{item.reviews ? item.rating+' · '+item.reviews+' reviews' : 'Not rated yet'}</small></span></button><IconButton className="expert-row-action" aria-label={`Message ${item.name}`} onClick={()=>{chooseExpert(item);setPanel('chat')}}><FaRegCommentDots /></IconButton><Button className="expert-meet-action" size="small" onClick={()=>{chooseExpert(item);setPanel('meet')}}>Meet</Button></Box>)}</Box></Box></Box>
    <Box component="section" className="expert-detail-pane" aria-label={panel==='chat'?'Messages':panel==='meet'?'Google Meet request':'Expert details'}><Box className="care-drawer-toolbar">{expert && <IconButton aria-label="Close expert details" onClick={dismissExpert}>×</IconButton>}</Box>{panel==='chat'&&expert?<ExpertChat key={expert.id || expert._id} expert={expert} onClose={()=>setPanel('profile')}/>:panel==='meet'&&expert?<MeetRequestPanel key={expert.id || expert._id} expert={expert} onClose={()=>setPanel('profile')}/>:!expert ? <Box className="expert-detail-empty"><EmptyState kind="experts" title="Select an expert" description="Choose a specialist from the list to see their profile and appointment times." /></Box> : loadingExpert ? <Box className="care-details-skeleton" role="status" aria-label="Loading expert details"><Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}><Skeleton variant="circular" width={48} height={48} /><Box sx={{ flex: 1 }}><Skeleton width="70%" /><Skeleton width="50%" /></Box></Stack><Skeleton height={70} /><Skeleton width="45%" /><Skeleton variant="rounded" height={64} /><Skeleton sx={{ mt: 3 }} width="45%" /><Skeleton variant="rounded" height={40} /><Skeleton variant="rounded" height={80} sx={{ mt: 3 }} /><Skeleton variant="rounded" height={44} sx={{ mt: 2 }} /></Box> : expert && <Box component="aside" className="care-booking-column"><Box className="care-panel" ref={bookingRef}><Box className="expert-profile-header">
      <Stack className="care-selected-expert" direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <ExpertAvatar expert={expert} />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3">{expert.name}</Typography>
          <Typography>{expert.specialty}</Typography>
          <Box className="expert-profile-badges">
            {expert.demo && <Chip size="small" label="Demo expert" />}
            {expert.verified && <Chip size="small" icon={<FaCheckCircle />} label="Verified expert" />}
            {expert.reviews > 0 && <Chip size="small" label={`${expert.rating}/5 · ${expert.reviews} reviews`} />}
          </Box>
        </Box>
      </Stack>
      <Box className="expert-profile-actions" aria-label="Consultation options">
        <Button variant="contained" disableElevation startIcon={<FaRegCalendarAlt />} onClick={() => document.getElementById('expert-booking-slots')?.scrollIntoView({ block: 'nearest' })}>View availability</Button>
        <Button variant="outlined" startIcon={<FaRegCommentDots />} onClick={() => setPanel('chat')}>Message</Button>
        <Button variant="outlined" startIcon={<FaVideo />} onClick={() => setPanel('meet')}>Request Google Meet</Button>
      </Box>
    </Box>
    <Box className="expert-profile-summary expert-detail-card">
      <Typography component="h4" className="expert-section-title">About the expert</Typography>
      {expert.description && <Typography>{expert.description}</Typography>}
      <Box component="dl" className="expert-fact-grid">
        {[
          [FaGraduationCap, 'Qualifications', expert.qualifications],
          [FaRegClock, 'Experience', expert.experienceYears != null ? `${expert.experienceYears} years` : ''],
          [FaMapMarkerAlt, 'Location', expert.location],
          [FaGlobe, 'Languages', expert.languages?.join(', ')],
        ].map(([Icon, label, value]) => (
          <Box key={label} className="expert-fact">
            <Icon aria-hidden="true" />
            <Box><dt>{label}</dt><dd>{value || 'Not listed'}</dd></Box>
          </Box>
        ))}
      </Box>
    </Box>
    <Box id="expert-booking-slots" className="expert-appointment-section expert-detail-card">
      <Box className="expert-booking-header">
        <Box>
          <Typography component="h4" className="expert-section-title">Book a consultation</Typography>
          <Typography className="expert-booking-meta">
            {[
              expert.consultationMinutes && `${expert.consultationMinutes} minutes`,
              expert.consultationFee > 0 && expert.consultationFee.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            ].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
        <Button variant="outlined" size="small" disabled={refreshing || bookingBusy} onClick={refreshSlots}>{refreshing ? 'Refreshing…' : 'Refresh availability'}</Button>
      </Box>
      {slots.length ? (
        <>
          <Box className="expert-slot-grid">
            <Box className="care-booking-step">
              <Typography component="h5">Pick a day</Typography>
              <Box className="care-dates">{days.map((date, index) => (
                <Button key={dateKey(date)} aria-pressed={day === index} className={day === index ? 'selected' : ''} onClick={() => { setDay(index); setTime(''); setNotice('') }}>
                  <Typography component="span">{dateKey(date) === dateKey(new Date()) ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })}</Typography>
                  <strong>{date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</strong>
                </Button>
              ))}</Box>
            </Box>
            <Box className="care-booking-step">
              <Typography component="h5">Choose a time</Typography>
              <Box className="care-times">{times.map(slot => (
                <Button key={slot} disabled={!available(day, slot)} aria-pressed={time === slot} className={time === slot ? 'selected' : ''} onClick={() => { setTime(slot); setNotice('') }}>{slotLabel(slot)}</Button>
              ))}</Box>
              <Typography className="care-timezone">Times in your device’s local time zone.</Typography>
            </Box>
          </Box>
          <Box className="expert-notes-section">
            <TextField label="Consultation notes" placeholder="Describe the plant, symptoms, and care you have tried…" multiline minRows={3} fullWidth size="small" value={consultationNotes} disabled={bookingBusy} onChange={event => setConsultationNotes(event.target.value)} slotProps={{htmlInput:{maxLength:2000}}} helperText="Shared with your expert when you reserve." />
          </Box>
          <Box className="expert-booking-footer">
            {time ? <Typography className="expert-booking-meta">{new Date(time).toLocaleString()}</Typography> : <Typography className="expert-booking-meta">Choose a time to reserve.</Typography>}
            {time && <Button size="small" onClick={() => setTime('')}>Clear selection</Button>}
            <Button variant="contained" disableElevation disabled={bookingBusy || refreshing || !time || !available(day, time)} onClick={book} endIcon={<FaArrowRight />}>{bookingBusy ? 'Reserving…' : 'Reserve slot'}</Button>
          </Box>
        </>
      ) : (
        <Box className="expert-availability-empty">
          <FaRegCalendarAlt aria-hidden="true" />
          <Box><Typography component="h5">No appointment times available</Typography><Typography>You can message this expert or request a Google Meet.</Typography></Box>
        </Box>
      )}
      {notice && <Alert severity={noticeError ? 'error' : 'success'} sx={{ mt: 1.5 }}>{notice}</Alert>}
    </Box>
    </Box>{appointments.some(item=>item.expertId===expert.id) && <Box className="care-appointments"><Typography component="h3">Your appointments</Typography>{appointments.filter(item=>item.expertId===expert.id).map(item => <Box key={item.id}><Typography>{item.expert}</Typography><Typography>{item.label} · {item.time}</Typography>{item.notes && <Typography>{item.notes}</Typography>}<MeetActions appointment={item} onChange={reloadAppointments}/><Button size="small" onClick={()=>downloadCalendar(item)}>Add to calendar</Button><Button size="small" onClick={() => cancel(item)}>Cancel slot</Button></Box>)}</Box>}</Box>}</Box></Box>
  </Box></ThemeProvider></DashboardLayout>
}




