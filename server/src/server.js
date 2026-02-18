const {app} = require('./app');
const {assertServerConfig, env} = require('./config');
const {closePool} = require('./db');

const start = async () => {
  assertServerConfig();

  const server = app.listen(env.port, () => {
    console.log(`[server] listening on port ${env.port}`);
  });

  const shutdown = async signal => {
    console.log(`[server] received ${signal}, shutting down...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
};

start().catch(error => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
