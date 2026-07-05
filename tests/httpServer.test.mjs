import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHttpGateway, handleHttpRequest } from '../src/platform/httpGateway.mjs';

test('can serve a room creation request over HTTP', async () => {
  const gateway = createHttpGateway();
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const response = await handleHttpRequest(gateway, { method: req.method, path: req.url, body });
    res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response.body));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: 'srv-1', hostId: 'host-srv', hostName: 'Rory' }),
    });

    const json = await response.json();
    assert.equal(response.status, 201);
    assert.equal(json.roomId, 'srv-1');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
