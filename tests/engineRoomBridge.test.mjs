import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, joinRoom, startGame, setRoomGameState } from '../src/platform/roomStore.mjs';
import { createInitialState, applyMove, getValidMoves } from '../src/engine/ludoEngine.mjs';
import { createGameSession, dispatchCommand } from '../src/platform/gameSession.mjs';

test('creates a game session from a room and initial engine state', () => {
  const room = createRoom({ roomId: 'bridge-1', hostId: 'host-a', hostName: 'Ava' });
  const engineState = createInitialState({ numPlayers: 4, humanPlayers: 2 });
  const session = createGameSession({ room, engineState });

  assert.equal(session.room.roomId, 'bridge-1');
  assert.equal(session.engineState.numPlayers, 4);
  assert.equal(session.events.length, 1);
  assert.equal(session.events[0].type, 'GameStarted');
});

test('dispatches a move command through the session', () => {
  const room = createRoom({ roomId: 'bridge-2', hostId: 'host-b', hostName: 'Ben' });
  const engineState = createInitialState({ numPlayers: 4, humanPlayers: 1 });
  const session = createGameSession({ room, engineState });

  const result = dispatchCommand(session, { type: 'moveToken', playerIdx: 0, tokenIdx: 0, dice: 6 });

  assert.equal(result.success, true);
  assert.equal(session.engineState.tokens[0][0], 0);
  assert.equal(session.events.at(-1).type, 'TokenMoved');
});

test('stores an updated game state back on the room', () => {
  const room = createRoom({ roomId: 'bridge-3', hostId: 'host-c', hostName: 'Cara' });
  const engineState = createInitialState({ numPlayers: 3, humanPlayers: 1 });
  const session = createGameSession({ room, engineState });
  startGame(room);
  setRoomGameState(room, session.engineState);

  assert.equal(room.status, 'playing');
  assert.equal(room.gameState.numPlayers, 3);
});
