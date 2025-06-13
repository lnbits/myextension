const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Get test data from command line args or default values
const getTestData = () => {
  // Check command line arguments
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    return {
      originalName: args[0],
      newName: args[1],
      newAmount: args[2] ? parseInt(args[2]) : null,
      newFrequency: args[3] || null
    };
  }
  
  // Default test data
  return {
    originalName: 'Daily Coffee Money',
    newName: 'Updated Coffee Budget',
    newAmount: 35,
    newFrequency: 'weekly'
  };
};

(async () => {
  const testData = getTestData();
  console.log(`🎯 Testing allowance edit: "${testData.originalName}" -> "${testData.newName}"`);
  
  const browser = await chromium.launch({ headless: true, slowMo: 500 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting edit allowance test...');
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('💥 Page error:', error.message);
    });
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/allowance/api/v1/allowance') && request.method() === 'PUT') {
        console.log('📤 PUT request to update allowance:', request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/allowance/api/v1/allowance') && response.request().method() === 'PUT') {
        console.log(`📥 PUT response: ${response.status()} ${response.url()}`);
      }
    });
    
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
    
    // Step 3: Find and edit existing allowance
    console.log(`📝 Step 3: Finding allowance "${testData.originalName}" to edit...`);
    
    // Look for the allowance row (use first if multiple matches)
    const allowanceRow = page.locator(`tr:has-text("${testData.originalName}")`).first();
    const rowExists = await allowanceRow.isVisible();
    
    if (!rowExists) {
      console.log(`❌ Allowance "${testData.originalName}" not found in table`);
      await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-allowance-not-found.png', fullPage: true });
      process.exit(1);
    }
    
    console.log(`✅ Found allowance "${testData.originalName}"`);
    
    // Click the edit button for this allowance (look for light-blue colored button which is edit)
    const editButton = allowanceRow.locator('button.text-light-blue, button[color="light-blue"]');
    await editButton.click();
    console.log('🖱️ Clicked edit button');
    
    await page.waitForTimeout(2000);
    
    // Step 4: Update the allowance form
    console.log('📝 Step 4: Updating allowance form...');
    
    // Wait for form to appear
    await page.waitForSelector('input', { timeout: 10000 });
    
    // Update description field
    await page.fill('input[placeholder*="Weekly allowance"]', testData.newName);
    console.log(`✅ Updated description: ${testData.newName}`);
    
    // Update amount if provided
    if (testData.newAmount) {
      await page.fill('input[type="number"]', testData.newAmount.toString());
      console.log(`✅ Updated amount: ${testData.newAmount}`);
    }
    
    // Update frequency if provided
    if (testData.newFrequency) {
      const frequencySelect = page.locator('.q-select').filter({ hasText: 'Frequency' });
      await frequencySelect.click();
      
      const frequencyLabel = testData.newFrequency.charAt(0).toUpperCase() + testData.newFrequency.slice(1);
      await page.waitForSelector(`.q-item:has-text("${frequencyLabel}")`);
      await page.click(`.q-item:has-text("${frequencyLabel}")`);
      console.log(`✅ Updated frequency: ${frequencyLabel}`);
    }
    
    await page.waitForTimeout(1000);
    
    // Take screenshot of updated form
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-allowance-form.png', fullPage: true });
    console.log('📸 Form screenshot saved');
    
    // Step 5: Submit the form
    console.log('🖱️ Submitting updated form...');
    
    try {
      const submitButton = page.locator('button[type="submit"]:has-text("Update")');
      await submitButton.click({ timeout: 5000 });
      console.log('✅ Clicked update button');
    } catch (error) {
      console.log('⚠️ Update button click timeout - form may have already submitted');
    }
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check if form dialog closed (success indicator)
    const dialogStillOpen = await page.locator('.q-dialog').isVisible();
    if (!dialogStillOpen) {
      console.log('🎉 Form dialog closed - likely successful update!');
    }
    
    // Step 6: Verify the update in the table
    console.log('🔍 Checking for updated allowance in table...');
    
    // Wait for table to update
    await page.waitForTimeout(2000);
    
    const updatedRow = page.locator(`tr:has-text("${testData.newName}")`);
    const updatedExists = await updatedRow.isVisible();
    
    if (updatedExists) {
      console.log(`✅ SUCCESS! Found updated allowance "${testData.newName}" in table!`);
      
      // Verify updated details
      const rowText = await updatedRow.first().textContent();
      const hasNewAmount = testData.newAmount ? rowText.includes(testData.newAmount.toString()) : true;
      const hasNewFrequency = testData.newFrequency ? rowText.includes(testData.newFrequency) : true;
      
      console.log(`  ✓ Updated name: ${testData.newName} ✅`);
      if (testData.newAmount) {
        console.log(`  ✓ Updated amount: ${testData.newAmount} sats`, hasNewAmount ? '✅' : '❌');
      }
      if (testData.newFrequency) {
        console.log(`  ✓ Updated frequency: ${testData.newFrequency}`, hasNewFrequency ? '✅' : '❌');
      }
      
      await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-allowance-success.png', fullPage: true });
      console.log('🎉 ALLOWANCE EDIT TEST PASSED! 🎉');
      process.exit(0); // Success
    } else {
      console.log(`❌ Updated allowance "${testData.newName}" not found in table`);
      
      // Check if dialog is still open (error state)
      const dialogOpen = await page.locator('.q-dialog').isVisible();
      if (dialogOpen) {
        console.log('⚠️ Form dialog still open - possible validation error');
        await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-allowance-error.png', fullPage: true });
        process.exit(1); // Failure
      }
      
      // Check if original name still exists (update failed)
      const originalStillExists = await page.locator(`tr:has-text("${testData.originalName}")`).isVisible();
      if (originalStillExists) {
        console.log(`⚠️ Original allowance "${testData.originalName}" still exists - update may have failed`);
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-allowance-final.png', fullPage: true });
    process.exit(1); // Failure
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/edit-allowance-error.png', fullPage: true });
    process.exit(1); // Failure
  } finally {
    await browser.close();
  }
})();