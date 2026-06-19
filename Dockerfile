FROM node:18-alpine AS build

WORKDIR /app

# Install all dependencies (including devDependencies for Vite)
COPY package*.json ./
RUN npm ci

# Copy source files needed for the frontend build
COPY index.html ./
COPY src ./src
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY vite.config.js ./

# Build the frontend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy server files
COPY server ./server

# Copy built frontend assets from build stage
COPY --from=build /app/dist ./dist

# Start application
CMD ["npm", "start"]
