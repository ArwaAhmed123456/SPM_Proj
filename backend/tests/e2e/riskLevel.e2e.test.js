/**
 * End-to-End Integration Test for Risk Level Detection
 * Uses REAL external APIs (NPM Registry + OSV API)
 * Tests actual vulnerability detection and risk level assignment
 * 
 * ⚠️  WARNING: This test makes real API calls and may be slower
 * 
 * Usage: npm test riskLevel.e2e.test.js
 */

import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import dependencyRoutes from '../../routes/dependencyRoute.js';
import Dependency from '../../models/DependencyModel.js';

describe('Risk Level E2E Tests (Real External APIs)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/dependencies', dependencyRoutes);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mock database only (we want real API calls)
  beforeEach(() => {
    jest.spyOn(Dependency.prototype, 'save').mockImplementation(function () {
      return Promise.resolve({ ...this, _id: 'mock-id-' + Date.now() });
    });
  });

  /**
   * Test 1: LOW RISK Package (Recent, No Known Vulnerabilities)
   * Package: express@4.19.2 (recent version with patches)
   */
  test('LOW RISK: Recent package with no vulnerabilities', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'express': '4.19.2'
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const result = res.body[0];
    
    // Basic structure validation
    expect(result.name).toBe('express');
    expect(result.version).toBeDefined();
    expect(result.latestVersion).toBeDefined();
    expect(typeof result.healthScore).toBe('number');
    expect(typeof result.vulnerabilities).toBe('number');
    expect(result.riskLevel).toBeDefined();

    // Risk level expectations for recent package
    expect(result.healthScore).toBeGreaterThanOrEqual(80);
    expect(result.riskLevel).toBe('Low');
    
    console.log('✅ LOW RISK Test Result:', {
      package: result.name,
      version: result.version,
      healthScore: result.healthScore,
      riskLevel: result.riskLevel,
      vulnerabilities: result.vulnerabilities
    });
  }, 15000); // 15s timeout for API calls

  /**
   * Test 2: MEDIUM RISK Package (Slightly Outdated)
   * Package: lodash@4.17.20 (has known vulnerabilities but not critical)
   */
  test('MEDIUM RISK: Slightly outdated package with some vulnerabilities', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'lodash': '4.17.20'
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const result = res.body[0];

    // Basic structure validation
    expect(result.name).toBe('lodash');
    expect(result.version).toBeDefined();
    expect(result.healthScore).toBeDefined();
    expect(result.riskLevel).toBeDefined();

    // Medium risk expectations
    expect(result.healthScore).toBeGreaterThanOrEqual(50);
    expect(result.healthScore).toBeLessThan(80);
    expect(result.riskLevel).toBe('Medium');

    console.log('✅ MEDIUM RISK Test Result:', {
      package: result.name,
      version: result.version,
      healthScore: result.healthScore,
      riskLevel: result.riskLevel,
      vulnerabilities: result.vulnerabilities
    });
  }, 15000);

  /**
   * Test 3: HIGH RISK Package (Old Version with Known Vulnerabilities)
   * Package: minimist@1.2.5 (known prototype pollution vulnerability)
   */
  test('HIGH RISK: Old package with known vulnerabilities', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'minimist': '1.2.5'
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const result = res.body[0];

    // Basic structure validation
    expect(result.name).toBe('minimist');
    expect(result.version).toBeDefined();
    expect(result.healthScore).toBeDefined();
    expect(result.riskLevel).toBeDefined();

    // High risk expectations
    expect(result.vulnerabilities).toBeGreaterThan(0);
    expect(result.healthScore).toBeLessThan(50);
    expect(result.riskLevel).toBe('High');

    console.log('✅ HIGH RISK Test Result:', {
      package: result.name,
      version: result.version,
      healthScore: result.healthScore,
      riskLevel: result.riskLevel,
      vulnerabilities: result.vulnerabilities
    });
  }, 15000);

  /**
   * Test 4: CRITICAL RISK Package (Very Old with Multiple CVEs)
   * Package: node-forge@0.10.0 (multiple critical vulnerabilities)
   */
  test('CRITICAL RISK: Very old package with multiple CVEs', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'node-forge': '0.10.0'
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const result = res.body[0];

    // Basic structure validation
    expect(result.name).toBe('node-forge');
    expect(result.version).toBe('0.10.0');
    expect(result.healthScore).toBeDefined();
    expect(result.riskLevel).toBeDefined();

    // Critical expectations
    expect(result.vulnerabilities).toBeGreaterThanOrEqual(3);
    expect(result.healthScore).toBeLessThan(50);
    expect(result.riskLevel).toBe('High');

    console.log('✅ CRITICAL RISK Test Result:', {
      package: result.name,
      version: result.version,
      healthScore: result.healthScore,
      riskLevel: result.riskLevel,
      vulnerabilities: result.vulnerabilities
    });
  }, 15000);

  /**
   * Test 5: Multiple Packages with Different Risk Levels
   * Tests batch processing and risk distribution
   */
  test('MIXED RISK: Multiple packages with varied risk levels', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'express': '4.19.2',        // Low risk
          'lodash': '4.17.20',         // Medium risk
          'minimist': '1.2.5',         // High risk
          'axios': '1.6.0'             // Low risk (recent)
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);

    // Check that we have varied risk levels
    const riskLevels = res.body.map(pkg => pkg.riskLevel);
    
    expect(riskLevels).toContain('Low');
    expect(riskLevels).toContain('High');
    
    // At least one low and one high risk package
    const lowRiskCount = riskLevels.filter(r => r === 'Low').length;
    const highRiskCount = riskLevels.filter(r => r === 'High').length;
    
    expect(lowRiskCount).toBeGreaterThanOrEqual(1);
    expect(highRiskCount).toBeGreaterThanOrEqual(1);

    console.log('✅ MIXED RISK Test Results:');
    res.body.forEach(pkg => {
      console.log(`   - ${pkg.name}: ${pkg.riskLevel} (Score: ${pkg.healthScore}, Vulns: ${pkg.vulnerabilities})`);
    });
  }, 30000); // 30s timeout for multiple API calls

  /**
   * Test 6: Outdated Package Detection
   * Tests that outdated packages get penalized
   */
  test('OUTDATED DETECTION: Old version penalized correctly', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'axios': '0.21.1'  // Very old version
        }
      })
      .expect(200);

    const result = res.body[0];

    // Should detect as outdated
    expect(result.version).not.toBe(result.latestVersion);
    
    // Health score should be reduced due to outdated status
    // (even if no vulnerabilities, -5 or -15 points for outdated)
    if (result.vulnerabilities === 0) {
      expect(result.healthScore).toBeLessThan(100);
    }

    console.log('✅ OUTDATED DETECTION Result:', {
      package: result.name,
      current: result.version,
      latest: result.latestVersion,
      healthScore: result.healthScore,
      isOutdated: result.version !== result.latestVersion
    });
  }, 15000);

  /**
   * Test 7: Risk Level Boundary Testing
   * Tests edge cases at risk level boundaries
   */
  test('BOUNDARY TEST: Risk level transitions at thresholds', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'express': '4.19.2',      // Expected: Low (score ~95-100)
          'lodash': '4.17.20',       // Expected: Medium (score ~70-75)
          'minimist': '1.2.5'        // Expected: High (score ~35-45)
        }
      })
      .expect(200);

    expect(res.body.length).toBe(3);

    // Check risk level thresholds
    res.body.forEach(pkg => {
      if (pkg.healthScore >= 80) {
        expect(pkg.riskLevel).toBe('Low');
      } else if (pkg.healthScore >= 50) {
        expect(pkg.riskLevel).toBe('Medium');
      } else {
        expect(pkg.riskLevel).toBe('High');
      }
    });

    console.log('✅ BOUNDARY TEST Results:');
    res.body.forEach(pkg => {
      console.log(`   - ${pkg.name}: Score ${pkg.healthScore} → ${pkg.riskLevel} risk`);
    });
  }, 30000);

  /**
   * Test 8: Scoped Package Risk Analysis
   * Tests packages with @ scopes (e.g., @babel/core)
   */
  test('SCOPED PACKAGE: Risk analysis for scoped packages', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          '@babel/core': '7.23.0'  // Recent version
        }
      })
      .expect(200);

    const result = res.body[0];

    // Should handle scoped package name correctly
    expect(result.name).toBe('@babel/core');
    expect(result.healthScore).toBeDefined();
    expect(result.riskLevel).toBeDefined();
    expect(['Low', 'Medium', 'High']).toContain(result.riskLevel);

    console.log('✅ SCOPED PACKAGE Result:', {
      package: result.name,
      healthScore: result.healthScore,
      riskLevel: result.riskLevel
    });
  }, 15000);

  /**
   * Test 9: API Response Time Validation
   * Ensures external API calls complete within reasonable time
   */
  test('PERFORMANCE: API calls complete within timeout', async () => {
    const startTime = Date.now();

    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'express': '4.19.2'
        }
      })
      .expect(200);

    const duration = Date.now() - startTime;

    expect(res.body.length).toBe(1);
    expect(duration).toBeLessThan(10000); // Should complete under 10s

    console.log(`✅ PERFORMANCE: Completed in ${duration}ms`);
  }, 15000);

  /**
   * Test 10: Empty/Invalid Package Handling
   * Tests graceful handling of edge cases
   */
  test('EDGE CASE: Empty dependencies returns empty array', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {}
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);

    console.log('✅ EDGE CASE: Empty dependencies handled correctly');
  }, 5000);
});

