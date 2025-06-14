const { chromium } = require('playwright');

(async () => {
  console.log('📸 Testing Amount field alignment fix...');
  
  const browser = await chromium.launch({ headless: true, slowMo: 500 });
  const page = await browser.newPage();

  try {
    // Step 1: Login
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
    
    // Step 3: Open create allowance form
    console.log('📝 Step 3: Opening create allowance form...');
    const newAllowanceButton = page.locator('button:has-text("New Allowance")');
    
    if (await newAllowanceButton.isVisible()) {
      await newAllowanceButton.click();
      await page.waitForTimeout(2000);
      
      // Wait for form to appear
      await page.waitForSelector('input', { timeout: 10000 });
      
      // Fill some sample data to show the alignment
      console.log('📝 Filling sample data to demonstrate alignment...');
      
      // Fill description
      await page.fill('input[placeholder*="Weekly allowance"]', 'Test Alignment');
      
      // Fill lightning address
      await page.fill('input[placeholder*="alice@getalby.com"]', 'test@example.com');
      
      // Fill amount (this is the field we're testing)
      await page.fill('input[type="number"]', '100');
      
      await page.waitForTimeout(1000);
      
      // Take screenshot of the form with the alignment fix
      await page.screenshot({ 
        path: 'tests/test-results/amount-field-alignment-fix.png', 
        fullPage: true 
      });
      console.log('📸 Screenshot saved: amount-field-alignment-fix.png');
      
      // Also take a close-up of just the form area
      const formDialog = page.locator('.q-dialog .q-card');
      await formDialog.screenshot({ 
        path: 'tests/test-results/amount-field-alignment-fix-closeup.png'
      });
      console.log('📸 Close-up screenshot saved: amount-field-alignment-fix-closeup.png');
      
      console.log('✅ SUCCESS! Screenshots captured showing amount field alignment fix');
      process.exit(0);
      
    } else {
      console.log('❌ New Allowance button not found');
      await page.screenshot({ path: 'tests/test-results/alignment-test-error.png', fullPage: true });
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'tests/test-results/alignment-test-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();