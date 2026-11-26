# Login Feature: Full Execution Flow

This document explains the current execution flow of:

```text
src/features/ui/login.feature
```

It describes the actual files and relationships in this repository. It does not assume that every available class or step is used by this feature.

## 1. Starting point: the feature file

The flow starts in:

```text
src/features/ui/login.feature
```

The feature contains:

- Feature tags: `@smoke @regression @ui @login`
- A `Background` step that opens `saucedemoUrl` before every scenario.
- One `Scenario Outline` for valid users.
- One scenario with examples for invalid or missing credentials.

The feature has two test case IDs:

```text
@TCId-Login001
@TCId-Login002
```

These tags are important because the test-data resolver uses the `@TCId-...` tag to choose the correct row from the JSON data file.

## 2. Playwright configuration loads first

The main configuration file is:

```text
playwright.config.ts
```

When Playwright loads this file, it:

1. Reads `ENV` from the process environment.
2. Defaults `ENV` to `dev` when it is not provided.
3. Builds the environment file path:

```text
env/<ENV>.env
```

4. Loads that file with `dotenv.config()`.
5. Reads `APP_URL`, retry settings, and the storage-state path.
6. Calls `defineBddConfig()` to configure Playwright BDD.

For the default development run, the environment file is:

```text
env/dev.env
```

That file currently contains:

```text
APP_URL=https://www.saucedemo.com/
```

## 3. BDD configuration connects feature files and step files

Inside `playwright.config.ts`, `defineBddConfig()` defines these inputs:

```text
features: src/features/**/*.feature
steps:
  src/fixtures/Fixtures.ts
  src/step-definitions/**/*.{ts,js}
  src/hooks/**/*.{ts,js}
outputDir: .features-gen
```

This means:

- Feature files are read from `src/features`.
- Step definitions are searched under `src/step-definitions`.
- The fixture file is also included as a BDD step source.
- Hooks are searched under `src/hooks`.
- Generated Playwright specs are written under `.features-gen`.

The command that performs this generation is:

```powershell
npm run bddgen
```

The generated login spec currently appears as:

```text
.features-gen/src/features/ui/login.feature.spec.js
```

The generated file is not the source of the test behavior. It is generated from the feature file and imports the custom test object from `src/fixtures/Fixtures.ts`.

## 4. What the generated spec does

The generated spec creates Playwright tests from the Gherkin scenarios.

For the attached feature, the generated tests contain:

- Two tests from `TCId-Login001`, one for each valid-user example.
- Five tests from `TCId-Login002`, one for each invalid-login example.

Therefore, the login feature produces seven test cases.

The generated spec also creates a `beforeEach` for the feature Background:

```text
Before each generated test:
  Given user opens "saucedemoUrl"
```

The generated test imports the custom test from:

```text
../../../../src/fixtures/Fixtures.ts
```

This is how generated BDD tests use the project fixtures.

## 5. Fixtures.ts creates the custom test instance

The central wiring file is:

```text
src/fixtures/Fixtures.ts
```

It imports:

```text
@playwright/test
playwright-bdd
LoginPage
InventoryPage
CommonPage
ApiService
```

Then it creates a custom Playwright test object:

```ts
export const test = base.extend<AppFixtures>({ ... });
```

`base.extend<AppFixtures>()` adds the project-specific fixtures to the normal Playwright test fixture system.

The same file then creates the BDD keyword bindings:

```ts
export const { Given, When, Then } = createBdd(test);
```

This makes `Given`, `When`, and `Then` available to step-definition files and to the generated BDD spec.

## 6. Objects created by the fixtures

The fixture definitions in `Fixtures.ts` describe where project objects are instantiated.

### LoginPage

```ts
loginPage: async ({ page }, use) => {
  await use(new LoginPage(page));
}
```

When a test requests the `loginPage` fixture:

