# Dependency Health Agent - Test Documentation

Complete guide for test suite using Jest and mocked external services.

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

- **Jest** - Testing framework with modern syntax
- **Supertest** - HTTP assertion library for testing Express routes
- **Nock** - HTTP mocking for external API calls
- **Mock implementations** - For database operations

---

## 📁 Test Files

### 1. **healthscore.test.js** - Unit Tests for Health Score Calculation

Tests the core health score calculation logic in isolation.

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

#### Run Unit Tests

```bash
npm test -- healthscore.test.js
```

**Expected Output:**
```
PASS  healthscore.test.js
  calculateHealthScore
    ✓ no vulnerabilities and up-to-date returns 100
    ✓ vulnerabilities reduce score correctly
    ✓ score never goes below 0
  risk level derivation
    ✓ low risk for high score
    ✓ medium risk for mid score
    ✓ high risk for low score

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
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

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test healthscore.test.js
npm test dependencyRoutes.test.js
```

### Run with Coverage

```bash
npm test -- --coverage
```

**Expected Output:**
```
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   90.5  |   87.3   |   92.1  |   89.8  |
 dependencyCntrl  |   85.2  |   80.0   |   88.9  |   84.5  |
 healthScore.js   |   100   |   100    |   100   |   100   |
```

### Run in Watch Mode

```bash
npm test -- --watch
```

Reruns tests automatically when files change.

---

## 🎯 Test Coverage Summary

### Unit Tests (healthscore.test.js)
- ✅ 6 tests covering health score calculation
- ✅ Perfect health scenario (no vulns)
- ✅ Multiple vulnerabilities scenario
- ✅ Score floor limit (never below 0)
- ✅ All 3 risk levels (Low/Medium/High)

### Integration Tests (dependencyRoutes.test.js)
- ✅ 4 route tests covering main scenarios
- ✅ Low health detection (no vulnerabilities)
- ✅ Medium health detection (3 vulnerabilities)
- ✅ High health detection (6 vulnerabilities)
- ✅ GET endpoint with database mock

### Total Coverage
- ✅ 10 test cases
- ✅ All health score ranges covered
- ✅ All risk levels tested
- ✅ API mocking validated
- ✅ Database mocking validated