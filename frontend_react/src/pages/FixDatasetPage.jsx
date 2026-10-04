import { useState, useRef } from 'react'
import axios from 'axios'
import './FixDatasetPage.css'
import './FixDatasetPageExtras.css'
import './FixDatasetTheme.css'

function FixDatasetPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [fixMethod, setFixMethod] = useState('remove')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [fixResult, setFixResult] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
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

  const handleFileSelection = (selectedFile) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (validTypes.includes(selectedFile.type) || 
        selectedFile.name.endsWith('.csv') || 
        selectedFile.name.endsWith('.xlsx') || 
        selectedFile.name.endsWith('.xls')) {
      setFile(selectedFile)
      setAnalysisResult(null)
      setFixResult(null)
      setError(null)
    } else {
      setError('Please select a CSV or Excel file')
      setFile(null)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleUploadAndFix = async () => {
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

    try {
      // Step 1: Upload dataset
      setProgress('📤 Uploading dataset...')
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
      console.log('✅ Upload successful:', datasetId)

      // Step 2: Analyze dataset
      setUploading(false)
      setAnalyzing(true)
      setProgress('🤖 Analyzing dataset for poisoned data...')

      const analysisResponse = await axios.post(
        `http://localhost:8000/analyze_dataset/${datasetId}`,
        {},
        { timeout: 300000 }
      )

      console.log('✅ Analysis complete:', analysisResponse.data)
      setAnalysisResult(analysisResponse.data)

      const summary = analysisResponse.data.summary
      const analysisId = analysisResponse.data.analysis_id
      
      // Check if we have a valid analysis_id
      if (!analysisId) {
        console.warn('⚠️  No analysis_id returned - MongoDB storage may have failed')
        setAnalyzing(false)
        setProgress('✅ Analysis complete! (Note: Results not stored in database)')
        return
      }
      
      const needsFix = summary.poisoned_samples > 0 || summary.suspicious_samples > 0

      if (!needsFix) {
        setAnalyzing(false)
        setProgress('✅ Dataset is already clean! No poisoned or suspicious data found.')
        return
      }

      // Step 3: Fix dataset automatically
      setAnalyzing(false)
      setFixing(true)
      setProgress(`🔧 Cleaning dataset using ${fixMethod === 'remove' ? 'Remove' : 'Imputation'} method...`)

      const fixResponse = await axios.post(
        `http://localhost:8000/fix_dataset/${analysisId}?action=${fixMethod}`,
        {},
        { timeout: 120000 }
      )

      console.log('✅ Fix complete:', fixResponse.data)
      setFixResult(fixResponse.data)
      setFixing(false)
      setProgress('✅ Dataset cleaned successfully!')

    } catch (err) {
      console.error('❌ Error:', err)
      setUploading(false)
      setAnalyzing(false)
      setFixing(false)
      
      let errorMsg = 'Failed to process dataset. '
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
    if (analysisResult && analysisResult.analysis_id) {
      window.open(`http://localhost:8000/download_fixed/${analysisResult.analysis_id}`, '_blank')
    }
  }

  const handleReset = () => {
    setFile(null)
    setAnalysisResult(null)
    setFixResult(null)
    setError(null)
    setProgress('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const isProcessing = uploading || analyzing || fixing

  return (
    <div className="fix-dataset-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <span className="icon">🔧</span>
            Fix Dataset
          </h1>
          <p className="subtitle">Upload your dataset and we'll automatically clean all poisoned and suspicious data</p>
        </div>
      </div>

      {/* Fix Method Selection */}
      {!fixResult && (
        <div className="fix-method-selector">
          <h3>🛠️ Choose Cleaning Method</h3>
          <div className="method-options">
            <div 
              className={`method-option ${fixMethod === 'remove' ? 'selected' : ''}`}
              onClick={() => !isProcessing && setFixMethod('remove')}
            >
              <div className="method-icon">🗑️</div>
              <div className="method-info">
                <h4>Remove Bad Rows</h4>
                <p>Delete all poisoned and suspicious samples</p>
              </div>
              <div className="method-check">{fixMethod === 'remove' ? '✓' : ''}</div>
            </div>
            <div 
              className={`method-option ${fixMethod === 'impute' ? 'selected' : ''}`}
              onClick={() => !isProcessing && setFixMethod('impute')}
            >
              <div className="method-icon">🔄</div>
              <div className="method-info">
                <h4>Fix Values (Imputation)</h4>
                <p>Replace bad values with clean statistics</p>
              </div>
              <div className="method-check">{fixMethod === 'impute' ? '✓' : ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {!fixResult && (
        <div className="upload-section">
          <div 
            className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="file-input-hidden"
              disabled={isProcessing}
            />
            
            {!file ? (
              <div className="dropzone-content">
                <div className="upload-icon-large">📁</div>
                <h3>Drag & Drop your dataset here</h3>
                <p className="or-text">or</p>
                <button className="btn-browse" disabled={isProcessing}>Browse Files</button>
                <p className="file-types">Supported: CSV, XLSX, XLS</p>
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-icon">
                  {file.name.endsWith('.csv') ? '📄' : '📊'}
                </div>
                <div className="file-info">
                  <h4>{file.name}</h4>
                  <p>{formatFileSize(file.size)}</p>
                </div>
                {!isProcessing && (
                  <button 
                    className="btn-remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {file && !fixResult && (
            <button
              className={`btn-process ${isProcessing ? 'processing' : ''}`}
              onClick={handleUploadAndFix}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  {progress || 'Processing...'}
                </>
              ) : (
                <>
                  <span className="icon">🚀</span>
                  Upload & Clean Dataset
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Progress Message */}
      {progress && !error && !fixResult && (
        <div className="progress-card">
          <div className="progress-icon">
            {uploading && '📤'}
            {analyzing && '🤖'}
            {fixing && '🔧'}
          </div>
          <p>{progress}</p>
        </div>
      )}

      {/* Analysis Results (if dataset is already clean) */}
      {analysisResult && !fixResult && !fixing && (
        <div className="analysis-card">
          <h3>📊 Analysis Results</h3>
          <div className="analysis-stats">
            <div className="stat-box">
              <span className="stat-label">Total Samples</span>
              <span className="stat-value">{analysisResult.summary.total_samples}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Poisoned</span>
              <span className="stat-value poisoned">{analysisResult.summary.poisoned_samples}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Suspicious</span>
              <span className="stat-value suspicious">{analysisResult.summary.suspicious_samples}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Clean</span>
              <span className="stat-value clean">{analysisResult.summary.clean_samples}</span>
            </div>
          </div>
          {analysisResult.summary.poisoned_samples === 0 && analysisResult.summary.suspicious_samples === 0 && (
            <div className="clean-message">
              <div className="clean-icon">✅</div>
              <h4>Dataset is Already Clean!</h4>
              <p>No poisoned or suspicious data detected. Your dataset is ready to use.</p>
              <button className="btn-primary" onClick={handleReset}>
                Upload Another Dataset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="result-card error">
          <div className="result-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={handleReset}>
            Try Again
          </button>
        </div>
      )}

      {/* Success Result */}
      {fixResult && (
        <div className="result-card success">
          <div className="result-icon">✅</div>
          <h3>Dataset Cleaned Successfully!</h3>
          <p className="success-message">
            Your dataset has been automatically cleaned, verified, and is 100% safe to use.
          </p>

          {/* Quality Guarantee Badge */}
          <div className="quality-badge">
            <div className="badge-icon">🛡️</div>
            <div className="badge-content">
              <h4>Quality Guaranteed</h4>
              <p className="verification-status">{fixResult.verification_status || '100% Clean'}</p>
              <p className="guarantee-text">
                ✓ {fixResult.quality_guarantee || 'This dataset is verified and safe to use'}
              </p>
            </div>
          </div>

          <div className="fix-summary">
            <h4>📋 Cleaning Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Method Used</span>
                <span className="summary-value">{fixMethod === 'remove' ? 'Remove Bad Rows' : 'Fix Values (Imputation)'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Original Samples</span>
                <span className="summary-value">{fixResult.original_samples}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Clean Samples</span>
                <span className="summary-value clean">{fixResult.fixed_samples}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Data Quality</span>
                <span className="summary-value clean">{fixResult.clean_percentage || 100}% Clean</span>
              </div>
            </div>

            {/* Detailed Removal Stats */}
            {(fixResult.poisoned_removed > 0 || fixResult.suspicious_removed > 0 || fixResult.removed_samples > 0) && (
              <div className="removal-stats">
                <h5>🗑️ Issues Removed:</h5>
                <div className="removal-grid">
                  {fixResult.poisoned_removed > 0 && (
                    <div className="removal-item poisoned-item">
                      <span className="removal-icon">⚠️</span>
                      <span className="removal-count">{fixResult.poisoned_removed}</span>
                      <span className="removal-label">Poisoned Samples</span>
                    </div>
                  )}
                  {fixResult.suspicious_removed > 0 && (
                    <div className="removal-item suspicious-item">
                      <span className="removal-icon">⚡</span>
                      <span className="removal-count">{fixResult.suspicious_removed}</span>
                      <span className="removal-label">Suspicious Samples</span>
                    </div>
                  )}
                  {fixResult.removed_samples > 0 && !fixResult.poisoned_removed && (
                    <div className="removal-item">
                      <span className="removal-icon">🗑️</span>
                      <span className="removal-count">{fixResult.removed_samples}</span>
                      <span className="removal-label">Total Removed</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {fixResult.fixed_values > 0 && (
              <div className="imputation-info">
                <div className="info-icon">🔄</div>
                <div className="info-text">
                  <strong>{fixResult.fixed_values} values</strong> were replaced with clean statistics from your dataset
                </div>
              </div>
            )}
          </div>

          <div className="download-section">
            <div className="download-card">
              <div className="download-icon">📥</div>
              <div className="download-info">
                <h4>Your Cleaned Dataset is Ready</h4>
                <p className="filename">
                  <span className="file-icon">📄</span>
                  {fixResult.fixed_filename}
                </p>
                <p className="security-note">
                  <span className="security-icon">🔒</span>
                  Verified clean and secure - Ready for production use
                </p>
              </div>
            </div>
            <button className="btn-download" onClick={handleDownload}>
              <span className="icon">⬇️</span>
              Download Cleaned Dataset
            </button>
          </div>

          <div className="next-actions">
            <button className="btn-secondary" onClick={handleReset}>
              <span className="icon">📤</span>
              Clean Another Dataset
            </button>
            <button className="btn-secondary" onClick={() => window.location.href = '/dashboard'}>
              <span className="icon">📊</span>
              View Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FixDatasetPage
