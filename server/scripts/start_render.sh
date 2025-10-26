#!/bin/bash

# Start script optimized for Render.com deployment
# This runs all agents and the Flask API server using supervisor/background processes

set -e

echo "🚀 Starting Superio AI on Render..."
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo ""

# Install supervisor if not available (for process management)
if ! command -v supervisord &> /dev/null; then
    echo "📦 Installing supervisor for process management..."
    pip install supervisor
fi

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

[program:fgi_agent]
command=python -m agents.fgi_agent
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:defi_agent]
command=python -m agents.defi_agent
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:coordinator_agent]
command=python -m agents.coordinator_agent
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:flask_api]
command=python api/server.py
directory=%(here)s/..
autostart=true
autorestart=true
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
priority=999
EOF

echo "✅ Supervisor config created"
echo "🎯 Starting all services with supervisord..."
echo ""

# Start supervisor (this keeps running in foreground)
exec supervisord -c /tmp/supervisord.conf
