const { chromium } = require('playwright');

(async () => {
  console.log('🧹 Starting clear all allowances script...');
  
  const browser = await chromium.launch({ headless: true, slowMo: 500 });
  const page = await browser.newPage();

  try {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser console error:', msg.text());
      }
    });
    
    // Monitor DELETE requests
    let deleteCount = 0;
    page.on('request', request => {
      if (request.url().includes('/allowance/api/v1/allowance') && request.method() === 'DELETE') {
        deleteCount++;
        console.log(`🗑️ DELETE request #${deleteCount}:`, request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/allowance/api/v1/allowance') && response.request().method() === 'DELETE') {
        console.log(`📥 DELETE response: ${response.status()}`);
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
    
    // Step 3: Count existing allowances
    console.log('📝 Step 3: Counting existing allowances...');
    const allRows = page.locator('tbody tr');
    const initialCount = await allRows.count();
    console.log(`📊 Found ${initialCount} allowances to delete`);
    
    if (initialCount === 0) {
      console.log('✅ No allowances to clear!');
      process.exit(0);
    }
    
    // Take screenshot before deletion
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/clear-allowances-before.png', fullPage: true });
    
    // Step 4: Delete all allowances one by one
    console.log('📝 Step 4: Deleting all allowances...');
    let deletedCount = 0;
    
    // Keep deleting until no more rows
    while (true) {
      // Get fresh count
      const currentRows = await page.locator('tbody tr').count();
      if (currentRows === 0) {
        console.log('✅ All allowances cleared!');
        break;
      }
      
      console.log(`📊 ${currentRows} allowances remaining...`);
      
      // Always delete the first row (as rows shift up after deletion)
      const firstRow = page.locator('tbody tr').first();
      const rowText = await firstRow.textContent();
      console.log(`🗑️ Deleting: ${rowText.substring(0, 50)}...`);
      
      // Click delete button on first row
      const deleteButton = firstRow.locator('button.text-pink, button[color="pink"]');
      await deleteButton.click();
      
      // Handle confirmation dialog
      await page.waitForTimeout(1000);
      
      // Look for confirmation button
      const confirmButtons = [
        'button:has-text("OK")',
        'button:has-text("Yes")',
        'button:has-text("Confirm")',
        'button:has-text("Delete")',
        '.q-btn--unelevated:has-text("OK")'
      ];
      
      let confirmClicked = false;
      for (const selector of confirmButtons) {
        try {
          const confirmButton = page.locator(selector);
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            confirmClicked = true;
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!confirmClicked) {
        console.log('⚠️ No confirmation button found, pressing Enter');
        await page.keyboard.press('Enter');
      }
      
      // Wait for deletion to process
      await page.waitForTimeout(3000);
      deletedCount++;
      
      // Safety check to prevent infinite loop
      if (deletedCount > 100) {
        console.log('⚠️ Safety limit reached (100 deletions)');
        break;
      }
    }
    
    // Step 5: Final verification
    console.log('\n📝 Step 5: Final verification...');
    await page.waitForTimeout(2000);
    
    const finalCount = await page.locator('tbody tr').count();
    console.log(`📊 Final count: ${finalCount} allowances`);
    
    if (finalCount === 0) {
      console.log('✅ SUCCESS! All allowances have been cleared!');
      console.log(`📊 Summary: Deleted ${deletedCount} allowances`);
      console.log(`🗑️ DELETE requests sent: ${deleteCount}`);
    } else {
      console.log(`⚠️ WARNING: ${finalCount} allowances still remain`);
    }
    
    // Take final screenshot
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/clear-allowances-after.png', fullPage: true });
    
    process.exit(finalCount === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/clear-allowances-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();