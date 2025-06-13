const { chromium } = require('playwright');

async function debugUpdateIssue() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Debug: Testing update allowance issue...');
    
    // Capture console logs from browser - including saveAllowance logs
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('🔄') || msg.text().includes('🔘') || msg.text().includes('📋') || msg.text().includes('✅') || msg.text().includes('📅') || msg.text().includes('🔥') || msg.text().includes('❌'))) {
        console.log('🖥️ Browser log:', msg.text());
      }
      if (msg.type() === 'error') {
        console.log('💥 Browser error:', msg.text());
      }
    });

    // Login using working credentials
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

    // Navigate to allowance extension
    await page.goto('http://localhost:5001/allowance');
    await page.waitForTimeout(3000);
    console.log('📍 Navigated to Allowance extension');

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

    // Check initial form data via browser console
    const initialFormData = await page.evaluate(() => {
      if (window.app && window.app.$data) {
        return {
          formData: window.app.$data.formDialog.data,
          allowances: window.app.$data.allowances.map(a => ({
            id: a.id,
            name: a.name, 
            active: a.active,
            activeType: typeof a.active
          }))
        };
      }
      return { error: 'Vue app not accessible' };
    });
    
    console.log('📊 Initial Vue data:');
    console.log('  Form data:', JSON.stringify(initialFormData.formData, null, 2));
    console.log('  Allowances from table:', JSON.stringify(initialFormData.allowances, null, 2));

    // Check toggle state with multiple selectors
    await page.waitForTimeout(1000); // Wait for Vue to render
    
    const toggleSelectors = [
      '.q-toggle input[type="checkbox"]',
      '.q-toggle input',
      '.q-toggle [role="switch"]',
      '.q-toggle'
    ];
    
    let toggleState = false;
    for (const selector of toggleSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`🔍 Found toggle with selector: ${selector}`);
          if (selector.includes('input')) {
            toggleState = await element.isChecked();
          } else {
            // For non-input elements, check for active class or aria attributes
            const isActive = await element.getAttribute('aria-checked') === 'true' || 
                             await element.locator('.q-toggle__thumb--true').isVisible();
            toggleState = isActive;
          }
          console.log(`🔘 Toggle state (${selector}): ${toggleState ? 'ON' : 'OFF'}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Selector failed: ${selector}`);
      }
    }
    
    console.log(`🔘 Final toggle state: ${toggleState ? 'ON' : 'OFF'}`);

    // Try manually setting toggle to ON if it's OFF
    if (!toggleState) {
      console.log('🔄 Manually setting toggle to ON...');
      await page.click('.q-toggle');
      await page.waitForTimeout(1000); // Wait longer for Vue to update
      
      // Check the Vue debug display
      const debugText = await page.locator('.text-caption').textContent();
      console.log(`📊 Vue debug display: ${debugText}`);
      
      // Check Vue data after toggle
      const formDataAfterToggle = await page.evaluate(() => {
        if (window.app && window.app.$data) {
          return window.app.$data.formDialog.data.active;
        }
        return null;
      });
      console.log('📊 Vue active value after toggle:', formDataAfterToggle);
    }

    // Monitor network requests for PUT
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/allowance/api/v1/allowance') && request.method() === 'PUT') {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        });
        console.log(`🌐 PUT request intercepted: ${request.url()}`);
        console.log(`📤 Request data: ${request.postData()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/allowance/api/v1/allowance') && response.request().method() === 'PUT') {
        console.log(`📥 PUT response: ${response.status()} ${response.url()}`);
      }
    });

    // Try to manually trigger saveAllowance first
    console.log('🧪 Testing manual saveAllowance trigger...');
    const manualResult = await page.evaluate(() => {
      const results = [];
      
      // Check different Vue app access patterns
      if (window.app && window.app.saveAllowance) {
        results.push('Found via window.app');
      } else if (window.app) {
        results.push(`window.app exists but no saveAllowance: ${Object.keys(window.app)}`);
      } else {
        results.push('No window.app found');
      }
      
      // Check if Vue is mounted somewhere else
      const vueEl = document.querySelector('#vue');
      if (vueEl && vueEl.__vue_app__) {
        results.push('Found Vue app via DOM element');
      }
      
      // Check all Vue-related globals
      const vueGlobals = Object.keys(window).filter(key => key.toLowerCase().includes('vue'));
      results.push(`Vue globals: ${vueGlobals.join(', ')}`);
      
      return results.join(' | ');
    });
    console.log('🧪 Vue app analysis:', manualResult);
    
    await page.waitForTimeout(2000);

    // Click update button
    console.log('🖱️ Attempting to click update button...');
    const updateButton = page.locator('button:has-text("Update Allowance"), button:has-text("UPDATE ALLOWANCE")');
    await updateButton.click();
    
    // Wait for network request
    await page.waitForTimeout(3000);
    
    console.log(`📡 Network requests captured: ${networkRequests.length}`);
    networkRequests.forEach((req, i) => {
      console.log(`  Request ${i + 1}:`, req);
    });

    // Check if dialog is still open
    const dialogStillOpen = await page.locator('.q-dialog').isVisible();
    console.log(`🔲 Dialog still open: ${dialogStillOpen}`);

    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/debug-update-issue.png' });

  } catch (error) {
    console.error('❌ Debug failed:', error);
    await page.screenshot({ path: '/mnt/raid1/GitHub/allowance/tests/test-results/debug-update-error.png' });
  } finally {
    await browser.close();
  }
}

debugUpdateIssue();