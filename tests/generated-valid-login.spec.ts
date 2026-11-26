import { expect } from '@playwright/test';
import { test } from '../src/fixtures/Fixtures';
import { saucedemoUrl } from '../src/utils/testData';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication and Session Management', () => {
  test('Login with a valid standard user', async ({ page, loginPage, commonPage }) => {
    // 1. Open the application in a fresh browser context.
    await page.goto(saucedemoUrl);
    await expect(loginPage.$('login_username')).toBeVisible();
    await expect(loginPage.$('login_password')).toBeVisible();
    await expect(loginPage.$('login_loginButton')).toBeVisible();

    // 2. Enter username standard_user and password secret_sauce, then select Login.
    await loginPage.attemptLogin('standard_user', 'secret_sauce');
    await expect(commonPage.$('inventory_page')).toBeVisible();
    await commonPage.assertElementByTextIsVisible('Products', true);
    await expect(commonPage.$('inventory_item')).toHaveCount(6);
    await expect(commonPage.$('inventory_shoppingCartLink')).toBeVisible();
  });
});
