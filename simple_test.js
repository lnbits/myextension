const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Simple allowance test...');
    
    // Go to LNBits
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Click Login link
    await page.click('text=Login');
    await page.waitForTimeout(2000);
    
    // Just click "Create New Wallet" for instant access
    await page.click('button:has-text("Create New Wallet")');
    await page.waitForTimeout(3000);
    
    // Fill wallet name
    await page.fill('input', 'LNbits wallet');
    
    // Click ADD A NEW WALLET
    await page.click('button:has-text("ADD A NEW WALLET")');
    await page.waitForTimeout(5000);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'dashboard.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved');
    
    // Now try to access allowance extension
    await page.goto('http://localhost:5001/allowance/');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'allowance-final.png', fullPage: true });
    console.log('📸 Allowance page screenshot saved');
    
    // Look for New Allowance button
    const newAllowanceButton = page.locator('button:has-text("New Allowance")');
    if (await newAllowanceButton.isVisible()) {
      console.log('✅ SUCCESS! Found New Allowance button!');
      
      // Click it to test the form
      await newAllowanceButton.click();
      await page.waitForTimeout(2000);
      
      // Fill the form with your specified values
      console.log('📝 Filling allowance form...');
      await page.fill('input[label="Description *"]', 'Pocket money');
      await page.fill('input[label="Lightning Address *"]', 'muddledsmell08@walletofsatoshi.com');
      await page.fill('input[label="Amount *"]', '100');
      
      // Select frequency
      await page.click('div:has-text("Frequency")');
      await page.click('text=Weekly');
      
      console.log('✅ Form filled with specified values!');
      await page.screenshot({ path: 'form-filled.png', fullPage: true });
      
      // Click Create Allowance
      await page.click('button:has-text("Create Allowance")');
      await page.waitForTimeout(3000);
      
      console.log('🎉 Allowance creation attempted!');
      await page.screenshot({ path: 'after-create.png', fullPage: true });
      
    } else {
      console.log('❌ New Allowance button not found');
      const pageContent = await page.locator('body').textContent();
      console.log('Page content:', pageContent.substring(0, 300));
    }
    
    // Keep browser open
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();