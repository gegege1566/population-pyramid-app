module.exports = {
  apps: [{
    name: 'population-pyramid-dev',
    script: 'node_modules/.bin/react-scripts',
    args: 'start',
    env: {
      PORT: 3001,
      BROWSER: 'none',
      FAST_REFRESH: 'false',
      WDS_SOCKET_TIMEOUT: '60000',
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    max_memory_restart: '800M',
    autorestart: true,
    watch: false,
    time: true,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 2000
  }]
};