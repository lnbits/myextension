#!/bin/bash

echo "LNBits Allowance Extension Test Runner"
echo "====================================="
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create test-results directory if it doesn't exist
mkdir -p test-results

echo "Running all tests..."
echo ""

# Function to run a single test
run_test() {
    local test_file=$1
    echo ""
    echo "🚀 Running: $test_file"
    echo "----------------------------------------"
    node "$test_file"
    local exit_code=$?
    echo "----------------------------------------"
    if [ $exit_code -eq 0 ]; then
        echo "✅ $test_file completed"
    else
        echo "❌ $test_file failed with exit code $exit_code"
    fi
    return $exit_code
}

# Track overall success
all_passed=true

# Run each test
run_test "create-admin-account.js" || all_passed=false
run_test "login-test.js" || all_passed=false
run_test "create-allowance.js" || all_passed=false

echo ""
echo "====================================="
if [ "$all_passed" = true ]; then
    echo "✅ All tests completed successfully!"
else
    echo "⚠️  Some tests failed. Check output above."
fi

echo ""
echo "📸 Screenshots saved in: tests/test-results/"
echo ""
echo "Note: create-admin-account.js will skip gracefully if account exists"