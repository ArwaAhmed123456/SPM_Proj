# Frontend React Application

This is the frontend React application for the Software Project Management (SPM) project. It provides a user interface for interacting with the backend API to manage dependencies and related functionalities.

## Technologies Used

- **React**: JavaScript library for building user interfaces
- **React DOM**: React rendering library for the web
- **Axios**: HTTP client for making API requests
- **React Scripts**: Build scripts and development server for React apps

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

## Installation

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

### Development Mode
```
npm start
```

This will start the development server and open the application in your default browser at `http://localhost:3000`.

### Production Build
```
npm run build
```

This creates an optimized production build in the `build` folder.

### Testing
```
npm test
```

Launches the test runner in interactive watch mode.

### Eject (Not Recommended)
```
npm run eject
```

**Note:** This command will remove the single build dependency from your project. It's a one-way operation and should only be used if you need full control over the build tools.

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/                    # Source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API service functions
│   ├── utils/              # Utility functions
│   └── index.js            # Application entry point
├── package.json            # Dependencies and scripts
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## API Integration

The frontend communicates with the backend API (typically running on `http://localhost:5000`). Make sure the backend server is running before starting the frontend.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request