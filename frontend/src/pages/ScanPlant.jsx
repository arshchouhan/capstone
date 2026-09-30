import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaCamera, FaCloudUploadAlt, FaLeaf, FaCut, FaSprayCan, FaWind, FaRegCalendarAlt, FaExclamationCircle, FaCheckCircle, FaExclamationTriangle, FaChevronRight, FaInfoCircle, FaImages, FaEllipsisH } from 'react-icons/fa'
import DashboardLayout from '../components/DashboardLayout'
import blightImage from '../assets/early_blight_leaf.jpg'
import basilImage from '../assets/plant_basil.jpg'
import chiliImage from '../assets/plant_chili.jpg'
import './ScanPlant.css'

const examples = [
  { id: 'tomato', name: 'Tomato plant', date: '12 Mar 2025, 10:24 AM', image: blightImage, status: 'Infection detected', tone: 'danger', title: 'Early Blight', scientific: '(Alternaria solani)', confidence: 92, description: 'A common fungal disease affecting tomato plants. It causes dark, circular spots with concentric rings, usually starting on older leaves.' },
  { id: 'basil', name: 'Basil plant', date: '8 Mar 2025, 2:15 PM', image: basilImage, status: 'Healthy', tone: 'healthy', title: 'Healthy plant', description: 'This example scan shows healthy foliage. Continue regular care and monitor for changes.' },
  { id: 'chili', name: 'Chili plant', date: '3 Mar 2025, 9:40 AM', image: chiliImage, status: 'Minor risk', tone: 'warning', title: 'Monitor your plant', description: 'This example scan is flagged for observation. Check the leaves regularly for changes.' },
]
const steps = [
  [FaCut, 'Remove Infected Parts', 'Cut and dispose of severely infected leaves to prevent further spread.'],
  [FaSprayCan, 'Apply fungicide', 'Use a suitable treatment and follow the product label instructions.'],
  [FaWind, 'Improve Air Circulation', 'Ensure proper spacing between plants and remove excess foliage to improve air circulation.'],
  [FaRegCalendarAlt, 'Monitor Progress', 'Check for improvement and re-scan the plant to track recovery.'],
]
const statusIcon = { danger: FaExclamationCircle, healthy: FaCheckCircle, warning: FaExclamationTriangle }

function TreatmentPanel({ selected, activeTab, setActiveTab }) {
  return <section className="scan-panel scan-treatment-pane"><div className="scan-tabs" aria-label="Diagnosis details">{[['treatment', 'Treatment Plan', FaLeaf], ['info', 'Disease Info', FaInfoCircle], ['similar', 'Similar Cases', FaImages]].map(([id, label, Icon]) => <button key={id} className={activeTab === id ? 'active' : ''} aria-pressed={activeTab === id} onClick={() => setActiveTab(id)}><Icon />{label}</button>)}</div>
    {activeTab === 'treatment' && <><p>{selected.tone === 'danger' ? 'Follow these steps to treat the infection and protect your plant.' : 'Keep an eye on your plant and check for changes.'}</p>{selected.tone === 'danger' ? <div className="scan-steps">{steps.map(([Icon, title, description], index) => <article key={title}><span className="scan-small-icon"><Icon /></span><div><h3>{index + 1}. {title}</h3><p>{description}</p></div></article>)}</div> : <div className="scan-general-care"><FaLeaf /><p>Continue regular care, inspect new growth, and upload a new photo if you notice changes.</p></div>}</>}
    {activeTab === 'info' && <div className="scan-tab-copy"><h2>{selected.title}</h2><p>{selected.description}</p>{selected.tone === 'danger' && <p>Early blight can spread through infected plant debris and splashing water. Inspect older leaves for circular spots, keep foliage dry, and monitor new growth.</p>}</div>}
    {activeTab === 'similar' && <div className="scan-tab-copy"><h2>Similar Cases</h2><p>{selected.id === 'tomato' ? 'Other conditions with similar leaf symptoms include Septoria leaf spot, bacterial speck, and late blight. Appearance alone does not confirm a diagnosis.' : 'Similar cases will appear when a diagnosis is available.'}</p></div>}
  </section>
}

