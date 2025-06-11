const { test, expect } = require('@playwright/test');

test('Login as admin and create allowance schedule', async ({ page }) => {
  // Navigate to LNBits home page
  await page.goto('http://localhost:5001/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Look for login form or admin wallet
  // If there's a login form, fill it out
  const loginForm = page.locator('form').first();
  if (await loginForm.isVisible()) {
    // Fill in admin credentials if login form is present
    await page.fill('input[type="email"], input[name="username"], input[placeholder*="user"]', 'admin');
    await page.fill('input[type="password"], input[name="password"]', 'admin');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    await page.waitForLoadState('networkidle');
  }
  
  // Navigate to wallet or find existing wallet
  // Look for wallet creation or existing wallet
  const walletSection = page.locator('[data-cy="wallets"], .wallet-card, .q-card:has-text("wallet")').first();
  
  // If no wallet exists, create one
  if (!(await walletSection.isVisible())) {
    // Create new wallet
    await page.click('button:has-text("Add a new wallet"), button:has-text("Create"), [data-cy="create-wallet"]');
    await page.fill('input[placeholder*="wallet"], input[label*="name"], input[name="name"]', 'LNbits wallet');
    await page.click('button:has-text("Create"), button:has-text("Add")');
    await page.waitForLoadState('networkidle');
  }
  
  // Navigate to the allowance extension
  await page.goto('http://localhost:5001/allowance/');
  
  // Wait for the allowance extension to load
  await page.waitForSelector('[data-cy="allowance-extension"], #vue', { timeout: 10000 });
  
  // Wait a bit more for Vue to initialize
  await page.waitForTimeout(2000);
  
  // Click "New Allowance" button
  await page.click('[data-cy="new-allowance-btn"], button:has-text("New Allowance")');
  
  // Wait for the dialog to appear
  await page.waitForSelector('.q-dialog, [role="dialog"]', { timeout: 5000 });
  
  // Fill in Description
  await page.fill('input[label="Description"], input[placeholder*="allowance"]', 'Pocket money');
  
  // Wallet should be pre-selected as "LNbits wallet" (first wallet)
  // Verify wallet is selected
  const walletSelect = page.locator('div:has-text("Wallet") input, [label="Wallet"] input').first();
  const walletValue = await walletSelect.inputValue();
  console.log('Selected wallet:', walletValue);
  
  // Fill in Lightning Address
  await page.fill('input[label="Lightning Address"], input[placeholder*="@"]', 'muddledsmell08@walletofsatoshi.com');
  
  // Fill in Amount
  await page.fill('input[label="Amount"], input[type="number"]', '100');
  
  // Currency should default to 'sats' - verify it
  const currencySelect = page.locator('div:has-text("Currency"), [label="Currency"]').first();
  console.log('Currency field found');
  
  // Select Frequency
  await page.click('div:has-text("Frequency") .q-select, [label="Frequency"]');
  await page.waitForSelector('.q-menu, .q-popup', { timeout: 3000 });
  await page.click('div:has-text("Weekly"), .q-item:has-text("Weekly")');
  
  // Start Date should default to current date (leave as is)
  
  // End Date - leave unspecified (empty)
  
  // Active should default to true (leave as is)
  
  // Verify form is filled correctly before submission
  const description = await page.inputValue('input[label="Description"]');
  const lightningAddress = await page.inputValue('input[label="Lightning Address"]');
  const amount = await page.inputValue('input[label="Amount"]');
  
  console.log('Form values before submission:');
  console.log('Description:', description);
  console.log('Lightning Address:', lightningAddress);
  console.log('Amount:', amount);
  
  // Submit the form
  await page.click('button:has-text("Create Allowance")');
  
  // Wait for API call to complete (either success or error)
  await page.waitForTimeout(3000);
  
  // Check for success notification or error
  const notification = page.locator('.q-notification, .q-banner, .notification');
  if (await notification.isVisible()) {
    const notificationText = await notification.textContent();
    console.log('Notification:', notificationText);
  }
  
  // Wait for dialog to close (if successful)
  try {
    await page.waitForSelector('.q-dialog', { state: 'hidden', timeout: 5000 });
    console.log('Dialog closed successfully');
  } catch (e) {
    console.log('Dialog still open, checking for errors');
    
    // Check for validation errors
    const errors = await page.locator('.q-field__messages, .text-negative, [role="alert"]').allTextContents();
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'allowance-form-error.png' });
  }
  
  // Check if allowance appears in the table
  await page.waitForTimeout(2000);
  
  // Look for the allowance in the table
  const tableRow = page.locator('tr:has-text("Pocket money"), .q-table tr:has-text("Pocket money")');
  
  if (await tableRow.isVisible()) {
    console.log('✅ Allowance "Pocket money" found in table');
    
    // Verify the details
    const rowText = await tableRow.textContent();
    console.log('Row content:', rowText);
    
    // Verify specific values
    await expect(tableRow.locator('text=100')).toBeVisible();
    await expect(tableRow.locator('text=muddledsmell08@walletofsatoshi.com')).toBeVisible();
    await expect(tableRow.locator('text=weekly')).toBeVisible();
  } else {
    console.log('❌ Allowance not found in table');
    
    // Check if table exists at all
    const table = page.locator('.q-table, table');
    if (await table.isVisible()) {
      const tableContent = await table.textContent();
      console.log('Table content:', tableContent);
    } else {
      console.log('No table found');
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'allowance-table-missing.png' });
  }
});

test('Debug allowance extension state', async ({ page }) => {
  // Navigate to the allowance extension
  await page.goto('http://localhost:5001/allowance/');
  
  // Wait for page load
  await page.waitForLoadState('networkidle');
  
  // Check for any JavaScript errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    } else if (msg.type() === 'log') {
      console.log('Console Log:', msg.text());
    }
  });
  
  // Wait for Vue to initialize
  await page.waitForTimeout(3000);
  
  // Check if the extension loaded properly
  const vueApp = page.locator('#vue');
  const isVueLoaded = await vueApp.isVisible();
  console.log('Vue app loaded:', isVueLoaded);
  
  // Check for user/wallet data
  const userWallets = await page.evaluate(() => {
    return window.app?._instance?.data?.g?.user?.wallets || 'No wallet data';
  });
  console.log('User wallets:', userWallets);
  
  // Check allowances data
  const allowances = await page.evaluate(() => {
    return window.app?._instance?.data?.allowances || 'No allowances data';
  });
  console.log('Allowances:', allowances);
  
  // Take screenshot of current state
  await page.screenshot({ path: 'allowance-extension-state.png', fullPage: true });
});