import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api/dependencies';
const TIMEOUT = 10000; // 10 seconds

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// ============================================
// TEST SCENARIOS
// ============================================

const testScenarios = {
  // Scenario 1: Analyze real-world dependencies
  scenario1: {
    name: 'Real-world Dependencies Analysis',
    description: 'Test with actual package.json dependencies',
    endpoint: '/analyze',
    method: 'POST',
    payload: {
      dependencies: {
        'express': '^4.18.0',
        'mongoose': '^7.5.0',
        'axios': '^1.4.0',
        'dotenv': '^16.0.0',
        'bcryptjs': '^2.4.3',
        'jsonwebtoken': '^9.0.0',
        'cors': '^2.8.5',
        'helmet': '^7.0.0'
      }
    },
    expectedFields: ['name', 'version', 'latestVersion', 'vulnerabilities', 'healthScore', 'riskLevel'],
    assertions: [
      (resp) => resp.status === 200,
      (resp) => Array.isArray(resp.data),
      (resp) => resp.data.length > 0,
      (resp) => resp.data[0].hasOwnProperty('healthScore'),
      (resp) => resp.data[0].healthScore >= 0 && resp.data[0].healthScore <= 100,
      (resp) => ['Low', 'Medium', 'High'].includes(resp.data[0].riskLevel)
    ]
  },

  // Scenario 2: Package.json format
  scenario2: {
    name: 'Package.json Format Analysis',
    description: 'Test with complete package.json object',
    endpoint: '/analyze',
    method: 'POST',
    payload: {
      packageJson: {
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          'webpack': '^5.88.0'
        }
      }
    },
    expectedFields: ['name', 'version', 'latestVersion', 'vulnerabilities', 'healthScore', 'riskLevel'],
    assertions: [
      (resp) => resp.status === 200,
      (resp) => Array.isArray(resp.data),
      (resp) => resp.data.every(d => d.name && d.version)
    ]
  },

  // Scenario 3: Single dependency
  scenario3: {
    name: 'Single Dependency Analysis',
    description: 'Test with just one dependency',
    endpoint: '/analyze',
    method: 'POST',
    payload: {
      dependencies: {
        'lodash': '^4.17.21'
      }
    },
    expectedFields: ['name', 'version', 'latestVersion', 'vulnerabilities', 'healthScore', 'riskLevel'],
    assertions: [
      (resp) => resp.status === 200,
      (resp) => Array.isArray(resp.data),
      (resp) => resp.data.length === 1,
      (resp) => resp.data[0].name === 'lodash'
    ]
  },

  // Scenario 4: Empty dependencies
  scenario4: {
    name: 'Empty Dependencies',
    description: 'Test with no dependencies',
    endpoint: '/analyze',
    method: 'POST',
    payload: {
      dependencies: {}
    },
    expectedFields: [],
    assertions: [
      (resp) => resp.status === 200,
      (resp) => Array.isArray(resp.data),
      (resp) => resp.data.length === 0
    ]
  },

  // Scenario 5: Fetch stored dependencies
  scenario5: {
    name: 'Fetch Stored Dependencies',
    description: 'Test GET endpoint for stored data',
    endpoint: '/',
    method: 'GET',
    payload: null,
    expectedFields: [],
    assertions: [
      (resp) => resp.status === 200,
      (resp) => Array.isArray(resp.data)
    ]
  },

  // Scenario 6: Scan endpoint (alias for analyze)
  scenario6: {
    name: 'Scan Endpoint (Alternative)',
    description: 'Test /scan endpoint',
    endpoint: '/scan',
    method: 'POST',
    payload: {
      dependencies: {
        'next': '^13.4.0',
        'tailwindcss': '^3.3.0'
      }
    },
    expectedFields: ['name', 'version', 'healthScore', 'riskLevel'],
    assertions: [
      (resp) => resp.status === 200,
      (resp) => Array.isArray(resp.data)
    ]
  },

  // Scenario 7: Mixed version formats
  scenario7: {
    name: 'Mixed Version Formats',
    description: 'Test various version specifiers',
    endpoint: '/analyze',
    method: 'POST',
    payload: {
      dependencies: {
        'package1': '^1.0.0',      // Caret
        'package2': '~2.0.0',      // Tilde
        'package3': '3.0.0',       // Exact
        'package4': '>=4.0.0',     // Range
        'package5': '*'            // Wildcard
      }
    },
    expectedFields: [],
    assertions: [
      (resp) => resp.status === 200 || resp.status === 200, // Might have API errors
      (resp) => Array.isArray(resp.data)
    ]
  }
};

// ============================================
// TEST RUNNER
// ============================================

