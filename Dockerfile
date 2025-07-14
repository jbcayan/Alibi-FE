# Use official Node.js image (alpine = small image)
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install dependencies based on the lock file
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci
# Copy all files except those in .dockerignore
COPY . .

# Build the Next.js app
RUN npm run build

# Expose Next.js default port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
