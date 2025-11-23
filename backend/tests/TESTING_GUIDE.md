# Dependency Health Agent - Testing Guide

Complete testing toolkit for your Dependency Health Agent API. This guide includes unit tests, integration tests, and Postman collection.

---

## 📁 Files Included

### 1. **test-dependency-agent.js**
Standalone unit test suite with 30+ tests covering:
- ✅ Health score calculations
- ✅ Risk level classifications
- ✅ Version parsing
- ✅ Data validation
- ✅ Error handling
- ✅ Performance benchmarks
- ✅ Edge cases

**Run with:**
```bash
node tests/test-dependency-agent.js
```

**What it tests:**
- Health scores (100 with no vuln, decreases per issue)
- Risk levels (Low ≥80, Medium ≥50, High <50)
- Version format handling (^, ~, *, ranges)
- Empty dependency objects
- Batch processing
- Null/undefined handling

---

### 2. **integration-test.js**
Full integration test suite for live API endpoints. Tests 7 real-world scenarios:

**Run with:**
```bash
# Local server
node tests/integration-test.js
```

**Test Scenarios:**
1. Real-world dependencies analysis (8 packages)
2. Package.json format (React + tools)
3. Single dependency
4. Empty dependencies (edge case)
5. Fetch stored data (GET endpoint)
6. Scan endpoint (alias test)
7. Mixed version formats

**Output:**
- Color-coded pass/fail results
- Sample response data
- Success rate percentage
- Detailed error logging