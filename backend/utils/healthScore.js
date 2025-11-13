export const calculateHealthScore = (vulnerabilities, outdated) => {
  let score = 100;
  score -= vulnerabilities * 10;
  score -= outdated ? 5 : 0;
  return Math.max(score, 0);
};
