# SPM Project

A full-stack web application for Software Project Management (SPM) that manages dependencies and provides health scoring functionality.

## Overview

This project consists of two main components:
- **Backend**: Node.js/Express API server with MongoDB database
- **Frontend**: React web application for user interaction

## Architecture

```
SPM_Project/
├── backend/          # Node.js/Express API server
│   ├── controllers/  # Request handlers
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── utils/        # Utility functions
│   ├── server.js     # Main server file
│   └── package.json  # Backend dependencies
├── frontend/         # React web application
│   ├── src/          # React source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
└── README.md         # This file
```

## Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **CORS**: Cross-Origin Resource Sharing
- **Axios**: HTTP client
- **Dotenv**: Environment variable management

### Frontend
- **React**: JavaScript library for building user interfaces
- **React DOM**: React rendering library
- **Axios**: HTTP client for API requests
- **React Scripts**: Build scripts and development server

## Prerequisites

- Node.js (version 18 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd SPM_Project
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   cd ..
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   cd ..
   ```

## Configuration

### Backend Configuration

1. Create a `.env` file in the `backend/` directory:
   ```
   MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/your-database
   PORT=5000
   ```

2. Replace the `MONGO_URI` with your actual MongoDB connection string.

### Frontend Configuration

The frontend is configured to communicate with the backend API running on `http://localhost:5000`. If you need to change this, update the API base URL in the frontend code.

## Running the Application

### Development Mode

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend:
   ```
   cd frontend
   npm start
   ```

The backend will run on `http://localhost:5000` and the frontend on `http://localhost:3000`.

### Production Build

1. Build the frontend:
   ```
   cd frontend
   npm run build
   ```

2. Start the backend in production:
   ```
   cd backend
   npm start
   ```

## API Endpoints

The backend provides RESTful API endpoints for dependency management:

- `GET /api/dependencies` - Retrieve dependencies
- Other endpoints as defined in the routes

## Features

- Dependency management system
- Health scoring for dependencies
- RESTful API architecture
- MongoDB data persistence
- CORS enabled for frontend communication
- Environment-based configuration

## Development

### Backend Development
- Use `npm run dev` for development with auto-restart
- Server runs on port 5000 by default
- MongoDB connection required

### Frontend Development
- Use `npm start` for development server
- Hot reloading enabled
- Runs on port 3000 by default

## Testing

### Backend Testing
```
cd backend
npm test
```

### Frontend Testing
```
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/feature-example`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feat/feature-example`)
5. Open a Pull Request