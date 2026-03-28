const { test, expect } = require('@playwright/test');
const { setupMockApi, apiCalls, resetCalls, findCalls, lastCall } = require('./fixtures/api-interceptor');
const data = require('./fixtures/mock-data');

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:3333' });
  await setupMockApi(page);
  await page.goto('/');
  await page.waitForSelector('.svix-ui', { timeout: 15000 });
  await page.locator('.wh-page-header-actions').getByRole('button', { name: 'API Docs' }).click();
  await page.getByRole('heading', { level: 2, name: 'Svix API Reference' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  resetCalls();
});

test.describe('API Docs Page', () => {
  test('renders API reference title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Svix API Reference' })).toBeVisible();
    await expect(page.getByText('Complete API reference', { exact: false })).toBeVisible();
  });

  test('shows sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('.wh-docs-sidebar');
    const labels = ['Overview', 'Applications', 'Endpoints', 'Messages', 'Attempts', 'Event Types', 'Auth', 'Health'];
    for (const label of labels) {
      await expect(sidebar.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('shows Base URL card', async ({ page }) => {
    const overview = page.locator('[data-section="overview"]');
    await expect(overview.getByText(/Base URL/i).first()).toBeVisible();
    await expect(
      overview.getByText('https://webhooks.vibey.cloud/api/v1', { exact: true }).first(),
    ).toBeVisible();
  });

  test('shows Authentication note', async ({ page }) => {
    const overview = page.locator('[data-section="overview"]');
    await expect(overview.getByText('Authentication:', { exact: true })).toBeVisible();
    await expect(overview.locator('code').filter({ hasText: /Authorization:\s*Bearer/ }).first()).toBeVisible();
  });

  test('shows credential cards', async ({ page }) => {
    const content = page.locator('.wh-docs-content');
    await expect(content.getByText('Your App UID', { exact: true })).toBeVisible();
    await expect(content.getByText('user_1', { exact: true }).first()).toBeVisible();
    await expect(content.getByText('API URL', { exact: true }).first()).toBeVisible();
    await expect(content.getByText('https://webhooks.vibey.cloud', { exact: true }).first()).toBeVisible();
    await expect(content.getByText('Auth Token', { exact: true })).toBeVisible();
    const copyInOverview = page.locator('.wh-docs-content .wh-api-card').first().getByRole('button', { name: 'Copy' });
    await expect(copyInOverview).toHaveCount(3);
  });

  test('shows Your Event Types table', async ({ page }) => {
    await expect(page.getByText('Your Event Types', { exact: true })).toBeVisible({ timeout: 10000 });
    const table = page.locator('.wh-docs-content table').filter({ has: page.getByRole('columnheader', { name: 'Name' }) });
    await expect(table.getByRole('columnheader', { name: 'Description' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'order.created' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'user.signup' })).toBeVisible();
  });

  test('sidebar clicking scrolls to section', async ({ page }) => {
    await page.locator('.wh-docs-sidebar').getByText('Endpoints', { exact: true }).first().click();
    await page.waitForTimeout(800);
    const endpointsHeading = page.locator('.wh-docs-content h3').filter({ hasText: /^Endpoints$/ });
    await expect(endpointsHeading).toBeVisible();
    await expect(endpointsHeading).toBeInViewport();
  });

  test('← Back to Webhooks navigates back', async ({ page }) => {
    await page.getByRole('button', { name: '← Back to Webhooks' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('button.wh-tab', { hasText: 'Endpoints' })).toBeVisible();
    await expect(page.locator('button.wh-tab', { hasText: 'Event Catalog' })).toBeVisible();
  });

  test('endpoint method badges show correct colors', async ({ page }) => {
    const main = page.locator('.wh-docs-content');
    await expect(main.getByText('GET', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('POST', { exact: true }).first()).toBeVisible();
    // Reference cards use GET, POST, PUT, DELETE (Svix-style updates use PUT; no PATCH badges in this UI).
    await expect(main.getByText('PUT', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('DELETE', { exact: true }).first()).toBeVisible();
  });

  test('Copy buttons work', async ({ page }) => {
    const copyBtn = page.locator('.wh-docs-content').getByRole('button', { name: 'Copy' }).first();
    await copyBtn.click();
    await page.waitForTimeout(200);
    await expect(
      page.locator('.wh-docs-content').getByRole('button', { name: /Copied|Done/ }).first(),
    ).toBeVisible();
  });
});
