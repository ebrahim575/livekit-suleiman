#!/bin/bash

# Navigate to the frontend directory (in case script is run from elsewhere)
cd ai-voice-assistant

# Clean install to avoid conflicts
echo "Cleaning previous installations..."
rm -rf node_modules package-lock.json

# Install dependencies with legacy peer deps to handle conflicts
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Ensure next is installed globally
if ! command -v next &> /dev/null; then
    echo "Installing next globally..."
    npm install -g next
fi

# Build and start the application
echo "Building and starting frontend application..."
npm run build
next start