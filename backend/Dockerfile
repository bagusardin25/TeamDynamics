FROM python:3.11-slim

WORKDIR /app

# Install system deps needed by some Python packages (e.g., bcrypt, asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend source code
COPY . .

# Railway injects $PORT at runtime, default to 8000 for local
ENV PORT=8000
EXPOSE ${PORT}

# Production server
# - 1 worker: Railway free/hobby tier has limited memory (~512MB)
# - --preload: load app once in master, then fork workers (faster startup, less memory)
# - shell form so $PORT is evaluated at runtime
CMD sh -c "gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT} --timeout 120 --graceful-timeout 30 --preload"
