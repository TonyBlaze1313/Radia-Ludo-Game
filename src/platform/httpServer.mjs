import { createServer } from 'node:http';
import { createHttpGateway, handleHttpRequest } from './httpGateway.mjs';

function createRadiaHttpServer({ port = 3000 } = {}) {
  const gateway = createHttpGateway();
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const response = await handleHttpRequest(gateway, { method: req.method, path: req.url, body });
    res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response.body));
  });

  return {
    gateway,
    server,
    listen() {
      return new Promise((resolve) => {
        server.listen(port, '127.0.0.1', resolve);
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

export {
  createRadiaHttpServer,
};
