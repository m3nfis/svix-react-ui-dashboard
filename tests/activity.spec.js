const { test, expect } = require('@playwright/test');
const { setupMockApi, apiCalls, resetCalls, findCalls, lastCall } = require('./fixtures/api-interceptor');
const data = require('./fixtures/mock-data');

async function openActivityTab(page) {
  await setupMockApi(page);
  await page.goto('/');
  await page.waitForSelector('.svix-ui', { timeout: 15000 });
  await page.getByRole('button', { name: 'Activity' }).click();
  await page.waitForTimeout(1000);
  await page.locator('h3').filter({ hasText: 'Activity Overview' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(2000);
}

test.describe('Activity Panel', () => {
  test.describe('UI', () => {
    test.beforeEach(async ({ page }) => {
      await openActivityTab(page);
      resetCalls();
    });

    test('renders activity overview stats', async ({ page }) => {
      // Scope to the Activity stats grid only — other .wh-api-card nodes (e.g. guide) can contain "failed".
      const statGrid = page
        .locator('.wh-toolbar')
        .filter({ hasText: 'Activity Overview' })
        .locator('..')
        .locator(':scope > div')
        .nth(1);
      const cards = statGrid.locator(':scope > .wh-api-card');
      await expect(cards).toHaveCount(4);
      await expect(cards.nth(0)).toContainText('Active Endpoints');
      await expect(cards.nth(0)).toContainText('2');
      await expect(cards.nth(1)).toContainText('Messages Sent');
      await expect(cards.nth(1)).toContainText('2');
      await expect(cards.nth(2)).toContainText('Successful');
      await expect(cards.nth(3)).toContainText('Failed');
    });

    test('shows recent messages table', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Recent Messages' })).toBeVisible();
      const table = page.locator('table.wh-table').filter({ has: page.getByRole('columnheader', { name: 'Message ID' }) }).first();
      await expect(table.getByRole('columnheader', { name: 'Event Type' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Message ID' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
      await expect(table.getByRole('cell', { name: data.MESSAGE_1.id })).toBeVisible();
      await expect(table.getByRole('cell', { name: data.MESSAGE_2.id })).toBeVisible();
    });

    test('shows recent delivery attempts table', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Recent Delivery Attempts' })).toBeVisible();
      const table = page.locator('table.wh-table').filter({ has: page.getByRole('columnheader', { name: 'Endpoint ID' }) });
      await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'HTTP' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Message ID' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Endpoint ID' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
    });
  });

  test.describe('API tracing', () => {
    test.beforeEach(async ({ page }) => {
      await openActivityTab(page);
    });

    test('API calls: fetches endpoints, messages, and attempts', async ({ page }) => {
      const endpointGets = findCalls('GET', 'app/user_1/endpoint/').filter((c) => c.path === 'app/user_1/endpoint/');
      expect(endpointGets.length).toBeGreaterThanOrEqual(1);
      const msgGets = findCalls('GET', 'app/user_1/msg/').filter((c) => c.path === 'app/user_1/msg/');
      expect(msgGets.length).toBeGreaterThanOrEqual(1);
      expect(
        findCalls('GET', 'attempt/msg/msg_test_message_1/').some(
          (c) => c.path === 'app/user_1/attempt/msg/msg_test_message_1/'
        )
      ).toBeTruthy();
      expect(
        findCalls('GET', 'attempt/msg/msg_test_message_2/').some(
          (c) => c.path === 'app/user_1/attempt/msg/msg_test_message_2/'
        )
      ).toBeTruthy();
    });
  });
});
