const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Login and test allowance...');
    
    // Listen for console messages
    page.on('console', msg => {
      console.log(`🖥️ Browser: ${msg.text()}`);
    });
    
    // Listen for JavaScript errors
    page.on('pageerror', error => {
      console.log(`💥 JS Error: ${error.message}`);
    });
    
    // Go to LNBits
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Click Login link
    await page.click('text=Login');
    await page.waitForTimeout(2000);
    
    // Fill login form with actual credentials
    // Use more specific selectors based on the login form
    await page.fill('input[type="text"], input[type="email"]', 'ben.weeks');
    await page.fill('input[type="password"]', 'zUYmy&05&uZ$3kmf*^T8');
    
    // Click LOGIN button
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(5000);
    
    // Take screenshot after login
    await page.screenshot({ path: 'logged-in.png', fullPage: true });
    console.log('📸 Logged in screenshot saved');
    
    // Now try to access allowance extension
    await page.goto('http://localhost:5001/allowance/');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'allowance-logged-in.png', fullPage: true });
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
      
      // Wait for form to be visible
      await page.waitForTimeout(2000);
      
      // Fill fields using nth selectors or placeholders
      const inputs = await page.locator('input').all();
      
      // Description field (usually first text input)
      await page.fill('input[placeholder*="allowance"], input[placeholder*="Description"]', 'Pocket money');
      
      // Lightning address field
      await page.fill('input[placeholder*="@"], input[placeholder*="Lightning"]', 'muddledsmell08@walletofsatoshi.com');
      
      // Amount field
      await page.fill('input[type="number"]', '100');
      
      // Select frequency - use more specific selector
      await page.click('.q-select:has-text("Frequency")');
      await page.waitForTimeout(1000);
      await page.click('.q-item:has-text("Weekly")');
      
      // Fill start date (current date)
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      console.log('📅 Set start date to:', today);
      
      // Make sure Active toggle is ON (click it if it's off)
      const activeToggle = page.locator('.q-toggle');
      const isActive = await activeToggle.evaluate(el => el.classList.contains('q-toggle--checked'));
      console.log('🔘 Active toggle state before:', isActive ? 'ON' : 'OFF');
      
      if (!isActive) {
        console.log('🔘 Clicking toggle to turn it ON');
        await activeToggle.click();
        await page.waitForTimeout(500);
        const isActiveAfter = await activeToggle.evaluate(el => el.classList.contains('q-toggle--checked'));
        console.log('🔘 Active toggle state after click:', isActiveAfter ? 'ON' : 'OFF');
      }
      
      console.log('✅ Form filled with specified values!');
      await page.screenshot({ path: 'form-filled.png', fullPage: true });
      
      // Click Create Allowance - try different selectors
      console.log('🖱️ Clicking Create Allowance button...');
      
      // Check if submit button exists and try to click it
      const submitButton = page.locator('button[type="submit"]');
      const submitExists = await submitButton.isVisible();
      console.log('🔍 Submit button exists:', submitExists);
      
      if (submitExists) {
        // Add a click handler to see if click works
        await page.evaluate(() => {
          const btn = document.querySelector('button[type="submit"]');
          if (btn) {
            console.log('🖱️ Button found, adding click listener');
            btn.addEventListener('click', () => console.log('🖱️ Button clicked!'));
          }
        });
        
        // Force form validation before clicking submit
        await page.evaluate(() => {
          const form = document.querySelector('form');
          if (form && form.__vue__) {
            console.log('🔍 Manually validating form');
            const isValid = form.__vue__.validate();
            console.log('📋 Manual validation result:', isValid);
          }
        });
        
        await submitButton.click();
        console.log('✅ Clicked submit button');
        await page.waitForTimeout(1000);
      } else {
        // Fallback to text-based click
        await page.click('button:has-text("Create Allowance")');
        console.log('✅ Clicked by text content');
      }
      
      // If form submission didn't work, try calling saveAllowance directly
      await page.waitForTimeout(2000);
      
      const dialogStillVisible = await page.locator('.q-dialog').isVisible();
      if (dialogStillVisible) {
        console.log('🔧 Form submission failed, trying direct call...');
        await page.evaluate(() => {
          if (window.app && window.app.saveAllowance) {
            console.log('🔧 Calling saveAllowance directly');
            window.app.saveAllowance();
          } else {
            console.log('❌ window.app.saveAllowance not found');
          }
        });
      }
      
      console.log('⏳ Waiting for allowance to be created...');
      
      // Wait for saveAllowance console logs
      await page.waitForTimeout(1000);
      
      // Wait for dialog to close or error to appear
      await page.waitForTimeout(5000);
      
      // Check if dialog is still open (which would indicate an error)
      const dialogStillOpen = await page.locator('.q-dialog').isVisible();
      
      if (dialogStillOpen) {
        console.log('⚠️ Dialog still open after clicking Create Allowance');
        
        // Check for validation errors
        const errorMessages = await page.locator('.q-field__messages').allTextContents();
        if (errorMessages.length > 0) {
          console.log('❌ Validation errors:', errorMessages);
        }
        
        // Take screenshot of form state
        await page.screenshot({ path: 'form-error-state.png', fullPage: true });
      } else {
        console.log('✅ Dialog closed successfully');
      }
      
      // Take screenshot after create attempt
      await page.screenshot({ path: 'after-create.png', fullPage: true });
      
      // Check if allowance appears in table
      const allowanceRow = page.locator('tr:has-text("Pocket money")');
      if (await allowanceRow.isVisible()) {
        console.log('🎉 SUCCESS! Allowance "Pocket money" appears in the table!');
        
        // Verify all the details in the table
        const rowHasAmount = await allowanceRow.locator('text=100').isVisible();
        const rowHasAddress = await allowanceRow.locator('text=muddledsmell08@walletofsatoshi.com').isVisible();
        const rowHasFrequency = await allowanceRow.locator('text=weekly').isVisible();
        
        console.log('✅ Table row contains:');
        console.log('  - Amount: 100', rowHasAmount ? '✓' : '✗');
        console.log('  - Address: muddledsmell08@walletofsatoshi.com', rowHasAddress ? '✓' : '✗');
        console.log('  - Frequency: weekly', rowHasFrequency ? '✓' : '✗');
      } else {
        console.log('❌ Allowance NOT found in table');
        
        // Check table content
        const tableContent = await page.locator('.q-table').textContent();
        console.log('Table content:', tableContent);
      }
      
    } else {
      console.log('❌ New Allowance button not found');
      const pageContent = await page.locator('body').textContent();
      console.log('Page content:', pageContent.substring(0, 300));
    }
    
    // Keep browser open for inspection
    console.log('✅ Test complete! Browser staying open for 30 seconds...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'login-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();