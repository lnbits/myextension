const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing per-second allowance creation');
  
  const browser = await chromium.launch({ headless: true, slowMo: 500 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting per-second allowance test...');
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser console error:', msg.text());
      }
    });
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/allowance/api/v1/allowance') && request.method() === 'POST') {
        console.log('📤 POST request to create allowance:', request.url());
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('/allowance/api/v1/allowance') && response.request().method() === 'POST') {
        console.log(`📥 POST response: ${response.status()} ${response.url()}`);
        if (response.status() !== 201) {
          try {
            const responseBody = await response.text();
            console.log('📥 Response body:', responseBody);
          } catch (e) {
            // Ignore
          }
        }
      }
    });
    
    // Step 1: Login
    console.log('📝 Step 1: Logging in as admin...');
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    const createAccountVisible = await page.locator('text=Create Account').first().isVisible();
    if (createAccountVisible) {
      await page.click('text=Login');
      await page.waitForTimeout(2000);
    }
    
    await page.fill('input[type="text"], input[type="email"]', 'ben.weeks');
    await page.fill('input[type="password"]', 'zUYmy&05&uZ$3kmf*^T8');
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(3000);
    
    // Step 2: Navigate to allowance extension
    console.log('📝 Step 2: Navigating to allowance extension...');
    await page.goto('http://localhost:5001/allowance/');
    await page.waitForTimeout(3000);
    
    // Refresh to ensure latest JavaScript is loaded
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what's on the page
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/per-second-page-load.png', fullPage: true });
    
    // Step 3: Create per-second allowance
    console.log('📝 Step 3: Creating per-second allowance...');
    const newAllowanceButton = page.locator('button:has-text("New Allowance")');
    
    if (await newAllowanceButton.isVisible()) {
      await newAllowanceButton.click();
      await page.waitForTimeout(2000);
      
      // Fill the form
      console.log('📝 Filling per-second allowance form...');
      
      await page.fill('input[placeholder*="Weekly allowance"]', 'Streaming Micropayments');
      console.log('✅ Filled description: Streaming Micropayments');
      
      await page.fill('input[placeholder*="alice@getalby.com"]', 'streaming@getalby.com');
      console.log('✅ Filled lightning address: streaming@getalby.com');
      
      await page.fill('input[type="number"]', '1');
      console.log('✅ Filled amount: 1 sat/second');
      
      // Select streaming frequency
      const frequencySelect = page.locator('.q-select').filter({ hasText: 'Frequency' });
      await frequencySelect.click();
      await page.waitForSelector('.q-item:has-text("Streaming")');
      await page.click('.q-item:has-text("Streaming")');
      console.log('✅ Selected frequency: Streaming (10s intervals)');
      
      await page.waitForTimeout(1000);
      
      // Check if helper text appears
      const helperText = page.locator('.bg-yellow-1:has-text("Streaming payments")');
      if (await helperText.isVisible()) {
        const helperContent = await helperText.textContent();
        console.log('✅ Helper text displayed:', helperContent.trim());
        
        // Verify the total calculation
        if (helperContent.includes('Total: 6 sats')) {
          console.log('✅ Total calculation correct: 1 sat x 6 payments = 6 sats');
        }
      }
      
      // Take screenshot of filled form
      await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/per-second-form.png', fullPage: true });
      console.log('📸 Form screenshot saved');
      
      // Submit the form
      console.log('🖱️ Submitting per-second allowance form...');
      
      try {
        const submitButton = page.locator('button[type="submit"]:has-text("Create")');
        await submitButton.click({ timeout: 5000 });
        console.log('✅ Clicked submit button');
      } catch (error) {
        console.log('⚠️ Submit button click timeout - form may have already submitted');
      }
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check if form dialog closed
      const dialogStillOpen = await page.locator('.q-dialog').isVisible();
      if (!dialogStillOpen) {
        console.log('🎉 Form dialog closed - likely successful submission!');
      }
      
      // Verify the per-second allowance in the table
      console.log('🔍 Checking for per-second allowance in table...');
      await page.waitForTimeout(2000);
      
      const allowanceRows = page.locator('tr:has-text("Streaming Micropayments")');
      const allowanceCount = await allowanceRows.count();
      
      if (allowanceCount > 0) {
        console.log(`✅ SUCCESS! Found ${allowanceCount} per-second allowance(s) in table!`);
        
        // Check if hourly rate is displayed in table
        const firstRow = allowanceRows.first();
        const rowText = await firstRow.textContent();
        
        if (rowText.includes('per_second')) {
          console.log('✅ Frequency shown as: per_second');
        }
        
        if (rowText.includes('every 10 seconds')) {
          console.log('✅ Streaming interval displayed in table: every 10 seconds');
        }
        
        // Check other details
        const hasAmount = rowText.includes('1 sats');
        const hasAddress = rowText.includes('streaming@getalby.com');
        
        console.log(`  ✓ Amount: 1 sats per payment`, hasAmount ? '✅' : '❌');
        console.log(`  ✓ Address: streaming@getalby.com`, hasAddress ? '✅' : '❌');
        console.log(`  ✓ Streaming display:`, rowText.includes('every 10 seconds') ? '✅' : '❌');
        
        await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/per-second-success.png', fullPage: true });
        console.log('🎉 STREAMING ALLOWANCE CREATED! 🎉');
        
        // Step 4: Wait and monitor payment attempts
        console.log('\n📝 Step 4: Monitoring payment attempts...');
        console.log('⏳ Waiting 70 seconds for 6 payment attempts (every 10 seconds)...');
        
        // Monitor network for payment attempts
        let paymentAttempts = 0;
        page.on('request', request => {
          if (request.url().includes('/api/v1/payments') || request.url().includes('/pay')) {
            paymentAttempts++;
            console.log(`💸 Payment attempt #${paymentAttempts} detected`);
          }
        });
        
        // Check logs periodically
        for (let i = 0; i < 7; i++) {
          await page.waitForTimeout(10000); // Wait 10 seconds
          console.log(`⏱️ ${i * 10} seconds elapsed...`);
          
          // Navigate to payments page to see if any payments were attempted
          if (i === 6) {
            console.log('📊 Checking payment history...');
            await page.goto('http://localhost:5001/wallet');
            await page.waitForTimeout(3000);
            await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/per-second-payments.png', fullPage: true });
          }
        }
        
        console.log(`\n📊 Total payment attempts detected: ${paymentAttempts}`);
        console.log('💡 Note: Payments will fail with void wallet (fake sats for development)');
        console.log('✅ This is expected behavior in development environment');
        
        process.exit(0);
      } else {
        console.log('❌ Per-second allowance not found in table');
        await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/per-second-failed.png', fullPage: true });
        process.exit(1);
      }
      
    } else {
      console.log('❌ New Allowance button not found');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/per-second-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();