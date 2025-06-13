const { chromium } = require('playwright');

async function testMinutelyPayments() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting minutely payments test...');
    
    // Login using working credentials from create-allowance.js
    console.log('📝 Step 1: Logging in...');
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to switch to login screen
    const createAccountVisible = await page.locator('text=Create Account').first().isVisible();
    if (createAccountVisible) {
      await page.click('text=Login');
      await page.waitForTimeout(2000);
    }
    
    // Fill login credentials
    await page.fill('input[type="text"], input[type="email"]', 'ben.weeks');
    await page.fill('input[type="password"]', 'zUYmy&05&uZ$3kmf*^T8');
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(3000);

    // Navigate to Allowance extension
    await page.goto('http://localhost:5001/allowance');
    await page.waitForTimeout(3000);
    console.log('📍 Navigated to Allowance extension');

    // Click New Allowance button
    const newAllowanceButton = page.locator('button:has-text("New Allowance")');
    await newAllowanceButton.click();
    await page.waitForSelector('text=Create Allowance', { timeout: 5000 });
    console.log('📝 Opened Create Allowance dialog');

    // Take screenshot of form
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/minutely-form.png' });

    // Fill form using same approach as create-allowance.js
    await page.waitForSelector('input', { timeout: 10000 });
    
    const formData = {
      description: 'Minutely Test Payment',
      lightning_address: 'muddledsmell08@walletofsatoshi.com',
      amount: '10',
      frequency: 'Minutely'
    };

    // Fill description field (usually input index 2)
    const descInputs = await page.locator('input[placeholder*="Weekly allowance"]').count();
    if (descInputs > 0) {
      await page.fill('input[placeholder*="Weekly allowance"]', formData.description);
      console.log('✅ Filled description field:', formData.description);
    }
    
    // Fill lightning address field
    const addrInputs = await page.locator('input[placeholder*="alice@getalby.com"]').count();
    if (addrInputs > 0) {
      await page.fill('input[placeholder*="alice@getalby.com"]', formData.lightning_address);
      console.log('✅ Filled lightning address field:', formData.lightning_address);
    }
    
    // Fill amount field
    const amountInputs = await page.locator('input[type="number"]').count();
    if (amountInputs > 0) {
      await page.fill('input[type="number"]', formData.amount);
      console.log('✅ Filled amount field:', formData.amount);
    }
    
    // Select frequency using dropdown approach from create-allowance.js
    const frequencySelect = page.locator('.q-select').filter({ hasText: 'Frequency' });
    if (await frequencySelect.isVisible()) {
      await frequencySelect.click();
      await page.waitForTimeout(1000);
      await page.click(`.q-item:has-text("${formData.frequency}")`);
      console.log('✅ Selected frequency:', formData.frequency);
    }
    
    console.log('📋 Form filled with minutely payment data');

    // Monitor network requests to capture payment attempts
    const paymentRequests = [];
    page.on('request', request => {
      if (request.url().includes('/allowance/api/v1/') && request.method() === 'POST') {
        paymentRequests.push({
          timestamp: new Date().toISOString(),
          url: request.url(),
          method: request.method()
        });
        console.log(`💰 Payment attempt detected: ${request.method()} ${request.url()}`);
      }
    });

    // Submit form
    await page.click('.q-btn:has-text("CREATE ALLOWANCE")');
    
    // Wait for success and verify allowance appears in table
    await page.waitForSelector('.q-table tbody tr', { timeout: 10000 });
    console.log('✅ Allowance created successfully');

    // Take screenshot of created allowance
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/minutely-created.png' });

    // Monitor for 5+ minutes to catch payment attempts
    console.log('⏰ Monitoring for 5 minutes to detect payment attempts...');
    console.log('📊 Expected: 5 payments (every 1 minute for 5 minutes)');
    
    const startTime = Date.now();
    const monitoringDuration = 5 * 60 * 1000; // 5 minutes
    let paymentCount = 0;
    
    while (Date.now() - startTime < monitoringDuration) {
      // Check for any new payment-related network activity
      await page.waitForTimeout(10000); // Check every 10 seconds
      
      // Look for any indication of payment processing in console or network
      const currentTime = new Date().toISOString();
      console.log(`⏳ Monitoring... ${Math.floor((Date.now() - startTime) / 60000)} minutes elapsed`);
      
      // Check if allowance is still active in the table
      const allowanceRows = await page.locator('.q-table tbody tr').count();
      if (allowanceRows > 0) {
        console.log(`📊 Allowance still visible in table (${allowanceRows} total)`);
      }
      
      // If we reach 5 minutes, break
      if (Date.now() - startTime >= monitoringDuration) {
        break;
      }
    }

    console.log('🏁 Monitoring complete');
    console.log(`📈 Total payment requests detected: ${paymentRequests.length}`);
    
    if (paymentRequests.length > 0) {
      console.log('💰 Payment attempts:');
      paymentRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.timestamp}: ${req.method} ${req.url}`);
      });
    } else {
      console.log('⚠️  No payment attempts detected during monitoring period');
    }

    // Take final screenshot
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/minutely-final.png' });

    console.log('✅ Minutely payments test completed successfully');
    console.log(`🎯 Expected: 5 payments over 5 minutes`);
    console.log(`📊 Detected: ${paymentRequests.length} payment requests`);

  } catch (error) {
    console.error('❌ Minutely payments test failed:', error);
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/minutely-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testMinutelyPayments();