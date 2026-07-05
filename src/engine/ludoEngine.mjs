function createInitialState({ numPlayers = 4, humanPlayers = 1 } = {}) {
  const safePlayerCount = Math.min(Math.max(numPlayers, 3), 10);
  const safeHumanCount = Math.min(Math.max(humanPlayers, 1), safePlayerCount);

  return {
    numPlayers: safePlayerCount,
    humanPlayers: safeHumanCount,
    currentPlayer: 0,
    diceValue: 0,
    extraTurn: false,
    gameWinner: null,
    gameMessage: "Player 1's turn • Roll dice to begin.",
    tokens: Array.from({ length: safePlayerCount }, () => [-1, -1, -1, -1]),
    playerNames: Array.from({ length: safePlayerCount }, (_, i) => (i < safeHumanCount ? `P${i + 1}` : `CPU${i + 1 - safeHumanCount}`)),
    startStepPerPlayer: Array.from({ length: safePlayerCount }, (_, i) => Math.round(i * 52 / safePlayerCount) % 52),
    isHuman: Array.from({ length: safePlayerCount }, (_, i) => i < safeHumanCount),
  };
}

function getScore(state, playerIdx) {
  return state.tokens[playerIdx].filter((value) => value === 99).length;
}

function checkWinner(state) {
  return state.tokens.findIndex((tokensForPlayer) => tokensForPlayer.every((value) => value === 99));
}

function getValidMoves(state, playerIdx, dice) {
  return state.tokens[playerIdx].reduce((valid, tokenValue, tokenIdx) => {
    if (canMovePiece(state, playerIdx, tokenValue, dice)) {
      valid.push(tokenIdx);
    }
    return valid;
  }, []);
}

function canMovePiece(state, playerIdx, stepVal, dice) {
  if (stepVal === 99) return false;
  if (stepVal === -1) return dice === 6;
  if (stepVal >= 0 && stepVal < 52) {
    return stepVal + dice <= 52;
  }
  if (stepVal >= 52 && stepVal < 58) {
    return stepVal + dice <= 57;
  }
  return false;
}

function applyMove(state, playerIdx, tokenIdx, dice) {
  const nextState = {
    ...state,
    tokens: state.tokens.map((tokensForPlayer) => [...tokensForPlayer]),
  };

  const current = nextState.tokens[playerIdx][tokenIdx];
  if (current === -1 && dice === 6) {
    nextState.tokens[playerIdx][tokenIdx] = 0;
    nextState.diceValue = 0;
    return nextState;
  }

  if (current >= 0 && current < 52) {
    const newStep = current + dice;
    if (newStep <= 52) {
      nextState.tokens[playerIdx][tokenIdx] = newStep;
      nextState.diceValue = 0;
      return nextState;
    }
  }

  if (current >= 52 && current < 58) {
    const newStep = current + dice;
    if (newStep <= 57) {
      nextState.tokens[playerIdx][tokenIdx] = newStep === 57 ? 99 : newStep;
      nextState.diceValue = 0;
      return nextState;
    }
  }

  return nextState;
}

export {
  createInitialState,
  getScore,
  checkWinner,
  getValidMoves,
  canMovePiece,
  applyMove,
};
