# Use the official Node.js Docker image as the base image
FROM node:18

# Set the working directory in the Docker container
WORKDIR /app

# Copy the rest of the application to the Docker container
COPY . .
# install
RUN npm install
# Build the deps
RUN npm run build

# Set the ENTRYPOINT directive
ENTRYPOINT [ "npm", "run", "start", "--" ]