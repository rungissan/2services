#!/bin/bash

# Test script for PDF Generator Service

echo "=== PDF Generator Service Test ==="
echo ""

# Configuration
GRPC_HOST="localhost:50051"
SERVICE_B_HOST="localhost:3002"

# Check if grpcurl is installed
if ! command -v grpcurl &> /dev/null; then
    echo "grpcurl is not installed. Please install it to test gRPC endpoints."
    echo "Installation: brew install grpcurl"
    echo ""
fi

# Test 1: Check if PDF generator service is running
echo "1. Testing gRPC service availability..."
if command -v grpcurl &> /dev/null; then
    grpcurl -plaintext $GRPC_HOST list > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ PDF Generator gRPC service is running"
    else
        echo "❌ PDF Generator gRPC service is not accessible"
        exit 1
    fi
else
    echo "⚠️  Skipping gRPC test (grpcurl not available)"
fi

# Test 2: Test direct gRPC call
echo ""
echo "2. Testing direct gRPC report generation..."
if command -v grpcurl &> /dev/null; then
    grpcurl -plaintext -d '{
        "report_type": "test",
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-02T00:00:00Z",
        "metrics": ["temperature", "humidity"],
        "filters": {"source": "test"}
    }' $GRPC_HOST pdfgenerator.PDFGeneratorService/GenerateReport > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Direct gRPC call successful"
    else
        echo "❌ Direct gRPC call failed"
    fi
else
    echo "⚠️  Skipping direct gRPC test (grpcurl not available)"
fi

# Test 3: Test Service B HTTP endpoint
echo ""
echo "3. Testing Service B PDF generation endpoint..."
curl -s -X POST http://$SERVICE_B_HOST/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "test",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-02T00:00:00Z",
    "metrics": ["temperature", "humidity"],
    "filters": {"source": "test"}
  }' \
  --output test-report.pdf > /dev/null 2>&1

if [ $? -eq 0 ] && [ -f test-report.pdf ]; then
    echo "✅ Service B HTTP endpoint successful"
    echo "   Generated test-report.pdf ($(wc -c < test-report.pdf) bytes)"
else
    echo "❌ Service B HTTP endpoint failed"
fi

# Test 4: Test async report generation
echo ""
echo "4. Testing async report generation..."
ASYNC_RESPONSE=$(curl -s -X POST http://$SERVICE_B_HOST/reports/generate-async \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "async-test",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-02T00:00:00Z",
    "metrics": ["temperature"],
    "filters": {"source": "async-test"}
  }')

if [ $? -eq 0 ]; then
    echo "✅ Async report generation successful"
    echo "   Response: $ASYNC_RESPONSE"

    # Extract report ID if available
    REPORT_ID=$(echo $ASYNC_RESPONSE | grep -o '"reportId":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$REPORT_ID" ]; then
        echo ""
        echo "5. Testing report status endpoint..."
        STATUS_RESPONSE=$(curl -s http://$SERVICE_B_HOST/reports/status/$REPORT_ID)
        if [ $? -eq 0 ]; then
            echo "✅ Report status endpoint successful"
            echo "   Status: $STATUS_RESPONSE"
        else
            echo "❌ Report status endpoint failed"
        fi
    fi
else
    echo "❌ Async report generation failed"
fi

# Test 5: Test with sample data
echo ""
echo "6. Testing with sample Redis TimeSeries data..."
echo "   Adding sample data to Redis TimeSeries..."

# Add sample data to Redis TimeSeries (requires redis-cli)
if command -v redis-cli &> /dev/null; then
    redis-cli -h localhost -p 6380 -a password TS.ADD "ts:temperature:test:sample.json" "*" 25.5 LABELS metric temperature source test filename sample.json > /dev/null 2>&1
    redis-cli -h localhost -p 6380 -a password TS.ADD "ts:humidity:test:sample.json" "*" 65.2 LABELS metric humidity source test filename sample.json > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Sample data added to Redis TimeSeries"

        # Now test report generation with real data
        curl -s -X POST http://$SERVICE_B_HOST/reports/generate \
          -H "Content-Type: application/json" \
          -d '{
            "reportType": "sample-data",
            "startTime": "2024-01-01T00:00:00Z",
            "endTime": "2024-12-31T00:00:00Z",
            "metrics": ["temperature", "humidity"],
            "filters": {"source": "test", "filename": "sample.json"}
          }' \
          --output sample-data-report.pdf > /dev/null 2>&1

        if [ $? -eq 0 ] && [ -f sample-data-report.pdf ]; then
            echo "✅ Report with sample data generated successfully"
            echo "   Generated sample-data-report.pdf ($(wc -c < sample-data-report.pdf) bytes)"
        else
            echo "❌ Report generation with sample data failed"
        fi
    else
        echo "❌ Failed to add sample data to Redis TimeSeries"
    fi
else
    echo "⚠️  Skipping Redis TimeSeries test (redis-cli not available)"
fi

echo ""
echo "=== Test Summary ==="
echo "Generated files:"
if [ -f test-report.pdf ]; then
    echo "  - test-report.pdf ($(wc -c < test-report.pdf) bytes)"
fi
if [ -f sample-data-report.pdf ]; then
    echo "  - sample-data-report.pdf ($(wc -c < sample-data-report.pdf) bytes)"
fi

echo ""
echo "To view the generated PDF files, open them with your PDF viewer:"
echo "  open test-report.pdf"
echo "  open sample-data-report.pdf"

echo ""
echo "=== Manual Testing Commands ==="
echo ""
echo "1. Test gRPC directly:"
echo "   grpcurl -plaintext -d '{\"report_type\":\"manual\",\"start_time\":\"2024-01-01T00:00:00Z\",\"end_time\":\"2024-01-02T00:00:00Z\",\"metrics\":[\"temperature\"],\"filters\":{}}' $GRPC_HOST pdfgenerator.PDFGeneratorService/GenerateReport"
echo ""
echo "2. Test via Service B:"
echo "   curl -X POST http://$SERVICE_B_HOST/reports/generate -H 'Content-Type: application/json' -d '{\"reportType\":\"manual\",\"startTime\":\"2024-01-01T00:00:00Z\",\"endTime\":\"2024-01-02T00:00:00Z\",\"metrics\":[\"temperature\"],\"filters\":{}}' --output manual-report.pdf"
echo ""
echo "3. Add test data to Redis TimeSeries:"
echo "   redis-cli -h localhost -p 6380 -a password TS.ADD 'ts:temperature:manual:test.json' '*' 23.5 LABELS metric temperature source manual filename test.json"
echo ""
echo "4. Check Redis TimeSeries data:"
echo "   redis-cli -h localhost -p 6380 -a password TS.RANGE ts:temperature:manual:test.json 0 -1"
echo ""
echo "Test completed!"
