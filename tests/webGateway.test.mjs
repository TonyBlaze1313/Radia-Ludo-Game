import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebGateway, handleWebCommand } from '../src/platform/webGateway.mjs';
import { createRoom } from '../src/platform/roomStore.mjs';

test('creates a web gateway with an in-memory room registry', () => {
  const gateway = createWebGateway();
  assert.equal(gateway.rooms.size, 0);
  assert.equal(gateway.name, 'web');
});

test('creates a room and lists it through the web gateway', () => {
  const gateway = createWebGateway();
  const result = handleWebCommand(gateway, { type: 'createRoom', roomId: 'web-1', hostId: 'host-1', hostName: 'Mina' });

  assert.equal(result.success, true);
  assert.equal(gateway.rooms.size, 1);
  assert.equal(result.room.roomId, 'web-1');
});

test('joins a player through the web gateway', () => {
  const gateway = createWebGateway();
  handleWebCommand(gateway, { type: 'createRoom', roomId: 'web-2', hostId: 'host-2', hostName: 'Nia' });
  const joinResult = handleWebCommand(gateway, { type: 'joinRoom', roomId: 'web-2', userId: 'u-2', userName: 'Ola' });

  assert.equal(joinResult.success, true);
  assert.equal(gateway.rooms.get('web-2').players.length, 2);
});