1. Playwright provides its built-in `page` fixture.
2. `new LoginPage(page)` creates a LoginPage object.
3. The LoginPage object receives that Playwright Page object.
4. The object is provided to the test through `use()`.

### InventoryPage

```ts
inventoryPage: async ({ page }, use) => {
  await use(new InventoryPage(page));
}
```

This creates an InventoryPage object when that fixture is requested.

### CommonPage

```ts
commonPage: async ({ page }, use) => {
  await use(new CommonPage(page));
}
```

The current login feature requests `commonPage`, so this is the page object created and used by the attached feature.

### APIRequestContext

```ts
apiContext: async ({}, use) => {
  const ctx = await request.newContext({ baseURL });
  await use(ctx);
  await ctx.dispose();
}
```

This creates a Playwright API request context when an API test requests `apiContext`. The login UI feature does not use this fixture.

### ApiService

```ts
apiService: async ({ apiContext }, use) => {
  await use(new ApiService(apiContext));
}
```

This creates the project API service when `apiService` is requested. The attached login feature does not use it.

## 7. BasePage is the parent class for page objects

The page objects inherit from:

```text
src/pages/BasePage.ts
```

`BasePage` receives the Playwright `Page` object in its constructor:

```ts
constructor(page: Page) {
  this.page = page;
  this.logger.info(`${this.constructor.name} initialized`);
}
```

`CommonPage` extends `BasePage`, so the following happens when the fixture creates it:

```text
new CommonPage(page)
  -> CommonPage constructor inherited from BasePage
  -> BasePage stores the Page object
  -> BasePage logs that CommonPage was initialized
```

`BasePage` provides the shared behavior used by `CommonPage`, including:

- Converting locator definitions into Playwright Locators.
- Waiting for a locator to become visible.
- Filling inputs.
- Clicking controls.
- Checking visibility.
- Checking text.
- Checking clickability.
- Capturing visual screenshots.
- Comparing screenshots with baselines.

## 8. Background URL flow

The feature Background contains:

```gherkin
Given user opens "saucedemoUrl"
```

This matches the step in:

```text
src/step-definitions/shared/commonSteps.ts
```

The step receives the `page` fixture and the text `saucedemoUrl`.

It then:

1. Trims the key.
2. Checks that the key exists in the `TestData` type/object.
3. Reads `testData.saucedemoUrl`.
4. Calls `page.goto(testData.saucedemoUrl)`.
5. Waits for `networkidle`.

The value comes from:

```text
src/utils/testData.ts
```

That file reads `APP_URL` first, then `BASE_URL`, then falls back to:

```text
https://www.saucedemo.com/
```

For the current `dev` environment, the Background opens:

```text
https://www.saucedemo.com/
```

This Background runs before each of the seven generated login tests.

## 9. How the valid-login Scenario Outline expands

The feature contains:

```gherkin
Scenario Outline: Valid user login through UI flow
```

Its Examples table contains two rows:

```text
user1 -> testdata.user1
user2 -> testdata.user2
```

The BDD generator creates two separate Playwright tests.

### Valid example 1

The generated value is:

```text
testdata.user1
```

### Valid example 2

The generated value is:

```text
testdata.user2
```

Both examples use:

```text
testdata.password
```

for the password.

## 10. How the invalid-login examples expand

The invalid-login scenario has five Examples rows, so it creates five Playwright tests.

The values are:

1. Empty username and valid password.
2. `wrong_username` and valid password.
3. `standard_user` and empty password.
4. `standard_user` and `wrong_password`.
5. `locked_out_user` and valid password.

The expected error message is written directly in the feature Examples table.

## 11. Test-data lookup flow

The login test data is stored in:

```text
src/test-data/dev/login.json
```

The current data contains:

```json
{
  "TCId-Login001": {
    "user1": "standard_user",
    "user2": "visual_user",
    "password": "secret_sauce"
  },
  "TCId-Login002": {
    "password": "secret_sauce"
  }
}
```

