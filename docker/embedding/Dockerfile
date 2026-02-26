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
RUN sed -i 's/^torch==2\.5\.1+cpu$/torch==2.5.1/' requirements.txt \
    && sed -i 's/^torchvision==0\.20\.1+cpu$/torchvision==0.20.1/' requirements.txt \
    && pip install --no-cache-dir -r requirements.txt

# Copy scripts only; dataset is mounted at runtime for indexing jobs.
COPY scripts/ ./scripts/

# Default command (overridden by compose/workflows)
CMD ["bash"]
