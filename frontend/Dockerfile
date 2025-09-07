# Placeholder Dockerfile for frontend
# This will serve a simple HTML page until the frontend is implemented
FROM nginx:alpine

# Create a simple index.html
RUN echo '<html><head><title>Clinic Management System</title></head><body><h1>Frontend Coming Soon</h1><p>The frontend for the Clinic Management System will be implemented here.</p></body></html>' > /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
