FROM python:3.11-slim

# Install system dependencies for image processing and ML
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy scripts
COPY scripts/ ./scripts/

# Copy preprocessed dataset
COPY preprocessed_dataset/ /data/input/

# Default command (will be overridden by docker-compose or docker run)
CMD ["bash"]
