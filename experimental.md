# Docker Containerization for SPM Project

This document outlines the Docker containerization setup for the SPM (Software Project Management) project, which consists of three main components: a Node.js/Express backend, a React frontend, and a Python supervisor agent.

## Components

### 1. Backend Service (Node.js/Express)
- **Dockerfile location**: `/backend/Dockerfile`
- **Base image**: `node:18-alpine`
- **Purpose**: Provides REST API endpoints for dependency management
- **Dependencies**: Express, Mongoose, Axios, CORS, Dotenv
- **Port**: 4000 (updated from 5000 to match worker agent expectations)
- **Environment variables**:
  - MONGO_URI for MongoDB connection
  - NODE_ENV for environment configuration
  - PORT=4000 to match worker agent configuration
- **Health score calculation**: Backend calculates health scores based on vulnerabilities and outdated packages

### 2. Frontend Service (React)
- **Dockerfile location**: `/frontend/Dockerfile`
- **Base images**: `node:18-alpine` (build stage), `nginx:alpine` (production stage)
- **Purpose**: Provides user interface for dependency management
- **Build process**: Uses multi-stage build to create optimized production build
- **Configuration**: Includes nginx.conf for API request proxying to backend
- **Port**: 80 (served via nginx)
- **API Proxying**: Updated nginx.conf to proxy to backend:4000 for internal service communication

### 3. Supervisor Agent (Python)
- **Dockerfile location**: `/Dockerfile.supervisor`
- **Base image**: `python:3.9-slim`
- **Purpose**: Coordinates task assignment between components
- **Dependencies**: requests library for HTTP communication
- **Components**: Includes agent-interface directory with worker agents
- **Backend Connection**: Worker agents configured to connect to backend at http://localhost:4000/api/dependencies/analyze (internal: http://backend:4000)

### 4. Database (MongoDB)
- **Image**: `mongo:5`
- **Purpose**: Stores dependency data and analysis results
- **Volume**: `mongodb_data` for persistent storage
- **Authentication**: Basic admin user/password setup
- **Port**: 27017

## Docker Compose Configuration

The `docker-compose.yml` file orchestrates all services with the following features:
- Proper service dependencies (MongoDB starts first, backend after MongoDB, frontend after backend, supervisor after backend)
- Custom network for inter-service communication
- Environment variable configuration for each service
- Persistent volume for database storage
- Port mappings for external access

### Services in docker-compose.yml:
- `mongodb`: Database service
- `backend`: API server configured to run on port 4000 to match worker agent expectations
- `frontend`: Web interface
- `supervisor`: Task coordination agent

### Networks:
- `app-network`: Bridge network for internal service communication

### Volumes:
- `mongodb_data`: Persistent storage for MongoDB

## Usage

To start all services:
```bash
docker-compose up -d
```

To stop and remove all services:
```bash
docker-compose down
```

To rebuild services after changes:
```bash
docker-compose up -d --build
```

## Architecture Notes

1. The frontend proxies API requests to the backend using nginx configuration
2. The backend connects to MongoDB for persistent storage
3. The supervisor agent coordinates tasks by communicating with the backend
4. All services are containerized for consistent deployment environments
5. The containerization maintains the original application's functionality while adding scalability and deployment flexibility
6. Backend port updated to 4000 to resolve communication issue between worker agent and backend service
7. Internal service communication aligned to use port 4000 for proper inter-service connectivity

## Environment Configuration

Each service can be configured through environment variables:
- Backend: MONGO_URI, NODE_ENV, PORT=4000
- Frontend: Communicates with backend via proxy
- Supervisor: PYTHONPATH
- MongoDB: Admin credentials

## Security Considerations

- Uses dedicated bridge network for service isolation
- Environment variables for configuration instead of hardcoded values
- Separation of concerns between services
- Persistent volume for database with proper ownership

## Recent Changes

### Issue Resolution
- **Problem**: Worker agent continuously showing "Sending scan request to backend..." messages
- **Root Cause**: Port mismatch between worker agent (expecting port 4000) and backend service (running on port 5000)
- **Solution**: Updated backend service to run on port 4000 to match worker agent configuration

### Configuration Updates
- Updated `docker-compose.yml` to run backend on port 4000
- Updated backend `Dockerfile` to expose port 4000
- Updated `frontend/nginx.conf` to proxy API requests to backend:4000
- Created `backend/.env` with PORT=4000 to ensure backend runs on correct port

## Todo List

### Future Tasks
- [ ] Research and implement deployment strategy on free cloud services (e.g., Render, Railway, Heroku, Fly.io)
- [ ] Set up CI/CD pipeline for automated deployment
- [ ] Configure monitoring and logging for deployed services
- [ ] Optimize Docker images for production deployment (reduce image sizes, security scanning)
- [ ] Set up domain and SSL certificates for production deployment