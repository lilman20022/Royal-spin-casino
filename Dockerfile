FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server ./server
COPY public ./public

EXPOSE 5000

CMD ["npm", "start"]
