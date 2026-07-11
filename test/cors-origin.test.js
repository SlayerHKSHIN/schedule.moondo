const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const test = require('node:test');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const appOrigin = 'https://hyun-schedule.gltr-ous.us';

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['server.js'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: 'production',
        APP_ORIGIN: appOrigin,
        ADMIN_PASSWORD: 'test-admin-password',
        ADMIN_SESSION_SECRET: 'test-admin-session-secret',
        JWT_SECRET: 'test-user-session-secret',
        SESSION_SECRET: 'test-session-secret',
        ENCRYPTION_KEY: 'test-encryption-key'
      }
    });

    let output = '';
    const timeout = setTimeout(() => {
      reject(new Error(`server did not start: ${output}`));
      child.kill('SIGTERM');
    }, 5_000);

    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes(`Server is running on port ${port}`)) {
        clearTimeout(timeout);
        resolve(child);
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`server exited before startup with code ${code}: ${output}`));
    });
  });
}

function request(port) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/admin/locations',
        method: 'GET',
        headers: { Origin: appOrigin }
      },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response));
      }
    );

    request.on('error', reject);
    request.end();
  });
}

test('allows requests from the configured public origin', async (t) => {
  const port = await getAvailablePort();
  const child = await startServer(port);
  t.after(() => child.kill('SIGTERM'));

  const response = await request(port);

  assert.equal(response.headers['access-control-allow-origin'], appOrigin);
});
