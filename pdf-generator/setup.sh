#!/bin/bash

# Install protoc if not installed
if ! command -v protoc &> /dev/null; then
    echo "Installing protoc..."
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install protobuf
    # For Ubuntu/Debian
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y protobuf-compiler
    fi
fi

# Install Go protobuf plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate protobuf files
echo "Generating protobuf files..."
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/pdf_generator.proto

echo "Protobuf files generated successfully!"

# Initialize Go module if not exists
if [ ! -f "go.mod" ]; then
    go mod init pdf-generator
fi

# Download dependencies
go mod tidy

echo "Setup complete!"
