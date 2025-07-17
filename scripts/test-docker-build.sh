#!/bin/bash

# Test script to simulate the Docker workflow build steps
echo "=== Docker Build Workflow Test ==="

services=("serviceA" "serviceB" "pdf-generator")

for service in "${services[@]}"; do
    echo ""
    echo "Testing $service build pipeline..."

    if [ "$service" = "serviceA" ] || [ "$service" = "serviceB" ]; then
        echo "📦 Building Node.js service: $service"

        # Simulate the build step
        npx nx build $service

        # Check if dist directory exists
        if [ -d "$service/dist" ]; then
            echo "✅ $service/dist directory exists"
            echo "   Contents:"
            ls -la "$service/dist/"
            echo "✅ Ready for Docker build"
        else
            echo "❌ $service/dist directory not found"
            exit 1
        fi

    elif [ "$service" = "pdf-generator" ]; then
        echo "🔧 Building Go service: $service"

        # Simulate Go build
        cd pdf-generator
        go build -v .
        cd ..

        if [ -f "pdf-generator/pdf-generator" ]; then
            echo "✅ pdf-generator binary exists"
            echo "✅ Ready for Docker build"
        else
            echo "❌ pdf-generator binary not found"
            exit 1
        fi
    fi
done

echo ""
echo "🎉 All services build successfully!"
echo "   Docker workflow should work correctly in GitHub Actions"
