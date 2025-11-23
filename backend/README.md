# Backend API for SPM Project

This is the backend server for the Software Project Management (SPM) project. It provides RESTful API endpoints for managing dependencies and related functionalities.

## Technologies Used

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework for Node.js
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **CORS**: Cross-Origin Resource Sharing
- **Axios**: HTTP client
- **Dotenv**: Environment variable management

## Prerequisites

- Node.js (version 18 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)

## Installation

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root of the backend directory and add the following environment variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   ```

   Replace `your_mongodb_connection_string` with your actual MongoDB URI.

## Running the Application

### Development Mode
```
npm run dev
```

### Production Mode
```
npm start
```

The server will start on the port specified in the `.env` file (default: 5000).

## API Endpoints

- `POST /api/dependencies/analyze` - Analyze dependencies for vulnerabilities and health score
- `GET /api/dependencies` - Retrieve stored dependencies

## Project Structure

```
backend/
├── controllers/          # Request handlers
├── models/               # Database models
├── routes/               # API routes
├── utils/                # Utility functions
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (not committed)
└── .gitignore            # Git ignore rules
```

## Health Score & Risk Level System

### Overview
Dependencies are scored and classified to help identify vulnerable or outdated packages.

### Health Score Calculation
- **Starting score**: 100 points
- **Vulnerability penalty**: 12 points per vulnerability
- **Outdated penalty**: 8 points if package is outdated
- **Minimum score**: 0

**Formula**: `healthScore = max(0, 100 - (vulnerabilities × 12) - (outdated ? 8 : 0))`

### Risk Level Classification
The system maps health scores to risk levels:

| Health Score | Risk Level | Action |
|--------------|-----------|--------|
| ≥ 80         | Low       | Safe to use; monitor for updates |
| 50–79        | Medium    | Review vulnerabilities; plan update |
| < 50         | High      | Update immediately |

### Scoring Examples
1. **Recent, no vulnerabilities**: 100 → **Low Risk**
2. **2 vulns + outdated**: 100 - 24 - 8 = 68 → **Medium Risk**
3. **4 vulns + outdated**: 100 - 48 - 8 = 44 → **High Risk**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request