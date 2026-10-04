import { useState, useRef } from 'react'
import axios from 'axios'
import './UploadPage.css'
import './UploadTheme.css'

function UploadPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
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
      setResult(null)
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

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)
    setUploadProgress('Uploading dataset...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Step 1: Upload dataset
      console.log('📤 Uploading dataset...')
      setUploadProgress('📤 Uploading dataset to server...')
      
      const uploadResponse = await axios.post('http://localhost:8000/upload_dataset', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 second timeout
      })
      
      console.log('✅ Upload successful:', uploadResponse.data)
      const datasetId = uploadResponse.data.dataset_id
      
      // Step 2: Trigger analysis
      console.log('🤖 Starting analysis...')
      setUploadProgress('🤖 Running 7-model AI analysis (this may take a few moments)...')
      
      const analysisResponse = await axios.post(
        `http://localhost:8000/analyze_dataset/${datasetId}`,
        {},
        { timeout: 300000 } // 5 minute timeout for analysis
      )
      
      console.log('✅ Analysis complete:', analysisResponse.data)
      setUploadProgress('✅ Analysis complete!')
      
      setResult({
        ...uploadResponse.data,
        analysis: analysisResponse.data
      })
      
      // Show success message
      setTimeout(() => {
        alert('✅ Analysis complete! View detailed results in the Dashboard.')
      }, 500)
      
    } catch (err) {
      console.error('❌ Error:', err)
      
      let errorMessage = 'Upload or analysis failed. '
      
      if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. The dataset might be too large or complex.'
      } else if (err.response) {
        // Server responded with error
        errorMessage += err.response.data?.detail || err.response.statusText || 'Server error'
      } else if (err.request) {
        // Request made but no response
        errorMessage += 'No response from server. Please check if backend is running at http://localhost:8000'
      } else {
        // Other errors
        errorMessage += err.message || 'Unknown error occurred'
      }
      
      setError(errorMessage)
      setUploadProgress('')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="upload-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <span className="icon">📤</span>
            Upload Dataset
          </h1>
          <p className="subtitle">Upload your CSV or Excel dataset for poison detection analysis</p>
        </div>
      </div>

      <div className="upload-container">
        <div className="upload-card">
          <div 
            className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            
            {!file ? (
              <div className="dropzone-content">
                <div className="upload-icon-large">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3>Drag & Drop your file here</h3>
                <p className="or-text">or</p>
                <button className="btn-browse">Browse Files</button>
                <p className="file-types">Supported formats: CSV, XLSX, XLS</p>
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
                <button 
                  className="btn-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setResult(null)
                    setError(null)
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {file && (
            <button
              className={`btn-upload ${uploading ? 'uploading' : ''}`}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  {uploadProgress || 'Processing...'}
                </>
              ) : (
                <>
                  <span className="upload-icon">⬆️</span>
                  Upload & Analyze Dataset
                </>
              )}
            </button>
          )}
          
          {uploading && uploadProgress && (
            <div className="progress-message">
              {uploadProgress}
            </div>
          )}

          {result && (
            <div className="result-card success">
              <div className="result-header">
                <span className="result-icon">✅</span>
                <h3>Upload Successful!</h3>
              </div>
              <div className="result-details">
                <div className="detail-item">
                  <span className="detail-label">Dataset ID</span>
                  <span className="detail-value">{result.dataset_id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Samples</span>
                  <span className="detail-value">{result.num_samples}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Features</span>
                  <span className="detail-value">{result.num_features}</span>
                </div>
              </div>
              <button 
                className="btn-next"
                onClick={() => window.location.href = '/dashboard'}
              >
                View Dashboard →
              </button>
            </div>
          )}

          {error && (
            <div className="result-card error">
              <div className="result-header">
                <span className="result-icon">❌</span>
                <h3>Upload Failed</h3>
              </div>
              <p className="error-message">{error}</p>
              <button 
                className="btn-retry"
                onClick={() => {
                  setError(null)
                  setFile(null)
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="info-panel">
          <h3>📋 Upload Guidelines</h3>
          <ul className="guidelines-list">
            <li>
              <span className="check-icon">✓</span>
              <div>
                <strong>File Format:</strong> CSV or Excel (.xlsx, .xls)
              </div>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <div>
                <strong>Minimum Samples:</strong> At least 10 rows
              </div>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <div>
                <strong>Columns:</strong> Minimum 2 columns (features + label)
              </div>
            </li>
            <li>
              <span className="check-icon">✓</span>
              <div>
                <strong>File Size:</strong> Maximum 50MB
              </div>
            </li>
          </ul>

          <div className="info-box">
            <h4>🔒 Data Security</h4>
            <p>Your data is processed securely and stored in encrypted MongoDB Atlas database.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
