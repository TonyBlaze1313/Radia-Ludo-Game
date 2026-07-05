import { createRadiaHttpServer } from './httpServer.mjs';

async function main() {
  const port = Number(process.env.PORT || 3000);
  const server = createRadiaHttpServer({ port });
  await server.listen();
  console.log(`Radia HTTP server listening on http://127.0.0.1:${port}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
