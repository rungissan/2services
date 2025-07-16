# Makefile for Two Services

.PHONY: help install build test clean docker-build docker-run docker-compose-up docker-compose-down docker-compose-dev

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

build: ## Build all services
	npx nx run-many -t build

build-serviceA: ## Build ServiceA
	npx nx build serviceA

build-serviceB: ## Build ServiceB
	npx nx build serviceB

test: ## Run tests for all services
	npx nx run-many -t test

test-serviceA: ## Run ServiceA tests
	npx nx test serviceA

test-serviceB: ## Run ServiceB tests
	npx nx test serviceB

serve-serviceA: ## Serve ServiceA in development
	npx nx serve serviceA

serve-serviceB: ## Serve ServiceB in development
	npx nx serve serviceB

lint: ## Run linter for all services
	npx nx run-many -t lint

lint-serviceA: ## Run linter for ServiceA
	npx nx lint serviceA

lint-serviceB: ## Run linter for ServiceB
	npx nx lint serviceB

clean: ## Clean build artifacts
	rm -rf dist
	rm -rf node_modules/.cache
	rm -rf serviceA/dist
	rm -rf serviceB/dist

docker-build: ## Build Docker images for both services
	npx nx docker-build serviceA
	npx nx docker-build serviceB

docker-build-serviceA: ## Build Docker image for ServiceA
	npx nx docker-build serviceA

docker-build-serviceB: ## Build Docker image for ServiceB
	npx nx docker-build serviceB

docker-run-serviceA: ## Run ServiceA container
	docker run -p 3000:3000 -t two-services-servicea

docker-run-serviceB: ## Run ServiceB container
	docker run -p 3001:3001 -t two-services-serviceb

docker-compose-up: ## Start services with Docker Compose
	docker-compose up --build

docker-compose-up-detached: ## Start services with Docker Compose in detached mode
	docker-compose up -d --build

docker-compose-down: ## Stop services
	docker-compose down

docker-compose-dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up --build

docker-compose-dev-detached: ## Start development environment in detached mode
	docker-compose -f docker-compose.dev.yml up -d --build

docker-compose-logs: ## View Docker Compose logs
	docker-compose logs -f

docker-compose-logs-serviceA: ## View ServiceA logs
	docker-compose logs -f servicea

docker-compose-logs-serviceB: ## View ServiceB logs
	docker-compose logs -f serviceb

docker-compose-restart: ## Restart all services
	docker-compose restart

docker-compose-restart-serviceA: ## Restart ServiceA
	docker-compose restart servicea

docker-compose-restart-serviceB: ## Restart ServiceB
	docker-compose restart serviceb

docker-clean: ## Clean Docker resources
	docker-compose down -v --remove-orphans
	docker system prune -a -f

docker-clean-volumes: ## Clean Docker volumes (WARNING: This will delete all data)
	docker-compose down -v
	docker volume prune -f

mongo-cli: ## Connect to MongoDB CLI
	docker exec -it two-services-mongodb mongosh -u admin -p password --authenticationDatabase admin

redis-cli: ## Connect to Redis CLI
	docker exec -it two-services-redis redis-cli -a password

redis-timeseries-cli: ## Connect to Redis TimeSeries CLI
	docker exec -it two-services-redis-timeseries redis-cli -a password

redis-pubsub-cli: ## Connect to Redis Pub/Sub CLI
	docker exec -it two-services-redis-pubsub redis-cli -a password

docker-db-only: ## Start only database services
	docker-compose up -d mongodb redis redis-timeseries redis-pubsub

docker-services-only: ## Start only application services
	docker-compose up -d servicea serviceb

health-check: ## Check health of running services
	curl -f http://localhost:3000/api || echo "ServiceA not responding"
	curl -f http://localhost:3001/api || echo "ServiceB not responding"
	docker exec two-services-mongodb mongosh --eval "db.adminCommand('ping')" || echo "MongoDB not responding"
	docker exec two-services-redis redis-cli -a password ping || echo "Redis not responding"

backup-mongodb: ## Backup MongoDB data
	docker exec two-services-mongodb mongodump --username admin --password password --authenticationDatabase admin --out /tmp/backup
	docker cp two-services-mongodb:/tmp/backup ./backup-$(shell date +%Y%m%d_%H%M%S)

restore-mongodb: ## Restore MongoDB data (specify BACKUP_DIR)
	@if [ -z "$(BACKUP_DIR)" ]; then echo "Please specify BACKUP_DIR=path/to/backup"; exit 1; fi
	docker cp $(BACKUP_DIR) two-services-mongodb:/tmp/restore
	docker exec two-services-mongodb mongorestore --username admin --password password --authenticationDatabase admin /tmp/restore

monitor-logs: ## Monitor all service logs
	docker-compose logs -f servicea serviceb mongodb redis redis-timeseries redis-pubsub

dev-setup: install build ## Complete development setup
	@echo "Development setup complete!"
	@echo "Run 'make serve-serviceA' or 'make serve-serviceB' to start development servers"
	@echo "Run 'make docker-compose-up' to start with Docker Compose"
	@echo "Run 'make docker-db-only' to start only database services"
