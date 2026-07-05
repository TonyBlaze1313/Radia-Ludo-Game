import { createRoom, joinRoom, startGame, setRoomGameState, getRoomSummary } from './roomStore.mjs';

function createWebGateway() {
  return {
    name: 'web',
    rooms: new Map(),
  };
}

function handleWebCommand(gateway, command) {
  if (command.type === 'createRoom') {
    const room = createRoom({
      roomId: command.roomId,
      hostId: command.hostId,
      hostName: command.hostName,
      gameType: command.gameType || 'ludo',
      maxPlayers: command.maxPlayers || 6,
    });
    gateway.rooms.set(room.roomId, room);
    return { success: true, room };
  }

  if (command.type === 'joinRoom') {
    const room = gateway.rooms.get(command.roomId);
    if (!room) {
      return { success: false, reason: 'room-not-found' };
    }

    const result = joinRoom(room, command.userId, { name: command.userName, role: command.role || 'player' });
    if (!result.success) {
      return result;
    }

    return { success: true, room };
  }

  if (command.type === 'startGame') {
    const room = gateway.rooms.get(command.roomId);
    if (!room) {
      return { success: false, reason: 'room-not-found' };
    }

    startGame(room);
    return { success: true, room, summary: getRoomSummary(room) };
  }

  if (command.type === 'setGameState') {
    const room = gateway.rooms.get(command.roomId);
    if (!room) {
      return { success: false, reason: 'room-not-found' };
    }

    setRoomGameState(room, command.gameState);
    return { success: true, room, summary: getRoomSummary(room) };
  }

  if (command.type === 'getRoomSummary') {
    const room = gateway.rooms.get(command.roomId);
    if (!room) {
      return { success: false, reason: 'room-not-found' };
    }

    return { success: true, summary: getRoomSummary(room) };
  }

  return { success: false, reason: 'unsupported-web-command' };
}

export {
  createWebGateway,
  handleWebCommand,
};
