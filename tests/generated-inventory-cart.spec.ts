import { expect } from '@playwright/test';
import { test } from '../src/fixtures/Fixtures';
import { asLocatorKey } from '../src/utils/asLocatorKey';
import { saucedemoInventoryUrl } from '../src/utils/testData';

test.describe('Inventory and Product Discovery', () => {
  test('Verify inventory product and cart controls', async ({ page, commonPage }) => {
    // 1. Open the authenticated inventory page.
    await page.goto(saucedemoInventoryUrl);
    await expect(commonPage.$(asLocatorKey('inventory_page'))).toBeVisible();

    // 2. Verify Sauce Labs Backpack, its $29.99 price, and its add-to-cart control.
    await commonPage.assertContainsTextByKey(
      asLocatorKey('inventory_backpackTitleLink'),
      'Sauce Labs Backpack',
    );
    await commonPage.assertClickableLinkByKey(asLocatorKey('inventory_backpackTitleLink'));
    await commonPage.assertContainsTextByKey(asLocatorKey('inventory_backpackPrice'), '$29.99');
    await commonPage.assertClickableByKey(asLocatorKey('inventory_addToCartButton'));

    // 3. Add Sauce Labs Backpack to the cart.
    await commonPage.clickByKey(asLocatorKey('inventory_addToCartButton'));
    await expect(commonPage.$(asLocatorKey('inventory_shoppingCartLink'))).toBeVisible();
  });
});
