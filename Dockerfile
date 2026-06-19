FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY server ./server
COPY src ./src
COPY public ./public
COPY index.html ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY vite.config.js ./

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
