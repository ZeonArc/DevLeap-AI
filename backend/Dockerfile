FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (git for GitHub cloning)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Render (and most PaaS hosts) inject $PORT at runtime and expect the
# process to bind to it; 8000 is just the local/EXPOSE fallback.
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
