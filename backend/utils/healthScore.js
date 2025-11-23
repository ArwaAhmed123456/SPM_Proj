export const calculateHealthScore = (vulnerabilities, outdated) => {
  // Increase penalties so old/vulnerable packages are penalized more heavily.
  // - Each vulnerability reduces score by 12 points (was 10)
  // - Outdated packages reduce score by 10 points (was 5)
  let score = 100;
  const perVulnPenalty = 12;
  const outdatedPenalty = 8;

  score -= vulnerabilities * perVulnPenalty;
  score -= outdated ? outdatedPenalty : 0;
  return Math.max(score, 0);
};