function ScanHistoryPanel({ recent, selected, showAll, setShowAll, setSelected, onBack }) {
  return <section className="scan-panel scan-history-pane"><div className="scan-panel-heading"><h2>Recent scans</h2><button className="scan-text-button" onClick={onBack}>View treatment</button></div>
    <div className="scan-recent-list">{(showAll ? recent : recent.slice(0, 3)).map(scan => { const Icon = statusIcon[scan.tone]; return <button key={scan.id} className={`scan-recent-item${selected.id === scan.id ? ' selected' : ''}`} aria-pressed={selected.id === scan.id} onClick={() => setSelected(scan)}><img src={scan.image} alt="" /><span className="scan-recent-name"><strong>{scan.name}</strong><small>{scan.date}</small></span><span className={`scan-status ${scan.tone}`}><Icon />{scan.status}</span><FaChevronRight /></button> })}</div>
    <button className="scan-history-toggle" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show less' : 'View all scans'}</button>
    <div className="scan-history-next"><span className="scan-small-icon"><FaRegCalendarAlt /></span><div><strong>Next check</strong><p>{selected.tone === 'danger' ? 'Re-scan your plant in 7 days to track recovery.' : 'Continue regular checks for changes.'}</p></div></div>
  </section>
}

function AiResultReport({ selected }) {
  const StatusIcon = statusIcon[selected.tone]
  const severity = selected.tone === 'danger' ? 'Moderate risk' : selected.tone === 'warning' ? 'Monitor closely' : 'Healthy'
  return <div className="scan-ai-report"><div className="scan-ai-report-heading"><div><span className={`scan-status ${selected.tone}`}><StatusIcon />{selected.status}</span><h2>{selected.title}</h2>{selected.scientific && <em>{selected.scientific}</em>}</div><span className="scan-small-icon"><FaLeaf /></span></div>
    {selected.confidence && <div className="scan-confidence"><p>AI confidence <strong>{selected.confidence}%</strong></p><progress aria-label="Diagnosis confidence" max="100" value={selected.confidence} /></div>}
    <div className="scan-ai-metrics"><div><span>Severity</span><strong className={selected.tone}>{severity}</strong></div><div><span>Model review</span><strong>Leaf pattern analysis</strong></div></div>
    <div className="scan-ai-findings"><strong>Key findings</strong><p>{selected.description}</p></div>
    <div className="scan-ai-action"><FaSprayCan /><span>{selected.tone === 'danger' ? 'Recommended: start the treatment plan today.' : 'Recommended: continue regular care and monitor changes.'}</span></div>
  </div>
}

