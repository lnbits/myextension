const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting enable allowance extension test...');
    
    // Step 1: Login first (reuse login logic)
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
    
    // Verify login success
    const walletVisible = await page.locator('text="Add a new wallet"').isVisible();
    if (!walletVisible) {
      console.log('❌ Login failed');
      await page.screenshot({ path: 'tests/test-results/enable-allowance-login-failed.png', fullPage: true });
      process.exit(1);
    }
    
    console.log('✅ Login successful');
    
    // Close any open dialogs that might be blocking clicks
    const dialogVisible = await page.locator('.q-dialog').isVisible();
    if (dialogVisible) {
      console.log('📝 Closing open dialog...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    // Step 2: Navigate to Extensions
    console.log('📝 Step 2: Navigating to Extensions...');
    await page.click('a:has-text("Extensions")');
    await page.waitForTimeout(3000);
    
    // Step 3: Find and enable Allowance extension
    console.log('📝 Step 3: Looking for Allowance extension...');
    
    // Find the card that contains "Allowance" text
    const allowanceCard = page.locator('.q-card:has(.text-h5:has-text("Allowance"))');
    
    if (!(await allowanceCard.isVisible())) {
      console.log('❌ Allowance extension card not found');
      await page.screenshot({ path: 'tests/test-results/enable-allowance-not-found.png', fullPage: true });
      process.exit(1);
    }
    
    console.log('✅ Found Allowance extension card');
    
    // Step 4: Check if extension is already enabled, if not enable it
    console.log('📝 Step 4: Checking extension status...');
    const disableButtonVisible = await allowanceCard.locator('button:has-text("Disable")').isVisible();
    
    if (disableButtonVisible) {
      console.log('✅ Extension is already enabled (Disable button visible)');
    } else {
      console.log('📝 Extension not enabled, looking for Enable button...');
      
      // Look for Enable button or toggle to enable
      const enableButton = allowanceCard.locator('button:has-text("Enable")');
      const toggleButton = allowanceCard.locator('.q-toggle');
      
      if (await enableButton.isVisible()) {
        console.log('📝 Clicking Enable button...');
        await enableButton.click();
      } else if (await toggleButton.isVisible()) {
        console.log('📝 Clicking toggle...');
        await toggleButton.click();
      } else {
        console.log('❌ No Enable button or toggle found');
        await page.screenshot({ path: 'tests/test-results/enable-allowance-no-enable-button.png', fullPage: true });
        process.exit(1);
      }
      
      await page.waitForTimeout(2000);
      
      // Re-check if enabled by looking for Disable button
      const newDisableButtonVisible = await allowanceCard.locator('button:has-text("Disable")').isVisible();
      
      if (!newDisableButtonVisible) {
        console.log('❌ Failed to enable extension - Disable button not found');
        await page.screenshot({ path: 'tests/test-results/enable-allowance-enable-failed.png', fullPage: true });
        process.exit(1);
      }
      
      console.log('✅ Extension enabled successfully (Disable button now visible)');
    }
    
    const enabledIndicator = await allowanceCard.locator('button:has-text("Disable")').isVisible();
    
    if (enabledIndicator) {
      console.log('✅ Allowance extension enabled successfully!');
      await page.screenshot({ path: 'tests/test-results/enable-allowance-success.png', fullPage: true });
      
      // Try to navigate to the allowance extension to verify it works
      console.log('📝 Step 5: Verifying extension access...');
      await page.goto('http://localhost:5001/allowance/');
      await page.waitForTimeout(5000); // Give more time for extension to load
      
      const allowancePageLoaded = await page.locator('text="New Allowance"').isVisible();
      if (allowancePageLoaded) {
        console.log('✅ Allowance extension is accessible!');
        await page.screenshot({ path: 'tests/test-results/enable-allowance-verified.png', fullPage: true });
        process.exit(0); // Success
      } else {
        console.log('⚠️ Extension enabled but page not accessible');
        await page.screenshot({ path: 'tests/test-results/enable-allowance-access-failed.png', fullPage: true });
        process.exit(1); // Failure
      }
    } else {
      console.log('❌ Failed to enable Allowance extension');
      await page.screenshot({ path: 'tests/test-results/enable-allowance-failed.png', fullPage: true });
      process.exit(1); // Failure
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'tests/test-results/enable-allowance-error.png', fullPage: true });
    process.exit(1); // Failure
  } finally {
    await browser.close();
  }
})();