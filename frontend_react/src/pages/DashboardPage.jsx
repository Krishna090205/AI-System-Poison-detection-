import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import './DashboardPage.css'
import './DashboardTheme.css'

function DashboardPage() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, poisoned, suspicious, clean
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSample, setSelectedSample] = useState(null) // For detailed view
  const [showDetailModal, setShowDetailModal] = useState(false)

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/analysis_results')
      setResults(response.data)
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']

  const attackData = results?.attack_distribution
    ? Object.entries(results.attack_distribution).map(([name, value]) => ({
        name,
        value
      }))
    : []

  const scoreDistribution = results?.detailed_results
    ? [
        { name: 'Clean (0-0.3)', value: results.detailed_results.filter(r => r.poison_score < 0.3).length },
        { name: 'Suspicious (0.3-0.7)', value: results.detailed_results.filter(r => r.poison_score >= 0.3 && r.poison_score < 0.7).length },
        { name: 'Poisoned (0.7-1.0)', value: results.detailed_results.filter(r => r.poison_score >= 0.7).length }
      ]
    : []

  const getFilteredResults = () => {
    if (!results?.detailed_results) return []
    
    let filtered = results.detailed_results

    // Apply filter
    if (filter === 'poisoned') {
      filtered = filtered.filter(r => r.poison_score >= 0.7)
    } else if (filter === 'suspicious') {
      filtered = filtered.filter(r => r.poison_score >= 0.3 && r.poison_score < 0.7)
    } else if (filter === 'clean') {
      filtered = filtered.filter(r => r.poison_score < 0.3)
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.sample_id.toString().includes(searchTerm) ||
        r.poison_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const filteredResults = getFilteredResults()

  const openDetailModal = (sample) => {
    setSelectedSample(sample)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedSample(null)
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <span className="icon">📊</span>
            Analysis Dashboard
          </h1>
          <p className="subtitle">Research-level 7-model hybrid AI framework for poison detection</p>
        </div>
        <button className="btn-refresh" onClick={fetchResults}>
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading analysis results...</p>
        </div>
      )}

      {!loading && results?.summary && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-label">Total Samples</div>
                <div className="stat-value">{results.summary.total_samples}</div>
                <div className="stat-meta">{results.summary.models_used || 7} ML Models</div>
              </div>
            </div>
            
            <div className="stat-card poisoned">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <div className="stat-label">Poisoned</div>
                <div className="stat-value">{results.summary.poisoned_samples}</div>
                <div className="stat-percent">
                  {((results.summary.poisoned_samples / results.summary.total_samples) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="stat-card suspicious">
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <div className="stat-label">Suspicious</div>
                <div className="stat-value">{results.summary.suspicious_samples}</div>
                <div className="stat-percent">
                  {((results.summary.suspicious_samples / results.summary.total_samples) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="stat-card clean">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-label">Clean</div>
                <div className="stat-value">{results.summary.clean_samples}</div>
                <div className="stat-percent">
                  {((results.summary.clean_samples / results.summary.total_samples) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="stat-card high-risk">
              <div className="stat-icon">🔴</div>
              <div className="stat-info">
                <div className="stat-label">High Risk</div>
                <div className="stat-value">{results.summary.high_risk_samples || 0}</div>
                <div className="stat-percent">
                  {((results.summary.high_risk_samples || 0) / results.summary.total_samples * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="stat-card avg">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <div className="stat-label">Avg Poison Score</div>
                <div className="stat-value">{results.summary.avg_poison_score.toFixed(3)}</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Attack Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attackData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attackData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Poison Score Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </div>


          </div>

          {/* Results Table */}
          <div className="results-section">
            <div className="results-header">
              <h2>Detailed Results ({filteredResults.length} samples)</h2>
              <div className="results-controls">
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'poisoned' ? 'active' : ''}`}
                    onClick={() => setFilter('poisoned')}
                  >
                    Poisoned
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'suspicious' ? 'active' : ''}`}
                    onClick={() => setFilter('suspicious')}
                  >
                    Suspicious
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'clean' ? 'active' : ''}`}
                    onClick={() => setFilter('clean')}
                  >
                    Clean
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search by ID or type..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Row #</th>
                    <th>Poison Score</th>
                    <th>Poison Type</th>
                    <th>Problem Location</th>
                    <th>Quick Fix</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.slice(0, 50).map((result) => (
                    <tr key={result.sample_id} className={
                      result.poison_score >= 0.7 ? 'row-poisoned' :
                      result.poison_score >= 0.3 ? 'row-suspicious' : 'row-clean'
                    }>
                      <td className="td-id">
                        <strong>Row {result.row_number || result.sample_id + 1}</strong>
                      </td>
                      <td className="td-score">
                        <div className="score-badge" style={{
                          background: result.poison_score >= 0.7 ? '#ff4444' :
                                     result.poison_score >= 0.3 ? '#ffa500' : '#28a745'
                        }}>
                          {result.poison_score.toFixed(3)}
                        </div>
                      </td>
                      <td className="td-type">{result.poison_type}</td>
                      <td className="td-location">
                        {result.problem_location && result.problem_location.problematic_features && result.problem_location.problematic_features.length > 0 ? (
                          <div className="problem-features">
                            <span className="feature-count">
                              {result.problem_location.problematic_features.length} column(s)
                            </span>
                            <div className="feature-list">
                              {result.problem_location.problematic_features.slice(0, 3).map((feature, idx) => (
                                <span key={idx} className="feature-badge">{feature}</span>
                              ))}
                              {result.problem_location.problematic_features.length > 3 && (
                                <span className="feature-more">+{result.problem_location.problematic_features.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="no-issues">No specific issues</span>
                        )}
                      </td>
                      <td className="td-fix">{result.suggested_fix}</td>
                      <td className="td-details">
                        <button 
                          className="btn-view-details"
                          onClick={() => openDetailModal(result)}
                        >
                          View Fix Steps
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !results?.summary && (
        <div className="no-data-container">
          <div className="no-data-icon">📭</div>
          <h3>No Analysis Results Available</h3>
          <p>Upload a dataset and run analysis to see results here.</p>
          <button className="btn-upload" onClick={() => window.location.href = '/upload'}>
            Upload Dataset
          </button>
        </div>
      )}
      
      {/* Detailed Fix Modal */}
      {showDetailModal && selectedSample && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔍 Detailed Fix Instructions</h2>
              <button className="modal-close" onClick={closeDetailModal}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Sample Info */}
              <div className="detail-section">
                <h3>📍 Sample Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Row Number:</span>
                    <span className="info-value">Row {selectedSample.row_number || selectedSample.sample_id + 1}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Poison Score:</span>
                    <span className="info-value">{selectedSample.poison_score.toFixed(4)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Poison Type:</span>
                    <span className="info-value">{selectedSample.poison_type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Confidence:</span>
                    <span className="info-value">{((selectedSample.confidence_score || selectedSample.confidence) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Severity:</span>
                    <span className={`severity-badge severity-${selectedSample.detailed_fix?.severity || 'low'}`}>
                      {(selectedSample.detailed_fix?.severity || 'low').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Problem Location */}
              {selectedSample.problem_location && selectedSample.problem_location.problematic_features && selectedSample.problem_location.problematic_features.length > 0 && (
                <div className="detail-section">
                  <h3>📊 Problematic Columns</h3>
                  <div className="problem-columns">
                    {Object.entries(selectedSample.problem_location.feature_issues || {}).map(([feature, issue]) => (
                      <div key={feature} className="column-issue">
                        <div className="column-name">
                          <strong>{feature}</strong>
                          <span className="column-index">Column {issue.column_index}</span>
                        </div>
                        <div className="column-value">
                          Current Value: <code>{issue.value.toFixed(4)}</code>
                        </div>
                        <div className="column-problem">
                          {issue.issue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Scores Breakdown */}
              {selectedSample.model_scores && (
                <div className="detail-section">
                  <h3>🤖 Model Scores Breakdown</h3>
                  <div className="model-scores">
                    {Object.entries(selectedSample.model_scores).map(([model, score]) => (
                      <div key={model} className="model-score-item">
                        <span className="model-name">{model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                        <div className="score-bar-container">
                          <div className="score-bar" style={{width: `${score * 100}%`, background: score > 0.7 ? '#ff4444' : score > 0.3 ? '#ffa500' : '#28a745'}}></div>
                          <span className="score-value">{score.toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Fix Instructions */}
              {selectedSample.detailed_fix && (
                <div className="detail-section">
                  <h3>🔧 Step-by-Step Fix Instructions</h3>
                  <div className="fix-action">
                    <strong>Action Required:</strong> {selectedSample.detailed_fix.action}
                  </div>
                  <div className="fix-location">
                    <strong>Exact Location:</strong> {selectedSample.detailed_fix.exact_location}
                  </div>
                  {selectedSample.detailed_fix.affected_columns && selectedSample.detailed_fix.affected_columns.length > 0 && (
                    <div className="fix-columns">
                      <strong>Affected Columns:</strong> {selectedSample.detailed_fix.affected_columns.join(', ')}
                    </div>
                  )}
                  <div className="fix-steps">
                    <strong>Steps to Fix:</strong>
                    <ol>
                      {selectedSample.detailed_fix.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Original Values (if available) */}
              {selectedSample.original_values && (
                <div className="detail-section">
                  <h3>📋 Original Data Values</h3>
                  <div className="original-values">
                    <table className="values-table">
                      <thead>
                        <tr>
                          <th>Column</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedSample.original_values).slice(0, 10).map(([col, val]) => (
                          <tr key={col}>
                            <td><strong>{col}</strong></td>
                            <td><code>{typeof val === 'number' ? val.toFixed(4) : val}</code></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {Object.keys(selectedSample.original_values).length > 10 && (
                      <p className="values-note">Showing first 10 columns. Total: {Object.keys(selectedSample.original_values).length} columns</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-close-modal" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