The lookup flow is:

```text
feature value testdata.user1
  -> td("testdata.user1")
  -> resolveTestData(value, testInfo)
  -> read ENV, default dev
  -> read @TCId-Login001 from testInfo.tags
  -> derive feature name login from login.feature.spec.js
  -> load src/test-data/dev/login.json
  -> select json["TCId-Login001"]
  -> select row["user1"]
  -> return standard_user
```

For the password:

```text
 testdata.password
  -> current TC ID selects the correct JSON row
  -> password is returned as secret_sauce
```

Values that do not start with `testdata.` are returned unchanged.

Examples:

```text
wrong_username -> wrong_username
standard_user -> standard_user
"" -> ""
```

The resolver also checks that:

- The `@TCId-...` tag exists.
- The JSON file exists.
- The test case row exists.
- The requested key exists in that row.

## 12. The `td` fixture is the convenience wrapper

`Fixtures.ts` defines:

```ts
td: async ({ resolveTestData, $testInfo }, use) => {
  await use((value: string) => String(resolveTestData(value, $testInfo)));
}
```

This means step definitions do not call the resolver directly.

The flow is:

```text
step receives td
  -> td(value)
  -> resolveTestData(value, $testInfo)
  -> return resolved string
```

`$testInfo` is supplied by the Playwright BDD integration and contains the generated test information, including tags and file path.

## 13. How input steps execute

The feature step is:

```gherkin
When user enters "testdata.password" in "login_password"
```

It matches this step definition in `commonSteps.ts`:

```ts
When('user enters {string} in {string}', async ({ commonPage, td }, value, key) => {
  await commonPage.inputInElementByKey(asLocatorKey(key), td(value));
});
```

The calls happen in this order:

1. `key` is received as `login_password`.
2. `value` is received as `testdata.password`.
3. `asLocatorKey(key)` validates that `login_password` exists in `L`.
4. `td(value)` resolves the password from JSON.
5. `commonPage.inputInElementByKey(...)` is called.

The same path is used for the username.

## 14. Locator-key validation

The helper is:

```text
src/utils/asLocatorKey.ts
```

It checks whether the supplied key exists in:

```text
src/config/config_locators.ts
```

For the login feature, the keys are:

```text
login_username
login_password
login_loginButton
login_error
inventory_page
```

If a key is not present, `asLocatorKey()` throws an error before trying to interact with the page.

## 15. Locator resolution

The central locator map is:

```text
src/config/config_locators.ts
```

Current login entries are:

```text
login_username: username
login_password: password
login_loginButton:
  primary: login-button-old
  fallback: login-button
login_error: error
```

`BasePage.resolveRawLocator()` interprets a plain string as a `data-test` value:

```text
username -> [data-test="username"]
password -> [data-test="password"]
login-button -> [data-test="login-button"]
```

For `login_loginButton`, `BasePage.getWorkingLocatorByKey()` tries the primary locator first:

```text
[data-test="login-button-old"]
```

If it is not visible within the configured timeout, it tries the fallback:

```text
[data-test="login-button"]
```

If a fallback is used, the framework logs a warning.

## 16. How the click step executes

The feature step is:

```gherkin
And user clicks "login_loginButton"
```

It matches this step in `commonSteps.ts`:

```ts
When('user clicks {string}', async ({ commonPage }, key) => {
  await commonPage.clickByKey(asLocatorKey(key));
});
```

The call chain is:

```text
feature step
  -> commonSteps.ts click step
  -> asLocatorKey("login_loginButton")
  -> commonPage.clickByKey("login_loginButton")
  -> BasePage.getWorkingLocatorByKey()
  -> try primary/fallback locator
  -> expect locator visible
  -> locator.click()
```

## 17. How the inventory assertion executes after valid login

The valid scenario ends with:

```gherkin
Then "inventory_page" should be visible
```

This matches:

