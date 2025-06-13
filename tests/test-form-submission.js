const { chromium } = require('playwright');

async function testFormSubmission() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔬 Testing form submission mechanics...');
    
    // Login
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

    // Navigate to allowance
    await page.goto('http://localhost:5001/allowance');
    await page.waitForTimeout(3000);

    // Click edit on first allowance
    const firstRow = page.locator('.q-table tbody tr').first();
    const editButton = firstRow.locator('button.text-light-blue');
    await editButton.click();
    await page.waitForTimeout(2000);

    console.log('📝 Form opened, testing submission approaches...');

    // Test 1: Try form.submit() directly
    console.log('🧪 Test 1: Direct form submission');
    const formSubmitResult = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        try {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return 'Form submit event dispatched';
        } catch (error) {
          return `Form submit error: ${error.message}`;
        }
      }
      return 'No form found';
    });
    console.log('🧪 Form submit result:', formSubmitResult);

    await page.waitForTimeout(2000);

    // Test 2: Try triggering through button programmatically
    console.log('🧪 Test 2: Programmatic button trigger');
    const buttonResult = await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]');
      if (button) {
        try {
          button.click();
          return 'Button clicked programmatically';
        } catch (error) {
          return `Button click error: ${error.message}`;
        }
      }
      return 'No submit button found';
    });
    console.log('🧪 Button result:', buttonResult);

    await page.waitForTimeout(2000);

    // Test 3: Check if form has proper event listeners
    console.log('🧪 Test 3: Form event listener analysis');
    const listenerResult = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        const events = [];
        // Check for common Vue event listener patterns
        const vNode = form.__vnode || form._vnode;
        if (vNode) {
          events.push('Vue vnode found');
        }
        
        // Check for Quasar form component
        if (form.__vue__ || form._isVue) {
          events.push('Vue component found on form');
        }

        // Check for submit event listeners
        const listeners = getEventListeners ? getEventListeners(form) : 'getEventListeners not available';
        return `Events: ${events.join(', ')} | Listeners: ${JSON.stringify(listeners)}`;
      }
      return 'No form found for listener check';
    });
    console.log('🧪 Listener result:', listenerResult);

    // Test 4: Check current Vue component state
    console.log('🧪 Test 4: Vue component state');
    const vueStateResult = await page.evaluate(() => {
      // Try to find the mounted Vue component
      const vueEl = document.querySelector('#vue');
      if (vueEl && vueEl.__vue_app__) {
        const app = vueEl.__vue_app__;
        if (app._instance && app._instance.ctx) {
          const ctx = app._instance.ctx;
          return `Vue context found: ${Object.keys(ctx).slice(0, 10).join(', ')}`;
        }
        return 'Vue app found but no context';
      }
      return 'No Vue app found on element';
    });
    console.log('🧪 Vue state result:', vueStateResult);

  } catch (error) {
    console.error('❌ Form submission test failed:', error);
  } finally {
    await browser.close();
  }
}

testFormSubmission();