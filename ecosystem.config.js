module.exports = {
  apps: [{
    name: 'population-pyramid-dev',
    script: 'node_modules/.bin/react-scripts',
    args: 'start',
    env: {
      PORT: 3000,
      BROWSER: 'none',
      FAST_REFRESH: 'false',
      WDS_SOCKET_TIMEOUT: '120000',
      CHOKIDAR_USEPOLLING: 'true',
      WATCHPACK_POLLING: 'true',
      NODE_OPTIONS: '--max-old-space-size=4096'
    },
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    time: true,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};