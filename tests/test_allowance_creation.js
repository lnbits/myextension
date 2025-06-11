const { test, expect } = require('@playwright/test');

test('Create new allowance schedule', async ({ page }) => {
  // Navigate to the allowance extension
  await page.goto('http://localhost:5001/allowance/');
  
  // Wait for the page to load
  await page.waitForSelector('[data-cy="allowance-extension"]', { timeout: 10000 });
  
  // Click "New Allowance" button
  await page.click('text=New Allowance');
  
  // Wait for the dialog to appear
  await page.waitForSelector('.q-dialog', { timeout: 5000 });
  
  // Fill in the form
  await page.fill('input[label="Description *"]', 'Pocket money');
  
  // Select wallet (should default to LNbits wallet)
  // The wallet should already be selected by default
  
  // Fill in lightning address
  await page.fill('input[label="Lightning Address *"]', 'muddledsmell08@walletofsatoshi.com');
  
  // Fill in amount
  await page.fill('input[label="Amount *"]', '100');
  
  // Currency should default to 'sats'
  
  // Select frequency
  await page.click('label:has-text("Frequency")');
  await page.click('text=Weekly');
  
  // Start date will default to today
  
  // End date - leave unspecified (empty)
  
  // Active should default to true
  
  // Submit the form
  await page.click('text=Create Allowance');
  
  // Wait for success notification or dialog to close
  await page.waitForSelector('.q-dialog', { state: 'hidden', timeout: 10000 });
  
  // Verify the allowance appears in the table
  await page.waitForSelector('text=Pocket money', { timeout: 5000 });
  
  // Verify table contains our new allowance
  const tableRow = page.locator('tr:has-text("Pocket money")');
  await expect(tableRow).toBeVisible();
  await expect(tableRow.locator('text=100')).toBeVisible();
  await expect(tableRow.locator('text=sats')).toBeVisible();
  await expect(tableRow.locator('text=muddledsmell08@walletofsatoshi.com')).toBeVisible();
  await expect(tableRow.locator('text=weekly')).toBeVisible();
  await expect(tableRow.locator('.q-badge:has-text("Active")')).toBeVisible();
});

test('Verify allowance form validation', async ({ page }) => {
  await page.goto('http://localhost:5001/allowance/');
  
  // Click "New Allowance" button
  await page.click('text=New Allowance');
  
  // Try to submit empty form
  await page.click('text=Create Allowance');
  
  // Should see validation errors
  await expect(page.locator('text=Description is required')).toBeVisible();
  await expect(page.locator('text=Lightning address is required')).toBeVisible();
  await expect(page.locator('text=Amount must be greater than 0')).toBeVisible();
  await expect(page.locator('text=Frequency is required')).toBeVisible();
});

test('Test form cancellation', async ({ page }) => {
  await page.goto('http://localhost:5001/allowance/');
  
  // Click "New Allowance" button
  await page.click('text=New Allowance');
  
  // Fill in some data
  await page.fill('input[label="Description *"]', 'Test allowance');
  
  // Cancel the form
  await page.click('text=Cancel');
  
  // Dialog should close
  await page.waitForSelector('.q-dialog', { state: 'hidden' });
  
  // Open dialog again and verify form is reset
  await page.click('text=New Allowance');
  const descriptionField = page.locator('input[label="Description *"]');
  await expect(descriptionField).toHaveValue('');
});