```ts
Then('{string} should be visible', async ({ commonPage }, key) => {
  await commonPage.assertVisibleByKey(asLocatorKey(key));
});
```

The call chain is:

```text
feature step
  -> commonSteps.ts visibility step
  -> asLocatorKey("inventory_page")
  -> commonPage.assertVisibleByKey("inventory_page")
  -> BasePage.getWorkingLocatorByKey()
  -> resolve inventory_page from config_locators.ts
  -> wait for the locator to be visible
  -> assert it is visible
```

The current locator value is:

```text
inventory_page: inventory-container
```

Because it is a plain string, it resolves to:

```text
[data-test="inventory-container"]
```

## 18. How invalid-login assertions execute

The invalid scenario uses:

```gherkin
Then "login_error" should be visible
And "login_error" text should be "..."
```

The first step uses `assertVisibleByKey()`.

The second step matches:

```ts
Then('{string} text should be {string}', async ({ commonPage }, key, expectedText) => {
  await commonPage.assertContainsTextByKey(asLocatorKey(key), expectedText);
});
```

The lookup for `login_error` is:

```text
login_error
  -> config_locators.ts
  -> error
  -> [data-test="error"]
```

The expected error text comes directly from the feature Examples table. It is not loaded from `login.json`.

## 19. Visual validation flow

The valid-login scenario has these steps:

```gherkin
Then visual validation passes for "login_username" element
And visual validation passes for "login_password" element
And visual validation passes for "login_loginButton" element
And visual validation passes for "login" page
```

These match the definitions in:

```text
src/step-definitions/ui/uiSteps.ts
```

### Element visual validation

The call chain is:

```text
feature step
  -> uiSteps.ts
  -> commonPage.assertVisualElement(locatorKey)
  -> asLocatorKey(locatorKey)
  -> CommonPage creates element snapshot name
  -> BasePage resolves the locator
  -> locator screenshot is captured
  -> compareWithBaseline() compares it with the baseline
```

The element snapshot name is built as:

```text
elementUnderTest_<locator-key>.png
```

### Page visual validation

For `login` page, `CommonPage.assertVisualPage()` creates:

```text
pageUnderTest_login.png
```

It then calls `BasePage.assertPageScreenshot()`, which:

1. Captures a full-page screenshot.
2. Disables animations.
3. Hides the caret.
4. Uses CSS scale.
5. Passes the screenshot to `compareWithBaseline()`.

The visual comparison implementation is in:

```text
src/utils/visualCompare.ts
```

## 20. Hooks that run around the scenarios

The configured hooks file is:

```text
src/hooks/hooks.ts
```

It creates BDD hooks using the same custom `test` from `Fixtures.ts`:

```ts
const { BeforeAll, AfterAll, Before, After, BeforeStep, AfterStep } = createBdd(test);
```

For login scenarios, the hooks currently do the following:

### BeforeAll

- Creates `test-results/hooks` if needed.
- Logs the worker start.

### Before

- Logs the scenario title and tags.
- Registers browser console logging.
- Registers page-error logging.

### After

- Logs the scenario status and tags.
- If the scenario failed, captures a full-page screenshot.
- Attaches that screenshot to the test result.

### AfterAll

- Logs the worker finish.

`BeforeStep` and `AfterStep` only log when their environment flags are enabled.

## 21. What LoginPage does and does not do here

The class is:

```text
src/pages/LoginPage.ts
```

It contains:

```ts
async attemptLogin(username: string, password: string)
```

That method fills the username and password through locator keys and clicks the login button.

The step definition that calls it is:

```text
src/step-definitions/ui/loginSteps.ts
```

However, the attached `login.feature` does not contain this step:

```gherkin
When user performs UI login with "..." and "..."
```

Instead, it uses the generic steps from `commonSteps.ts`:

```gherkin
When user enters "..." in "..."
And user clicks "..."
```

