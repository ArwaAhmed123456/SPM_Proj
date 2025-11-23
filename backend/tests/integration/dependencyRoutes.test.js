import express from 'express';
import { jest } from '@jest/globals';
import request from 'supertest';
import nock from 'nock';

import dependencyRoutes from '../../routes/dependencyRoute.js';
import Dependency from '../../models/DependencyModel.js';

describe('Dependency routes (integration, mocked external services)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/dependencies', dependencyRoutes);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
  });

  test('POST /analyze analyzes one dependency and returns result', async () => {
    // Mock npm registry response
    nock('https://registry.npmjs.org')
      .get('/lodash')
      .reply(200, { 'dist-tags': { latest: '4.17.21' } });

    // Mock OSV response
    nock('https://api.osv.dev')
      .post('/v1/query')
      .reply(200, { vulns: [] });

    // Mock saving to DB
    jest.spyOn(Dependency.prototype, 'save').mockImplementation(function () {
      return Promise.resolve({ ...this, _id: 'mockid' });
    });

    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({ dependencies: { lodash: '^4.17.21' } })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    const item = res.body[0]._doc ? res.body[0]._doc : res.body[0];
    expect(item.name).toBe('lodash');
    expect(item.latestVersion).toBe('4.17.21');
  });

  test('POST /analyze returns Medium risk when multiple vulns', async () => {
    // Package where cleaned version equals latest (not outdated)
    nock('https://registry.npmjs.org')
      .get('/pkgA')
      .reply(200, { 'dist-tags': { latest: '1.0.0' } });

    // Return 3 vulnerabilities -> healthScore 100 - 30 = 70 -> Medium
    nock('https://api.osv.dev')
      .post('/v1/query')
      .reply(200, { vulns: [{}, {}, {}] });

    jest.spyOn(Dependency.prototype, 'save').mockImplementation(function () {
      return Promise.resolve({ ...this, _id: 'm_pkgA' });
    });

    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({ dependencies: { pkgA: '^1.0.0' } })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    const itemA = res.body[0]._doc ? res.body[0]._doc : res.body[0];
    expect(itemA.name).toBe('pkgA');
    expect(itemA.riskLevel).toBe('Medium');
  });

  test('POST /analyze returns High risk when many vulns', async () => {
    nock('https://registry.npmjs.org')
      .get('/pkgB')
      .reply(200, { 'dist-tags': { latest: '2.0.0' } });

    // Return 6 vulnerabilities -> healthScore 100 - 60 = 40 -> High
    nock('https://api.osv.dev')
      .post('/v1/query')
      .reply(200, { vulns: [{},{},{},{},{},{}] });

    jest.spyOn(Dependency.prototype, 'save').mockImplementation(function () {
      return Promise.resolve({ ...this, _id: 'm_pkgB' });
    });

    const res = await request(app)
      .post('/api/dependencies/analyze')
      .send({ dependencies: { pkgB: '^2.0.0' } })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    const itemB = res.body[0]._doc ? res.body[0]._doc : res.body[0];
    expect(itemB.name).toBe('pkgB');
    expect(itemB.riskLevel).toBe('High');
  });

  test('GET / returns stored dependencies (mocked DB)', async () => {
    jest.spyOn(Dependency, 'find').mockResolvedValue([
      { _id: '1', name: 'express', healthScore: 95, riskLevel: 'Low' }
    ]);

    const res = await request(app).get('/api/dependencies/').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('express');
  });
});
