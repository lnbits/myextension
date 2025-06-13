const { chromium } = require('playwright');

async function debugActiveToggle() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Debug: Testing active toggle behavior...');
    
    // Login first
    await page.goto('http://localhost:5001');
    const needsLogin = await page.locator('text=Username').isVisible({ timeout: 3000 }).catch(() => false);
    
    if (needsLogin) {
      console.log('🔐 Logging in...');
      await page.fill('[aria-label="Username"]', 'admin');
      await page.fill('[aria-label="Password"]', 'admin');
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=Add a new wallet', { timeout: 10000 });
    }
    
    // Navigate to LNBits allowance
    await page.goto('http://localhost:5001/allowance');
    await page.waitForTimeout(3000); // Wait for page to load
    console.log('📍 Navigated to Allowance extension');
    
    // Check what's actually on the page
    const pageContent = await page.content();
    console.log('📄 Page title:', await page.title());
    
    // Look for NEW ALLOWANCE button with different selectors
    const buttonSelectors = [
      '.q-btn:has-text("NEW ALLOWANCE")',
      'button:has-text("NEW ALLOWANCE")',
      '[aria-label*="NEW ALLOWANCE"]',
      'text=NEW ALLOWANCE'
    ];
    
    let buttonFound = false;
    for (const selector of buttonSelectors) {
      const button = page.locator(selector);
      if (await button.isVisible().catch(() => false)) {
        console.log(`✅ Found button with selector: ${selector}`);
        buttonFound = true;
        break;
      }
    }
    
    if (!buttonFound) {
      console.log('❌ NEW ALLOWANCE button not found with any selector');
      // Check if there are any buttons
      const allButtons = await page.locator('button').all();
      console.log(`🔍 Found ${allButtons.length} buttons on page`);
      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  Button ${i}: "${text}"`);
      }
      process.exit(1);
    }

    // Find first allowance in table
    const firstRow = page.locator('.q-table tbody tr').first();
    const rowExists = await firstRow.isVisible();
    
    if (!rowExists) {
      console.log('❌ No allowances found in table');
      process.exit(1);
    }

    const description = await firstRow.locator('td').nth(1).textContent();
    console.log(`📋 Found allowance: ${description}`);

    // Click edit button
    const editButton = firstRow.locator('button.text-light-blue, button[color="light-blue"]');
    await editButton.click();
    console.log('🖱️ Clicked edit button');

    await page.waitForTimeout(2000);

    // Check initial toggle state
    await page.waitForSelector('.q-toggle input[type="checkbox"]');
    const initialToggleState = await page.locator('.q-toggle input[type="checkbox"]').isChecked();
    console.log(`🔘 Initial toggle state: ${initialToggleState ? 'ON' : 'OFF'}`);

    // Examine the form data in Vue
    const formData = await page.evaluate(() => {
      if (window.app && window.app.$data) {
        return {
          formDialog: window.app.$data.formDialog,
          allowances: window.app.$data.allowances
        };
      }
      return { error: 'Vue app not accessible' };
    });
    
    console.log('📊 Vue form data:', JSON.stringify(formData, null, 2));

    // Try to manually set toggle to ON
    if (!initialToggleState) {
      console.log('🔄 Manually setting toggle to ON...');
      await page.click('.q-toggle');
      await page.waitForTimeout(500);
      const newToggleState = await page.locator('.q-toggle input[type="checkbox"]').isChecked();
      console.log(`🔘 Toggle after manual click: ${newToggleState ? 'ON' : 'OFF'}`);
    }

    // Check Vue data after toggle
    const formDataAfter = await page.evaluate(() => {
      if (window.app && window.app.$data) {
        return window.app.$data.formDialog.data.active;
      }
      return null;
    });
    console.log('📊 Vue active value after toggle:', formDataAfter);

    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/debug-active-toggle.png' });
    console.log('📸 Screenshot saved');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugActiveToggle();