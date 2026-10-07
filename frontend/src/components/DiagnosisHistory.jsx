import { useEffect, useRef, useState } from 'react'
import PlantAnalysis from './PlantAnalysis'
import EmptyState from './EmptyState'
import { Box, Button, Chip, IconButton, Typography } from '@mui/material'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { MdOutlineHealthAndSafety, MdOutlineAnalytics, MdOutlineCheckCircle, MdOutlineWarningAmber, MdOutlinePhotoLibrary } from 'react-icons/md'

function ScanHistoryRow({ day, children }) {
  const row = useRef(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const element = row.current
    const update = () => setEdges({ left: element.scrollLeft > 2, right: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 })
    const observer = new ResizeObserver(update)
    observer.observe(element); update(); element.addEventListener('scroll', update)
    return () => { observer.disconnect(); element.removeEventListener('scroll', update) }
  }, [children])
  const move = direction => row.current.scrollBy({ left: direction * (row.current.clientWidth + 12), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  return <Box className="diagnosis-history-group"><Box className="scan-history-row-heading"><Typography component="h4">{day}</Typography>{(edges.left || edges.right) && <Box><IconButton size="small" aria-label="Previous scans" disabled={!edges.left} onClick={() => move(-1)}><MdChevronLeft /></IconButton><IconButton size="small" aria-label="More scans" disabled={!edges.right} onClick={() => move(1)}><MdChevronRight /></IconButton></Box>}</Box><Box ref={row} className="diagnosis-history-list" tabIndex={0} aria-label={`Scans from ${day}`}>{children}</Box></Box>
}

export default function DiagnosisHistory({ plant, history = [] }) {
  const [selected, setSelected] = useState(null)
  const records = [...history].sort((a,b)=>(Date.parse(b.checkedAt)||0)-(Date.parse(a.checkedAt)||0))
  const healthy = records.filter(record => record.source !== 'demo' && record.status === 'Healthy').length
  const issues = records.reduce((total, record) => total + (record.source !== 'demo' && Array.isArray(record.findings) ? record.findings.length : 0), 0)
  const groups = records.reduce((result, record) => {
    const day = record.checkedAt ? new Date(record.checkedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Earlier scans · date not recorded'
    ;(result[day] ||= []).push(record)
    return result
  }, {})
  if (selected) {
    const scanPlant = { name: selected.name || plant.name, scientific: selected.scientific || plant.scientific, score: selected.score, status: selected.status || 'Not assessed', summary: selected.summary || 'No analysis summary was saved for this scan.', notes: [], scanResults: { 'Disease Identifier': { notes: selected.summary, findings: selected.findings || [] } } }
    return <Box className="diagnosis-scan-detail"><Button startIcon={<MdChevronLeft />} onClick={() => setSelected(null)}>Back to diagnoses</Button><Typography className="diagnosis-scan-date">{selected.kind} · {selected.checkedAt ? new Date(selected.checkedAt).toLocaleString() : 'Date not recorded'}</Typography><PlantAnalysis key={selected.id} plantId={`history-${selected.id}`} plant={scanPlant} photos={selected.photo ? [selected.photo] : []} historical /></Box>
  }
  return <Box className="diagnosis-history-section"><Box className="diagnosis-history-overview"><Box className="diagnosis-card-heading"><span className="diagnosis-icon"><MdOutlineHealthAndSafety /></span><Box><Typography component="h3">Diagnoses</Typography><Typography className="diagnosis-help">Your plant’s scan history</Typography></Box></Box><Box className="diagnosis-history-stats">{[[MdOutlineAnalytics, records.length, 'Total scans'], [MdOutlineCheckCircle, healthy, 'Confirmed healthy'], [MdOutlineWarningAmber, issues, 'Confirmed findings']].map(([Icon, count, label]) => <Box key={label}><Icon /><strong>{count}</strong><Typography>{label}</Typography></Box>)}</Box></Box>
    {records.length ? Object.entries(groups).map(([day, entries]) => <ScanHistoryRow key={day} day={day}>{entries.map(record => <Button className="diagnosis-history-record" key={record.id} onClick={() => setSelected(record)}><Box className="diagnosis-record-photo">{record.photo ? <img src={record.photo} alt={`${record.name || plant.name} scan`} /> : <><MdOutlinePhotoLibrary /><span>No photo saved</span></>}</Box><Box className="diagnosis-record-content"><Box className="diagnosis-history-record-meta"><Chip size="small" icon={<MdOutlineCheckCircle />} label={record.sample ? 'Sample' : 'Complete'} /><Typography>{record.checkedAt ? new Date(record.checkedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Time unavailable'}</Typography></Box><Typography component="h5">{record.name || plant.name}{record.scientific ? ` (${record.scientific})` : ''}</Typography><Typography className="diagnosis-record-preview">{record.summary || 'Demo check completed. No live AI assessment available.'}</Typography><Typography className="diagnosis-record-source"><MdOutlineWarningAmber />{record.source === 'demo' ? 'Demo · assessment pending' : Array.isArray(record.findings) ? `${record.findings.length} issues detected` : record.status || 'Assessment pending'}</Typography></Box><span className="diagnosis-record-score" title="Health score">{Number.isFinite(record.score) ? record.score : '—'}</span></Button>)}</ScanHistoryRow>) : <EmptyState kind="scans" title="No diagnoses yet" description="Your plant scans and recovery checks will appear here." />}

  </Box>
}
