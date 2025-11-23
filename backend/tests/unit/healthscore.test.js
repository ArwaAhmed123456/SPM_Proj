import { calculateHealthScore } from '../../utils/healthScore.js';

describe('calculateHealthScore', () => {
  test('no vulnerabilities and up-to-date returns 100', () => {
    expect(calculateHealthScore(0, false)).toBe(100);
  });

  test('vulnerabilities reduce score correctly', () => {
    // vulnerabilities * 12 subtracted, outdated subtracts 8 in utils
    expect(calculateHealthScore(2, true)).toBe(68); // 100 - 24 - 8
  });

  test('score never goes below 0', () => {
    expect(calculateHealthScore(100, true)).toBeGreaterThanOrEqual(0);
  });
});

describe('risk level derivation (helper in tests)', () => {
  const getRiskLevel = (healthScore) =>
    healthScore >= 80 ? 'Low' : healthScore >= 50 ? 'Medium' : 'High';

  test('low risk for high score', () => {
    expect(getRiskLevel(90)).toBe('Low');
  });

  test('medium risk for mid score', () => {
    expect(getRiskLevel(65)).toBe('Medium');
  });

  test('high risk for low score', () => {
    expect(getRiskLevel(30)).toBe('High');
  });
});
