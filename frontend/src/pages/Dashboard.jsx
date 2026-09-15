import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FaLeaf,
  FaUsers,
  FaStore,
  FaCamera,
  FaSearch,
  FaBell,
  FaChevronDown,
  FaCloudUploadAlt,
  FaTimes,
  FaCut,
  FaWind,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaPlus,
  FaCheck,
  FaBookOpen,
  FaSprayCan,
  FaSeedling,
  FaInfoCircle,
  FaImages,
  FaRegCalendarAlt,
  FaCalendarPlus,
  FaChartBar,
  FaThLarge,
  FaExclamationCircle,
  FaSignOutAlt
} from 'react-icons/fa'

import earlyBlightImg from '../assets/early_blight_leaf.jpg'
import heroPlantImg from '../assets/hero_plant_banner.jpg'
import tomatoPlantImg from '../assets/plant_tomato.jpg'
import basilPlantImg from '../assets/plant_basil.jpg'
import chiliPlantImg from '../assets/plant_chili.jpg'
import sidebarPlantImg from '../assets/sidebar_plant_decor.jpg'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const scanSectionRef = useRef(null)
  const mainSectionRef = useRef(null)

  // Interactive states
  const [activeTab, setActiveTab] = useState('treatment') // 'treatment' | 'info' | 'similar'
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddPlantModal, setShowAddPlantModal] = useState(false)
  const [newPlantName, setNewPlantName] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    if (mainSectionRef.current) {
      mainSectionRef.current.scrollTop = 0
    }
  }, [])

  // Diagnosis Image State
  const [previewImage, setPreviewImage] = useState(earlyBlightImg)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentDiagnosis, setCurrentDiagnosis] = useState({
    name: 'Early Blight',
    scientificName: '(Alternaria solani)',
    confidence: 92,
    status: 'Detected',
    description:
      'A common fungal disease affecting tomato plants. It causes dark, circular spots with concentric rings, usually starting on older leaves.'
  })

  // Care schedule tasks state
  const [tasks, setTasks] = useState([
    { id: 1, period: 'Today', title: 'Apply fungicide (Tomato Plant)', completed: false },
    { id: 2, period: 'In 7 days', title: 'Re-scan plant', completed: false },
    { id: 3, period: 'In 14 days', title: 'Check for new growth', completed: false }
  ])

  // Your plants state
  const [plants, setPlants] = useState([
    { id: 1, name: 'Tomato', image: tomatoPlantImg, status: 'warning' },
    { id: 2, name: 'Basil', image: basilPlantImg, status: 'healthy' },
    { id: 3, name: 'Chili', image: chiliPlantImg, status: 'healthy' }
  ])

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  const scrollToScan = () => {
    if (scanSectionRef.current) {
      scanSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const processUploadedFile = (file) => {
    const url = URL.createObjectURL(file)
    setPreviewImage(url)
    setIsAnalyzing(true)

    // Simulate real AI diagnosis transition
    setTimeout(() => {
      setIsAnalyzing(false)
      setCurrentDiagnosis({
        name: 'Early Blight',
        scientificName: '(Alternaria solani)',
        confidence: 94,
        status: 'Detected',
        description:
          'A common fungal disease affecting tomato plants. It causes dark, circular spots with concentric rings, usually starting on older leaves.'
      })
    }, 600)
  }

  const handleResetImage = () => {
    setPreviewImage(earlyBlightImg)
    setCurrentDiagnosis({
      name: 'Early Blight',
      scientificName: '(Alternaria solani)',
      confidence: 92,
      status: 'Detected',
      description:
        'A common fungal disease affecting tomato plants. It causes dark, circular spots with concentric rings, usually starting on older leaves.'
    })
  }

  const toggleTask = (id) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const handleAddPlant = (e) => {
    e.preventDefault()
    if (!newPlantName.trim()) return
    const newPlant = {
      id: Date.now(),
      name: newPlantName.trim(),
      image: basilPlantImg,
      status: 'healthy'
    }
    setPlants(prev => [...prev, newPlant])
    setNewPlantName('')
    setShowAddPlantModal(false)
  }

  const userName = user?.name || user?.fullName || 'Arsh'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <main className="dashboard-shell modern-dashboard">
      {/* Top Navigation Bar */}
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <div className="brand-logo" onClick={() => navigate('/dashboard')}>
            <span className="brand-leaf-icon">
              <FaLeaf />
            </span>
            <span className="brand-title">Plantaexa</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="search-bar-wrap">
            <FaSearch className="search-icon-svg" />
            <input
              type="text"
              placeholder="Search plants, diseases, or solutions..."
              className="top-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="icon-badge-btn" aria-label="Notifications">
            <FaBell />
            <span className="notification-dot" />
          </button>

          <div className="user-profile-menu">
            <button
              className="user-profile-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User profile menu"
            >
              <span className="user-avatar">{userInitial}</span>
              <span className="user-name">{userName}</span>
              <FaChevronDown className="user-chevron" />
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-card">
                <div className="dropdown-user-info">
                  <strong>{userName}</strong>
                  <span>{user?.email || 'user@plantaexa.com'}</span>
                </div>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setUserMenuOpen(false)
                    navigate('/dashboard/crops')
                  }}
                >
                  <FaLeaf /> My Crops
                </button>
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    setUserMenuOpen(false)
                    handleLogout()
                  }}
                >
                  <FaSignOutAlt /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Left Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div className="nav-item active" onClick={() => navigate('/dashboard')}>
              <FaThLarge className="nav-icon" />
              <span>Dashboard</span>
            </div>
            <div className="nav-item" onClick={scrollToScan}>
              <FaCamera className="nav-icon" />
              <span>Scan Plant</span>
            </div>
            <div className="nav-item" onClick={() => navigate('/dashboard/crops')}>
              <FaSeedling className="nav-icon" />
              <span>My Plants</span>
            </div>
            <div className="nav-item" onClick={() => setActiveTab('info')}>
              <FaBookOpen className="nav-icon" />
              <span>Disease Library</span>
            </div>
            <div className="nav-item" onClick={() => {}}>
              <FaRegCalendarAlt className="nav-icon" />
              <span>Care Schedule</span>
            </div>
            <div className="nav-item" onClick={() => setActiveTab('treatment')}>
              <FaShieldAlt className="nav-icon" />
              <span>Treatment Plans</span>
            </div>
            <div className="nav-item" onClick={() => {}}>
              <FaChartLine className="nav-icon" />
              <span>Analytics</span>
            </div>
            <div className="nav-item" onClick={() => navigate('/dashboard/community')}>
              <FaUsers className="nav-icon" />
              <span>Community</span>
            </div>
            <div className="nav-item" onClick={() => navigate('/dashboard/market')}>
              <FaStore className="nav-icon" />
              <span>Market</span>
            </div>
          </nav>

          {/* Sidebar Promo Card */}
          <div className="sidebar-promo-card">
            <div className="promo-badge-icon">
              <FaLeaf />
            </div>
            <h3>Healthy Plants<br />Brighter Tomorrows</h3>
            <p>Detect. Treat. Prevent. Grow with AI.</p>
            <div className="promo-leaf-art">
              <img src={sidebarPlantImg} alt="Botanical leaf foliage" />
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main Scrollable Content */}
        <section className="dashboard-main" ref={mainSectionRef}>
          <div className="main-canvas-card">
            {/* 1. Dashboard Hero Banner (Single Cohesive Pale-Green Banner) */}
            <div className="dashboard-hero-card">
            <div className="hero-content">
              <h1 className="hero-headline">
                Smarter Plant Care<br />with the Power of AI
              </h1>
              <p className="hero-subtext">
                Upload a photo, detect diseases, get expert recommendations,
                and manage the full lifecycle of your plant’s health.
              </p>
              <div className="hero-cta-group">
                <button className="btn-primary-green" onClick={scrollToScan}>
                  <FaCamera />
                  <span>Scan a Plant</span>
                </button>
                <button
                  className="btn-secondary-outline"
                  onClick={() => setActiveTab('info')}
                >
                  Browse Disease Library
                </button>
              </div>
            </div>

            <div className="hero-visual-center">
              <img
                src={heroPlantImg}
                alt="Fresh green indoor foliage"
                className="hero-plant-large-img"
              />
              <span className="hero-handscript-tag">
                Healthy Plants<br />Happier You
              </span>
            </div>

            <div className="hero-quote-box">
              <div className="quote-leaf-badge">
                <FaLeaf />
              </div>
              <blockquote className="quote-text">
                “Early detection saves plants, time and resources.”
              </blockquote>
              <cite className="quote-author">— Plantaexa</cite>
            </div>
          </div>

          {/* 2-Column Main Dashboard Grid */}
          <div className="dashboard-grid-layout">
            {/* LEFT COLUMN: Scan & Diagnosis + Treatment Plan */}
            <div className="dashboard-left-col">
              {/* 2. Plant Scanning & Diagnosis Section */}
              <div className="card-panel scan-diagnosis-card" ref={scanSectionRef}>
                <div className="card-section-header">
                  <div className="header-icon-circle">
                    <FaCamera />
                  </div>
                  <div>
                    <h2 className="card-title">Scan Your Plant</h2>
                    <p className="card-subtitle">
                      Upload an image of your plant leaf, stem, or entire plant to detect diseases.
                    </p>
                  </div>
                </div>

                <div className="scan-diagnosis-body">
                  {/* Left: Drag & Drop upload box */}
                  <div
                    className={`dropzone-box ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragOver(true)
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <div className="cloud-icon-wrap">
                      <FaCloudUploadAlt />
                    </div>
                    <p className="dropzone-label">Drag & drop an image here</p>
                    <span className="dropzone-or">or</span>
                    <button
                      type="button"
                      className="btn-choose-image"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      <FaCamera />
                      <span>Choose Image</span>
                    </button>
                    <p className="dropzone-hint">Supports JPG, PNG (Max 10MB)</p>
                  </div>

                  {/* Right: Diagnosis Result Box */}
                  <div className="diagnosis-result-box">
                    <div className="diagnosis-preview-frame">
                      <img
                        src={previewImage}
                        alt="Diagnosis Leaf Preview"
                        className="diagnosis-img"
                      />
                      <button
                        className="btn-clear-preview"
                        onClick={handleResetImage}
                        title="Reset sample"
                        aria-label="Reset image"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <div className="diagnosis-details">
                      <div className="diagnosis-header-row">
                        <span className="result-label">Diagnosis Result</span>
                        <span className="status-pill detected">
                          <FaExclamationCircle />
                          {currentDiagnosis.status}
                        </span>
                      </div>

                      <div className="disease-title-row">
                        <div className="disease-badge-icon">
                          <FaLeaf />
                        </div>
                        <div>
                          <h3 className="disease-name">{currentDiagnosis.name}</h3>
                          <span className="scientific-name">
                            {currentDiagnosis.scientificName}
                          </span>
                        </div>
                      </div>

                      <div className="confidence-row">
                        <div className="confidence-text-group">
                          <span className="confidence-label">Confidence:</span>
                          <span className="confidence-val">
                            {isAnalyzing ? 'Analyzing...' : `${currentDiagnosis.confidence}%`}
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: isAnalyzing ? '30%' : `${currentDiagnosis.confidence}%`
                            }}
                          />
                        </div>
                      </div>

                      <p className="disease-description">
                        {currentDiagnosis.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Treatment Plan | Disease Info | Similar Cases */}
                <div className="diagnosis-tabs-row">
                  <button
                    className={`diag-tab-btn ${activeTab === 'treatment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('treatment')}
                  >
                    <FaLeaf />
                    <span>Treatment Plan</span>
                  </button>
                  <button
                    className={`diag-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                  >
                    <FaInfoCircle />
                    <span>Disease Info</span>
                  </button>
                  <button
                    className={`diag-tab-btn ${activeTab === 'similar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('similar')}
                  >
                    <FaImages />
                    <span>Similar Cases</span>
                  </button>
                </div>

                {/* Tab 1: Treatment Plan */}
                {activeTab === 'treatment' && (
                  <div className="treatment-content-wrap">
                    <div className="treatment-cards-grid">
                      {/* Card 1 */}
                      <div className="treatment-step-card">
                        <div className="step-icon-badge">
                          <FaCut />
                        </div>
                        <h4 className="step-title">1. Remove Infected Parts</h4>
                        <p className="step-desc">
                          Cut and dispose of severely affected leaves to prevent further spread.
                        </p>
                      </div>

                      {/* Card 2 */}
                      <div className="treatment-step-card">
                        <div className="step-icon-badge">
                          <FaSprayCan />
                        </div>
                        <h4 className="step-title">2. Apply Fungicide</h4>
                        <p className="step-desc">
                          Use recommended fungicide (e.g. Mancozeb or Copper-based) every 7–10 days.
                        </p>
                      </div>

                      {/* Card 3 */}
                      <div className="treatment-step-card">
                        <div className="step-icon-badge">
                          <FaWind />
                        </div>
                        <h4 className="step-title">3. Improve Air Circulation</h4>
                        <p className="step-desc">
                          Ensure proper spacing between plants and remove excess foliage.
                        </p>
                      </div>

                      {/* Card 4 */}
                      <div className="treatment-step-card">
                        <div className="step-icon-badge">
                          <FaChartLine />
                        </div>
                        <h4 className="step-title">4. Monitor Progress</h4>
                        <p className="step-desc">
                          Re-scan after treatment to track recovery.
                        </p>
                      </div>
                    </div>

                    {/* Notification Banner */}
                    <div className="schedule-status-banner">
                      <div className="banner-left">
                        <FaCheckCircle className="banner-check-icon" />
                        <span>Treatment plan added to your plant schedule!</span>
                      </div>
                      <button
                        className="btn-add-to-plants"
                        onClick={() => {
                          alert('Added to your plant care schedule!')
                        }}
                      >
                        <FaCalendarPlus />
                        <span>Add to My Plants</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: Disease Info */}
                {activeTab === 'info' && (
                  <div className="tab-info-panel">
                    <div className="info-item-grid">
                      <div className="info-stat-card">
                        <span className="stat-label">Pathogen</span>
                        <strong className="stat-value">Alternaria solani (Fungus)</strong>
                      </div>
                      <div className="info-stat-card">
                        <span className="stat-label">Susceptible Hosts</span>
                        <strong className="stat-value">Tomato, Potato, Eggplant</strong>
                      </div>
                      <div className="info-stat-card">
                        <span className="stat-label">Optimal Conditions</span>
                        <strong className="stat-value">Warm temperatures (24–29°C) & high humidity</strong>
                      </div>
                    </div>
                    <p className="info-extended-text">
                      Early blight persists in plant debris and soil. Splashing water from rain or overhead irrigation spreads spores from the ground up onto the lower foliage. Preventative staking, drip irrigation, and mulching severely reduce infection rates.
                    </p>
                  </div>
                )}

                {/* Tab 3: Similar Cases */}
                {activeTab === 'similar' && (
                  <div className="similar-cases-panel">
                    <div className="similar-case-card">
                      <strong>Septoria Leaf Spot</strong>
                      <span>Smaller concentric lesions with distinct dark borders and gray centers.</span>
                    </div>
                    <div className="similar-case-card">
                      <strong>Bacterial Speck</strong>
                      <span>Tiny, dark brown to black spots with faint yellow halos.</span>
                    </div>
                    <div className="similar-case-card">
                      <strong>Late Blight (Phytophthora)</strong>
                      <span>Large, water-soaked lesions that rapidly turn purplish-brown.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Lifecycle + Care Schedule + Your Plants */}
            <div className="dashboard-right-col">
              {/* 3. Plant Disease Lifecycle Management */}
              <div className="card-panel lifecycle-card">
                <h2 className="card-title">Plant Disease Lifecycle Management</h2>

                {/* 5-Step Horizontal Stepper */}
                <div className="lifecycle-stepper">
                  {/* Step 1: Healthy */}
                  <div className="stepper-step completed">
                    <div className="step-circle">
                      <FaLeaf />
                    </div>
                    <span className="step-label">Healthy</span>
                  </div>

                  <div className="stepper-line active" />

                  {/* Step 2: Infection Detected (Active) */}
                  <div className="stepper-step active-alert">
                    <div className="step-circle alert">
                      <FaExclamationTriangle />
                    </div>
                    <span className="step-label highlight">Infection Detected</span>
                  </div>

                  <div className="stepper-line" />

                  {/* Step 3: Treatment */}
                  <div className="stepper-step">
                    <div className="step-circle">
                      <FaSprayCan />
                    </div>
                    <span className="step-label">Treatment</span>
                  </div>

                  <div className="stepper-line" />

                  {/* Step 4: Recovery */}
                  <div className="stepper-step">
                    <div className="step-circle">
                      <FaSeedling />
                    </div>
                    <span className="step-label">Recovery</span>
                  </div>

                  <div className="stepper-line" />

                  {/* Step 5: Prevention */}
                  <div className="stepper-step">
                    <div className="step-circle">
                      <FaShieldAlt />
                    </div>
                    <span className="step-label">Prevention</span>
                  </div>
                </div>

                {/* Current Stage Highlight Box */}
                <div className="current-stage-box">
                  <div className="stage-alert-icon">
                    <FaExclamationTriangle />
                  </div>
                  <div className="stage-alert-text">
                    <h3 className="stage-alert-title">Infection Detected</h3>
                    <p className="stage-alert-desc">
                      Take action with the recommended treatment plan to prevent further spread.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Care Schedule */}
              <div className="card-panel care-schedule-card">
                <div className="card-header-flex">
                  <div className="header-title-flex">
                    <FaRegCalendarAlt className="header-icon-green" />
                    <h2 className="card-title">Care Schedule</h2>
                  </div>
                  <button
                    className="btn-view-all"
                    onClick={() => navigate('/dashboard/crops')}
                  >
                    View All
                  </button>
                </div>

                <div className="schedule-task-list">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`schedule-task-item ${task.completed ? 'task-done' : ''}`}
                      onClick={() => toggleTask(task.id)}
                    >
                      <span className="schedule-badge">
                        <FaRegCalendarAlt className="badge-mini-icon" />
                        {task.period}
                      </span>
                      <span className="task-title-text">{task.title}</span>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="task-checkbox"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Your Plants */}
              <div className="card-panel your-plants-card">
                <div className="card-header-flex">
                  <div className="header-title-flex">
                    <FaSeedling className="header-icon-green" />
                    <h2 className="card-title">Your Plants</h2>
                  </div>
                  <button
                    className="btn-view-all"
                    onClick={() => navigate('/dashboard/crops')}
                  >
                    View All
                  </button>
                </div>

                <div className="plants-cards-grid">
                  {plants.map((plant) => (
                    <div key={plant.id} className="plant-thumb-card">
                      <div className="plant-img-wrap">
                        <img src={plant.image} alt={plant.name} className="plant-thumb-img" />
                        {plant.status === 'warning' ? (
                          <span className="plant-status-dot warning" title="Infection Detected">!</span>
                        ) : (
                          <span className="plant-status-dot healthy" title="Healthy">
                            <FaCheck />
                          </span>
                        )}
                      </div>
                      <span className="plant-thumb-name">{plant.name}</span>
                    </div>
                  ))}

                  {/* Add Plant Card */}
                  <button
                    type="button"
                    className="add-plant-card-btn"
                    onClick={() => setShowAddPlantModal(true)}
                  >
                    <div className="add-icon-circle">
                      <FaPlus />
                    </div>
                    <span>Add Plant</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Bottom Information Cards */}
          <div className="bottom-info-strip">
            {/* Card 1 */}
            <div className="info-feature-card">
              <div className="info-feature-icon">
                <FaShieldAlt />
              </div>
              <div className="info-feature-copy">
                <h3 className="info-feature-title">Prevent Outbreaks</h3>
                <p className="info-feature-desc">
                  Get early alerts and preventive tips based on weather and plant conditions.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="info-feature-card">
              <div className="info-feature-icon">
                <FaChartBar />
              </div>
              <div className="info-feature-copy">
                <h3 className="info-feature-title">Track Plant Health</h3>
                <p className="info-feature-desc">
                  Monitor progress and maintain a healthy garden.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="info-feature-card">
              <div className="info-feature-icon">
                <FaSeedling />
              </div>
              <div className="info-feature-copy">
                <h3 className="info-feature-title">Grow Smarter</h3>
                <p className="info-feature-desc">
                  AI-powered insights for better yields and sustainable farming.
                </p>
              </div>
            </div>

            {/* Script Signature Tagline */}
            <div className="bottom-signature">
              <span className="signature-text">A Greener Future Together</span>
              <FaLeaf className="signature-leaf-icon" />
            </div>
          </div>
        </div>
      </section>

        {/* Far Right Vertical Toolbar */}
        <aside className="far-right-toolbar">
          <button className="right-tool-btn" title="Reminders / Timer">
            <FaRegCalendarAlt />
          </button>
          <button className="right-tool-btn" title="Completed Tasks">
            <FaCheckCircle />
          </button>
          <button className="right-tool-btn" title="Analytics">
            <FaChartBar />
          </button>
          <button className="right-tool-btn" title="Profile">
            <FaUsers />
          </button>
        </aside>
      </div>

      {/* Add Plant Modal */}
      {showAddPlantModal && (
        <div className="modal-overlay" onClick={() => setShowAddPlantModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Plant</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddPlantModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddPlant} className="modal-form">
              <label>
                <span>Plant Name</span>
                <input
                  type="text"
                  placeholder="e.g. Cherry Tomato, Rosemary, Mint"
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  autoFocus
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAddPlantModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Add Plant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Dashboard
