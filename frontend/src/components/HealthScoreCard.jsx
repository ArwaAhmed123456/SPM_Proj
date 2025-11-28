import React, { useState } from "react";
import "../styles/HealthScoreCard.css";

const HealthScoreCard = ({ results, overallHealthScore, onRefreshAnalysis }) => {
  const [showDetails, setShowDetails] = useState(false);
  const avg = overallHealthScore || (
    results.reduce((sum, r) => sum + r.healthScore, 0) / results.length
  ).toFixed(1);

  const riskLevel = avg >= 80 ? "low-risk" : avg >= 50 ? "medium-risk" : "high-risk";
  const statusText = avg >= 80 ? "Healthy" : avg >= 50 ? "Needs Attention" : "Critical";

  return (
    <div className="health-score-card-container">
      <div className="health-card-header">
        <div>
          <h2 className="health-card-title">
            <span className="title-icon">🏥</span>
            Overall Health Score
          </h2>
          <p className="health-card-subtitle">Dependency Health Analysis</p>
        </div>
      </div>

      <div className="health-score-main">
        <div className="score-circle-container">
          <svg className="score-circle" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="lowRiskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="mediumRiskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="highRiskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            <circle
              className="score-circle-bg"
              cx="60"
              cy="60"
              r="54"
            />
            <circle
              className={`score-circle-progress ${riskLevel}`}
              cx="60"
              cy="60"
              r="54"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - avg / 100)}`}
            />
          </svg>
          <div className="score-center-content">
            <div className={`score-number ${riskLevel}`}>{avg}%</div>
            <div className="score-label">Health Score</div>
          </div>
        </div>

        <div className="score-info">
          <div className={`score-status ${riskLevel}`}>
            <span className="status-icon">
              {avg >= 80 ? "✅" : avg >= 50 ? "⚠️" : "🚨"}
            </span>
            {statusText}
          </div>
          <p className="score-description">
            {avg >= 80
              ? "Your dependencies are in good health with minimal security risks."
              : avg >= 50
              ? "Some dependencies need attention. Consider updating vulnerable packages."
              : "Critical security issues detected. Immediate action required."
            }
          </p>
          <div className="score-recommendation">
            <div className="recommendation-title">Recommendation</div>
            <div className="recommendation-text">
              {avg >= 80
                ? "Keep monitoring for new vulnerabilities and update dependencies regularly."
                : avg >= 50
                ? "Review and update high-risk dependencies. Run security audits frequently."
                : "Immediately update critical dependencies and implement security patches."
              }
            </div>
          </div>
        </div>
      </div>

      <div className="health-metrics">
        <div className="metric-item">
          <div className="metric-label">
            
            Total Dependencies
          </div>
          <div className="metric-value">{results.length}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">
            
            Vulnerabilities
          </div>
          <div className="metric-value">
            {results.reduce((sum, r) => sum + r.vulnerabilities, 0)}
          </div>
        </div>
        <div className="metric-item">
          <div className="metric-label">
            
            Outdated
          </div>
          <div className="metric-value">
            {results.filter(r => r.version !== r.latestVersion).length}
          </div>
        </div>
      </div>

      <div className="health-card-actions">
        <button
          className="health-action-btn primary"
          onClick={onRefreshAnalysis}
        >
          Refresh Analysis
        </button>
        <button
          className="health-action-btn secondary"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {showDetails && (
        <div className="detailed-metrics">
          <h4>Detailed Health Metrics</h4>
          <div className="detailed-metrics-grid">
            <div className="detailed-metric">
              <span className="metric-label">Average Health Score:</span>
              <span className="metric-value">{avg}%</span>
            </div>
            <div className="detailed-metric">
              <span className="metric-label">Total Dependencies:</span>
              <span className="metric-value">{results.length}</span>
            </div>
            <div className="detailed-metric">
              <span className="metric-label">High Risk Dependencies:</span>
              <span className="metric-value">
                {results.filter(r => r.riskLevel === 'High').length}
              </span>
            </div>
            <div className="detailed-metric">
              <span className="metric-label">Medium Risk Dependencies:</span>
              <span className="metric-value">
                {results.filter(r => r.riskLevel === 'Medium').length}
              </span>
            </div>
            <div className="detailed-metric">
              <span className="metric-label">Low Risk Dependencies:</span>
              <span className="metric-value">
                {results.filter(r => r.riskLevel === 'Low').length}
              </span>
            </div>
            <div className="detailed-metric">
              <span className="metric-label">Total Vulnerabilities:</span>
              <span className="metric-value">
                {results.reduce((sum, r) => sum + r.vulnerabilities, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthScoreCard;
