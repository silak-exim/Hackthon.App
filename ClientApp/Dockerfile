# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

#Remark เพื่อใช้กับ Zscaler ต้องเพิ่ม Certificate ลงไปใน Container ด้วย
COPY ZscalerRootCertificate-2048-SHA256.crt /usr/local/share/ca-certificates/ZscalerRootCertificate-2048-SHA256.crt

# Install ca-certificates and update with Zscaler cert (bypass SSL for initial apk)
# RUN apk add --no-cache --allow-untrusted ca-certificates && \
#     update-ca-certificates

# Copy package files
COPY package*.json ./

# Give the 'node' user ownership of the working directory.
RUN chown -R node:node .

# BEST PRACTICE: Switch to the 'node' user for all subsequent commands
USER node

ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/ZscalerRootCertificate-2048-SHA256.crt

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist/client-app/browser /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
