# Use a lightweight Python image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required for building certain Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy your requirements first (for efficient caching)
# We will create this requirements.txt file in the next step!
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

# Create the temp directory for uploads
RUN mkdir -p temp_uploads

# The default command will just be to run the API
ENV C_FORCE_ROOT=true
CMD celery -A worker.celery_app worker --loglevel=info --pool=solo & uvicorn main:app --host 0.0.0.0 --port 10000