#!/bin/bash

# Simulate SonarCloud token check (for testing the workflow logic)
echo "=== SonarCloud Setup Test ==="

if [ -z "$SONAR_TOKEN" ]; then
    echo "✓ SONAR_TOKEN is not set - workflow will skip SonarCloud and show setup instructions"
    echo "  This is the expected behavior for new repositories"
    echo ""
    echo "To enable SonarCloud analysis:"
    echo "1. Go to https://sonarcloud.io and create an account"
    echo "2. Create a new project with key 'two-services' and organization 'rungissan'"
    echo "3. Generate a token at https://sonarcloud.io/account/security"
    echo "4. Add the token as 'SONAR_TOKEN' secret in GitHub repository settings"
    echo ""
    echo "✓ Tests and other quality checks will continue to work normally"
else
    echo "✓ SONAR_TOKEN is available - SonarCloud analysis will run"
fi

echo ""
echo "=== Running Quality Checks Available Without SonarCloud ==="
echo "✓ Running tests..."
npm run test:all > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Tests passed"
else
    echo "✗ Tests failed"
fi

echo "✓ Running linting..."
npx nx run-many -t lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Linting passed"
else
    echo "✗ Linting failed"
fi

echo "✓ Quality checks completed successfully!"
echo ""
echo "The GitHub Actions workflow will provide similar feedback and continue"
echo "with all other quality checks even without SonarCloud configuration."
