import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './HistoryPage.css'
import './HistoryTheme.css'

function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/history?limit=200')
      const allHistory = response.data.history || []

      // Preserve all historical runs chronologically (newest first)
      const sortedHistory = [...allHistory].sort((a, b) => 
        new Date(b.analysis_time || 0) - new Date(a.analysis_time || 0)
      )

      setHistory(sortedHistory)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewDetails = (result) => {
    setSelectedResult(result)
  }

  const getRiskLevel = (score) => {
    if (score >= 0.7) return 'high-risk'
    if (score >= 0.3) return 'medium-risk'
    return 'low-risk'
  }

  const getRiskLabel = (score) => {
    if (score >= 0.7) return 'High Risk'
    if (score >= 0.3) return 'Medium Risk'
    return 'Low Risk'
  }

  const openInDashboard = (analysisId) => {
    if (analysisId) {
      navigate(`/dashboard?id=${analysisId}`)
    } else {
      navigate('/dashboard')
    }
  }

  const downloadPdf = (analysisId) => {
    window.open(`http://localhost:8000/download_report/${analysisId}?format=pdf`, '_blank')
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <span className="icon">📋</span>
            Analysis History
          </h1>
          <p className="subtitle">View past analyses and dataset quality reports</p>
        </div>
        <button className="btn-refresh" onClick={fetchHistory}>
          <span className="icon">🔄</span>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="no-data">
          <div className="no-data-icon">📭</div>
          <h3>No Analysis History</h3>
          <p>Upload and analyze datasets to see history here.</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="history-container">
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Date & Time</th>
                  <th>Total Samples</th>
                  <th>Poisoned</th>
                  <th>Suspicious</th>
                  <th>Clean</th>
                  <th>Avg Score</th>
                  <th>Risk Level</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={item.analysis_id || idx}>
                    <td className="dataset-name">
                      <span className="file-icon">📄</span>
                      {item.dataset_name}
                    </td>
                    <td className="date-time">
                      {item.analysis_time ? new Date(item.analysis_time).toLocaleString() : 'Recent'}
                    </td>
                    <td className="text-center">{item.total_samples}</td>
                    <td className="text-center poisoned-count">
                      {item.poisoned_samples}
                      {item.total_samples > 0 && item.poisoned_samples > 0 && (
                        <span className="percentage">
                          ({((item.poisoned_samples / item.total_samples) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="text-center suspicious-count">
                      {item.suspicious_samples}
                      {item.total_samples > 0 && item.suspicious_samples > 0 && (
                        <span className="percentage">
                          ({((item.suspicious_samples / item.total_samples) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="text-center clean-count">
                      {item.clean_samples}
                    </td>
                    <td className="text-center score-cell">
                      <span className={`score-badge ${getRiskLevel(item.avg_poison_score)}`}>
                        {item.avg_poison_score?.toFixed(3)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`risk-badge ${getRiskLevel(item.avg_poison_score)}`}>
                        {getRiskLabel(item.avg_poison_score)}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          className="btn-view"
                          style={{ background: 'var(--gradient-primary)', color: 'white', border: 'none' }}
                          onClick={() => openInDashboard(item.analysis_id)}
                          title="Open in Dashboard"
                        >
                          📊 Dashboard
                        </button>
                        <button
                          className="btn-view"
                          onClick={() => viewDetails(item)}
                          title="View Details"
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn-view"
                          style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}
                          onClick={() => downloadPdf(item.analysis_id)}
                          title="Download PDF"
                        >
                          📄 PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedResult && (
        <div className="modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Analysis Details</h2>
              <button className="btn-close" onClick={() => setSelectedResult(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Dataset Name</span>
                  <span className="detail-value">{selectedResult.dataset_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Analysis Date</span>
                  <span className="detail-value">
                    {selectedResult.analysis_time ? new Date(selectedResult.analysis_time).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Samples</span>
                  <span className="detail-value">{selectedResult.total_samples}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Poisoned Samples</span>
                  <span className="detail-value poisoned-text">
                    {selectedResult.poisoned_samples}
                    {selectedResult.total_samples > 0 && (
                      ` (${((selectedResult.poisoned_samples / selectedResult.total_samples) * 100).toFixed(1)}%)`
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Suspicious Samples</span>
                  <span className="detail-value suspicious-text">
                    {selectedResult.suspicious_samples}
                    {selectedResult.total_samples > 0 && (
                      ` (${((selectedResult.suspicious_samples / selectedResult.total_samples) * 100).toFixed(1)}%)`
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Clean Samples</span>
                  <span className="detail-value clean-text">
                    {selectedResult.clean_samples}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Average Poison Score</span>
                  <span className={`detail-value score-badge ${getRiskLevel(selectedResult.avg_poison_score)}`}>
                    {selectedResult.avg_poison_score?.toFixed(4)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Risk Level</span>
                  <span className={`detail-value risk-badge ${getRiskLevel(selectedResult.avg_poison_score)}`}>
                    {getRiskLabel(selectedResult.avg_poison_score)}
                  </span>
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const id = selectedResult.analysis_id
                    setSelectedResult(null)
                    openInDashboard(id)
                  }}
                >
                  📊 Open in Dashboard
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => downloadPdf(selectedResult.analysis_id)}
                >
                  📄 Download PDF
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedResult(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
