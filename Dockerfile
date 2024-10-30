# 1. Specify the base image from Docker Hub. Node.js 18 is a good option for many Express apps.
FROM node:18

# 2. Set the working directory in the container to /app.
WORKDIR /app

# 3. Copy only the package.json and package-lock.json files to install dependencies.
COPY package*.json ./

# 4. Install dependencies using npm.
RUN npm install

# 5. Copy the rest of the app's code into the container.
COPY . .

# 6. Define the environment variable for the port Cloud Run uses.
ENV PORT 8080

# 7. Expose port 8080 (for Cloud Run or local use).
EXPOSE 8080

# 8. Define the command to run the app.
CMD ["npm", "start"]
