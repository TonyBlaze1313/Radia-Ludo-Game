import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, joinRoom, startGame, setRoomGameState, getRoomSummary } from '../src/platform/roomStore.mjs';

test('creates a room with a host and initial waiting state', () => {
  const room = createRoom({ roomId: 'room-1', hostId: 'host-1', hostName: 'Alice' });
  assert.equal(room.status, 'waiting');
  assert.equal(room.hostId, 'host-1');
  assert.equal(room.players.length, 1);
  assert.equal(room.players[0].name, 'Alice');
});

test('allows a second player to join and a spectator to watch', () => {
  const room = createRoom({ roomId: 'room-2', hostId: 'host-2', hostName: 'Bob' });
  joinRoom(room, 'p-2', { name: 'Charlie', role: 'player' });
  joinRoom(room, 'p-3', { name: 'Dana', role: 'spectator' });

  assert.equal(room.players.length, 2);
  assert.equal(room.spectators.length, 1);
  assert.equal(room.spectators[0].name, 'Dana');
});

test('prevents players from joining a full room', () => {
  const room = createRoom({ roomId: 'room-3', hostId: 'host-3', hostName: 'Eve', maxPlayers: 2 });
  joinRoom(room, 'p-4', { name: 'Finn', role: 'player' });
  const result = joinRoom(room, 'p-5', { name: 'Grace', role: 'player' });

  assert.equal(result.success, false);
  assert.equal(room.players.length, 2);
});

test('starts a game and stores a room summary', () => {
  const room = createRoom({ roomId: 'room-4', hostId: 'host-4', hostName: 'Hank' });
  const gameState = { currentPlayer: 0, tokens: [[-1, -1, -1, -1]] };
  startGame(room);
  setRoomGameState(room, gameState);
  const summary = getRoomSummary(room);

  assert.equal(room.status, 'playing');
  assert.deepEqual(summary.gameState, gameState);
  assert.equal(summary.playerCount, 1);
});
