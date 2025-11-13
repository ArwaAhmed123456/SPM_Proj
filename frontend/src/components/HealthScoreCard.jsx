import React from "react";
import "../styles/HealthScoreCard.css";

const HealthScoreCard = ({ results }) => {
  const avg = (
    results.reduce((sum, r) => sum + r.healthScore, 0) / results.length
  ).toFixed(1);

  return (
    <div className="health-score-card">
      <h2 className="health-score-title">Overall Health Score</h2>
      <p
        className={`health-score-value ${
          avg >= 80 ? "health-score-low" : avg >= 50 ? "health-score-medium" : "health-score-high"
        }`}
      >
        {avg}%
      </p>
    </div>
  );
};

export default HealthScoreCard;
