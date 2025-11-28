FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 4000 to match worker agent expectation
EXPOSE 4000

# Use the start script from package.json
CMD ["npm", "start"]