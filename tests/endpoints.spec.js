const { test, expect } = require('@playwright/test');
const { setupMockApi, apiCalls, resetCalls, findCalls, lastCall } = require('./fixtures/api-interceptor');
const data = require('./fixtures/mock-data');

/**
 * End-to-end checks for the Webhook Endpoints panel.
 * The dev server should expose the script-tag React app at baseURL (see playwright.config.js)
 * with Svix client appUid `user_1` so mocked paths match `app/user_1/endpoint/**`.
 */
test.beforeEach(async ({ page }) => {
  await setupMockApi(page);
  // Reset after route registration, before navigation, so this test’s session includes
  // the initial list GET (and we do not clear it with a post-load reset).
  resetCalls();
  await page.goto('/');
  // Wait for the Babel-transpiled app to render
  await page.waitForSelector('.svix-ui', { timeout: 15000 });
  // The Endpoints tab is active by default, wait for it to load
  await page.locator('h3').filter({ hasText: 'Webhook Endpoints' }).waitFor({ timeout: 10000 });
});

test.describe('Endpoints Panel', () => {
  test('renders endpoint list with mock data: table shows URLs, descriptions, status badges, counter, and list GET ran on load', async ({ page }) => {
    // Step 1: After the app finishes loading, confirm both mock endpoint URLs appear in the endpoints table.
    const table = page.locator('table.wh-table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('cell', { name: data.ENDPOINT_1.url })).toBeVisible();
    await expect(table.getByRole('cell', { name: data.ENDPOINT_2.url })).toBeVisible();

    // Step 2: Confirm the Description column shows the human-readable labels from the mock payload.
    await expect(table.getByRole('cell', { name: data.ENDPOINT_1.description })).toBeVisible();
    await expect(table.getByRole('cell', { name: data.ENDPOINT_2.description })).toBeVisible();

    // Step 3: Confirm status badges reflect disabled flags — Active vs Disabled.
    await expect(page.locator('.badge-active').filter({ hasText: 'Active' })).toBeVisible();
    await expect(page.locator('.badge-planned').filter({ hasText: 'Disabled' })).toBeVisible();

    // Step 4: Confirm the footer counter reflects the number of rows returned by the API.
    await expect(page.getByText('2 endpoints', { exact: true })).toBeVisible();

    // Step 5: Confirm the Svix list endpoint was requested when the panel mounted.
    const listGets = findCalls('GET', 'app/user_1/endpoint/');
    expect(listGets.length).toBeGreaterThanOrEqual(1);
    const listGet = listGets.find((c) => c.path === 'app/user_1/endpoint/');
    expect(listGet, 'expected exact GET app/user_1/endpoint/').toBeTruthy();
  });

  test('shows "+ Add Endpoint" button: visible, first click opens form, second click (Cancel) hides it', async ({ page }) => {
    // Step 1: Locate the primary action in the toolbar and ensure it is visible to the operator.
    const toggle = page.locator('.wh-toolbar').getByRole('button', { name: '+ Add Endpoint' });
    await expect(toggle).toBeVisible();

    // Step 2: Click once — the add form should appear (class wh-form from the Endpoints UI).
    await toggle.click();
    const form = page.locator('form.wh-form');
    await expect(form).toBeVisible();
    await page.waitForTimeout(500);

    // Step 3: Click again — the button label switches to "Cancel" and should hide the form (toggle behavior).
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(form).toBeHidden();
    await page.waitForTimeout(500);
    await expect(page.locator('.wh-toolbar').getByRole('button', { name: '+ Add Endpoint' })).toBeVisible();
  });

  test('creates a new endpoint via form: fills URL, description, filters, submits, POST body matches, form closes', async ({ page }) => {
    const postBefore = findCalls('POST', 'endpoint/').length;

    // Step 1: Open the add-endpoint flow from the toolbar.
    await page.locator('.wh-toolbar').getByRole('button', { name: '+ Add Endpoint' }).click();
    const form = page.locator('form.wh-form');
    await expect(form).toBeVisible();

    // Step 2: Fill Endpoint URL exactly as the scenario specifies (labels are not htmlFor-linked in the UI).
    await form.locator('input[placeholder="https://your-server.com/webhook"]').fill('https://new-endpoint.example.com/hook');

    // Step 3: Fill Description.
    await form.locator('input[placeholder="Optional description"]').fill('New endpoint');

    // Step 4: Provide comma-separated event types for filterTypes in the Svix payload.
    await form.locator('input[placeholder="user.created, order.completed"]').fill('order.created, user.signup');

    // Step 5: Submit the form and allow React state + network to settle.
    await form.getByRole('button', { name: 'Add Endpoint' }).click();
    await page.waitForTimeout(500);

    // Step 6: Assert Svix received POST app/user_1/endpoint/ with url, description, and filterTypes.
    const posts = findCalls('POST', 'app/user_1/endpoint/');
    expect(posts.length).toBeGreaterThan(postBefore);
    const created = lastCall('POST', 'app/user_1/endpoint/');
    expect(created.body).toMatchObject({
      url: 'https://new-endpoint.example.com/hook',
      description: 'New endpoint',
      filterTypes: ['order.created', 'user.signup'],
    });

    // Step 7: On success the parent hides the form — toolbar should show "+ Add Endpoint" again.
    await expect(form).toBeHidden();
    await expect(page.locator('.wh-toolbar').getByRole('button', { name: '+ Add Endpoint' })).toBeVisible();
  });

  test('validates required URL field: empty submit stays on form and does not call the create API', async ({ page }) => {
    const postBefore = findCalls('POST', 'app/user_1/endpoint/').length;

    // Step 1: Open the add form without typing a URL.
    await page.locator('.wh-toolbar').getByRole('button', { name: '+ Add Endpoint' }).click();
    const form = page.locator('form.wh-form');
    await expect(form).toBeVisible();
    const urlInput = form.locator('input[required]').first();
    await expect(urlInput).toBeVisible();
    await urlInput.fill('');

    // Step 2: Attempt submit — expect HTML5 constraint validation to block the request.
    await form.getByRole('button', { name: 'Add Endpoint' }).click();
    await expect(urlInput).toHaveJSProperty('validity.valid', false);
    await page.waitForTimeout(500);

    // Step 3: No new POST to create endpoint should have been recorded.
    expect(findCalls('POST', 'app/user_1/endpoint/').length).toBe(postBefore);
    await expect(form).toBeVisible();
  });

  test('disables an endpoint via row context menu: open ⋮ on first row, choose Disable, PATCH disabled true', async ({ page }) => {
    // Step 1: Open the fixed-position context menu for the first endpoint row (⋮ control).
    const firstRow = page.locator('table.wh-table tbody tr').first();
    await firstRow.locator('button.btn-sm.btn-ghost').filter({ hasText: '⋮' }).click();
    const disableBtn = page.getByRole('button', { name: 'Disable' }).filter({ visible: true });
    await expect(disableBtn).toBeVisible();

    // Step 2: Choose Disable — the UI PATCHes the endpoint with disabled: true for an enabled row.
    await disableBtn.click();
    await page.waitForTimeout(500);

    // Step 3: Inspect recorded traffic for PATCH app/user_1/endpoint/ep_test_endpoint_1/.
    const patch = lastCall('PATCH', 'app/user_1/endpoint/ep_test_endpoint_1/');
    expect(patch).toBeTruthy();
    expect(patch.body).toMatchObject({ disabled: true });
  });

  test('deletes an endpoint via row context menu: accept confirm, DELETE is sent', async ({ page }) => {
    // Step 1: Accept the browser confirm dialog raised by the Delete action.
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // Step 2: Open ⋮ on the first data row and choose Delete (destructive menu item).
    const firstRow = page.locator('table.wh-table tbody tr').first();
    await firstRow.locator('button.btn-sm.btn-ghost').filter({ hasText: '⋮' }).click();
    const deleteBtn = page.getByRole('button', { name: 'Delete' }).filter({ visible: true });
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Step 3: Verify Svix DELETE for the first endpoint id.
    const del = lastCall('DELETE', 'app/user_1/endpoint/ep_test_endpoint_1/');
    expect(del).toBeTruthy();
  });

  test('clicking endpoint URL navigates to detail view: back link, GET single endpoint', async ({ page }) => {
    const detailGetsBefore = findCalls('GET', 'app/user_1/endpoint/ep_test_endpoint_1/').length;

    // Step 1: Click the URL button in the first row (stops row propagation and selects detail).
    const firstRow = page.locator('table.wh-table tbody tr').first();
    await firstRow.locator('button.wh-url').filter({ hasText: data.ENDPOINT_1.url }).click();
    await page.waitForTimeout(500);

    // Step 2: Detail shell should expose the back affordance.
    await expect(page.getByText('← Back to Endpoints')).toBeVisible();

    // Step 3: A GET for the single endpoint resource should have been issued.
    const detailGets = findCalls('GET', 'app/user_1/endpoint/ep_test_endpoint_1/');
    expect(detailGets.length).toBeGreaterThan(detailGetsBefore);
    const single = detailGets.find((c) => c.path === 'app/user_1/endpoint/ep_test_endpoint_1/');
    expect(single, 'expected GET app/user_1/endpoint/ep_test_endpoint_1/').toBeTruthy();
  });
});
