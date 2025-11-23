# Dependency Health Agent - E2E Test Documentation

Complete guide for end-to-end test suite using Jest with real external API calls.

---

## 🏥 Health Score Calculation Details

### Penalty System (Updated)
The health score system uses the following penalty structure:

- **Per-vulnerability penalty**: 12 points per known CVE or security issue
- **Outdated penalty**: 8 points if the installed version differs from the latest available version

**Calculation Formula**:
```
healthScore = max(0, 100 - (vulnerabilities × 12) - (outdated ? 8 : 0))
```

### Risk Level Thresholds
- **Low Risk**: healthScore ≥ 80
- **Medium Risk**: 50 ≤ healthScore < 80
- **High Risk**: healthScore < 50

---

## 📋 Overview

- **Jest** - Testing framework with modern syntax
- **Supertest** - HTTP assertion library for testing Express routes
- **Real External APIs** - Tests make actual calls to:
  - NPM Registry (for latest package versions)
  - OSV API (for known vulnerabilities)

⚠️ **WARNING**: These tests make real API calls and may be slower. Ensure internet connectivity.

---

## 📁 Test File

### riskLevel.e2e.test.js - End-to-End Tests with Real APIs

Tests the complete dependency analysis flow using actual external API calls.

#### Test Cases

```javascript
describe('calculateHealthScore', () => {
  test('no vulnerabilities and up-to-date returns 100')
  test('vulnerabilities reduce score correctly')
  test('score never goes below 0')
})

describe('risk level derivation', () => {
  test('low risk for high score')
  test('medium risk for mid score')
  test('high risk for low score')
})
```

#### What It Tests

| Test | Input | Expected Output | Purpose |
|------|-------|-----------------|---------|
| Perfect health | 0 vulns, not outdated | 100 | Validates max score |
| Multiple vulns | 2 vulns, outdated | 68 | Checks calculation: 100 - (2×12) - 8 = 68 |
| Floor limit | 100 vulns, outdated | ≥0 | Ensures score never negative |
| Low risk | healthScore 90 | 'Low' | Score ≥80 = Low risk |
| Medium risk | healthScore 65 | 'Medium' | 50≤Score<80 = Medium risk |
| High risk | healthScore 30 | 'High' | Score <50 = High risk |

#### Run E2E Tests

```bash
npm test
```

**Run specific E2E test:**

```bash
npm test -- -t "HIGH RISK"
npm test -- -t "MIXED RISK"
npm test -- -t "CVE DETECTION"
```

---

### 2. **dependencyRoutes.test.js** - Integration Tests with Mocked APIs

Tests your Express routes with mocked external API responses.

#### Test Setup

```javascript
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/dependencies', dependencyRoutes);
});

afterEach(() => {
  nock.cleanAll();           // Clear API mocks
  jest.restoreAllMocks();    // Reset jest mocks
});
```

#### Test Cases

##### Test 1: Single Dependency Analysis (Low Health)

```javascript
test('POST /analyze analyzes one dependency and returns result', async () => {});
```

**What It Tests:**
- Endpoint responds with 200 status ✅
- Returns array of dependencies ✅
- Correctly parses package name ✅
- Retrieves latest version from NPM registry ✅
- Handles zero vulnerabilities ✅

**Expected Result:**
```json
{
  "name": "lodash",
  "version": "4.17.21",
  "latestVersion": "4.17.21",
  "vulnerabilities": 0,
  "healthScore": 100,
  "riskLevel": "Low"
}
```

---

##### Test 2: Medium Risk (Multiple Vulnerabilities)

```javascript
test('POST /analyze returns Medium risk when multiple vulns', async () => {});
```

**Calculation:**
- Base score: 100
- Vulnerabilities: 3 × 12 = -36
- Outdated: 0 (version matches latest)
- **Final score: 64 → Medium risk** (50-79 range)

**Expected Result:**
```json
{
  "name": "pkgA",
  "vulnerabilities": 3,
  "healthScore": 70,
  "riskLevel": "Medium"
}
```

---

##### Test 3: High Risk (Many Vulnerabilities)

```javascript
test('POST /analyze returns High risk when many vulns', async () => {});
```

**Calculation:**
- Base score: 100
- Vulnerabilities: 5 × 12 = -60
- Outdated: 0
- **Final score: 40 → High risk** (<50 range)

**Expected Result:**
```json
{
  "name": "pkgB",
  "vulnerabilities": 6,
  "healthScore": 40,
  "riskLevel": "High"
}
```

---

##### Test 4: GET Stored Dependencies (Database Mock)

```javascript
test('GET / returns stored dependencies (mocked DB)', async () => {});
```

**What It Tests:**
- GET endpoint returns 200 ✅
- Returns array of stored dependencies ✅
- Database mock works correctly ✅

---

## 🔧 How Mocking Works

### API Mocking with Nock

Nock intercepts HTTP requests and returns mock responses:

```javascript
// Intercept NPM registry calls
nock('https://registry.npmjs.org')
  .get('/lodash')
  .reply(200, { 'dist-tags': { latest: '4.17.21' } });

// Intercept OSV API calls
nock('https://api.osv.dev')
  .post('/v1/query')
  .reply(200, { vulns: [] });
```

**Benefits:**
- ✅ No network calls (faster tests)
- ✅ Predictable responses (consistent results)
- ✅ Can simulate errors (test error handling)
- ✅ Can control vulnerability counts

### Database Mocking with Jest

Mock database operations without a real MongoDB connection:

```javascript
jest.spyOn(Dependency.prototype, 'save')
  .mockImplementation(function () {
    return Promise.resolve({ ...this, _id: 'mockid' });
  });

jest.spyOn(Dependency, 'find')
  .mockResolvedValue([...]);
```

**Benefits:**
- ✅ No database dependency
- ✅ Tests run offline
- ✅ Can mock success/failure scenarios

---

## 🚀 Running Tests

### Run All E2E Tests

```bash
npm test
```

### Run Specific E2E Test

```bash
npm test -- -t "HIGH RISK"
npm test -- -t "MIXED RISK"
npm test -- -t "CVE DETECTION"
npm test -- -t "BOUNDARY TEST"
```

### Run with Coverage

```bash
npm test -- --coverage
```

---

## 🎯 Test Coverage Summary

### End-to-End Tests (riskLevel.e2e.test.js)
- ✅ 10+ test cases covering all scenarios
- ✅ Low risk detection (recent packages, no vulnerabilities)
- ✅ Medium risk detection (some vulnerabilities, outdated)
- ✅ High risk detection (multiple vulnerabilities)
- ✅ Critical risk detection (many vulnerabilities)
- ✅ Mixed risk distribution (multiple packages)
- ✅ Outdated detection (version mismatch from latest)
- ✅ Boundary testing (thresholds)
- ✅ Scoped packages (@babel/core, etc.)
- ✅ Performance validation (<10s response time)
- ✅ Edge cases (empty dependencies)
- ✅ CVE detection (real-world vulnerabilities)