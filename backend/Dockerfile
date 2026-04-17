FROM python:3.11-slim

WORKDIR /app

# Install dependencies from the backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code into /app
COPY backend/ .

# Expose port
EXPOSE 8000

# Production server
CMD ["gunicorn", "main:app", \
     "-w", "2", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--graceful-timeout", "30"]
