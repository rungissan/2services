#!/bin/bash

# Test script to simulate the PDF Generator Docker build workflow
echo "=== PDF Generator Build Test ==="

echo "📁 Current directory: $(pwd)"
echo "📁 Checking pdf-generator directory..."
if [ ! -d "pdf-generator" ]; then
    echo "❌ pdf-generator directory not found"
    exit 1
fi

cd pdf-generator

echo ""
echo "🔧 Testing Go environment..."
echo "Go version: $(go version)"

echo ""
echo "📦 Verifying Go modules..."
go mod tidy
go mod verify
if [ $? -ne 0 ]; then
    echo "❌ Go modules verification failed"
    exit 1
fi

echo ""
echo "🏗️ Testing Go build..."
go build -v .
if [ $? -ne 0 ]; then
    echo "❌ Go build failed"
    exit 1
fi

echo ""
echo "📋 Checking build artifacts..."
if [ -f "pdf-generator" ]; then
    echo "✅ Binary created: $(file pdf-generator)"
    echo "✅ Binary size: $(ls -lh pdf-generator | awk '{print $5}')"
else
    echo "❌ Binary not created"
    exit 1
fi

echo ""
echo "🐳 Testing Docker build context..."
echo "Files in build context:"
ls -la

echo ""
echo "📄 Checking Dockerfile..."
if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile exists"
    echo "Docker build context looks good for: context=./pdf-generator file=./pdf-generator/Dockerfile"
else
    echo "❌ Dockerfile not found"
    exit 1
fi

echo ""
echo "🎉 PDF Generator build test completed successfully!"
echo "   Docker workflow should work correctly in GitHub Actions"
