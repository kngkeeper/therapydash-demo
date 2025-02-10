#!/bin/bash

# Check if npm exists
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ..
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies"
    exit 1
fi

# Start backend
echo "Starting backend..."
cd backend
node app.js &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ..
npm start

# Cleanup backend process on script exit
trap "kill $BACKEND_PID" EXIT