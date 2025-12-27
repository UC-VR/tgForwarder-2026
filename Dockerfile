# Dockerfile for FastAPI Backend

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV APP_HOME=/app
WORKDIR $APP_HOME

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# Assuming the FastAPI app will be in a directory named 'backend'
COPY ./backend $APP_HOME/backend

# Command to run the application
# We'll assume the main application file is at backend/main.py
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
