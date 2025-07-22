module.exports = {
  apps: [{
    name: 'population-pyramid-dev',
    script: 'node_modules/.bin/react-scripts',
    args: 'start',
    env: {
      PORT: 3001,
      BROWSER: 'none',
      FAST_REFRESH: 'false',
      WDS_SOCKET_TIMEOUT: '120000',
      CHOKIDAR_USEPOLLING: 'true'
    },
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    time: true
  }]
};