# Two Services - NestJS Microservices with Docker

This project contains two NestJS microservices (serviceA and serviceB) that can be run individually or together using Docker Compose.

## Architecture

- **ServiceA**: NestJS microservice running on port 3000
- **ServiceB**: NestJS microservice running on port 3001
- Both services are containerized using Docker
- Docker Compose orchestrates both services

## Prerequisites

- Node.js (v18 or higher)
- npm
- Docker
- Docker Compose

## Project Structure

```
two-services/
├── serviceA/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── serviceA-e2e/
├── serviceB/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── serviceB-e2e/
├── docker-compose.yml
├── docker-compose.dev.yml
└── package.json
```

## Development

### Running Services Individually

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run ServiceA:**
   ```bash
   npx nx serve serviceA
   # or
   npx nx run @two-services/serviceA:serve
   ```
   ServiceA will be available at: http://localhost:3000/api

3. **Run ServiceB:**
   ```bash
   npx nx serve serviceB
   # or
   npx nx run @two-services/serviceB:serve
   ```
   ServiceB will be available at: http://localhost:3001/api

### Building Services

1. **Build ServiceA:**
   ```bash
   npx nx build serviceA
   ```

2. **Build ServiceB:**
   ```bash
   npx nx build serviceB
   ```

3. **Build all services:**
   ```bash
   npx nx run-many -t build
   ```

### Testing

1. **Test ServiceA:**
   ```bash
   npx nx test serviceA
   ```

2. **Test ServiceB:**
   ```bash
   npx nx test serviceB
   ```

3. **Run E2E tests:**
   ```bash
   npx nx e2e serviceA-e2e
   npx nx e2e serviceB-e2e
   ```

## Docker

### Building Docker Images

1. **Build ServiceA Docker image:**
   ```bash
   npx nx docker-build serviceA
   ```

2. **Build ServiceB Docker image:**
   ```bash
   npx nx docker-build serviceB
   ```

### Running Individual Containers

1. **Run ServiceA container:**
   ```bash
   docker run -p 3000:3000 -t two-services-servicea
   ```

2. **Run ServiceB container:**
   ```bash
   docker run -p 3001:3001 -t two-services-serviceb
   ```

## Docker Compose

### Production Environment

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Start services in detached mode:**
   ```bash
   docker-compose up -d
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

4. **View logs:**
   ```bash
   docker-compose logs
   # or for specific service
   docker-compose logs servicea
   docker-compose logs serviceb
   ```

### Development Environment

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Start in detached mode:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

## API Endpoints

### ServiceA (Port 3000)
- **GET** `http://localhost:3000/api` - Health check
- **GET** `http://localhost:3000/api/health` - Health status

### ServiceB (Port 3001)
- **GET** `http://localhost:3001/api` - Health check
- **GET** `http://localhost:3001/api/health` - Health status

## Health Checks

Both services include health checks that can be monitored:
- Health checks run every 30 seconds
- 3 retries before marking as unhealthy
- 30-second startup grace period

## Networking

When running with Docker Compose, both services are connected via a custom bridge network `microservices-network`. This allows services to communicate with each other using their service names.

## Environment Variables

### ServiceA
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Port number (default: 3000)
- `HOST`: Host address (default: 0.0.0.0)

### ServiceB
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Port number (default: 3001)
- `HOST`: Host address (default: 0.0.0.0)

## Useful Commands

```bash
# View running containers
docker-compose ps

# Restart a specific service
docker-compose restart servicea

# Rebuild and start a specific service
docker-compose up --build servicea

# View resource usage
docker-compose top

# Clean up everything
docker-compose down -v --remove-orphans
docker system prune -a
```

## Security Features

- Non-root user execution in containers
- Proper file permissions
- Health checks for monitoring
- Network isolation using Docker networks

## Scaling

To scale services horizontally:

```bash
# Scale ServiceA to 3 instances
docker-compose up --scale servicea=3

# Scale ServiceB to 2 instances
docker-compose up --scale serviceb=2
```

Note: When scaling, you'll need to configure a load balancer or use different ports.

## Troubleshooting

1. **Port conflicts**: Ensure ports 3000 and 3001 are not in use by other applications
2. **Build failures**: Run `docker-compose down` and `docker-compose up --build` to rebuild
3. **Permission issues**: Check Docker daemon permissions and file ownership
4. **Health check failures**: Verify services are responding on their respective ports

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure Docker containers build successfully
5. Test both individual and composed service deployments

To create a production bundle:

```sh
npx nx build serviceA
```

To see all available targets to run for a project, run:

```sh
npx nx show project serviceA
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/node:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/node:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/node?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
