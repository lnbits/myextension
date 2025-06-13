const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test data table with variety of allowance configurations
const testAllowances = [
  {
    name: 'Daily Coffee Money',
    lightningAddress: 'coffee@getalby.com',
    amount: 25,
    frequency: 'daily'
  },
  {
    name: 'Weekly Lunch Fund',
    lightningAddress: 'lunch@walletofsatoshi.com',
    amount: 150,
    frequency: 'weekly'
  },
  {
    name: 'Monthly Gaming Budget',
    lightningAddress: 'gaming@strike.me',
    amount: 2000,
    frequency: 'monthly'
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
    
    // Run the create-allowance script with command line arguments
    const testProcess = spawn('node', [
      'create-allowance.js',
      allowanceData.name,
      allowanceData.lightningAddress,
      allowanceData.amount.toString(),
      allowanceData.frequency
    ], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Show key progress indicators
      if (text.includes('SUCCESS!') || text.includes('PASSED!') || text.includes('POST response: 201')) {
        console.log(`  ${text.trim()}`);
      }
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      if (success) {
        console.log(`✅ [${testIndex + 1}] SUCCESS: ${allowanceData.name} (${(duration/1000).toFixed(1)}s)`);
        results.passed++;
      } else {
        console.log(`❌ [${testIndex + 1}] FAILED: ${allowanceData.name} (${(duration/1000).toFixed(1)}s)`);
        results.failed++;
        
        // Show error details for failed tests
        if (errorOutput) {
          console.log(`   Error: ${errorOutput.slice(-200)}`);
        }
      }
      
      results.details.push({
        index: testIndex + 1,
        name: allowanceData.name,
        success,
        duration,
        exitCode: code
      });
      
      resolve({ success, duration });
    });
    
    // Set timeout for each test
    setTimeout(() => {
      testProcess.kill('SIGTERM');
      console.log(`⏰ [${testIndex + 1}] TIMEOUT: ${allowanceData.name}`);
      results.failed++;
      resolve({ success: false, duration: 60000, timeout: true });
    }, 90000); // 90 second timeout per test
  });
}

// Run tests sequentially
async function runAllTests() {
  console.log('🎬 Starting test execution...\n');
  
  for (let i = 0; i < testAllowances.length; i++) {
    await runAllowanceTest(testAllowances[i], i);
    
    // Brief pause between tests
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
    console.log(`${status} Test ${result.index}: ${result.name} (${(result.duration/1000).toFixed(1)}s)`);
  });
  
  // Save summary
  const reportPath = path.join(__dirname, 'test-results', 'variety-test-summary.txt');
  const reportContent = `
Allowance Variety Test Results - ${new Date().toISOString()}
${'='.repeat(60)}

Summary:
- Total Tests: ${results.total}
- Passed: ${results.passed}
- Failed: ${results.failed} 
- Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%

Test Configurations:
${testAllowances.map((a, i) => `${i+1}. ${a.name}: ${a.amount} sats ${a.frequency}`).join('\n')}

Results:
${results.details.map(r => `${r.success ? '✅' : '❌'} ${r.name} (${(r.duration/1000).toFixed(1)}s)`).join('\n')}
`;
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n📄 Summary saved to: ${reportPath}`);
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Start the test suite
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});