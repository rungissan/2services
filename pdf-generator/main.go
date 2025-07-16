package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"pdf-generator/internal/redis"
	"pdf-generator/internal/service"
	"pdf-generator/proto"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	// Configuration from environment variables
	grpcPort := getEnvOrDefault("GRPC_PORT", "50051")
	redisAddr := getEnvOrDefault("REDIS_TIMESERIES_ADDR", "localhost:6380")
	redisPassword := getEnvOrDefault("REDIS_PASSWORD", "password")

	// Create Redis client
	redisClient := redis.NewRedisClient(redisAddr, redisPassword, 0)

	// Create PDF service
	pdfService := service.NewPDFService(redisClient)

	// Create gRPC server
	server := grpc.NewServer(
		grpc.ConnectionTimeout(30 * time.Second),
	)

	// Register service
	proto.RegisterPDFGeneratorServiceServer(server, pdfService)

	// Enable reflection for testing
	reflection.Register(server)

	// Create listener
	listener, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", grpcPort, err)
	}

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Shutting down gRPC server...")
		server.GracefulStop()
		redisClient.Close()
	}()

	log.Printf("PDF Generator gRPC server starting on port %s", grpcPort)
	log.Printf("Connected to Redis TimeSeries at %s", redisAddr)

	if err := server.Serve(listener); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Health check endpoint (optional)
func healthCheck(ctx context.Context) error {
	// Add any health check logic here
	return nil
}
