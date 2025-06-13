const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting create allowance test...');
    
    // Step 1: Login first
    console.log('📝 Step 1: Logging in as admin...');
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
    
    // Step 2: Navigate to allowance extension
    console.log('📝 Step 2: Navigating to allowance extension...');
    await page.goto('http://localhost:5001/allowance/');
    await page.waitForTimeout(3000);
    
    // Step 3: Create new allowance
    console.log('📝 Step 3: Creating new allowance...');
    const newAllowanceButton = page.locator('button:has-text("New Allowance")');
    
    if (await newAllowanceButton.isVisible()) {
      await newAllowanceButton.click();
      await page.waitForTimeout(2000);
      
      // Fill the form
      console.log('📝 Filling allowance form...');
      
      // Description
      await page.fill('input[placeholder*="allowance"], input[placeholder*="Description"]', 'Pocket money');
      
      // Lightning address
      await page.fill('input[placeholder*="@"], input[placeholder*="Lightning"]', 'muddledsmell08@walletofsatoshi.com');
      
      // Amount
      await page.fill('input[type="number"]', '100');
      
      // Frequency - click dropdown and select Weekly
      await page.click('.q-select:has-text("Frequency")');
      await page.waitForTimeout(1000);
      await page.click('.q-item:has-text("Weekly")');
      
      // Take screenshot of filled form
      await page.screenshot({ path: 'tests/test-results/form-filled.png', fullPage: true });
      console.log('📸 Form screenshot saved');
      
      // Submit the form
      console.log('🖱️ Submitting form...');
      await page.click('button:has-text("Create Allowance")');
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check if allowance was created successfully
      const allowanceRow = page.locator('tr:has-text("Pocket money")');
      if (await allowanceRow.isVisible()) {
        console.log('✅ SUCCESS! Allowance "Pocket money" created successfully!');
        
        // Verify details
        const hasAmount = await allowanceRow.locator('text=100').isVisible();
        const hasAddress = await allowanceRow.locator('text=muddledsmell08@walletofsatoshi.com').isVisible();
        const hasFrequency = await allowanceRow.locator('text=weekly').isVisible();
        
        console.log('  ✓ Amount: 100 sats', hasAmount ? '✅' : '❌');
        console.log('  ✓ Address: muddledsmell08@walletofsatoshi.com', hasAddress ? '✅' : '❌');
        console.log('  ✓ Frequency: weekly', hasFrequency ? '✅' : '❌');
        
        await page.screenshot({ path: 'tests/test-results/create-allowance-success.png', fullPage: true });
        process.exit(0); // Success
      } else {
        console.log('❌ Allowance not found in table');
        
        // Check if dialog is still open (error state)
        const dialogOpen = await page.locator('.q-dialog').isVisible();
        if (dialogOpen) {
          console.log('⚠️ Form dialog still open - possible validation error');
          await page.screenshot({ path: 'tests/test-results/create-allowance-validation-error.png', fullPage: true });
          process.exit(1); // Failure
        }
      }
      
      // Final screenshot
      await page.screenshot({ path: 'tests/test-results/create-allowance-final.png', fullPage: true });
      
    } else {
      console.log('❌ New Allowance button not found');
      await page.screenshot({ path: 'tests/test-results/create-allowance-no-button.png', fullPage: true });
      process.exit(1); // Failure
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'tests/test-results/create-allowance-error.png', fullPage: true });
    process.exit(1); // Failure
  } finally {
    await browser.close();
  }
})();