Therefore, for the current login feature:

- `CommonPage` is used.
- `LoginPage.attemptLogin()` is not called.
- `loginSteps.ts` defines a reusable alternative login step, but this feature does not invoke it.

## 22. Storage-state projects in the current configuration

The current `playwright.config.ts` defines two projects.

### storage-state-setup

This project is configured with:

```text
testDir: tests
testMatch: .features-gen/**/*.spec.ts, tests/**/*.spec.ts
```

The setup project is intended to run the standalone storage-state setup test under:

```text
tests/loginStorageState.spec.ts
```

That test creates:

```text
src/test-data/storageState.json
```

### chromium

The Chromium project:

- Depends on `storage-state-setup`.
- Ignores `loginStorageState.spec.ts` directly.
- Loads the configured storage-state JSON through `use.storageState`.
- Runs the generated BDD tests.

The storage-state path is resolved from:

```text
STORAGE_STATE_PATH
```

or defaults to:

```text
src/test-data/storageState.json
```

The login feature itself still opens `saucedemoUrl` in its Background and performs its own login actions. The storage state is a Playwright project-level capability; it does not replace the explicit login steps currently written in this feature.

## 23. Full flow diagram

```mermaid
flowchart TD
    A[src/features/ui/login.feature] --> B[npm run bddgen]
    B --> C[.features-gen/src/features/ui/login.feature.spec.js]
    C --> D[Imports src/fixtures/Fixtures.ts]
    D --> E[Custom test = base.extend<AppFixtures>]
    E --> F[createBdd(test)]
    F --> G[Generated test requests page, commonPage, td]
    G --> H[Fixtures.ts creates CommonPage with Playwright Page]
    G --> I[td calls resolveTestData]
    I --> J[src/test-data/dev/login.json]
    J --> K[TCId tag selects JSON row]
    G --> L[Generated Background calls Given]
    L --> M[src/step-definitions/shared/commonSteps.ts]
    M --> N[src/utils/testData.ts]
    N --> O[env/dev.env APP_URL]
    M --> P[asLocatorKey]
    P --> Q[src/config/config_locators.ts]
    Q --> R[src/pages/BasePage.ts locator methods]
    R --> S[SauceDemo browser page]
    S --> T[Assertions and visual comparison]
    T --> U[src/utils/visualCompare.ts]
    C --> V[src/hooks/hooks.ts]
    V --> W[Logging and failure screenshots]
```

## 24. Practical command flow

Generate the BDD specs:

```powershell
npm run bddgen
```

Run all configured Playwright tests:

```powershell
npm run pw:test
```

Run only login-tagged tests:

```powershell
npm run pw:login
```

The `pw:login` script expands to:

```text
npm run bddgen && playwright test --grep "@login"
```

The command therefore generates the current specs first, then asks Playwright to run tests carrying the `@login` tag.

## 25. One-minute interview explanation

> "The login flow starts in the Gherkin feature. Playwright BDD reads that feature and generates a JavaScript Playwright spec under `.features-gen`. The generated spec imports the custom test from `Fixtures.ts`. That custom test extends Playwright with page-object, API, and test-data fixtures and creates the BDD `Given`, `When`, and `Then` bindings. Before every scenario, the Background step resolves `saucedemoUrl` from `testData.ts`, which reads `APP_URL` from `env/dev.env`, and opens the application. The generic login steps use `td()` to resolve values such as `testdata.user1` from `src/test-data/dev/login.json`, using the scenario's `@TCId` tag to select the row. They validate locator keys through `asLocatorKey()`, resolve selectors from `config_locators.ts`, and perform the actual Playwright actions through `CommonPage` and its inherited `BasePage` methods. Visual steps use `CommonPage` and `visualCompare.ts`. Hooks add logging and failure screenshots around each scenario. `LoginPage` is available as a fixture and has a combined login method, but the current feature uses the generic CommonPage steps instead."
