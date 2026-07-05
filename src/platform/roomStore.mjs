function createRoom({ roomId, hostId, hostName, maxPlayers = 6, gameType = 'ludo' } = {}) {
  return {
    roomId,
    hostId,
    gameType,
    status: 'waiting',
    maxPlayers,
    players: [{ id: hostId, name: hostName, role: 'player' }],
    spectators: [],
    gameState: null,
    createdAt: new Date().toISOString(),
  };
}

function joinRoom(room, userId, member) {
  if (room.players.length + room.spectators.length >= room.maxPlayers && member.role === 'player') {
    return { success: false, reason: 'room-full' };
  }

  if (member.role === 'spectator') {
    room.spectators.push({ id: userId, name: member.name, role: 'spectator' });
    return { success: true, role: 'spectator' };
  }

  if (room.players.some((player) => player.id === userId)) {
    return { success: false, reason: 'already-member' };
  }

  room.players.push({ id: userId, name: member.name, role: 'player' });
  return { success: true, role: 'player' };
}

function startGame(room) {
  room.status = 'playing';
  return room;
}

function setRoomGameState(room, gameState) {
  room.gameState = gameState;
  return room;
}

function getRoomSummary(room) {
  return {
    roomId: room.roomId,
    status: room.status,
    playerCount: room.players.length,
    spectatorCount: room.spectators.length,
    gameType: room.gameType,
    gameState: room.gameState,
  };
}

export {
  createRoom,
  joinRoom,
  startGame,
  setRoomGameState,
  getRoomSummary,
};