class IntegrationTestRunner {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      skipped: 0
    };
    this.axiosInstance = axios.create({
      timeout: TIMEOUT,
      validateStatus: () => true // Don't throw on any status
    });
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runScenario(scenario, scenarioKey) {
    console.log('\n' + '─'.repeat(70));
    this.log(`📋 ${scenario.name}`, 'cyan');
    this.log(`   ${scenario.description}`, 'yellow');
    this.log(`   Endpoint: ${scenario.method} ${scenario.endpoint}`, 'blue');

    try {
      // Make request
      const config = {
        method: scenario.method,
        url: `${this.baseUrl}${scenario.endpoint}`,
        data: scenario.payload,
        timeout: TIMEOUT
      };

      this.log(`   Sending request...`, 'yellow');
      const response = await this.axiosInstance(config);

      // Check assertions
      let assertionsPassed = 0;
      let assertionsFailed = 0;

      for (let i = 0; i < scenario.assertions.length; i++) {
        try {
          const result = scenario.assertions[i](response);
          if (result === false) {
            throw new Error(`Assertion ${i + 1} failed`);
          }
          assertionsPassed++;
        } catch (err) {
          assertionsFailed++;
          this.results.errors.push({
            scenario: scenario.name,
            assertion: i + 1,
            error: err.message,
            response: response.status
          });
        }
      }

      // Validate response structure
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const firstItem = response.data[0];
        const missingFields = [];
        
        for (const field of scenario.expectedFields) {
          if (!(field in firstItem)) {
            missingFields.push(field);
          }
        }

        if (missingFields.length > 0) {
          this.log(`   ⚠️  Missing fields: ${missingFields.join(', ')}`, 'yellow');
          assertionsFailed++;
        }
      }

      if (assertionsFailed === 0) {
        this.log(`   ✅ PASSED (${assertionsPassed}/${scenario.assertions.length} assertions)`, 'green');
        this.results.passed++;
      } else {
        this.log(`   ❌ FAILED (${assertionsFailed} assertion(s) failed)`, 'red');
        this.results.failed++;
      }

      // Show sample response
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        this.log(`   Sample response:`, 'blue');
        console.log(`   ${JSON.stringify(response.data[0], null, 2)
          .split('\n')
          .map(line => `   ${line}`)
          .join('\n')}`);
      }

    } catch (error) {
      this.log(`   ❌ ERROR: ${error.message}`, 'red');
      this.results.errors.push({
        scenario: scenario.name,
        error: error.message
      });
      this.results.failed++;
    }
  }

  async runAll() {
    console.clear();
    console.log('\n');
    this.log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
    this.log('║  DEPENDENCY HEALTH AGENT - INTEGRATION TEST SUITE               ║', 'cyan');
    this.log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');

    this.log(`\n🔗 Testing against: ${this.baseUrl}`, 'blue');
    this.log(`⏱️  Timeout: ${TIMEOUT}ms\n`, 'blue');

    // Check if server is reachable
    try {
      await this.axiosInstance.get(this.baseUrl);
      this.log('✅ Server is reachable\n', 'green');
    } catch {
      this.log('⚠️  Warning: Could not reach server. Tests may fail.\n', 'yellow');
    }

    // Run all scenarios
    for (const [key, scenario] of Object.entries(testScenarios)) {
      await this.runScenario(scenario, key);
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '═'.repeat(70));
    this.log('📊 TEST SUMMARY', 'bold');
    console.log('═'.repeat(70));

    this.log(`✅ Passed:  ${this.results.passed}`, 'green');
    this.log(`❌ Failed:  ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    this.log(`⏭️  Skipped: ${this.results.skipped}`, 'yellow');
    this.log(`📝 Total:   ${this.results.passed + this.results.failed + this.results.skipped}`, 'cyan');

    console.log('');

    if (this.results.errors.length > 0) {
      this.log('⚠️  ERROR DETAILS:', 'yellow');
      this.results.errors.forEach((err, idx) => {
        console.log(`\n   ${idx + 1}. ${err.scenario}`);
        console.log(`      Error: ${err.error}`);
        if (err.response) {
          console.log(`      Response Status: ${err.response}`);
        }
      });
    }

    console.log('\n' + '═'.repeat(70));

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1);
    this.log(`📈 Success Rate: ${successRate}%\n`, 
      this.results.failed === 0 ? 'green' : 'yellow'
    );

    if (this.results.failed === 0) {
      this.log('🎉 All tests passed! Your dependency agent is working correctly.\n', 'green');
    } else {
      this.log(`⚠️  ${this.results.failed} test(s) failed. Review errors above.\n`, 'red');
    }
  }
}

// ============================================
// RUN TESTS
// ============================================

const runner = new IntegrationTestRunner(API_BASE_URL);
await runner.runAll();
