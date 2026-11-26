import { expect } from '@playwright/test';
import { test } from '../src/fixtures/Fixtures';
import { asLocatorKey } from '../src/utils/asLocatorKey';
import { saucedemoUrl } from '../src/utils/testData';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication and Session Management', () => {
  test('Reject invalid login credentials', async ({ page, commonPage }) => {
    // 1. Open the application in a fresh browser context.
    await page.goto(saucedemoUrl);
    await expect(commonPage.$(asLocatorKey('login_username'))).toBeVisible();

    // 2. Enter wrong_username and wrong_password, then select Login.
    await commonPage.inputInElementByKey(asLocatorKey('login_username'), 'wrong_username');
    await commonPage.inputInElementByKey(asLocatorKey('login_password'), 'wrong_password');
    await commonPage.clickByKey(asLocatorKey('login_loginButton'));

    // Verify the required authentication error is visible and the user remains on login.
    await commonPage.assertContainsTextByKey(
      asLocatorKey('login_error'),
      'Epic sadface: Username and password do not match any user in this service',
    );
    await expect(commonPage.$(asLocatorKey('login_username'))).toBeVisible();
    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
  });
});
