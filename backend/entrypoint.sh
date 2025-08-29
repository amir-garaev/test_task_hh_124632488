#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for database ${DB_HOST}:${DB_PORT}..."
python - <<'PY'
import os, time, sys, asyncio, asyncpg
host = os.getenv("DB_HOST", "localhost")
port = int(os.getenv("DB_PORT", "5432"))
user = os.getenv("DB_USER", "postgres")
pwd  = os.getenv("DB_PASSWORD", "postgres")
db   = os.getenv("DB_NAME", "postgres")

dsn = f"postgresql://{user}:{pwd}@{host}:{port}/{db}"
for i in range(60):
    try:
        async def ping():
            conn = await asyncpg.connect(dsn)
            await conn.close()
        asyncio.run(ping())
        print("DB is ready")
        sys.exit(0)
    except Exception:
        time.sleep(1)
print("DB not ready after 60s"); sys.exit(1)
PY

echo "Alembic state BEFORE:"
alembic heads || true
alembic current -v || true
alembic history --verbose | tail -n 20 || true

VERS_DIR="alembic/versions"

if [ ! -d "$VERS_DIR" ]; then
  echo "No versions directory found — creating: $VERS_DIR"
  mkdir -p "$VERS_DIR"
fi

if [ -z "$(ls -A "$VERS_DIR" 2>/dev/null || true)" ] || [ -z "$(alembic heads -q || true)" ]; then
  echo "No migrations found — generating initial migration (autogenerate)"
  alembic revision -m "init schema" --autogenerate
else
  echo "Migrations already exist, skipping autogenerate"
fi

echo "Running alembic upgrade head..."
alembic upgrade head

echo "Alembic state AFTER:"
alembic heads || true
alembic current -v || true

echo "Starting app..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker --timeout 300 -b 0.0.0.0:8000 main:app
