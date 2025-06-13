const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Checking LNBits initial screen...');
    
    // Go to LNBits
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/test-results/initial-screen.png', fullPage: true });
    
    // Check what's visible on the page
    const texts = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, button, a, label, .q-card-section');
      return Array.from(elements).map(el => el.textContent.trim()).filter(text => text.length > 0);
    });
    
    console.log('📝 Found text elements:');
    texts.forEach(text => {
      if (text.toLowerCase().includes('create') || 
          text.toLowerCase().includes('admin') || 
          text.toLowerCase().includes('setup') ||
          text.toLowerCase().includes('account') ||
          text.toLowerCase().includes('login')) {
        console.log(`  - "${text}"`);
      }
    });
    
    // Check for specific elements
    const hasCreateAccount = await page.locator('text=/create.*account/i').isVisible();
    const hasLogin = await page.locator('text=/login/i').isVisible();
    const hasCreateWallet = await page.locator('text=/create.*wallet/i').isVisible();
    
    console.log('\n🔍 Element checks:');
    console.log(`  - Create Account visible: ${hasCreateAccount}`);
    console.log(`  - Login visible: ${hasLogin}`);
    console.log(`  - Create Wallet visible: ${hasCreateWallet}`);
    
    console.log('\n✅ Check complete! Browser staying open for 15 seconds...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await browser.close();
  }
})();