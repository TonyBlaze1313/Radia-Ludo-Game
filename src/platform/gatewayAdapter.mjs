import { joinRoom } from './roomStore.mjs';

function createGatewayAdapter({ name = 'web', transport = name } = {}) {
  return {
    name,
    transport,
    events: [],
  };
}

function dispatchGatewayCommand(adapter, session, command) {
  if (command.type === 'joinRoom') {
    const result = joinRoom(session.room, command.userId, {
      name: command.userName,
      role: command.role || 'player',
    });

    adapter.events.push({ type: 'JoinRoom', userId: command.userId, role: result.role || 'player', timestamp: new Date().toISOString() });
    return result;
  }

  if (command.type === 'spectate') {
    const result = joinRoom(session.room, command.userId, {
      name: command.userName,
      role: 'spectator',
    });

    adapter.events.push({ type: 'Spectate', userId: command.userId, timestamp: new Date().toISOString() });
    return result;
  }

  return { success: false, reason: 'unsupported-gateway-command' };
}

export {
  createGatewayAdapter,
  dispatchGatewayCommand,
};
