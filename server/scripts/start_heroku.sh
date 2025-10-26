#!/bin/bash

# Start script optimized for Heroku deployment
# This runs all agents and the Flask API server using supervisor

set -e

echo "🚀 Starting Superio AI on Heroku..."
echo "Python version: $(python --version)"
echo "PORT: ${PORT}"
echo ""

# Create supervisor config
cat > /tmp/supervisord.conf << 'EOF'
[supervisord]
nodaemon=true
logfile=/dev/stdout
logfile_maxbytes=0
loglevel=info

[program:coin_agent]
command=python -m agents.coin_agent
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
startsecs=3
priority=100

[program:fgi_agent]
command=python -m agents.fgi_agent
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
startsecs=3
priority=200

[program:defi_agent]
command=python -m agents.defi_agent
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
startsecs=3
priority=300

[program:coordinator_agent]
command=python -m agents.coordinator_agent
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
startsecs=3
priority=400

[program:flask_api]
command=bash -c "export FLASK_PORT=${PORT} && python api/server.py"
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
startsecs=5
priority=999
EOF

echo "✅ Supervisor config created"
echo "🎯 Starting all services..."
echo "📡 Flask will bind to port: ${PORT}"
echo ""

# Start supervisor (this keeps running in foreground)
exec supervisord -c /tmp/supervisord.conf
