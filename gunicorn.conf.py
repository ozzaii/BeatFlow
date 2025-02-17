import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'gevent'
worker_connections = 1000
timeout = 30
keepalive = 2

# Process naming
proc_name = "musicstagram"
pythonpath = '.'

# Logging
accesslog = "logs/access.log"
errorlog = "logs/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process management
daemon = False
pidfile = "musicstagram.pid"
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL
keyfile = None
certfile = None

# Server mechanics
preload_app = True
reload = False
reload_engine = 'auto'

# Server hooks
def on_starting(server):
    """Log when server starts."""
    server.log.info("Starting Musicstagram server with Gunicorn 🚀")

def on_reload(server):
    """Log when server reloads."""
    server.log.info("Reloading Musicstagram server")

def post_fork(server, worker):
    """Log when worker spawns."""
    server.log.info(f"Worker spawned (pid: {worker.pid})")

def pre_fork(server, worker):
    """Log before worker fork."""
    pass

def pre_exec(server):
    """Log before exec."""
    server.log.info("Forked child, re-executing.")

def when_ready(server):
    server.log.info("Server is ready. Bring the beats! 🎵")

def worker_int(worker):
    worker.log.info("worker received INT or QUIT signal")

def worker_abort(worker):
    worker.log.info("worker received SIGABRT signal") 