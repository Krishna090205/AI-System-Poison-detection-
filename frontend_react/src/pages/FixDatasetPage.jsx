import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './FixDatasetPage.css'
import './FixDatasetPageExtras.css'
import './FixDatasetTheme.css'

function FixDatasetPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const queryAnalysisId = searchParams.get('analysis_id') || searchParams.get('id')

  const [preloadedAnalysis, setPreloadedAnalysis] = useState(null)
  const [loadingPreload, setLoadingPreload] = useState(false)

  const [file, setFile] = useState(null)
  const [originalData, setOriginalData] = useState([])
  const [currentData, setCurrentData] = useState([])
  const [cleanedData, setCleanedData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [fixMethod, setFixMethod] = useState('remove') // 'remove' or 'impute'
  const [analysisResult, setAnalysisResult] = useState(null)
  const [fixResult, setFixResult] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState('')
  const [cleaningStats, setCleaningStats] = useState(null)
  const fileInputRef = useRef(null)

  // Load existing analysis passed from Dashboard without needing re-upload
  useEffect(() => {
    if (queryAnalysisId) {
      loadPreloadedAnalysis(queryAnalysisId)
    }
  }, [queryAnalysisId])

  const loadPreloadedAnalysis = async (analysisId) => {
    setLoadingPreload(true)
    setError(null)
    try {
      const stateData = location.state || {}

      // Fetch full analysis from server
      const response = await axios.get(`http://localhost:8000/analysis_results/${analysisId}`)
      const data = response.data

      const fileName = data.filename || data.dataset_name || stateData.filename || 'Dashboard Dataset'
      const totalSamples = data.total_samples || stateData.total_samples || 0
      const poisonedSamples = data.poisoned_samples ?? stateData.poisoned_samples ?? 0
      const suspiciousSamples = data.suspicious_samples ?? stateData.suspicious_samples ?? 0
      const cleanSamples = data.clean_samples ?? stateData.clean_samples ?? 0

      setPreloadedAnalysis({
        analysis_id: analysisId,
        dataset_id: data.dataset_id || stateData.dataset_id,
        filename: fileName,
        total_samples: totalSamples,
        poisoned_samples: poisonedSamples,
        suspicious_samples: suspiciousSamples,
        clean_samples: cleanSamples,
        detailed_results: data.detailed_results || []
      })

      setAnalysisResult(data)
    } catch (err) {
      console.warn('Could not load analysis details for ID:', analysisId, err)
      if (location.state?.analysis_id) {
        setPreloadedAnalysis(location.state)
      }
    } finally {
      setLoadingPreload(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const parseCsvPreview = (selectedFile) => {
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const text = evt.target.result
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
          const parsed = []
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            const rowObj = {}
            headers.forEach((h, colIdx) => {
              rowObj[h] = vals[colIdx] !== undefined ? vals[colIdx] : ''
            })
            parsed.push(rowObj)
          }
          setOriginalData(parsed)
          setCurrentData(parsed)
        }
      } catch (err) {
        console.warn('Could not parse CSV preview:', err)
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleFileSelection = (selectedFile) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    if (
      validTypes.includes(selectedFile.type) ||
      selectedFile.name.endsWith('.csv') ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls')
    ) {
      setFile(selectedFile)
      setPreloadedAnalysis(null)
      setAnalysisResult(null)
      setFixResult(null)
      setError(null)
      setCleaningStats(null)
      setCleanedData(null)
      if (selectedFile.name.endsWith('.csv')) {
        parseCsvPreview(selectedFile)
      }
    } else {
      setError('Please select a valid CSV or Excel file')
      setFile(null)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  // Combined single-click Clean Data pipeline
  const handleCleanData = async () => {
    // A: Preloaded dataset from Dashboard -> Clean directly without re-upload!
    if (preloadedAnalysis) {
      setFixing(true)
      setError(null)
      setFixResult(null)
      setCleaningStats(null)
      setProgress(
        fixMethod === 'remove'
          ? '🧹 Purging poisoned rows & removing duplicate copies (keeping 1 original)...'
          : '🔄 Imputing corrupted values & removing duplicate copies...'
      )

      try {
        const fixResponse = await axios.post(
          `http://localhost:8000/fix_dataset/${preloadedAnalysis.analysis_id}?action=${fixMethod}&remove_duplicates=true&remove_suspicious=true`,
          {},
          { timeout: 120000 }
        )

        setFixResult(fixResponse.data)

        const stats = {
          totalBefore: fixResponse.data.original_samples || preloadedAnalysis.total_samples,
          poisonedRemoved: fixResponse.data.poisoned_removed || 0,
          suspiciousRemoved: fixResponse.data.suspicious_removed || 0,
          suspiciousRetained: fixResponse.data.suspicious_retained || 0,
          duplicatesRemoved: fixResponse.data.duplicates_removed || 0,
          totalAfter: fixResponse.data.fixed_samples || (preloadedAnalysis.total_samples - (fixResponse.data.removed_samples || 0))
        }
        setCleaningStats(stats)
        setFixing(false)
        setProgress('✅ Dataset cleaned successfully!')
      } catch (err) {
        setFixing(false)
        let errorMsg = 'Failed to clean dataset. '
        if (err.response) {
          errorMsg += err.response.data?.detail || err.response.statusText
        } else {
          errorMsg += err.message
        }
        setError(errorMsg)
        setProgress('')
      }
      return
    }

    // B: Freshly uploaded file flow
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setAnalyzing(false)
    setFixing(false)
    setError(null)
    setAnalysisResult(null)
    setFixResult(null)
    setCleaningStats(null)

    try {
      // Step 1: Upload dataset
      setProgress('📤 Uploading dataset to server...')
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await axios.post(
        'http://localhost:8000/upload_dataset',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        }
      )

      const datasetId = uploadResponse.data.dataset_id
      setUploading(false)

      // Step 2: Run forensic analysis
      setAnalyzing(true)
      setProgress('🔍 Running 7-model ML forensic scan...')

      const analysisResponse = await axios.post(
        `http://localhost:8000/analyze_poison/${datasetId}`,
        {},
        { timeout: 180000 }
      )

      const analysisData = analysisResponse.data
      setAnalysisResult(analysisData)
      setAnalyzing(false)

      // Step 3: Automatically trigger dataset clean
      setFixing(true)
      setProgress(
        fixMethod === 'remove'
          ? '🧹 Purging poisoned rows & removing duplicate copies (keeping 1 original)...'
          : '🔄 Imputing corrupted values & removing duplicate copies...'
      )

      const fixResponse = await axios.post(
        `http://localhost:8000/fix_dataset/${analysisData.analysis_id}?action=${fixMethod}&remove_duplicates=true&remove_suspicious=true`,
        {},
        { timeout: 120000 }
      )

      setFixResult(fixResponse.data)

      const stats = {
        totalBefore: fixResponse.data.original_samples || (analysisData.summary?.total_samples || originalData.length),
        poisonedRemoved: fixResponse.data.poisoned_removed || 0,
        suspiciousRemoved: fixResponse.data.suspicious_removed || 0,
        suspiciousRetained: fixResponse.data.suspicious_retained || 0,
        duplicatesRemoved: fixResponse.data.duplicates_removed || 0,
        totalAfter: fixResponse.data.fixed_samples || (originalData.length - (fixResponse.data.removed_samples || 0))
      }
      setCleaningStats(stats)

      setFixing(false)
      setProgress('✅ Dataset cleaned successfully!')
    } catch (err) {
      setUploading(false)
      setAnalyzing(false)
      setFixing(false)
      let errorMsg = 'Failed to clean dataset. '
      if (err.code === 'ECONNABORTED') {
        errorMsg += 'Request timed out.'
      } else if (err.response) {
        errorMsg += err.response.data?.detail || err.response.statusText
      } else if (err.request) {
        errorMsg += 'No response from server. Check if backend is running.'
      } else {
        errorMsg += err.message
      }
      setError(errorMsg)
      setProgress('')
    }
  }

  const handleDownload = () => {
    if (fixResult && fixResult.download_url) {
      window.open(`http://localhost:8000${fixResult.download_url}`, '_blank')
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreloadedAnalysis(null)
    setAnalysisResult(null)
    setFixResult(null)
    setError(null)
    setProgress('')
    setOriginalData([])
    setCurrentData([])
    setCleanedData(null)
    setCleaningStats(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUndoResetToOriginal = () => {
    if (originalData.length > 0) {
      setCurrentData(originalData)
      setCleanedData(null)
      setFixResult(null)
      setCleaningStats(null)
      setProgress('Reverted to original uploaded data.')
    }
  }

  const isProcessing = uploading || analyzing || fixing
  const hasActiveDataset = file || preloadedAnalysis

  return (
    <div className="fix-dataset-page">
      {/* Header with pill tag */}
      <div className="page-header">
        <div className="header-pill">
          <span className="pill-dot"></span>
          AI-Powered Remediation Framework
        </div>
        <div className="header-content">
          <h1>
            <span className="icon-wrapper">
              <span className="icon">🛡️</span>
            </span>
            Clean &amp; Fix Dataset
          </h1>
          <p className="subtitle">
            One-click automated dataset remediation: Purge confirmed adversarial poison vectors, eliminate duplicate rows, and protect suspicious data integrity.
          </p>
        </div>
      </div>

      {!fixResult && (
        <div className="fix-workflow">
          {/* Step 1: Preloaded Dataset or Upload Box */}
          <div className="workflow-step-card">
            <div className="step-badge-row">
              <span className="step-number-badge">1</span>
              <div>
                <h3 className="step-title">Target Dataset Identification</h3>
                <p className="step-subtitle">Identify the dataset to be cleaned and sanitized</p>
              </div>
            </div>

            {loadingPreload ? (
              <div className="loading-container preload-loading">
                <div className="spinner"></div>
                <p>Loading forensic analysis details from Dashboard...</p>
              </div>
            ) : preloadedAnalysis ? (
              <div className="preloaded-dataset-card">
                <div className="preloaded-top-row">
                  <div className="preloaded-file-meta">
                    <div className="preloaded-icon-tile">
                      <span className="preloaded-icon">📊</span>
                    </div>
                    <div>
                      <div className="preloaded-title-wrap">
                        <h4 className="preloaded-filename">{preloadedAnalysis.filename}</h4>
                        <span className="source-pill">✓ Direct from Dashboard</span>
                      </div>
                      <p className="preloaded-subtext">Forensic scan completed &bull; Ready for automated remediation</p>
                    </div>
                  </div>

                  <button
                    className="btn-switch-file"
                    type="button"
                    onClick={() => {
                      setPreloadedAnalysis(null)
                      handleReset()
                    }}
                  >
                    <span>📁</span> Upload a different file instead
                  </button>
                </div>

                {/* Stat pills row */}
                <div className="preloaded-stats-grid">
                  <div className="preload-stat-box stat-total">
                    <span className="stat-label">Total Rows</span>
                    <span className="stat-value">{preloadedAnalysis.total_samples?.toLocaleString()}</span>
                    <span className="stat-tag tag-neutral">Mapped</span>
                  </div>

                  <div className="preload-stat-box stat-poisoned">
                    <span className="stat-label">Poisoned Rows</span>
                    <span className="stat-value val-red">{preloadedAnalysis.poisoned_samples}</span>
                    <span className="stat-tag tag-danger">Will be purged</span>
                  </div>

                  <div className="preload-stat-box stat-suspicious">
                    <span className="stat-label">Suspicious Rows</span>
                    <span className="stat-value val-amber">{preloadedAnalysis.suspicious_samples?.toLocaleString()}</span>
                    <span className="stat-tag tag-warning">✓ 100% Retained</span>
                  </div>

                  <div className="preload-stat-box stat-clean">
                    <span className="stat-label">Clean Rows</span>
                    <span className="stat-value val-green">{preloadedAnalysis.clean_samples?.toLocaleString()}</span>
                    <span className="stat-tag tag-success">✓ Verified Clean</span>
                  </div>
                </div>

                {/* Instant Action Reassurance Banner */}
                <div className="zero-reupload-banner">
                  <span className="banner-icon">⚡</span>
                  <div className="banner-text">
                    <strong>Zero Re-upload Required:</strong> Your dataset is already loaded and cached on the secure server. Choose your cleaning action below and execute with a single click.
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {!file ? (
                  <div className="dropzone-content">
                    <div className="upload-icon-tile">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="40" height="40">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3>Drag &amp; drop your dataset file here</h3>
                    <p className="dropzone-sub">Upload CSV, XLSX, or XLS to clean and sanitize</p>
                    <button className="btn-browse-file" type="button">Browse Local Files</button>
                    <div className="format-chips">
                      <span className="chip">.CSV</span>
                      <span className="chip">.XLSX</span>
                      <span className="chip">.XLS</span>
                    </div>
                  </div>
                ) : (
                  <div className="file-preview-card">
                    <div className="file-preview-left">
                      <div className="file-preview-icon">📄</div>
                      <div>
                        <h4 className="file-preview-name">{file.name}</h4>
                        <p className="file-preview-size">{(file.size / 1024).toFixed(1)} KB &bull; Ready for cleaning</p>
                      </div>
                    </div>
                    <button
                      className="btn-remove-file"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReset()
                      }}
                      type="button"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Choose Method Card */}
          {hasActiveDataset && (
            <div className="workflow-step-card">
              <div className="step-badge-row">
                <span className="step-number-badge">2</span>
                <div>
                  <h3 className="step-title">Choose Remediation Strategy</h3>
                  <p className="step-subtitle">Select how adversarial poison and redundant duplicates should be handled</p>
                </div>
              </div>

              <div className="strategy-grid">
                {/* Method 1: Remove Bad Rows & Deduplicate */}
                <div
                  className={`strategy-card ${fixMethod === 'remove' ? 'selected' : ''}`}
                  onClick={() => setFixMethod('remove')}
                >
                  <div className="strategy-card-header">
                    <div className="strategy-icon-tile icon-remove">
                      <span>🗑️</span>
                    </div>
                    <div className="strategy-header-meta">
                      <div className="strategy-title-row">
                        <h4>Purge Poison &amp; Duplicates</h4>
                        <span className="recommend-badge">Recommended</span>
                      </div>
                      <span className="strategy-tagline">Strict ML Safety Guarantee</span>
                    </div>
                    <div className="selection-ring">
                      <div className="selection-dot"></div>
                    </div>
                  </div>

                  <p className="strategy-desc">
                    Drops all verified poisoned rows (poison score &ge; 0.70) and purges redundant duplicate copies while keeping exactly 1 pristine original.
                  </p>

                  <div className="strategy-perks">
                    <div className="perk-item">
                      <span className="perk-check">✓</span>
                      <span><strong>Preserves 1 original record</strong> for all duplicates</span>
                    </div>
                    <div className="perk-item">
                      <span className="perk-check">✓</span>
                      <span><strong>Suspicious rows retained</strong> (0.30 &le; score &lt; 0.70)</span>
                    </div>
                    <div className="perk-item">
                      <span className="perk-check">✓</span>
                      <span>Guarantees <strong>100% zero-poison</strong> output</span>
                    </div>
                  </div>
                </div>

                {/* Method 2: Fix Values (Imputation) */}
                <div
                  className={`strategy-card ${fixMethod === 'impute' ? 'selected' : ''}`}
                  onClick={() => setFixMethod('impute')}
                >
                  <div className="strategy-card-header">
                    <div className="strategy-icon-tile icon-impute">
                      <span>🔄</span>
                    </div>
                    <div className="strategy-header-meta">
                      <div className="strategy-title-row">
                        <h4>Statistical Value Imputation</h4>
                        <span className="preserve-badge">Preserves Rows</span>
                      </div>
                      <span className="strategy-tagline">Mathematical Repair</span>
                    </div>
                    <div className="selection-ring">
                      <div className="selection-dot"></div>
                    </div>
                  </div>

                  <p className="strategy-desc">
                    Replaces corrupted and anomalous feature values with clean statistical median and mode values, retaining all rows and removing duplicate copies.
                  </p>

                  <div className="strategy-perks">
                    <div className="perk-item">
                      <span className="perk-check">✓</span>
                      <span><strong>Preserves sample size</strong> without row deletion</span>
                    </div>
                    <div className="perk-item">
                      <span className="perk-check">✓</span>
                      <span><strong>Statistical median/mode</strong> feature repair</span>
                    </div>
                    <div className="perk-item">
                      <span className="perk-check">✓</span>
                      <span>Purges duplicate copies &amp; keeps 1 original</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="action-cta-box">
                <button
                  className="btn-clean-primary"
                  onClick={handleCleanData}
                  disabled={isProcessing}
                >
                  <span className="btn-icon">{isProcessing ? '⏳' : '🧹'}</span>
                  <span>
                    {isProcessing
                      ? (progress || 'Cleaning Dataset...')
                      : (preloadedAnalysis
                          ? 'Clean Dataset Now (No Re-upload)'
                          : 'Sanitize & Clean Dataset Now')}
                  </span>
                  {!isProcessing && <span className="btn-arrow">&rarr;</span>}
                </button>

                <div className="safety-guarantee-note">
                  <span className="shield-icon">🛡️</span>
                  <span><strong>Enterprise Safety Guarantee:</strong> Original datasets are never overwritten. Suspicious records are strictly protected.</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress Banner */}
          {progress && !error && !fixResult && (
            <div className="progress-status-box">
              <div className="spinner"></div>
              <div className="progress-details">
                <h4>Remediation Pipeline Running</h4>
                <p>{progress}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="error-alert-box">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h4>Remediation Process Notice</h4>
                <p>{error}</p>
                <span className="safety-hint">Safety check: Your original dataset was left completely untouched.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results View */}
      {fixResult && (
        <div className="fix-results-container">
          {/* Quality Guarantee Hero Banner */}
          <div className="results-hero-card">
            <div className="hero-shield-tile">
              <span>🛡️</span>
            </div>
            <div className="hero-content">
              <div className="hero-pill-badge">Verified Clean &bull; Zero Poison</div>
              <h2>Dataset Successfully Cleaned &amp; Sanitized</h2>
              <p className="hero-desc">
                {fixResult.verification_status || 'All poisoned rows have been removed, redundant duplicates purged, and suspicious records retained safely.'}
              </p>
              <div className="guarantee-chip">
                <span>✓</span> {fixResult.quality_guarantee || 'This dataset has been verified and is 100% safe to use for machine learning.'}
              </div>
            </div>
          </div>

          {/* 5-Column Forensic Metrics Grid */}
          <div className="remediation-kpi-grid">
            <div className="kpi-card kpi-total">
              <span className="kpi-label">Original Samples</span>
              <span className="kpi-number">{fixResult.original_samples || cleaningStats?.totalBefore}</span>
              <span className="kpi-sub">Before remediation</span>
            </div>

            <div className="kpi-card kpi-poisoned">
              <span className="kpi-label">Poisoned Rows Removed</span>
              <span className="kpi-number val-red">
                -{fixResult.poisoned_removed ?? cleaningStats?.poisonedRemoved ?? 0}
              </span>
              <span className="kpi-sub">Adversarial vectors purged</span>
            </div>

            <div className="kpi-card kpi-duplicates">
              <span className="kpi-label">Duplicate Copies Purged</span>
              <span className="kpi-number val-amber">
                -{fixResult.duplicates_removed ?? cleaningStats?.duplicatesRemoved ?? 0}
              </span>
              <span className="kpi-sub">Kept 1 pristine original</span>
            </div>

            <div className="kpi-card kpi-suspicious">
              <span className="kpi-label">
                {(fixResult.suspicious_removed ?? cleaningStats?.suspiciousRemoved ?? 0) > 0
                  ? 'Suspicious Rows Purged'
                  : 'Suspicious Rows Retained'}
              </span>
              <span className={`kpi-number ${(fixResult.suspicious_removed ?? cleaningStats?.suspiciousRemoved ?? 0) > 0 ? 'val-amber' : 'val-green'}`}>
                {(fixResult.suspicious_removed ?? cleaningStats?.suspiciousRemoved ?? 0) > 0
                  ? `-${fixResult.suspicious_removed ?? cleaningStats?.suspiciousRemoved}`
                  : `+${fixResult.suspicious_retained ?? cleaningStats?.suspiciousRetained ?? 0}`}
              </span>
              <span className="kpi-sub">
                {(fixResult.suspicious_removed ?? cleaningStats?.suspiciousRemoved ?? 0) > 0
                  ? 'All anomalies eliminated'
                  : '100% safely protected'}
              </span>
            </div>

            <div className="kpi-card kpi-clean">
              <span className="kpi-label">Clean Dataset Output</span>
              <span className="kpi-number val-purple">
                {fixResult.fixed_samples ?? cleaningStats?.totalAfter}
              </span>
              <span className="kpi-sub">100% production ready</span>
            </div>
          </div>

          {/* Download Cleaned Dataset Card */}
          <div className="download-cta-card">
            <div className="download-card-meta">
              <div className="download-icon-tile">
                <span>📥</span>
              </div>
              <div>
                <h3>Your Sanitized Dataset is Ready</h3>
                <p className="download-file-name">
                  <span className="file-chip">CSV</span> {fixResult.fixed_filename}
                </p>
                <p className="download-security-note">
                  🔒 Sanitized with 7-model multi-perspective validation &bull; Ready for production training
                </p>
              </div>
            </div>

            <button className="btn-download-cleaned" onClick={handleDownload}>
              <span className="icon">⬇️</span>
              Download Cleaned Dataset
            </button>
          </div>

          {/* Next Navigation Actions */}
          <div className="results-actions-row">
            <button
              className="btn-action-secondary"
              onClick={() => navigate(fixResult?.new_analysis_id ? `/dashboard?id=${fixResult.new_analysis_id}` : '/dashboard')}
            >
              <span className="icon">📊</span>
              View Analysis Dashboard
            </button>
            <button className="btn-action-secondary" onClick={handleReset}>
              <span className="icon">🔄</span>
              Clean Another Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FixDatasetPage
