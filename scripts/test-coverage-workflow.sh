#!/bin/bash

# Test script to simulate the GitHub Actions coverage workflow
echo "=== Coverage Generation Test ==="

echo "📊 Running tests with coverage..."
npx nx run-many -t test --coverage

echo ""
echo "📁 Creating combined coverage directory..."
mkdir -p coverage

echo ""
echo "🔍 Coverage files found:"
find . -name "lcov.info" | grep -v node_modules | head -10

echo ""
echo "📊 Coverage file statistics:"
if [ -f "serviceA/test-output/jest/coverage/lcov.info" ] && [ -f "serviceB/test-output/jest/coverage/lcov.info" ]; then
    echo "=== Combining LCOV files ==="
    cat serviceA/test-output/jest/coverage/lcov.info serviceB/test-output/jest/coverage/lcov.info > coverage/lcov.info
    echo "✅ Combined coverage report created"
    echo "ServiceA coverage lines: $(wc -l < serviceA/test-output/jest/coverage/lcov.info)"
    echo "ServiceB coverage lines: $(wc -l < serviceB/test-output/jest/coverage/lcov.info)"
    echo "Combined coverage lines: $(wc -l < coverage/lcov.info)"
elif [ -f "serviceA/test-output/jest/coverage/lcov.info" ]; then
    echo "=== Using ServiceA coverage only ==="
    cp serviceA/test-output/jest/coverage/lcov.info coverage/lcov.info
elif [ -f "serviceB/test-output/jest/coverage/lcov.info" ]; then
    echo "=== Using ServiceB coverage only ==="
    cp serviceB/test-output/jest/coverage/lcov.info coverage/lcov.info
else
    echo "⚠️ No LCOV files found, creating empty coverage report"
    touch coverage/lcov.info
fi

echo ""
echo "📈 Final coverage report:"
if [ -f "coverage/lcov.info" ]; then
    echo "Final coverage file size: $(wc -l < coverage/lcov.info) lines"
    echo "✅ Coverage report ready for SonarCloud and Codecov"
else
    echo "❌ No coverage report generated"
    exit 1
fi

echo ""
echo "🎉 Coverage workflow test completed successfully!"
echo "   GitHub Actions quality workflow should work correctly"