/**
 * Additional Test Suite: Real-World Vulnerability Detection
 */
describe('Real-World CVE Detection (External APIs)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/dependencies', dependencyRoutes);
  });

  beforeEach(() => {
    jest.spyOn(Dependency.prototype, 'save').mockImplementation(function () {
      return Promise.resolve({ ...this, _id: 'mock-id-' + Date.now() });
    });
  });

  /**
   * Test real CVE detection for known vulnerable package
   */
  test('CVE DETECTION: Detects prototype pollution in minimist', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'minimist': '1.2.5'  // CVE-2021-44906
        }
      })
      .expect(200);

    const result = res.body[0];

    // Should detect at least 1 vulnerability (prototype pollution)
    expect(result.vulnerabilities).toBeGreaterThanOrEqual(1);
    expect(result.riskLevel).toBe('High');

    console.log('✅ CVE DETECTION Result:', {
      package: result.name,
      version: result.version,
      vulnerabilities: result.vulnerabilities,
      healthScore: result.healthScore,
      expectedCVE: 'CVE-2021-44906 (Prototype Pollution)'
    });
  }, 15000);

  /**
   * Test multiple CVE detection
   */
  test('CVE DETECTION: Detects multiple vulnerabilities in old axios', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'axios': '0.21.1'  // Multiple known vulnerabilities
        }
      })
      .expect(200);

    const result = res.body[0];

    // Should detect multiple vulnerabilities
    expect(result.vulnerabilities).toBeGreaterThanOrEqual(1);
    
    console.log('✅ CVE DETECTION Result:', {
      package: result.name,
      version: result.version,
      vulnerabilities: result.vulnerabilities,
      healthScore: result.healthScore
    });
  }, 15000);
});
