import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom } from '../src/platform/roomStore.mjs';
import { createGameSession } from '../src/platform/gameSession.mjs';
import { createGatewayAdapter, dispatchGatewayCommand } from '../src/platform/gatewayAdapter.mjs';

test('creates a gateway adapter with a default transport', () => {
  const adapter = createGatewayAdapter({ name: 'web' });
  assert.equal(adapter.name, 'web');
  assert.equal(adapter.transport, 'web');
});

test('dispatches a join-room command through the adapter', () => {
  const room = createRoom({ roomId: 'gw-1', hostId: 'host-x', hostName: 'Xena' });
  const session = createGameSession({ room });
  const adapter = createGatewayAdapter({ name: 'discord' });

  const result = dispatchGatewayCommand(adapter, session, { type: 'joinRoom', userId: 'u-2', userName: 'Yuri' });

  assert.equal(result.success, true);
  assert.equal(session.room.players.length, 2);
  assert.equal(adapter.events.at(-1).type, 'JoinRoom');
});
