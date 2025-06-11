const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting allowance creation script...');
    
    // Navigate to LNBits
    console.log('📱 Navigating to LNBits...');
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'lnbits-home.png', fullPage: true });
    console.log('📸 Screenshot saved: lnbits-home.png');
    
    // Look for "Login" link on the create account screen (the clickable one with cursor-pointer class)
    const loginLink = page.locator('.text-secondary.cursor-pointer:has-text("Login")');
    if (await loginLink.isVisible()) {
      console.log('🔐 Found Login link, clicking to access existing account...');
      await loginLink.click();
      await page.waitForTimeout(3000);
      
      // Take screenshot after login click
      await page.screenshot({ path: 'after-login-click.png', fullPage: true });
      console.log('📸 After login click screenshot saved');
      
      // Look for the "Create New Wallet" button in the instant access section
      await page.waitForTimeout(2000); // Let page fully load
      
      // The Create New Wallet button has a plus icon and specific styling
      // Try multiple selectors to find it
      const createWalletSelectors = [
        'button:has-text("Create New Wallet")',
        'button[class*="bg-positive"]', // The green/blue button
        'button:has(i:text("+"))', // Button with plus icon
        'button:has-text("+")', // Button with plus text
        'text=Create New Wallet' // Direct text match
      ];
      
      let walletCreated = false;
      
      for (const selector of createWalletSelectors) {
        try {
          const button = page.locator(selector);
          if (await button.isVisible() && await button.isEnabled()) {
            console.log(`🆕 Found Create New Wallet button with selector: ${selector}`);
            await button.click();
            await page.waitForTimeout(5000);
            walletCreated = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!walletCreated) {
        console.log('🔍 Debugging: Looking at all elements...');
        // List all clickable elements
        const clickableElements = await page.locator('button, a, [role="button"]').all();
        for (let i = 0; i < clickableElements.length; i++) {
          const elementText = await clickableElements[i].textContent();
          const isEnabled = await clickableElements[i].isEnabled();
          const tagName = await clickableElements[i].evaluate(el => el.tagName);
          console.log(`Element ${i}: <${tagName}> "${elementText}" - Enabled: ${isEnabled}`);
        }
      }
      
      // Take screenshot after clicking Create New Wallet
      await page.screenshot({ path: 'after-wallet-creation.png', fullPage: true });
      console.log('📸 After wallet creation click screenshot saved');
      
      // Fill in wallet name and complete wallet creation
      const walletNameInput = page.locator('input[placeholder*="LNbits"], input[placeholder*="wallet"]');
      if (await walletNameInput.isVisible()) {
        console.log('📝 Filling wallet name...');
        await walletNameInput.fill('LNbits wallet');
        
        // Click "ADD A NEW WALLET" button
        const addWalletButton = page.locator('button:has-text("ADD A NEW WALLET")');
        if (await addWalletButton.isVisible()) {
          console.log('✅ Clicking "ADD A NEW WALLET" button...');
          await addWalletButton.click();
          
          // Wait for redirect to main dashboard
          await page.waitForTimeout(5000);
          await page.screenshot({ path: 'wallet-created-dashboard.png', fullPage: true });
          console.log('📸 Wallet created dashboard screenshot saved');
        }
      }
    }
    
    // Wait a bit more for full loading
    await page.waitForTimeout(2000);
    
    // Navigate to allowance extension (now with proper session)
    console.log('💰 Navigating to Allowance extension...');
    await page.goto('http://localhost:5001/allowance/');
    
    // Take screenshot of allowance page
    await page.screenshot({ path: 'allowance-page.png', fullPage: true });
    console.log('📸 Screenshot saved: allowance-page.png');
    
    // Check for error messages
    const errorMessages = await page.locator('body').textContent();
    if (errorMessages.includes('Missing user ID') || errorMessages.includes('token')) {
      console.log('❌ Authentication required. Trying to access through main interface...');
      
      // Go back to main page and try to access allowance through extension menu
      await page.goto('http://localhost:5001/');
      await page.waitForTimeout(2000);
      
      // Look for extensions menu
      const extensionsMenu = page.locator('a:has-text("Extensions"), button:has-text("Extensions")');
      if (await extensionsMenu.isVisible()) {
        await extensionsMenu.click();
        await page.waitForTimeout(1000);
        
        // Look for allowance extension
        const allowanceExtension = page.locator('a:has-text("Allowance"), button:has-text("Allowance")');
        if (await allowanceExtension.isVisible()) {
          await allowanceExtension.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Wait for Vue to load
    await page.waitForSelector('#vue', { timeout: 10000 });
    
    // Wait for Vue to initialize
    await page.waitForTimeout(3000);
    
    console.log('✨ Looking for New Allowance button...');
    
    // Check if page loaded properly
    const pageContent = await page.locator('body').textContent();
    console.log('📄 Page contains text:', pageContent.substring(0, 200) + '...');
    
    // Look for New Allowance button with more flexibility
    const newAllowanceButton = page.locator('button:has-text("New Allowance"), [data-cy="new-allowance-btn"], button:has-text("allowance")').first();
    
    if (await newAllowanceButton.isVisible()) {
      console.log('✅ Found New Allowance button, clicking...');
      await newAllowanceButton.click();
      await page.waitForSelector('.q-dialog', { timeout: 5000 });
    } else {
      console.log('❌ New Allowance button not found');
      console.log('🔍 Available buttons:');
      const buttons = await page.locator('button').allTextContents();
      console.log(buttons);
      
      console.log('🔍 Looking for any allowance-related elements...');
      const allowanceElements = await page.locator('*:has-text("allowance"), *:has-text("Allowance")').allTextContents();
      console.log(allowanceElements);
      
      throw new Error('Cannot find New Allowance button');
    }
    
    console.log('📝 Filling form with specified values...');
    
    // Fill Description
    await page.fill('input[label="Description *"]', 'Pocket money');
    console.log('  ✓ Description: Pocket money');
    
    // Wallet should be pre-selected (LNbits wallet)
    console.log('  ✓ Wallet: LNbits wallet (default)');
    
    // Fill Lightning Address
    await page.fill('input[label="Lightning Address *"]', 'muddledsmell08@walletofsatoshi.com');
    console.log('  ✓ Lightning Address: muddledsmell08@walletofsatoshi.com');
    
    // Fill Amount
    await page.fill('input[label="Amount *"]', '100');
    console.log('  ✓ Amount: 100');
    
    // Currency defaults to sats
    console.log('  ✓ Currency: sats (default)');
    
    // Select Frequency
    await page.click('div:has-text("Frequency") .q-select');
    await page.waitForSelector('.q-menu');
    await page.click('.q-item:has-text("Weekly")');
    console.log('  ✓ Frequency: Weekly');
    
    // Start Date defaults to now
    console.log('  ✓ Start Date: Now (default)');
    
    // End Date is unspecified (empty)
    console.log('  ✓ End Date: Unspecified');
    
    // Active defaults to Yes
    console.log('  ✓ Active: Yes (default)');
    
    console.log('🎯 All values populated! Ready to submit...');
    console.log('');
    console.log('Form values:');
    console.log('  Description: Pocket money');
    console.log('  Wallet: LNbits wallet');
    console.log('  Lightning Address: muddledsmell08@walletofsatoshi.com');
    console.log('  Amount: 100');
    console.log('  Currency: sats');
    console.log('  Frequency: Weekly');
    console.log('  Start Date: Now');
    console.log('  End Date: Unspecified');
    console.log('  Active: Yes');
    console.log('');
    
    // Wait for user to review
    console.log('⏸️  Pausing for 5 seconds to review form...');
    await page.waitForTimeout(5000);
    
    // Submit the form
    console.log('🚀 Clicking "Create Allowance" button...');
    await page.click('button:has-text("Create Allowance")');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for notifications
    const notification = page.locator('.q-notification');
    if (await notification.isVisible()) {
      const notificationText = await notification.textContent();
      console.log('📢 Notification:', notificationText);
    }
    
    // Check if dialog closed (success) or still open (error)
    const dialogStillOpen = await page.locator('.q-dialog').isVisible();
    
    if (!dialogStillOpen) {
      console.log('✅ Dialog closed - allowance creation appears successful!');
      
      // Check if allowance appears in table
      await page.waitForTimeout(2000);
      const allowanceRow = page.locator('tr:has-text("Pocket money")');
      
      if (await allowanceRow.isVisible()) {
        console.log('🎉 Success! Allowance "Pocket money" appears in the table!');
        const rowText = await allowanceRow.textContent();
        console.log('📊 Table row:', rowText);
      } else {
        console.log('⚠️  Allowance not visible in table yet...');
      }
    } else {
      console.log('❌ Dialog still open - there may be validation errors');
      
      // Check for errors
      const errors = await page.locator('.q-field__messages').allTextContents();
      if (errors.length > 0) {
        console.log('🔍 Validation errors found:', errors);
      }
    }
    
    console.log('');
    console.log('🏁 Script completed! Browser will stay open for manual inspection.');
    console.log('   Press Ctrl+C to close when done.');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(60000); // Wait 1 minute
    
  } catch (error) {
    console.error('💥 Error occurred:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as error-screenshot.png');
  } finally {
    // Don't auto-close browser for inspection
    // await browser.close();
  }
})();