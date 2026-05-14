module.exports = {
  apps: [
    {
      name: 'lingobridge-backend',
      script: './node_modules/.bin/tsx',
      args: 'backend/src/server.ts',
      env: {
        HOST: '0.0.0.0',
        PORT: '3001'
      },
      max_memory_restart: '500M',
      restart_delay: 3000
    }
  ]
};
