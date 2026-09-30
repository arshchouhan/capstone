import { useRef, useState } from 'react'
import { FaArrowRight, FaCheckCircle, FaChevronDown, FaRegCalendarAlt, FaSearch, FaStar, FaVideo } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import './CareSchedule.css'

const avatar = (name, color) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=ffffff&bold=true&size=160`
const experts = [
  { id: 'mira', name: 'Dr. Mira Sharma', initials: 'MS', avatarUrl: avatar('Mira Sharma', '188b74'), specialty: 'Plant Pathologist', rating: '4.9', reviews: 128, day: 0, description: 'Specializes in plant diseases, pest management and healthy plant care.' },
  { id: 'rohan', name: 'Prof. Rohan Mehta', initials: 'RM', avatarUrl: avatar('Rohan Mehta', '799477'), specialty: 'Horticulture Specialist', rating: '4.8', reviews: 96, day: 1, description: 'Expert in plant growth, soil health, and outdoor gardening.' },
  { id: 'ananya', name: 'Ananya Rao', initials: 'AR', avatarUrl: avatar('Ananya Rao', 'bd8967'), specialty: 'Indoor Plant Expert', rating: '4.7', reviews: 74, day: 2, description: 'Specializes in indoor plants, plant styling and low-maintenance care.' },
  { id: 'vikram', name: 'Dr. Vikram Singh', initials: 'VS', avatarUrl: avatar('Vikram Singh', '5d967e'), specialty: 'Soil Health Specialist', rating: '4.9', reviews: 112, day: 1, description: 'Helps diagnose soil nutrition, drainage, and root health issues.' },
  { id: 'neha', name: 'Neha Kapoor', initials: 'NK', avatarUrl: avatar('Neha Kapoor', '9d8760'), specialty: 'Organic Gardening Expert', rating: '4.8', reviews: 88, day: 3, description: 'Focuses on natural treatments, composting, and sustainable plant care.' },
  { id: 'aarav', name: 'Aarav Menon', initials: 'AM', avatarUrl: avatar('Aarav Menon', '678aa5'), specialty: 'Plant Pathologist', rating: '4.7', reviews: 69, day: 2, description: 'Specializes in identifying fungal, bacterial, and viral plant diseases.' },
  { id: 'isha', name: 'Dr. Isha Verma', initials: 'IV', avatarUrl: avatar('Isha Verma', 'a46978'), specialty: 'Horticulture Specialist', rating: '4.9', reviews: 141, day: 4, description: 'Offers practical guidance for seasonal growth and outdoor plant care.' },
  { id: 'kabir', name: 'Kabir Nair', initials: 'KN', avatarUrl: avatar('Kabir Nair', '738b66'), specialty: 'Indoor Plant Expert', rating: '4.6', reviews: 57, day: 0, description: 'Supports plant placement, lighting, and day-to-day indoor care.' },
]
const expertsApiUrl = import.meta.env.VITE_EXPERTS_API_URL || 'http://localhost:5000/api/experts'
const toExpert = (data, fallback) => ({ ...fallback, ...data, avatarUrl: data.avatarUrl || data.profileImage || fallback.avatarUrl, reviews: Number(data.reviews ?? fallback.reviews), day: Number(data.day ?? fallback.day) })

async function getExpertDetails(fallback) {
  try {
    const response = await fetch(`${expertsApiUrl}/${fallback.id}`)
    if (!response.ok) throw new Error('Expert details are unavailable')
    return toExpert(await response.json(), fallback)
  } catch {
    return fallback
  }
}
const times = ['10:00 AM', '3:00 PM', '5:00 PM']
const dateKey = date => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
const specialties = [...new Set(experts.map(expert => expert.specialty))]

function FilterSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(option => option.value === value)?.label || label
  return <div className="care-filter-select">
    <button type="button" className={open ? 'open' : ''} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(previous => !previous)}>{selected}<FaChevronDown /></button>
    {open && <div className="care-filter-menu" role="listbox">{options.map(option => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={option.value === value ? 'selected' : ''} onClick={() => { onChange(option.value); setOpen(false) }}>{option.label}</button>)}</div>}
  </div>
}

export default function CareSchedule() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [expert, setExpert] = useState(experts[0])
  const [loadingExpert, setLoadingExpert] = useState(false)
  const [day, setDay] = useState(0)
  const [time, setTime] = useState('3:00 PM')
  const [appointments, setAppointments] = useState([])
  const [notice, setNotice] = useState('')
  const bookingRef = useRef(null)
  const expertRequest = useRef(0)
  const days = Array.from({ length: 5 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return date })
  const available = (index, slot) => {
    const date = new Date(days[index])
    date.setHours(slot === '10:00 AM' ? 10 : slot === '3:00 PM' ? 15 : 17, 0, 0, 0)
    return index >= expert.day && date > new Date() && !appointments.some(item => item.date === dateKey(date) && item.time === slot)
  }
  const filtered = experts.filter(item => `${item.name} ${item.specialty} ${item.description}`.toLowerCase().includes(query.toLowerCase()) && (specialty === 'all' || specialty === item.specialty) && (availability === 'all' || item.day <= Number(availability)))
  const chooseExpert = async item => {
    const request = ++expertRequest.current
    setLoadingExpert(true); setExpert(item); setDay(item.day); setTime(''); setNotice('')
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const details = await getExpertDetails(item)
    if (request !== expertRequest.current) return
    setExpert(details); setDay(details.day); setLoadingExpert(false)
  }
  const book = () => {
    if (!available(day, time) || !time) return
    setAppointments(previous => [...previous, { id: Date.now(), expert: expert.name, date: dateKey(days[day]), label: days[day].toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), time }])
    setNotice('Demo appointment added. No expert has been contacted.'); setTime('')
  }
  return <DashboardLayout className="care-dashboard">
    <div className="care-page">
      <header className="care-heading"><div><h1>Meet a Plant Expert</h1><p>Get one-on-one help for your plants.</p></div></header>
      <div className="care-columns">
        <section className="care-directory" aria-label="Plant experts">
          <div className="care-filters"><label className="care-search"><FaSearch /><input aria-label="Search experts" placeholder="Search experts by name or expertise..." value={query} onChange={event => setQuery(event.target.value)} /></label><FilterSelect label="All specialties" value={specialty} onChange={setSpecialty} options={[{ value: 'all', label: 'All specialties' }, ...specialties.map(item => ({ value: item, label: item }))]} /><FilterSelect label="Availability: Any time" value={availability} onChange={setAvailability} options={[{ value: 'all', label: 'Availability: Any time' }, { value: '0', label: 'Today' }, { value: '1', label: 'By tomorrow' }]} /></div>
          <div className="care-experts">{filtered.map(item => <article key={item.id} className={`care-expert ${expert.id === item.id ? 'selected' : ''}`} onClick={() => chooseExpert(item)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') chooseExpert(item) }} role="button" tabIndex="0"><div className={`care-avatar ${item.id}`} aria-hidden="true"><img src={item.avatarUrl} alt="" onError={event => { event.currentTarget.style.display = 'none' }} /><b>{item.initials}</b><span /></div><div className="care-expert-copy"><h2>{item.name} <FaCheckCircle /></h2><p>{item.specialty}</p><div className="care-rating"><FaStar /> {item.rating} <span>({item.reviews} reviews)</span></div><p className="care-description">{item.description}</p></div><div className="care-expert-actions"><div className="care-next"><FaRegCalendarAlt /><div>Sample availability<strong>{item.day === 0 ? 'Today' : item.day === 1 ? 'Tomorrow' : days[item.day].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong></div></div><button className="care-primary" onClick={event => { event.stopPropagation(); chooseExpert(item) }}>View availability <FaArrowRight /></button></div></article>)}</div>
          {filtered.length === 0 && <div className="care-empty">No experts match your filters. Try another specialty or search.</div>}
          <p className="care-demo-note">Sample expert profiles and availability. Bookings are a demo for this session.</p>
        </section>
        <aside className="care-booking-column">
          <section className="care-panel" ref={bookingRef}><h2>Book a consultation</h2><div className="care-selected-expert"><div className={`care-avatar small ${expert.id}`} aria-hidden="true"><img src={expert.avatarUrl} alt="" onError={event => { event.currentTarget.style.display = 'none' }} /><b>{expert.initials}</b></div><div><h3>{expert.name} <FaCheckCircle /></h3><p>{loadingExpert ? 'Loading doctor details…' : expert.specialty}</p><div className="care-rating"><FaStar /> {expert.rating} <span>({expert.reviews} reviews)</span></div></div></div>
            <fieldset><legend>Select a date</legend><div className="care-dates">{days.map((date, index) => <button key={dateKey(date)} disabled={index < expert.day} aria-pressed={day === index} className={day === index ? 'selected' : ''} onClick={() => { setDay(index); setTime(''); setNotice('') }}><span>{index === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })}</span><strong>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong></button>)}</div></fieldset>
            <fieldset><legend>Select a time</legend><div className="care-times">{times.map(slot => <button key={slot} disabled={!available(day, slot)} aria-pressed={time === slot} className={time === slot ? 'selected' : ''} onClick={() => { setTime(slot); setNotice('') }}>{slot}</button>)}</div></fieldset>
            <p className="care-timezone">Times shown in your local time zone.</p><h3 className="care-visit-label">Visit type</h3><div className="care-visit"><FaVideo /><div><strong>Google Meet video call</strong><p>A meeting link will be available when live booking launches.</p></div></div>
            <button className="care-primary care-confirm" disabled={loadingExpert || !time || !available(day, time)} onClick={book}>Confirm demo booking <FaArrowRight /></button><p role="status" className="care-notice">{notice}</p>
          </section>
        </aside>
      </div>
    </div>
  </DashboardLayout>
}
