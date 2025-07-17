FROM golang:1.21-alpine AS builder

# Install dependencies
RUN apk add --no-cache git protobuf protobuf-dev build-base

# Set working directory
WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Install protoc-gen-go tools
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Copy source code
COPY . .

# Generate protobuf files (only if needed)
RUN if [ ! -f "proto/pdf_generator.pb.go" ] || [ ! -f "proto/pdf_generator_grpc.pb.go" ]; then \
        echo "Generating protobuf files..." && \
        protoc --go_out=. --go_opt=paths=source_relative \
               --go-grpc_out=. --go-grpc_opt=paths=source_relative \
               proto/pdf_generator.proto; \
    else \
        echo "Protobuf files already exist, skipping generation"; \
    fi

# Build the application with explicit flags for cross-compilation
ARG TARGETARCH
ARG TARGETOS
RUN echo "Building for ${TARGETOS:-linux}/${TARGETARCH:-amd64}" && \
    CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64} \
    go build -a -ldflags '-extldflags "-static"' -o main .

# Verify the binary was created and check its properties
RUN ls -la main && file main && \
    echo "Binary size: $(du -h main | cut -f1)" && \
    echo "Build completed successfully"

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Expose port
EXPOSE 50051

# Run the application
CMD ["./main"]
