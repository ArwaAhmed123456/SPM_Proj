import React from 'react';
import HealthScoreCard from './HealthScoreCard';
import DependencyTable from './DependencyTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/Dashboard.css';

const Dashboard = ({ results, onRefreshAnalysis }) => {
  // CSV export
  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,File,Name,Current,Latest,Vulns,Health,Risk\n';
    results.forEach(fileResult => {
      fileResult.dependencies.forEach(dep => {
        csvContent += `${fileResult.fileName},${dep.name},${dep.version},${dep.latestVersion},${dep.vulnerabilities},${dep.healthScore},${dep.riskLevel}\n`;
      });
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'dependency-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF export
  const exportToPDF = () => {
    const doc = new jsPDF();
    results.forEach((fileResult, index) => {
      if (index > 0) doc.addPage();
      doc.text(`File: ${fileResult.fileName}`, 14, 20);
      const tableColumn = ['Name', 'Current', 'Latest', 'Vulns', 'Health', 'Risk'];
      const tableRows = [];

      fileResult.dependencies.forEach(dep => {
        const depData = [
          dep.name,
          dep.version,
          dep.latestVersion,
          dep.vulnerabilities,
          dep.healthScore,
          dep.riskLevel,
        ];
        tableRows.push(depData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
      });
    });

    doc.save('dependency-report.pdf');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
        
          Dependency Analysis Dashboard
        </h1>
        <p className="dashboard-subtitle">Comprehensive dependency health and security analysis</p>
        <div className="dashboard-meta">
          <span className="last-updated">
            <span>🕒</span>
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      <div className="quick-actions-bar">
        <div className="action-buttons">
          <button onClick={exportToCSV} className="quick-action-btn primary">
            <span>📄</span>
            Export CSV
          </button>
          <button onClick={exportToPDF} className="quick-action-btn secondary">
            <span>📕</span>
            Export PDF
          </button>
        </div>
      </div>

      {results.map((fileResult, index) => (
        <div key={index} className="file-analysis-section">
          <h3 className="file-name">{fileResult.fileName}</h3>
          <HealthScoreCard
            results={fileResult.dependencies}
            overallHealthScore={fileResult.overallHealthScore}
            onRefreshAnalysis={onRefreshAnalysis}
          />

          <div className="top-dependencies-card">
            <div className="card-header">
              <h3 className="card-title">
                <span>📋</span>
                Dependency Details
              </h3>
            </div>
            <div className="card-body">
              <DependencyTable results={fileResult.dependencies} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
