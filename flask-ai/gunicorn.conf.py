# gunicorn.conf.py - Optimized for Render Free Tier (512MB RAM)
import os
import multiprocessing

# Bind to the port Render provides
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# Worker configuration - Single worker for 512MB RAM limit
workers = 1
worker_class = "sync"

# Timeout settings - Increased for ML model loading
# Render free tier needs more time to load scikit-learn models
timeout = 120  # 2 minutes (default 30s is too short)
graceful_timeout = 30
keepalive = 2

# Memory management - Restart worker after 1000 requests to prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Preload app to load ML models at startup (not on first request)
preload_app = True  # Changed to True - models now load at startup

# Logging - Explicit configuration for Render logs
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Worker process name
proc_name = "fitness-ai"

# Server mechanics
daemon = False
pidfile = None
umask = 0
tmp_upload_dir = None

# SSL (Render handles this at the load balancer)
forwarded_allow_ips = '*'
secure_scheme_headers = {'X-FORWARDED-PROTOCOL': 'ssl', 'X-FORWARDED-PROTO': 'https', 'X-FORWARDED-SSL': 'on'}


def on_starting(server):
    """Called just before the master process is initialized."""
    print("🚀 Gunicorn starting up...")


def on_reload(server):
    """Called when SIGHUP is received."""
    print("🔄 Gunicorn reloading...")


def when_ready(server):
    """Called just after the server is started."""
    print("✅ Gunicorn server is ready")


def worker_int(worker):
    """Called when a worker receives SIGINT or SIGQUIT."""
    print(f"⚠️ Worker {worker.pid} interrupted")


def worker_abort(worker):
    """Called when a worker receives SIGABRT."""
    print(f"🚨 Worker {worker.pid} aborted - likely due to timeout")


def on_exit(server):
    """Called just before exiting Gunicorn."""
    print("👋 Gunicorn shutting down...")
