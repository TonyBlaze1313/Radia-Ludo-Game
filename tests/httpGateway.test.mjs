import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpGateway, handleHttpRequest } from '../src/platform/httpGateway.mjs';

test('creates an HTTP gateway with a web gateway dependency', () => {
  const gateway = createHttpGateway();
  assert.equal(gateway.name, 'http');
  assert.ok(gateway.webGateway);
});

test('creates a room over HTTP', async () => {
  const gateway = createHttpGateway();
  const response = await handleHttpRequest(gateway, {
    method: 'POST',
    path: '/rooms',
    body: { roomId: 'http-1', hostId: 'host-http', hostName: 'Pia' },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.roomId, 'http-1');
});

test('returns a room summary over HTTP', async () => {
  const gateway = createHttpGateway();
  await handleHttpRequest(gateway, {
    method: 'POST',
    path: '/rooms',
    body: { roomId: 'http-2', hostId: 'host-http-2', hostName: 'Quin' },
  });

  const response = await handleHttpRequest(gateway, {
    method: 'GET',
    path: '/rooms/http-2',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.roomId, 'http-2');
});
