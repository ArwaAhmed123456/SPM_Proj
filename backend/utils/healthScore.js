

export const calculateHealthScore = (vulnerabilities, outdated) => {
  let score = 100;

  // Increase penalty per vulnerability
  score -= vulnerabilities * 15;

  // Increase penalty if outdated
  score -= outdated ? 10 : 0;

  // Cap minimum score at 0
  return Math.max(score, 0);
};
