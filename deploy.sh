#!/bin/bash

# Navigate to server directory
cd server

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "Build completed successfully!"
