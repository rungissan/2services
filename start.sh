#!/bin/bash

# Two Services Startup Script

set -e

echo "🚀 Two Services - NestJS Microservices Setup"
echo "============================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is available and running"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build services
echo "🔨 Building services..."
npx nx run-many -t build

echo "✅ Services built successfully"

# Function to start services
start_services() {
    echo "🐳 Starting services with Docker Compose..."
    docker-compose up --build
}

# Function to start development services
start_dev_services() {
    echo "🛠️  Starting development services..."
    echo "ServiceA will be available at: http://localhost:3000/api"
    echo "ServiceB will be available at: http://localhost:3001/api"
    echo ""
    echo "Press Ctrl+C to stop services"
    echo ""

    # Start services in development mode
    npx nx serve serviceA &
    SERVICE_A_PID=$!

    sleep 2

    npx nx serve serviceB &
    SERVICE_B_PID=$!

    # Wait for services to start
    sleep 5

    # Test services
    echo "🧪 Testing services..."
    curl -f http://localhost:3000/api && echo "✅ ServiceA is responding"
    curl -f http://localhost:3001/api && echo "✅ ServiceB is responding"

    # Wait for user interrupt
    wait $SERVICE_A_PID $SERVICE_B_PID
}

# Parse command line arguments
case "${1:-}" in
    "docker")
        start_services
        ;;
    "dev")
        start_dev_services
        ;;
    *)
        echo "Usage: $0 [docker|dev]"
        echo ""
        echo "  docker  - Start services with Docker Compose"
        echo "  dev     - Start services in development mode"
        echo ""
        echo "If no argument is provided, services will start with Docker Compose"
        start_services
        ;;
esac
