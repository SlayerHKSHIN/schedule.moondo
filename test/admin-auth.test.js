const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const express = require('express');
const cookieParser = require('cookie-parser');

process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.ADMIN_SESSION_SECRET = 'test-admin-session-secret';

const adminRouter = require('../routes/admin');

function request(port, path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const requestHeaders = { ...headers };
    const payload = body ? JSON.stringify(body) : undefined;

    if (payload) {
      requestHeaders['Content-Type'] = 'application/json';
      requestHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const request = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: requestHeaders
      },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response));
      }
    );

    request.on('error', reject);
    request.end(payload);
  });
}

async function startAdminServer(t) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/admin', adminRouter);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  return server.address().port;
}

test('rejects unauthenticated access to admin locations', async (t) => {
  const port = await startAdminServer(t);
  const response = await request(port, '/api/admin/locations');

  assert.equal(response.statusCode, 401);
});

test('allows an authenticated administrator to read locations', async (t) => {
  const port = await startAdminServer(t);
  const loginResponse = await request(port, '/api/admin/login', {
    method: 'POST',
    body: { password: process.env.ADMIN_PASSWORD }
  });

  assert.equal(loginResponse.statusCode, 200);
  assert.ok(loginResponse.headers['set-cookie']);

  const response = await request(port, '/api/admin/locations', {
    headers: { Cookie: loginResponse.headers['set-cookie'][0].split(';')[0] }
  });

  assert.equal(response.statusCode, 200);
});
