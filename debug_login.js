const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 2000 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Debugging LNBits login process...');
    
    // Navigate to LNBits
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of home page
    await page.screenshot({ path: 'lnbits-home.png', fullPage: true });
    console.log('📸 Home page screenshot saved');
    
    // Log what we see on the page
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    const pageText = await page.locator('body').textContent();
    console.log('📄 Page contains:', pageText.substring(0, 300) + '...');
    
    // Look for wallet creation interface
    console.log('🔍 Looking for wallet interface...');
    
    // Check for different possible wallet interfaces
    const walletButtons = await page.locator('button').allTextContents();
    console.log('🔘 Available buttons:', walletButtons);
    
    // Look for wallet creation or existing wallets
    const addWalletBtn = page.locator('button:has-text("Add"), button:has-text("wallet"), button[class*="wallet"]').first();
    
    if (await addWalletBtn.isVisible()) {
      console.log('✅ Found wallet button, clicking...');
      await addWalletBtn.click();
      await page.waitForTimeout(3000);
      
      // Take screenshot after click
      await page.screenshot({ path: 'after-wallet-click.png', fullPage: true });
      console.log('📸 After wallet click screenshot saved');
      
      // Fill wallet form if needed
      const nameInput = page.locator('input').first();
      if (await nameInput.isVisible()) {
        console.log('✏️ Filling wallet name...');
        await nameInput.fill('LNbits wallet');
        
        // Look for create/add button
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Add")').first();
        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // Try to access allowance extension
    console.log('🎯 Attempting to access allowance extension...');
    await page.goto('http://localhost:5001/allowance/');
    await page.waitForTimeout(3000);
    
    // Take screenshot of allowance page
    await page.screenshot({ path: 'allowance-attempt.png', fullPage: true });
    console.log('📸 Allowance page screenshot saved');
    
    const allowancePageText = await page.locator('body').textContent();
    console.log('📄 Allowance page content:', allowancePageText.substring(0, 300));
    
    // If we get authentication error, try different approach
    if (allowancePageText.includes('Missing user ID') || allowancePageText.includes('token')) {
      console.log('🔄 Authentication error, trying extension menu approach...');
      
      // Go to main page and look for extensions
      await page.goto('http://localhost:5001/');
      await page.waitForTimeout(2000);
      
      // Look for extensions or menu
      const menuItems = await page.locator('a, button').allTextContents();
      console.log('🔗 Available menu items:', menuItems);
      
      // Try to find extensions menu
      const extensionsLink = page.locator('a:has-text("Extensions"), a:has-text("Extension"), [href*="extension"]').first();
      if (await extensionsLink.isVisible()) {
        console.log('✅ Found extensions link');
        await extensionsLink.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'extensions-page.png', fullPage: true });
        console.log('📸 Extensions page screenshot saved');
      }
    }
    
    console.log('🏁 Debug complete. Check screenshots for analysis.');
    
    // Keep browser open for 30 seconds for manual inspection
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();