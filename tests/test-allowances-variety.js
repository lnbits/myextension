const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test data table with variety of allowance configurations
const testAllowances = [
  {
    name: 'Daily Coffee Money',
    lightningAddress: 'coffee@getalby.com',
    amount: 25,
    frequency: 'daily',
    description: 'Daily coffee allowance for work'
  },
  {
    name: 'Weekly Lunch Fund',
    lightningAddress: 'lunch@walletofsatoshi.com',
    amount: 150,
    frequency: 'weekly', 
    description: 'Weekly lunch budget'
  },
  {
    name: 'Monthly Gaming Budget',
    lightningAddress: 'gaming@strike.me',
    amount: 2000,
    frequency: 'monthly',
    description: 'Monthly gaming and entertainment fund'
  },
  {
    name: 'Daily Transport',
    lightningAddress: 'transport@blink.sv',
    amount: 50,
    frequency: 'daily',
    description: 'Daily public transport costs'
  },
  {
    name: 'Weekly Groceries',
    lightningAddress: 'groceries@phoenix.acinq.co',
    amount: 500,
    frequency: 'weekly',
    description: 'Weekly grocery shopping allowance'
  },
  {
    name: 'Monthly Subscription Box',
    lightningAddress: 'subs@muun.com',
    amount: 800,
    frequency: 'monthly',
    description: 'Monthly subscription services'
  },
  {
    name: 'Daily Snacks',
    lightningAddress: 'snacks@lnpay.co',
    amount: 15,
    frequency: 'daily',
    description: 'Small daily snack allowance'
  },
  {
    name: 'Weekly Books',
    lightningAddress: 'books@lntxbot.com',
    amount: 300,
    frequency: 'weekly',
    description: 'Weekly book purchasing budget'
  },
  {
    name: 'Monthly Hobby Fund',
    lightningAddress: 'hobby@tippin.me',
    amount: 1200,
    frequency: 'monthly',
    description: 'Monthly hobby and craft supplies'
  },
  {
    name: 'Daily Podcast Tips',
    lightningAddress: 'podcast@fountain.fm',
    amount: 10,
    frequency: 'daily',
    description: 'Daily podcast creator tips'
  }
];

// Results tracking
const results = {
  total: testAllowances.length,
  passed: 0,
  failed: 0,
  details: []
};

console.log('🚀 Starting comprehensive allowance creation test suite...');
console.log(`📊 Testing ${testAllowances.length} different allowance configurations\n`);

// Display test plan
console.log('📋 TEST PLAN:');
testAllowances.forEach((allowance, index) => {
  console.log(`${index + 1}. ${allowance.name}: ${allowance.amount} sats ${allowance.frequency} to ${allowance.lightningAddress}`);
});
console.log('');

// Function to run a single test
function runAllowanceTest(allowanceData, testIndex) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`🔄 [${testIndex + 1}/${testAllowances.length}] Testing: ${allowanceData.name}`);
    
    // Write test data to temporary file for the script to read
    const testDataPath = path.join(__dirname, 'current-test-data.json');
    fs.writeFileSync(testDataPath, JSON.stringify(allowanceData, null, 2));
    
    // Run the create-allowance script
    const testProcess = spawn('node', ['create-allowance-parameterized.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      if (success) {
        console.log(`✅ [${testIndex + 1}] SUCCESS: ${allowanceData.name} (${duration}ms)`);
        results.passed++;
      } else {
        console.log(`❌ [${testIndex + 1}] FAILED: ${allowanceData.name} (${duration}ms)`);
        results.failed++;
      }
      
      results.details.push({
        index: testIndex + 1,
        name: allowanceData.name,
        success,
        duration,
        output: output.slice(-500), // Keep last 500 chars
        error: errorOutput.slice(-500)
      });
      
      // Clean up test data file
      if (fs.existsSync(testDataPath)) {
        fs.unlinkSync(testDataPath);
      }
      
      resolve({ success, duration });
    });
    
    // Set timeout for each test
    setTimeout(() => {
      testProcess.kill('SIGTERM');
      console.log(`⏰ [${testIndex + 1}] TIMEOUT: ${allowanceData.name}`);
      results.failed++;
      resolve({ success: false, duration: 60000, timeout: true });
    }, 60000); // 60 second timeout per test
  });
}

// Run tests sequentially
async function runAllTests() {
  console.log('🎬 Starting test execution...\n');
  
  for (let i = 0; i < testAllowances.length; i++) {
    await runAllowanceTest(testAllowances[i], i);
    
    // Brief pause between tests to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 DETAILED RESULTS:');
  results.details.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} Test ${result.index}: ${result.name} (${result.duration}ms)`);
  });
  
  // Save detailed results to file
  const reportPath = path.join(__dirname, 'test-results', 'variety-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / results.total) * 100).toFixed(1)
    },
    testData: testAllowances,
    results: results.details
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Final screenshot of the allowances table
  console.log('📸 Taking final screenshot of all allowances...');
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Start the test suite
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});