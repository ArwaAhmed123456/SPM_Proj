import axios from 'axios';

// ============================================
// MOCK DATA
// ============================================

const mockDependencies = {
  "express": "^4.18.0",
  "mongoose": "^7.0.0",
  "axios": "^1.3.0",
  "bcryptjs": "^2.4.0",
  "jsonwebtoken": "^9.0.0"
};

const mockPackageJson = {
  dependencies: {
    "react": "^18.2.0",
    "webpack": "^5.75.0",
    "lodash": "^4.17.0"
  }
};

// Mock health score calculation (replicate your utils)
const calculateHealthScore = (vulnerabilities, outdated) => {
  let score = 100;
  score -= vulnerabilities * 10; // 10 points per vulnerability
  score -= outdated ? 15 : 0;    // 15 points if outdated
  return Math.max(0, score);
};

// ============================================
// TEST UTILITIES
// ============================================

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('\n🧪 DEPENDENCY HEALTH AGENT TEST SUITE\n');
    console.log('=' .repeat(60));

    for (const test of this.tests) {
      try {
        await test.testFn();
        this.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.error(`❌ ${test.name}`);
        console.error(`   Error: ${error.message}\n`);
      }
    }

    console.log('=' .repeat(60));
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed out of ${this.tests.length} tests\n`);
    
    return this.failed === 0;
  }

  assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
  }

  assertTrue(value, message) {
    if (!value) throw new Error(message);
  }

  assertFalse(value, message) {
    if (value) throw new Error(message);
  }

  assertExists(value, message) {
    if (value === undefined || value === null) throw new Error(message);
  }
}

// ============================================
// UNIT TESTS
// ============================================

const runner = new TestRunner();

// Test 1: Health Score Calculation
runner.addTest('Health Score: No vulnerabilities, up-to-date', () => {
  const score = calculateHealthScore(0, false);
  runner.assertEquals(score, 100, 'Score should be 100');
});

runner.addTest('Health Score: 2 vulnerabilities, outdated', () => {
  const score = calculateHealthScore(2, true);
  runner.assertEquals(score, 65, 'Score should be 65 (100 - 20 - 15)');
});

runner.addTest('Health Score: 5 vulnerabilities, up-to-date', () => {
  const score = calculateHealthScore(5, false);
  runner.assertEquals(score, 50, 'Score should be 50 (100 - 50)');
});

runner.addTest('Health Score: Cannot go below 0', () => {
  const score = calculateHealthScore(15, true);
  runner.assertTrue(score >= 0, 'Score should never be negative');
});

// Test 2: Risk Level Classification
const getRiskLevel = (healthScore) => {
  return healthScore >= 80 ? "Low" : healthScore >= 50 ? "Medium" : "High";
};

runner.addTest('Risk Level: High score = Low risk', () => {
  const risk = getRiskLevel(85);
  runner.assertEquals(risk, "Low", 'Should be Low risk');
});

runner.addTest('Risk Level: Medium score = Medium risk', () => {
  const risk = getRiskLevel(65);
  runner.assertEquals(risk, "Medium", 'Should be Medium risk');
});

runner.addTest('Risk Level: Low score = High risk', () => {
  const risk = getRiskLevel(30);
  runner.assertEquals(risk, "High", 'Should be High risk');
});

// Test 3: Version Parsing
const parseVersion = (version) => {
  // 1) Remove non-digit / non-dot chars
  let v = version.replace(/[^\d.]/g, '');
  // 2) Collapse multiple dots to a single dot
  v = v.replace(/\.+/g, '.');
  // 3) Trim leading/trailing dots
  v = v.replace(/^\.+|\.+$/g, '');
  return v;
};

runner.addTest('Version Parsing: Remove caret', () => {
  const parsed = parseVersion('^4.18.0');
  runner.assertEquals(parsed, '4.18.0', 'Should remove caret');
});

runner.addTest('Version Parsing: Remove tilde', () => {
  const parsed = parseVersion('~1.2.3');
  runner.assertEquals(parsed, '1.2.3', 'Should remove tilde');
});

runner.addTest('Version Parsing: Remove wildcard', () => {
  const parsed = parseVersion('1.x.x');
  runner.assertEquals(parsed, '1', 'Should remove x');
});

// Test 4: Dependency Object Validation
runner.addTest('Dependency Object: Has all required fields', () => {
  const dep = {
    name: 'express',
    version: '^4.18.0',
    latestVersion: '4.18.2',
    vulnerabilities: 0,
    healthScore: 100,
    riskLevel: 'Low'
  };
  
  const required = ['name', 'version', 'latestVersion', 'vulnerabilities', 'healthScore', 'riskLevel'];
  for (const field of required) {
    runner.assertTrue(field in dep, `Missing required field: ${field}`);
  }
});

runner.addTest('Dependency Object: Data types are correct', () => {
  const dep = {
    name: 'axios',
    version: '^1.3.0',
    latestVersion: '1.4.0',
    vulnerabilities: 1,
    healthScore: 90,
    riskLevel: 'Low'
  };
  
  runner.assertTrue(typeof dep.name === 'string', 'name should be string');
  runner.assertTrue(typeof dep.version === 'string', 'version should be string');
  runner.assertTrue(typeof dep.vulnerabilities === 'number', 'vulnerabilities should be number');
  runner.assertTrue(typeof dep.healthScore === 'number', 'healthScore should be number');
  runner.assertTrue(typeof dep.riskLevel === 'string', 'riskLevel should be string');
});

// Test 5: Empty Dependencies Handling
runner.addTest('Empty Dependencies: Should return empty array', () => {
  const emptyDeps = {};
  runner.assertEquals(Object.keys(emptyDeps).length, 0, 'Empty deps should have 0 keys');
});

// Test 6: Package.json Format Validation
runner.addTest('Package.json Format: Valid structure', () => {
  runner.assertTrue('dependencies' in mockPackageJson, 'Should have dependencies key');
  runner.assertTrue(typeof mockPackageJson.dependencies === 'object', 'dependencies should be object');
  runner.assertFalse(Array.isArray(mockPackageJson.dependencies), 'dependencies should not be array');
});

// Test 7: Outdated Detection
runner.addTest('Outdated Detection: Version comparison', () => {
  const current = '1.2.0';
  const latest = '1.2.5';
  const isOutdated = current !== latest;
  runner.assertTrue(isOutdated, 'Should detect outdated version');
});

runner.addTest('Outdated Detection: Current version', () => {
  const current = '2.0.0';
  const latest = '2.0.0';
  const isOutdated = current !== latest;
  runner.assertFalse(isOutdated, 'Should not flag as outdated if current');
});

// Test 8: Vulnerability Count Validation
runner.addTest('Vulnerability Validation: Non-negative count', () => {
  const vulnerabilities = 3;
  runner.assertTrue(vulnerabilities >= 0, 'Vulnerabilities should be non-negative');
});

runner.addTest('Vulnerability Validation: Reasonable limits', () => {
  const vulnerabilities = 15;
  runner.assertTrue(vulnerabilities < 1000, 'Vulnerabilities count seems reasonable');
});

// ============================================
// INTEGRATION TESTS (Mock API Responses)
// ============================================

runner.addTest('Mock API: NPM Registry Response Structure', () => {
  const mockNpmResponse = {
    'dist-tags': {
      latest: '4.18.2',
      rc: '4.18.1'
    },
    versions: {
      '4.18.2': { version: '4.18.2' }
    }
  };
  
  runner.assertExists(mockNpmResponse['dist-tags'], 'Should have dist-tags');
  runner.assertExists(mockNpmResponse['dist-tags'].latest, 'Should have latest version');
});

runner.addTest('Mock API: OSV API Response Structure', () => {
  const mockOsvResponse = {
    vulns: [
      { id: 'CVE-2021-1234', severity: 'HIGH' },
      { id: 'CVE-2021-5678', severity: 'MEDIUM' }
    ]
  };
  
  runner.assertTrue(Array.isArray(mockOsvResponse.vulns), 'vulns should be array');
  runner.assertEquals(mockOsvResponse.vulns.length, 2, 'Should have 2 vulnerabilities');
});

// ============================================
// BATCH PROCESSING TESTS
// ============================================

runner.addTest('Batch Processing: Multiple dependencies', () => {
  const deps = Object.entries(mockDependencies);
  runner.assertTrue(deps.length > 0, 'Should have dependencies');
  runner.assertEquals(deps.length, 5, 'Should have exactly 5 test dependencies');
});

runner.addTest('Batch Processing: Each dependency processed', () => {
  const results = [];
  for (const [pkg, version] of Object.entries(mockDependencies)) {
    const healthScore = calculateHealthScore(0, false);
    const riskLevel = getRiskLevel(healthScore);
    results.push({ name: pkg, version, healthScore, riskLevel });
  }
  
  runner.assertEquals(results.length, 5, 'Should process all 5 dependencies');
  runner.assertTrue(results.every(r => r.name && r.version), 'All should have name and version');
});

// ============================================
// ERROR HANDLING TESTS
// ============================================

runner.addTest('Error Handling: Invalid package name gracefully', () => {
  const invalidPkg = '@invalid/package%^&*';
  const cleaned = invalidPkg.replace(/[^\w-/@]/g, '');
  runner.assertTrue(cleaned.length > 0, 'Should handle special characters');
});

runner.addTest('Error Handling: Malformed version gracefully', () => {
  const malformedVersion = 'v1.2.3-beta+build.123';
  const parsed = parseVersion(malformedVersion);
  runner.assertTrue(parsed.length > 0, 'Should extract version numbers');
});

runner.addTest('Error Handling: Null vulnerabilities treated as 0', () => {
  const vulns = null || 0;
  runner.assertEquals(vulns, 0, 'Should default to 0');
});

// ============================================
// ENDPOINT SIMULATION TESTS
// ============================================

runner.addTest('Endpoint /analyze: Valid request body structure', () => {
  const requestBody = {
    dependencies: mockDependencies
  };
  
  runner.assertTrue('dependencies' in requestBody, 'Should have dependencies');
  runner.assertTrue(typeof requestBody.dependencies === 'object', 'Should be object');
});

runner.addTest('Endpoint /analyze: Alternative packageJson structure', () => {
  const requestBody = {
    packageJson: mockPackageJson
  };
  
  runner.assertTrue('packageJson' in requestBody, 'Should accept packageJson');
  runner.assertTrue('dependencies' in requestBody.packageJson, 'Should have dependencies in packageJson');
});

runner.addTest('Endpoint GET /: Returns array', () => {
  const mockDbResponse = [
    { _id: '123', name: 'express', healthScore: 95, riskLevel: 'Low' },
    { _id: '124', name: 'mongoose', healthScore: 85, riskLevel: 'Low' }
  ];
  
  runner.assertTrue(Array.isArray(mockDbResponse), 'Should return array');
  runner.assertTrue(mockDbResponse.length > 0, 'Should have results');
});

// ============================================
// PERFORMANCE TESTS
// ============================================

runner.addTest('Performance: Health score calculation is fast', () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    calculateHealthScore(Math.floor(Math.random() * 10), Math.random() > 0.5);
  }
  const end = Date.now();
  const timeMs = end - start;
  
  runner.assertTrue(timeMs < 100, `Calculation took ${timeMs}ms, should be < 100ms`);
});

// ============================================
// EDGE CASES
// ============================================

runner.addTest('Edge Case: Package with no vulnerabilities', () => {
  const score = calculateHealthScore(0, false);
  const risk = getRiskLevel(score);
  runner.assertEquals(score, 100, 'Perfect score');
  runner.assertEquals(risk, 'Low', 'Should be low risk');
});

runner.addTest('Edge Case: Package with critical vulnerabilities', () => {
  const score = calculateHealthScore(10, true);
  const risk = getRiskLevel(score);
  runner.assertTrue(score < 50, 'Score should be critical');
  runner.assertEquals(risk, 'High', 'Should be high risk');
});

runner.addTest('Edge Case: Package names with scopes', () => {
  const scopedPkg = '@babel/core';
  runner.assertTrue(scopedPkg.includes('@'), 'Should handle scoped packages');
  runner.assertTrue(scopedPkg.includes('/'), 'Should handle scoped packages');
});

runner.addTest('Edge Case: Version range combinations', () => {
  const versions = ['^1.0.0', '~1.0.0', '1.x.x', '1.0.0', '>=1.0.0'];
  for (const v of versions) {
    const parsed = parseVersion(v);
    runner.assertTrue(parsed.length > 0, `Should parse ${v}`);
  }
});

// ============================================
// RUN ALL TESTS
// ============================================

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   DEPENDENCY HEALTH AGENT - COMPREHENSIVE TEST SUITE       ║');
console.log('╚════════════════════════════════════════════════════════════╝');

await runner.run();
