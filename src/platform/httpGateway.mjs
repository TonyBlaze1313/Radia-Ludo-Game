import { createWebGateway, handleWebCommand } from './webGateway.mjs';

function createHttpGateway() {
  return {
    name: 'http',
    webGateway: createWebGateway(),
  };
}

async function handleHttpRequest(gateway, request) {
  const { method, path, body } = request;

  if (method === 'POST' && path === '/rooms') {
    const result = handleWebCommand(gateway.webGateway, {
      type: 'createRoom',
      roomId: body.roomId,
      hostId: body.hostId,
      hostName: body.hostName,
      gameType: body.gameType || 'ludo',
      maxPlayers: body.maxPlayers || 6,
    });

    return {
      statusCode: 201,
      body: result.room,
    };
  }

  if (method === 'GET' && path.startsWith('/rooms/')) {
    const roomId = path.split('/').pop();
    const result = handleWebCommand(gateway.webGateway, { type: 'getRoomSummary', roomId });

    if (!result.success) {
      return { statusCode: 404, body: { error: 'room-not-found' } };
    }

    return { statusCode: 200, body: result.summary };
  }

  return { statusCode: 404, body: { error: 'not-found' } };
}

export {
  createHttpGateway,
  handleHttpRequest,
};
