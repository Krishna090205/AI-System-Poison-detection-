import { useState, useEffect } from 'react'
import axios from 'axios'
import './HistoryPage.css'
import './HistoryTheme.css'

function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/history')
      const allHistory = response.data.history || []
      
      // Group by dataset_name and keep only the latest analysis for each file
      const uniqueFiles = {}
      allHistory.forEach(item => {
        const fileName = item.dataset_name
        // If file not seen yet, or this analysis is more recent, keep it
        if (!uniqueFiles[fileName] || 
            new Date(item.analysis_time) > new Date(uniqueFiles[fileName].analysis_time)) {
          uniqueFiles[fileName] = item
        }
      })
      
      // Convert back to array and sort by date (most recent first)
      const uniqueHistory = Object.values(uniqueFiles).sort((a, b) => 
        new Date(b.analysis_time) - new Date(a.analysis_time)
      )
      
      setHistory(uniqueHistory)
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.analysis_id}>
                    <td className="dataset-name">
                      <span className="file-icon">📄</span>
                      {item.dataset_name}
                    </td>
                    <td className="date-time">
                      {new Date(item.analysis_time).toLocaleString()}
                    </td>
                    <td className="text-center">{item.total_samples}</td>
                    <td className="text-center poisoned-count">
                      {item.poisoned_samples}
                      {item.poisoned_samples > 0 && (
                        <span className="percentage">
                          ({((item.poisoned_samples / item.total_samples) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="text-center suspicious-count">
                      {item.suspicious_samples}
                      {item.suspicious_samples > 0 && (
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
                      <button 
                        className="btn-view" 
                        onClick={() => viewDetails(item)}
                        title="View Details"
                      >
                        👁️ View
                      </button>
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
                    {new Date(selectedResult.analysis_time).toLocaleString()}
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
                    ({((selectedResult.poisoned_samples / selectedResult.total_samples) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Suspicious Samples</span>
                  <span className="detail-value suspicious-text">
                    {selectedResult.suspicious_samples}
                    ({((selectedResult.suspicious_samples / selectedResult.total_samples) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Clean Samples</span>
                  <span className="detail-value clean-text">
                    {selectedResult.clean_samples}
                    ({((selectedResult.clean_samples / selectedResult.total_samples) * 100).toFixed(1)}%)
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

              <div className="modal-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    window.location.href = '/fix-dataset?analysis_id=' + selectedResult.analysis_id
                  }}
                >
                  🔧 Fix This Dataset
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    window.location.href = '/dashboard'
                  }}
                >
                  📊 View Dashboard
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
