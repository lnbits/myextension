const { chromium } = require('playwright');

async function testEditWithApiVerification() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing edit allowance with API verification...');
    
    // Login first
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

    // Navigate to allowance extension
    await page.goto('http://localhost:5001/allowance');
    await page.waitForTimeout(3000);

    // Find first allowance
    const firstRow = page.locator('.q-table tbody tr').first();
    const rowExists = await firstRow.isVisible();
    
    if (!rowExists) {
      console.log('❌ No allowances found - creating one first');
      await page.click('button:has-text("New Allowance")');
      await page.waitForTimeout(2000);
      await page.fill('input[placeholder*="Weekly allowance"]', 'API Test Allowance');
      await page.fill('input[placeholder*="alice@getalby.com"]', 'test@walletofsatoshi.com');
      await page.fill('input[type="number"]', '75');
      
      const frequencySelect = page.locator('.q-select').filter({ hasText: 'Frequency' });
      await frequencySelect.click();
      await page.waitForTimeout(1000);
      await page.click('.q-item:has-text("Hourly")');
      
      await page.click('button:has-text("CREATE ALLOWANCE")');
      await page.waitForTimeout(3000);
      console.log('✅ Created test allowance');
    }

    // Get allowance ID from the table
    const allowanceId = await firstRow.locator('td').first().textContent();
    console.log(`📋 Testing allowance ID: ${allowanceId}`);

    // Get initial state via API (we'll need to extract the API key)
    let initialState = null;
    let apiKey = null;
    
    // Listen for API requests to capture the key
    page.on('request', request => {
      if (request.url().includes('/allowance/api/v1/allowance') && request.headers()['x-api-key']) {
        apiKey = request.headers()['x-api-key'];
      }
    });

    // Click edit to trigger an API call that will give us the key
    const editButton = firstRow.locator('button.text-light-blue');
    await editButton.click();
    await page.waitForTimeout(2000);

    // Now we have the API key, fetch the current state
    if (apiKey) {
      console.log(`🔑 Captured API key: ${apiKey.substring(0, 10)}...`);
      
      try {
        const response = await page.request.get(`http://localhost:5001/allowance/api/v1/allowance/${allowanceId}`, {
          headers: { 'X-API-Key': apiKey }
        });
        
        if (response.ok()) {
          initialState = await response.json();
          console.log('📊 Initial allowance state:');
          console.log(`  ID: ${initialState.id}`);
          console.log(`  Name: ${initialState.name}`);
          console.log(`  Amount: ${initialState.amount}`);
          console.log(`  Active: ${initialState.active} (type: ${typeof initialState.active})`);
          console.log(`  Frequency: ${initialState.frequency_type}`);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch initial state via API:', error.message);
      }
    }

    // Make changes to the form
    const newName = 'Updated API Test';
    const newAmount = '150';
    
    await page.fill('input[placeholder*="Weekly allowance"]', newName);
    await page.fill('input[type="number"]', newAmount);
    
    // Try to set active to ON
    const toggleChecked = await page.locator('.q-toggle input[type="checkbox"]').isChecked();
    console.log(`🔘 Toggle state before change: ${toggleChecked}`);
    
    if (!toggleChecked) {
      await page.click('.q-toggle');
      await page.waitForTimeout(500);
      const newToggleState = await page.locator('.q-toggle input[type="checkbox"]').isChecked();
      console.log(`🔘 Toggle state after click: ${newToggleState}`);
    }

    // Monitor the PUT request
    let putRequestData = null;
    let putResponse = null;
    
    page.on('request', request => {
      if (request.url().includes(`/allowance/api/v1/allowance/${allowanceId}`) && request.method() === 'PUT') {
        putRequestData = request.postData();
        console.log(`🌐 PUT request to: ${request.url()}`);
        console.log(`📤 PUT data: ${putRequestData}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes(`/allowance/api/v1/allowance/${allowanceId}`) && response.request().method() === 'PUT') {
        putResponse = response;
        console.log(`📥 PUT response: ${response.status()}`);
      }
    });

    // Submit the form
    await page.click('button:has-text("Update Allowance"), button:has-text("UPDATE ALLOWANCE")');
    await page.waitForTimeout(3000);

    // Check if PUT request was made
    if (putRequestData && putResponse) {
      console.log('✅ PUT request was made');
      
      if (putResponse.status() === 200) {
        console.log('✅ PUT request successful');
        
        // Verify the update via API
        try {
          const verifyResponse = await page.request.get(`http://localhost:5001/allowance/api/v1/allowance/${allowanceId}`, {
            headers: { 'X-API-Key': apiKey }
          });
          
          if (verifyResponse.ok()) {
            const updatedState = await verifyResponse.json();
            console.log('🔍 Updated allowance state from API:');
            console.log(`  ID: ${updatedState.id}`);
            console.log(`  Name: ${updatedState.name}`);
            console.log(`  Amount: ${updatedState.amount}`);
            console.log(`  Active: ${updatedState.active} (type: ${typeof updatedState.active})`);
            console.log(`  Frequency: ${updatedState.frequency_type}`);
            
            // Verify changes
            const nameUpdated = updatedState.name === newName;
            const amountUpdated = updatedState.amount.toString() === newAmount;
            const activeIsBoolean = typeof updatedState.active === 'boolean';
            
            console.log('\n📋 Verification Results:');
            console.log(`  ✓ Name updated: ${nameUpdated ? '✅' : '❌'} (${initialState?.name} → ${updatedState.name})`);
            console.log(`  ✓ Amount updated: ${amountUpdated ? '✅' : '❌'} (${initialState?.amount} → ${updatedState.amount})`);
            console.log(`  ✓ Active is boolean: ${activeIsBoolean ? '✅' : '❌'} (type: ${typeof updatedState.active})`);
            console.log(`  ✓ Active value: ${updatedState.active}`);
            
            if (nameUpdated && amountUpdated && activeIsBoolean) {
              console.log('\n🎉 EDIT TEST PASSED - API verification successful!');
            } else {
              console.log('\n❌ EDIT TEST FAILED - API verification found issues');
              process.exit(1);
            }
          }
        } catch (error) {
          console.log('❌ Could not verify update via API:', error.message);
          process.exit(1);
        }
      } else {
        console.log(`❌ PUT request failed with status: ${putResponse.status()}`);
        process.exit(1);
      }
    } else {
      console.log('❌ No PUT request was made - form did not submit');
      process.exit(1);
    }

    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-api-verification.png' });

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-api-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testEditWithApiVerification();