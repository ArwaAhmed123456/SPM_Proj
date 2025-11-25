import React from 'react';
import HealthScoreCard from './HealthScoreCard';
import DependencyTable from './DependencyTable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Dashboard = ({ results }) => {
  // CSV export
  const exportToCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Name,Current,Latest,Vulns,Health,Risk\n' +
      results.map(dep =>
        `${dep.name},${dep.version},${dep.latestVersion},${dep.vulnerabilities},${dep.healthScore},${dep.riskLevel}`
      ).join('\n');
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
    const tableColumn = ['Name', 'Current', 'Latest', 'Vulns', 'Health', 'Risk'];
    const tableRows = [];

    results.forEach(dep => {
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
    });

    doc.save('dependency-report.pdf');
  };

  return (
    <div className="dashboard">
      <div className="export-buttons">
        <button onClick={exportToCSV} className="export-btn csv-btn">Export to CSV</button>
        <button onClick={exportToPDF} className="export-btn pdf-btn">Export to PDF</button>
      </div>
      <HealthScoreCard results={results} />
      <DependencyTable results={results} />
    </div>
  );
};

export default Dashboard;
