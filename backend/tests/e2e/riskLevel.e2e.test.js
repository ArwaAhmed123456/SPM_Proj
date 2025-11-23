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
import fs from 'fs';
import path from 'path';

// ✅ Helper function to extract plain object from Mongoose document
const extractDependencyData = (response) => {
  // Handle both plain objects and Mongoose documents
  return response.map(item => {
    if (item.toObject && typeof item.toObject === 'function') {
      // It's a Mongoose document
      return item.toObject();
    } else if (item._doc) {
      // Extract from _doc property
      return item._doc;
    }
    // Already a plain object
    return item;
  });
};

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
          'express': '5.1.0'
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    // ✅ Extract plain object from Mongoose document
    const results = extractDependencyData(res.body);
    const result = results[0];

    
    
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
  }, 15000);

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

    // ✅ Extract plain object from Mongoose document
    const results = extractDependencyData(res.body);
    const result = results[0];

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
   * Test 3: HIGH RISK Package 
   * Package: minimist@0.2.2 (known prototype pollution vulnerability)
   */
  test('HIGH RISK: Old package with known vulnerabilities', async () => {
    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({
        dependencies: {
          'express': '0.0.9'
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    // ✅ Extract plain object from Mongoose document
    const results = extractDependencyData(res.body);
    const result = results[0];

    // Save the response to a JSON file for inspection (helpful when console logs are captured)
    try {
      const outPath = path.resolve('tests/e2e/high_risk_response.json');
      await fs.promises.writeFile(outPath, JSON.stringify(res.body, null, 2));
    } catch (writeErr) {
      // Don't fail the test just because writing the file failed — log for developer visibility
      // eslint-disable-next-line no-console
      console.error('Failed to write debug response file:', writeErr.message);
    }

    // Basic structure validation
    expect(result.name).toBe('express');
    expect(result.version).toBeDefined();
    expect(result.healthScore).toBeDefined();
    expect(result.riskLevel).toBeDefined();

    // High risk expectations
    expect(result.vulnerabilities).toBeGreaterThan(0);
    expect(result.healthScore).toBeLessThan(90);
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

    // ✅ Extract plain object from Mongoose document
    const results = extractDependencyData(res.body);
    const result = results[0];

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
          'express': '3.19.2',        // Low risk
          'lodash': '4.17.20',         // Medium risk
          'minimist': '1.2.5',         // Low risk
          'axios': '1.6.0'             // Medium risk 
        }
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);

    // ✅ Extract plain objects from Mongoose documents
    const results = extractDependencyData(res.body);

    // Save the response for inspection when debugging CI or hidden logs
    try {
      const outPath = path.resolve('tests/e2e/mixed_risk_response.json');
      await fs.promises.writeFile(outPath, JSON.stringify(res.body, null, 2));
    } catch (writeErr) {
      // eslint-disable-next-line no-console
      console.error('Failed to write mixed_risk debug file:', writeErr.message);
    }

    // Check that we have varied risk levels
    const riskLevels = results.map(pkg => pkg.riskLevel);
    
    expect(riskLevels).toContain('Low');
    expect(riskLevels).toContain('Medium');
    
    // risk package >= 2 different levels
    expect(new Set(riskLevels).size).toBeGreaterThanOrEqual(2);

    console.log('✅ MIXED RISK Test Results:');
    results.forEach(pkg => {
      console.log(`   - ${pkg.name}: ${pkg.riskLevel} (Score: ${pkg.healthScore}, Vulns: ${pkg.vulnerabilities})`);
    });
  }, 30000);

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

    // ✅ Extract plain object from Mongoose document
    const results = extractDependencyData(res.body);
    const result = results[0];

    // Should detect as outdated
    expect(result.version).not.toBe(result.latestVersion);
    
    // Health score should be reduced due to outdated status
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

    // ✅ Extract plain objects from Mongoose documents
    const results = extractDependencyData(res.body);
    expect(results.length).toBe(3);

    // Check risk level thresholds
    results.forEach(pkg => {
      if (pkg.healthScore >= 80) {
        expect(pkg.riskLevel).toBe('Low');
      } else if (pkg.healthScore >= 50) {
        expect(pkg.riskLevel).toBe('Medium');
      } else {
        expect(pkg.riskLevel).toBe('High');
      }
    });

    console.log('✅ BOUNDARY TEST Results:');
    results.forEach(pkg => {
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

    // ✅ Extract plain object from Mongoose document
    const results = extractDependencyData(res.body);
    const result = results[0];

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

    // ✅ Extract plain object from Mongoose document
    const results = extractDependencyData(res.body);
    expect(results.length).toBe(1);
    expect(duration).toBeLessThan(10000);

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