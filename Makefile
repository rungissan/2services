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

health-check: ## Check health of running services
	curl -f http://localhost:3000/api || echo "ServiceA not responding"
	curl -f http://localhost:3001/api || echo "ServiceB not responding"

dev-setup: install build ## Complete development setup
	@echo "Development setup complete!"
	@echo "Run 'make serve-serviceA' or 'make serve-serviceB' to start development servers"
	@echo "Run 'make docker-compose-up' to start with Docker Compose"