export default function ScanPlant() {
  const navigate = useNavigate()
  const location = useLocation()
  const fileInput = useRef(null)
  const analysisTimer = useRef(null)
  const [selected, setSelected] = useState(null)
  const [uploaded, setUploaded] = useState(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('treatment')
  const [showAll, setShowAll] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [rightPane, setRightPane] = useState('treatment')
  useEffect(() => () => { if (uploaded?.image) URL.revokeObjectURL(uploaded.image) }, [uploaded])
  useEffect(() => () => { if (analysisTimer.current) clearTimeout(analysisTimer.current) }, [])

  const upload = file => {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setError('Please choose a JPG or PNG image.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Please choose an image smaller than 10 MB.'); return }
    const preview = { id: 'upload', name: file.name, image: URL.createObjectURL(file), date: 'Just scanned', title: 'Early Blight', scientific: '(Alternaria solani)', confidence: 94, description: 'Early blight symptoms were detected. Follow the treatment plan and monitor the plant for recovery.', status: 'Infection detected', tone: 'danger' }
    setUploaded(preview)
    setSelected(preview)
    setIsAnalyzing(true)
    setRightPane('treatment')
    setError('')
    if (analysisTimer.current) clearTimeout(analysisTimer.current)
    analysisTimer.current = setTimeout(() => {
      setIsAnalyzing(false)
      analysisTimer.current = null
    }, 5000)
  }
  const recent = uploaded ? [uploaded, ...examples] : examples
  const hasScan = Boolean(selected) && !isAnalyzing

  return (
    <DashboardLayout className="scan-dashboard">
      <div className="scan-page">
        <header className="scan-page-header">
          <span className="scan-title-icon"><FaCamera /></span>
          <div><h1>Scan Plant</h1><p>{isAnalyzing ? 'Analyzing your plant image…' : hasScan ? 'Review the diagnosis and follow the care plan.' : 'Upload a clear photo of your plant to check its health.'}</p></div>
          {hasScan && <div className="scan-header-actions">{location.state?.returnTo && <button className="scan-primary" onClick={() => { sessionStorage.setItem('plant-scan-complete', 'true'); navigate(location.state.returnTo) }}>Continue registration</button>}<div className="scan-menu-wrap"><button className="scan-menu-button" aria-label="Scan options" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}><FaEllipsisH /></button>{menuOpen && <div className="scan-action-menu"><button onClick={() => { setRightPane('treatment'); setMenuOpen(false) }}><FaCheckCircle /> View results</button><button onClick={() => { setRightPane('history'); setMenuOpen(false) }}><FaImages /> View scan history</button><button onClick={() => { setSelected(null); setRightPane('treatment'); setMenuOpen(false) }}><FaLeaf /> Return to scanner</button></div>}</div></div>}
        </header>
        <div className={`scan-columns${hasScan ? ' has-scan' : ''}`}>
          <div className="scan-left-column">
            <section className="scan-panel" aria-labelledby="latest-scan-title">
              <div className="scan-panel-heading"><h2 id="latest-scan-title">Scan Your Plant</h2>{hasScan && <span>{selected.name} · {selected.date}</span>}</div>
              <div className={`scan-workspace${hasScan ? ' has-result' : ' empty'}`}>            <div className="scan-upload-panel">
              {hasScan ? <AiResultReport selected={selected} /> : <div className={`scan-dropzone${dragging ? ' dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); upload(event.dataTransfer.files[0]) }}>
                {isAnalyzing ? <div className="scan-analysis-state" role="status" aria-live="polite"><div className="scan-analysis-image-wrap"><img src={selected.image} alt="Plant image being analyzed" /><span className="scan-analysis-line" /><span className="scan-image-caption">Live AI image review</span></div><div className="scan-analysis-details"><span className="scan-analysis-badge"><FaLeaf /> AI scan in progress</span><h2>Analyzing your plant</h2><p>We are reviewing visible leaf features and checking for possible disease patterns.</p><div className="scan-rising-copy"><span><b>1</b> Reading leaf patterns</span><span><b>2</b> Checking disease symptoms</span><span><b>3</b> Preparing your care plan</span></div><div className="scan-analysis-progress"><span /></div><small>Your result will be ready shortly.</small></div></div> : <><span className="scan-upload-icon"><FaCloudUploadAlt /></span><strong>Drag &amp; drop an image here</strong><span>or</span><button className="scan-primary" onClick={() => fileInput.current.click()}><FaCamera /> Choose image</button><small>Supports JPG, PNG (Max 10MB)</small></>}
                <input ref={fileInput} type="file" accept="image/jpeg,image/png" hidden onChange={event => { upload(event.target.files[0]); event.target.value = '' }} />
              </div>}
              {error && <p className="scan-upload-error" role="alert">{error}</p>}
            </div>
{hasScan && <div className="scan-result-body scan-image-result">
                <img className="scan-result-image" src={selected.image} alt={selected.id === 'upload' ? 'Uploaded plant preview' : selected.name} />
              </div>}</div>
            </section>
          </div>
          {hasScan && <div className="scan-right-column">{rightPane === 'history' ? <ScanHistoryPanel recent={recent} selected={selected} showAll={showAll} setShowAll={setShowAll} setSelected={scan => { setSelected(scan); setRightPane('treatment') }} onBack={() => setRightPane('treatment')} /> : <TreatmentPanel selected={selected} activeTab={activeTab} setActiveTab={setActiveTab} />}</div>}
        </div>
      </div>
    </DashboardLayout>
  )
}
