#!/bin/bash

# Start both services with proper ports
echo "Starting Service A on port 3001..."
PORT=3001 npm run dev:serviceA &
SERVICE_A_PID=$!

echo "Starting Service B on port 3002..."
PORT=3002 npm run dev:serviceB &
SERVICE_B_PID=$!

echo "Services started!"
echo "Service A: http://localhost:3001/api"
echo "Service A Swagger: http://localhost:3001/api/docs"
echo "Service B: http://localhost:3002/api"
echo "Service B Swagger: http://localhost:3002/api/docs"

# Wait for services to start
sleep 5

# Check if services are running
echo "Checking service health..."
curl -s http://localhost:3001/api > /dev/null && echo "✅ Service A is running" || echo "❌ Service A is not responding"
curl -s http://localhost:3002/api > /dev/null && echo "✅ Service B is running" || echo "❌ Service B is not responding"

# Keep script running
wait $SERVICE_A_PID $SERVICE_B_PID
