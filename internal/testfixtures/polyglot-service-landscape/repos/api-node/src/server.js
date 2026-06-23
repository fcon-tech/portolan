import { createServer } from 'node:http';

export function routeJob(job) {
  return {
    queue: 'worker-go',
    job,
  };
}

export function startServer(port = 3000) {
  const server = createServer((request, response) => {
    const routed = routeJob({ path: request.url || '/' });
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(routed));
  });
  server.listen(port);
  return server;
}
