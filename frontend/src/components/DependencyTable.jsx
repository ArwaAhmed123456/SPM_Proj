import React from "react";
import "../styles/DependencyTable.css";

const DependencyTable = ({ results }) => {
  return (
    <div className="dependency-table-container">
      <table className="dependency-table">
        <thead>
          <tr className="table-header">
            <th>Name</th>
            <th>Current</th>
            <th>Latest</th>
            <th>Vulns</th>
            <th>Health</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {results.map((d, index) => (
            <tr key={`${d.name}-${index}`}>
              <td>{d.name}</td>
              <td>{d.version}</td>
              <td>{d.latestVersion}</td>
              <td>{d.vulnerabilities}</td>
              <td>{d.healthScore}</td>
              <td
                className={
                  d.riskLevel === "Low"
                    ? "risk-low"
                    : d.riskLevel === "Medium"
                    ? "risk-medium"
                    : "risk-high"
                }
              >
                {d.riskLevel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DependencyTable;
