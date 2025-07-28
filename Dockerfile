# Use official Node.js image (alpine = small image)
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all project files
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the production server
CMD ["npm", "run", "start:prod"]
