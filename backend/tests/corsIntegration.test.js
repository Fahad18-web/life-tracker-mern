
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const cors = require('cors');

const corsOptions = require('../middleware/corsOptions');
const config = require('../config');

let server;
let baseUrl;

test.before(async () => {
  const app = express();

  app.use(cors(corsOptions));

  app.get('/test', (req, res) => {
    res.json({ success: true });
  });

  server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

function request(path, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${path}`,
      { method, headers },
      res => {
        let body = '';

        res.setEncoding('utf8');
        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body
          });
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

test('returns Access-Control-Allow-Origin for the primary origin', async () => {
  const response = await request('/test', {
    headers: {
      Origin: config.clientUrl
    }
  });

  assert.equal(
    response.headers['access-control-allow-origin'],
    config.clientUrl
  );
  assert.equal(response.status, 200);
});

test('returns Access-Control-Allow-Origin for an additional trusted origin', async t => {
  const additionalOrigin = config.corsOrigins.find(
    origin => origin !== config.clientUrl
  );

  if (!additionalOrigin) {
    t.skip('No additional CORS origin is configured for this test run.');
    return;
  }

  const response = await request('/test', {
    headers: {
      Origin: additionalOrigin
    }
  });

  assert.equal(
    response.headers['access-control-allow-origin'],
    additionalOrigin
  );
});

test('does not grant CORS permission to an untrusted origin', async () => {
  const response = await request('/test', {
    headers: {
      Origin: 'https://untrusted.example.com'
    }
  });

  assert.equal(
    response.headers['access-control-allow-origin'],
    undefined
  );

  // CORS controls browser access; it does not itself block the request.
  assert.equal(response.status, 200);
});

test('returns credentials permission for trusted origins', async () => {
  const response = await request('/test', {
    headers: {
      Origin: config.clientUrl
    }
  });

  assert.equal(
    response.headers['access-control-allow-credentials'],
    'true'
  );
});

test('handles preflight requests for trusted origins', async () => {
  const response = await request('/test', {
    method: 'OPTIONS',
    headers: {
      Origin: config.clientUrl,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'content-type'
    }
  });

  assert.equal(response.status, 204);
  assert.equal(
    response.headers['access-control-allow-origin'],
    config.clientUrl
  );
  assert.equal(
    response.headers['access-control-allow-credentials'],
    'true'
  );
  assert.ok(
    response.headers['access-control-allow-methods']
  );
});

test('does not grant preflight permission to an untrusted origin', async () => {
  const response = await request('/test', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://untrusted.example.com',
      'Access-Control-Request-Method': 'GET'
    }
  });

  assert.equal(
    response.headers['access-control-allow-origin'],
    undefined
  );
});

test('continues serving requests without an Origin header', async () => {
  const response = await request('/test');

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true
  });
});

test('does not return a wildcard origin with credentials enabled', async () => {
  const response = await request('/test', {
    headers: {
      Origin: config.clientUrl
    }
  });

  assert.notEqual(
    response.headers['access-control-allow-origin'],
    '*'
  );

  assert.equal(
    response.headers['access-control-allow-credentials'],
    'true'
  );
});
