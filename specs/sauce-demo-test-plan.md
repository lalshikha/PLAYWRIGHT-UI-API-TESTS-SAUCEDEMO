# Sauce Demo UI Test Plan

## Application Overview

End-to-end UI coverage for the Sauce Demo storefront at saucedemo.com. The application provides login with multiple user personas, a six-product inventory, sorting, product detail pages, cart management, checkout, order completion, side-menu navigation, logout, reset state, and order PDF generation. Every scenario is independent and starts from a fresh browser state unless the steps explicitly create the required state.

## Test Scenarios

### 1. Authentication and Session Management

**Seed:** `tests/loginStorageState.spec.ts`

#### 1.1. Login with a valid standard user

**File:** `tests/plans/auth/valid-login.spec.ts`

**Steps:**
  1. Open the application in a fresh browser context.
    - expect: The login form is visible with Username, Password, and Login controls.
  2. Enter username `standard_user` and password `secret_sauce`, then select Login.
    - expect: The user is authenticated.
    - expect: The browser navigates to the inventory page.
    - expect: The Products heading and six product cards are visible.
    - expect: The cart is empty.

#### 1.2. Reject invalid, locked, and missing login credentials

**File:** `tests/plans/auth/invalid-login.spec.ts`

**Steps:**
  1. Open the application in a fresh browser context and submit blank credentials.
    - expect: Login is rejected.
    - expect: A required-field validation message is shown.
    - expect: The user remains on the login page.
  2. Submit a valid username with an incorrect password.
    - expect: Login is rejected with an authentication error.
    - expect: The user remains on the login page.
  3. Submit `locked_out_user` with password `secret_sauce`.
    - expect: Login is rejected with a locked-user error.
    - expect: The user remains on the login page.

#### 1.3. Logout ends the authenticated session

**File:** `tests/plans/auth/logout.spec.ts`

**Steps:**
  1. Log in as `standard_user` with password `secret_sauce`.
    - expect: The inventory page is displayed.
  2. Open the side menu and select Logout.
    - expect: The user is returned to the login page.
    - expect: Authenticated inventory content is no longer available without logging in again.

### 2. Inventory and Product Discovery

**Seed:** `tests/loginStorageState.spec.ts`

#### 2.1. Display inventory and sort products

**File:** `tests/plans/inventory/inventory-and-sorting.spec.ts`

**Steps:**
  1. Log in as `standard_user`.
    - expect: Six products are displayed with names, descriptions, prices, and Add to cart controls.
    - expect: The default sort is Name (A to Z).
  2. Select Name (Z to A), Price (low to high), and Price (high to low) in turn.
    - expect: Products are reordered correctly for each selected option.
    - expect: The selected option remains visible in the sort control.
    - expect: Product prices and controls remain present after each reorder.

#### 2.2. Open product details and continue shopping

**File:** `tests/plans/inventory/product-details.spec.ts`

**Steps:**
  1. Log in and select the image or name for Sauce Labs Backpack.
    - expect: The product detail page opens.
    - expect: The product name, description, price, image, and Add to cart control are displayed.
  2. Add the product to the cart and select Back to products.
    - expect: The cart badge shows one item.
    - expect: The inventory page is displayed.
    - expect: The selected product remains available without duplicate unintended cart items.

#### 2.3. Exercise side-menu navigation and reset state

**File:** `tests/plans/inventory/menu-and-reset.spec.ts`

**Steps:**
  1. Log in, add any product to the cart, and open the side menu.
    - expect: All Items, Dynamic Catalog, About, Logout, Reset App State, and Close Menu controls are visible.
  2. Select Reset App State.
    - expect: The cart is emptied.
    - expect: The application remains usable and the reset state is reflected in the UI.
  3. Open the menu, select Close Menu, then reopen and select All Items.
    - expect: The menu closes and reopens correctly.
    - expect: All Items returns to the inventory view.

### 3. Cart and Checkout

**Seed:** `tests/loginStorageState.spec.ts`

#### 3.1. Add, remove, and preserve cart contents

**File:** `tests/plans/cart/cart-management.spec.ts`

**Steps:**
  1. Log in and add Sauce Labs Backpack and Sauce Labs Bike Light.
    - expect: The cart badge shows two items.
    - expect: Each selected product changes from Add to cart to its remove action where applicable.
  2. Open the cart.
    - expect: Both products, quantities, prices, Remove controls, Continue Shopping, and Checkout are displayed.
  3. Remove one product, then select Continue Shopping.
    - expect: The removed product is absent from the cart.
    - expect: The remaining item count is correct.
    - expect: The inventory page is displayed.

#### 3.2. Validate checkout required fields

**File:** `tests/plans/cart/checkout-validation.spec.ts`

**Steps:**
  1. Log in, add one product, open the cart, and select Checkout.
    - expect: Checkout: Your Information is displayed with First Name, Last Name, Zip/Postal Code, Cancel, and Continue controls.
  2. Select Continue with all fields blank.
    - expect: Checkout does not advance.
    - expect: A required-field validation message identifies the missing information.
  3. Fill only one or two of the fields and select Continue.
    - expect: Checkout does not advance.
    - expect: Validation identifies the remaining missing fields.

#### 3.3. Complete an order and verify totals

**File:** `tests/plans/cart/complete-order.spec.ts`

**Steps:**
  1. Log in, add Sauce Labs Backpack, open the cart, select Checkout, and enter valid first name, last name, and postal code.
    - expect: The checkout overview page opens.
    - expect: The selected item is listed with quantity one and price $29.99.
    - expect: Payment information and shipping information are displayed.
  2. Verify the overview totals.
    - expect: Item total is $29.99.
    - expect: Tax is $2.40.
    - expect: Total is $32.39.
  3. Select Finish.
    - expect: Checkout: Complete is displayed with a thank-you confirmation.
    - expect: The Back Home and Generate PDF order controls are visible.
    - expect: The cart is empty.
  4. Select Back Home.
    - expect: The inventory page is displayed.

#### 3.4. Cancel checkout without completing the order

**File:** `tests/plans/cart/cancel-checkout.spec.ts`

**Steps:**
  1. Log in, add one product, open the cart, select Checkout, then select Cancel.
    - expect: The user leaves checkout without completing an order.
    - expect: No order-complete confirmation is shown.
    - expect: The application returns to the expected prior shopping context and preserves or clearly resets cart state according to the product behavior.

### 4. Compatibility and Resilience

**Seed:** `tests/loginStorageState.spec.ts`

#### 4.1. Exercise supported user personas

**File:** `tests/plans/resilience/user-personas.spec.ts`

**Steps:**
  1. Run the inventory smoke flow independently for `problem_user`, `performance_glitch_user`, `error_user`, and `visual_user`, using password `secret_sauce`.
    - expect: Each user either reaches the inventory page or produces the documented persona-specific behavior.
    - expect: Any persona-specific broken image, delayed response, or error is recorded as a defect only when it violates the expected behavior.
    - expect: No user can access another session's cart or checkout data.

#### 4.2. Generate the order PDF after successful checkout

**File:** `tests/plans/resilience/order-pdf.spec.ts`

**Steps:**
  1. Complete an order through the normal checkout flow.
    - expect: The checkout-complete page is displayed.
  2. Select Generate PDF order.
    - expect: A PDF download or browser PDF response is initiated.
    - expect: The generated document is non-empty and associated with the completed order.
