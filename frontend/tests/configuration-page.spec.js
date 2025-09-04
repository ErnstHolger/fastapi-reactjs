import { test, expect } from '@playwright/test';

test.describe('Configuration Page - ObjectTable Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should navigate to configuration page successfully', async ({ page }) => {
    // Navigate to configuration page
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Verify page loaded correctly
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();
    await expect(page.getByText('Data from streams endpoint')).toBeVisible();
    
    // Verify Configuration button is active
    await expect(page.getByRole('button', { name: 'Configuration' })).toHaveAttribute('aria-current', 'page');
  });

  test('should display table with correct structure and data', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Verify table is present
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    
    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'id' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'description' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'createddate' })).toBeVisible();
    
    // Verify data rows are present
    const rows = page.getByRole('row');
    await expect(rows).toHaveCountGreaterThan(1); // Header + at least one data row
  });

  test('should handle dropdown selection correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Initially should show Streams data
    await expect(page.getByText('Data from streams endpoint (100 items)')).toBeVisible();
    await expect(page.getByRole('combobox')).toContainText('Streams');
    
    // Open dropdown and select Asset Types
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Asset Types' }).click();
    
    // Verify data changed
    await expect(page.getByText('Data from asset types endpoint (3 items)')).toBeVisible();
    await expect(page.getByRole('combobox')).toContainText('Asset Types');
    
    // Test other dropdown options
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Assets' }).click();
    await expect(page.getByRole('combobox')).toContainText('Assets');
  });

  test('should handle pagination correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Ensure we're on Streams (which has pagination)
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Streams' }).click();
    
    // Verify initial pagination state
    await expect(page.getByText('Showing 1 to 20 of 100 items')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
    
    // Test Next button
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Showing 21 to 40 of 100 items')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
    
    // Test numbered page navigation
    await page.getByRole('button', { name: '1' }).click();
    await expect(page.getByText('Showing 1 to 20 of 100 items')).toBeVisible();
    
    // Test page 3
    await page.getByRole('button', { name: '3' }).click();
    await expect(page.getByText('Showing 41 to 60 of 100 items')).toBeVisible();
  });

  test('should handle Test Connection button correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Initially should show "Test Connection"
    const testButton = page.getByRole('button', { name: 'Test Connection' });
    await expect(testButton).toBeVisible();
    
    // Click Test Connection
    await testButton.click();
    
    // Should change to "Connected"
    await expect(page.getByRole('button', { name: 'Connected' })).toBeVisible();
  });

  test('should handle dark mode toggle correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Initially should show "Dark" button
    const darkButton = page.getByRole('button', { name: 'Dark' });
    await expect(darkButton).toBeVisible();
    
    // Click Dark mode toggle
    await darkButton.click();
    
    // Should change to "Light" and be active
    const lightButton = page.getByRole('button', { name: 'Light' });
    await expect(lightButton).toBeVisible();
    await expect(lightButton).toHaveAttribute('active');
    
    // Toggle back to light mode
    await lightButton.click();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Test Tab navigation through interactive elements
    await page.keyboard.press('Tab');
    
    // Should be able to navigate through buttons and dropdown
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle empty state correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Switch to Asset Types (which has fewer items)
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Asset Types' }).click();
    
    // Verify pagination is hidden for small datasets
    await expect(page.getByText('Data from asset types endpoint (3 items)')).toBeVisible();
    
    // Pagination controls should not be visible or should be minimal
    const paginationText = page.getByText(/Showing \d+ to \d+ of \d+ items/);
    if (await paginationText.isVisible()) {
      // If pagination is visible, it should show all items on one page
      await expect(page.getByText(/Showing 1 to 3 of 3 items/)).toBeVisible();
    }
  });

  test('should maintain state when switching between dropdown options', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Start with Streams and go to page 2
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Streams' }).click();
    await page.getByRole('button', { name: '2' }).click();
    await expect(page.getByText('Showing 21 to 40 of 100 items')).toBeVisible();
    
    // Switch to Asset Types
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Asset Types' }).click();
    
    // Switch back to Streams - should reset to page 1
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Streams' }).click();
    await expect(page.getByText('Showing 1 to 20 of 100 items')).toBeVisible();
  });

  test('should display correct data format in table cells', async ({ page }) => {
    await page.getByRole('button', { name: 'Configuration' }).click();
    
    // Check that date format is consistent
    const dateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2}/;
    const dateCells = page.getByRole('cell').filter({ hasText: dateRegex });
    await expect(dateCells.first()).toBeVisible();
    
    // Verify ID format (should be alphanumeric strings)
    const firstRow = page.getByRole('row').nth(1);
    const idCell = firstRow.getByRole('cell').first();
    await expect(idCell).toBeVisible();
    await expect(idCell).not.toBeEmpty();
  });
});