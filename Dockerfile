FROM node:20-slim

# Install required system dependencies for PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY src ./src
COPY public ./public

# Create necessary directories
RUN mkdir -p /workspace/data \
    /workspace/templates \
    /workspace/output \
    && chmod -R 755 /workspace

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the web server
CMD ["npm", "run", "web"]
