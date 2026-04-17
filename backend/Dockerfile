FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY . .

# Railway uses dynamic $PORT, default to 8000 for local dev
ENV PORT=8000

# Production server — shell form so $PORT is evaluated at runtime
CMD sh -c "gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT} --timeout 120 --graceful-timeout 30"
