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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request