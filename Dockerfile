FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the application files
COPY SupervisorAgent_Main.py ./
COPY agent-interface/ ./agent-interface/

# Install Python dependencies (if any are needed beyond standard library)
# Currently only using standard library modules (json, sys, os, requests)
RUN pip install requests

CMD ["python", "SupervisorAgent_Main.py"]