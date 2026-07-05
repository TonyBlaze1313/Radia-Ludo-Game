import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, getValidMoves, applyMove, checkWinner, getScore } from '../src/engine/ludoEngine.mjs';

test('creates a game state with the requested player count', () => {
  const state = createInitialState({ numPlayers: 4, humanPlayers: 2 });
  assert.equal(state.numPlayers, 4);
  assert.equal(state.humanPlayers, 2);
  assert.equal(state.tokens.length, 4);
  assert.equal(state.tokens[0].length, 4);
});

test('allows a token to enter the board on a roll of six', () => {
  const state = createInitialState({ numPlayers: 4, humanPlayers: 1 });
  const nextState = applyMove(state, 0, 0, 6);
  assert.equal(nextState.tokens[0][0], 0);
  assert.equal(nextState.currentPlayer, 0);
});

test('detects the winner when all tokens finish', () => {
  const state = createInitialState({ numPlayers: 2, humanPlayers: 1 });
  state.tokens[0] = [99, 99, 99, 99];
  assert.equal(checkWinner(state), 0);
  assert.equal(getScore(state, 0), 4);
});

test('returns the valid move options for a roll of six from the yard', () => {
  const state = createInitialState({ numPlayers: 3, humanPlayers: 1 });
  const validMoves = getValidMoves(state, 0, 6);
  assert.deepEqual(validMoves, [0, 1, 2, 3]);
});
