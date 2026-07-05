import { createInitialState, applyMove, getValidMoves } from '../engine/ludoEngine.mjs';

function createGameSession({ room, engineState = null }) {
  const baseState = engineState || createInitialState({ numPlayers: 4, humanPlayers: 1 });
  const session = {
    room,
    engineState: {
      ...baseState,
      tokens: baseState.tokens.map((tokenRow) => [...tokenRow]),
    },
    events: [{ type: 'GameStarted', roomId: room.roomId, timestamp: new Date().toISOString() }],
  };

  return session;
}

function dispatchCommand(session, command) {
  const { type } = command;

  if (type === 'moveToken') {
    const { playerIdx, tokenIdx, dice } = command;
    const nextState = applyMove(session.engineState, playerIdx, tokenIdx, dice);
    session.engineState = nextState;
    session.events.push({ type: 'TokenMoved', playerIdx, tokenIdx, dice, timestamp: new Date().toISOString() });
    session.room.gameState = nextState;
    return { success: true, state: nextState };
  }

  if (type === 'rollDice') {
    session.events.push({ type: 'DiceRolled', timestamp: new Date().toISOString() });
    return { success: true };
  }

  return { success: false, reason: 'unsupported-command' };
}

export {
  createGameSession,
  dispatchCommand,
};
