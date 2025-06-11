#!/bin/bash

echo "Running Allowance Creation Test..."
echo "Make sure LNBits is running on http://localhost:5001"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the specific test
echo "Running allowance creation test..."
npx playwright test create_allowance_test.js --headed --project=chromium

echo ""
echo "Test completed. Check the results above."
echo "Screenshots will be saved if there are any errors."