module.exports = {
  apps: [
    {
      name: 'lingobridge-backend',
      script: './node_modules/.bin/tsx',
      args: 'backend/src/server.ts',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'development',
        HOST: '127.0.0.1',
        PORT: '3001'
      },
      max_memory_restart: '500M',
      restart_delay: 3000
    },
    {
      name: 'lingobridge-frontend-preview',
      script: './node_modules/.bin/vite',
      args: 'preview --host 127.0.0.1 --port 4174 --strictPort',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'development'
      },
      max_memory_restart: '500M',
      restart_delay: 3000
    }
  ]
};
