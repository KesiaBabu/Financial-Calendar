# Stage 1: Build the app
FROM node:18 AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the React app using Vite
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy build output to Nginx's public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
