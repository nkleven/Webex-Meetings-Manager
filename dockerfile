# Source Docker Image
FROM node:latest

# Working directory in the container
WORKDIR /usr/src/app

# Copy Package Json Files
COPY package*.json ./

RUN npm install

COPY . .

# Expose the Web Port
EXPOSE 4000

# Start the Server
CMD [ "node", "app.js"]