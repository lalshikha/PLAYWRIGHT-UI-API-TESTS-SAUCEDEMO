# Playwright BDD Framework Best Practices

This document is the reference standard for this repository. It describes the
practices currently present, the practices that should be enforced, and the
improvements recommended for the next iterations of the framework.

## Scope and Technology Baseline

This framework combines:

- Playwright Test for browser, API, fixtures, assertions, traces, screenshots,
  projects, retries, and reporting.
- `playwright-bdd` for Gherkin features and generated Playwright tests.
- TypeScript with strict compiler settings.
- Page objects, typed locator keys, environment-specific test data, API
  services, visual checks, and custom reporting.
- Playwright MCP for AI-assisted browser exploration and test authoring only.

At the time of writing, the repository declares `@playwright/test` `^1.58.2`,
while the npm registry reports `1.63.0`. The lockfile and CI installation are
the reproducible versions. Evaluate and pin upgrades deliberately; do not
upgrade only because a newer version exists.

Useful official references:

- [Playwright Test documentation](https://playwright.dev/docs/intro)
- [Playwright release notes](https://playwright.dev/docs/release-notes)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [playwright-bdd documentation](https://vitalets.github.io/playwright-bdd/)

## Current Strengths

The framework already follows these important practices:

- `defineConfig` centralizes timeouts, retries, workers, reporters, projects,
  and browser options.
- `playwright-bdd` generation runs before test execution and fails on missing
  steps (`missingSteps: 'fail-on-gen'`).
- Custom fixtures inject page objects, API context, API service, and test-data
  resolution instead of using global mutable test state.
- API request contexts are disposed after use.
- Page objects separate UI behavior from Gherkin step definitions.
- Locators are centralized and include role, title, text, id, and test-id
  strategies.
- Test data is separated by environment and test-case ID, with explicit errors
  for missing files, rows, or keys.
- CI can forbid accidental `test.only`; local retries default to zero and CI
  retries are explicit.
- Traces are captured on first retry and screenshots on failure.
- JUnit and HTML reports are generated, with a custom flaky-test reporter.
- Browser console errors and page errors are recorded by hooks.
- API tests use Playwright's `APIRequestContext` rather than a second HTTP
  client, keeping browser and API tests on one toolchain.
- TypeScript `strict` mode and consistent casing are enabled.
- Visual artifacts are separated into baseline, actual, and diff locations.

These strengths should be preserved while the controls below are added.

## Core Test Design Rules

### Test behavior, not implementation

- Prefer user-visible behavior and business outcomes over CSS structure or
  private implementation details.
- Use accessible locators first: `getByRole`, `getByLabel`, `getByText`, and
  `getByTestId` where a stable test contract is appropriate.
- Avoid brittle selectors based on generated classes, deep CSS chains, XPath,
  DOM indexes, or incidental text.
- Ask product teams to add stable `data-testid` attributes for elements with no
  reliable accessible identity.
- Use locator assertions such as `toBeVisible`, `toHaveText`, and
  `toBeEnabled`; they auto-wait and produce better diagnostics than manual
  polling.
- Never use arbitrary `waitForTimeout` delays in committed tests.
- Replace `networkidle` as a generic readiness signal with an assertion on the
  page state the test actually needs. Modern applications may keep long-lived
  connections open.
- Keep each test independent. A test must create or arrange its own state and
  must not depend on execution order.
- Make tests deterministic: control time, randomness, locale, timezone,
  feature flags, and external data where those affect assertions.
- Keep scenarios short and focused on one business capability.

### Assertions

- Assert the outcome after the action that causes it.
- Prefer one clear failure per assertion group, with a useful message when the
  business meaning is not obvious.
- Do not assert incidental details unless they are part of the contract.
- Use `expect.poll` for eventually consistent API or service state instead of
  loops and sleeps.
- Use `test.step` around meaningful multi-action operations when it improves
  report readability. Keep Gherkin steps readable; do not wrap every line just
  to add ceremony.
- Use soft assertions only when collecting independent diagnostics is more
  useful than failing at the first defect.

### Gherkin and BDD

- Write features in business language. Keep selectors, waits, and TypeScript
  details out of `.feature` files.
- Use `Background` only for genuinely shared setup.
- Use `Scenario Outline` for meaningful data variation, not as a substitute for
  readable scenarios.
- Use stable tags for ownership, suite, risk, and test-case IDs, for example
  `@ui`, `@api`, `@smoke`, `@regression`, and `@TCId-...`.
- Require exactly one valid test-case ID where test-data lookup depends on it.
- Keep step wording generic and reusable. Add a scenario-specific step only
  when the behavior cannot be expressed clearly with existing abstractions.
- Avoid duplicate step definitions with overlapping expressions.
- Run BDD generation in CI and fail on missing or ambiguous steps.
- Treat generated `.features-gen` files as build output, not source code.

## Page Objects and Locators

- Keep page objects responsible for page behavior, not test-case decisions.
- Expose intent-revealing methods such as `login()` or `addProductToCart()`;
  avoid exposing raw selectors to feature steps.
- Keep selectors near the page or in the existing typed locator registry. Do
  not scatter selector strings through step definitions.
- Prefer one stable primary locator. Fallback locators should be temporary
  migration aids, not a permanent way to hide selector regressions.
- Record fallback use as a test attachment or CI metric and fail a quality gate
  when fallback use exceeds an agreed threshold.
- Do not wait for visibility in a helper and then perform an action that has a
  different readiness requirement. Let Playwright actionability and the final
  assertion provide the synchronization where possible.
- Use `Locator` objects rather than resolving elements early.
- Keep page-object methods typed and small enough to diagnose from a trace.
- Remove unused helper methods and imports promptly; dead page-object APIs make
  the framework harder to evolve.

## Fixtures, Isolation, and Authentication

- Use fixtures for dependency injection and lifecycle management.
- Keep fixture scope as narrow as practical. Use worker scope only for truly
  expensive, immutable setup.
- Dispose API contexts, browser resources, temporary files, and subscriptions.
- Keep authentication setup in a dedicated project with a dependency, as this
  framework does, but generate storage state from the selected environment and
  credentials.
- Never commit real credentials, session cookies, access tokens, or sensitive
  storage state.
- Store generated authentication state outside source-controlled test data, or
  explicitly prove that the committed state is non-sensitive and disposable.
- Use separate storage state per environment, browser, and role when needed.
- Delete or rotate authentication artifacts in CI workspaces.
- Ensure setup tests use the same `APP_URL`, environment selection, and
  credentials as the tests that consume their storage state.
- Prefer API-based authentication when it is stable and supported; use the UI
  login flow in a focused test that validates authentication itself.

## Environment and Test Data Management

- Load environment configuration once, from one authoritative module.
- Validate required variables at startup with a typed configuration object.
- Fail fast for missing URLs, credentials, API keys, and environment names.
- Never silently fall back from a production-like environment to development.
- Keep `.env` files containing secrets out of version control; commit only safe
  templates such as `.env.example`.
- Use a single naming convention for application and API base URLs.
- Keep environment-specific data structurally identical so tests do not change
  behavior between environments.
- Prefer versioned JSON or TypeScript fixtures for stable data and generated
  data for unique values. Seed and clean server-side data where possible.
- Do not use shared accounts for parallel tests unless the account state is
  isolated or reset between tests.
- Redact secrets, cookies, authorization headers, and personal data from logs,
  traces, screenshots, and report attachments.

## API Testing

- Use `APIRequestContext` for service-level setup, cleanup, and API assertions.
- Keep request construction separate from response assertions.
- Return a typed response object from service methods rather than relying only
  on mutable `lastResponse` state.
- Replace `any` with `unknown` plus runtime validation or typed domain models.
- Validate status, content type, important headers, schema, and business fields.
- Use explicit status expectations, or `response.ok()` where any successful
  2xx response is the contract.
- Test negative cases, authorization, validation errors, idempotency, and
  boundary values, not only successful CRUD paths.
- Use request timeouts and clear error messages for connection failures.
- Keep request bodies and response payloads small in logs. Redact sensitive
  fields before logging.
- Use unique data and clean up created resources. Make cleanup resilient but
  visible when it fails.
- Use API setup to avoid repeating slow UI setup, but keep at least one UI test
  for the authentication and critical user journey.
- Add JSON Schema, Zod, or another runtime contract validator when response
  shape is a material risk.

## Visual Testing

- Prefer Playwright-native `expect(page).toHaveScreenshot()` and
  `expect(locator).toHaveScreenshot()` for new visual coverage. They integrate
  with Playwright snapshots, retries, attachments, projects, and reporting.
- Keep custom `pixelmatch` comparison only where its threshold or image
  processing behavior is an intentional requirement.
- Stabilize visuals by controlling viewport, device scale factor, fonts,
  locale, timezone, color scheme, animations, caret, network data, and dynamic
  timestamps.
- Prefer component or region screenshots over full-page screenshots when the
  requirement is local; use full-page snapshots for page-level contracts.
- Review baseline changes as code changes. Never update baselines silently in
  CI.
- Require an explicit, protected baseline-update job or approval workflow for
  `UPDATE_BASELINES`.
- Keep baselines versioned and generated on a consistent operating system and
  browser version.
- Name snapshots by stable project, feature, and state rather than transient
  test titles.

## Playwright Configuration and Execution

- Keep the Playwright version pinned through the lockfile and update it in a
  reviewed dependency change.
- Use projects for browser, device, environment, API, and setup differences.
- Use project dependencies for authentication or seed projects, and ensure
  dependencies do not create hidden ordering between unrelated tests.
- Use `webServer` when the application is built or started as part of the test
  job. Make readiness and reuse behavior explicit.
- Use `baseURL` and relative paths consistently.
- Set action and navigation timeouts only as guardrails; prefer targeted waits
  and assertions over increasing global timeouts.
- Keep `fullyParallel` only when tests and test data are genuinely isolated.
- Use `workers` appropriate to the CI service and backend capacity. Document
  the chosen value and wire every documented environment variable into config.
- Use retries to collect diagnostics, not to make broken tests pass. Track
  retry rate and quarantine only with an owner and expiry date.
- Use sharding for scale, with deterministic data and report merging.
- Use trace collection on first retry or failure. Use `trace: 'on'` only for
  targeted debugging because traces are expensive.
- Use `blob` reports for sharded CI runs and merge them into a single HTML
  report.
- Keep `forbidOnly` enabled in CI.
- Use `--pass-with-no-tests` only for intentionally empty filtered jobs; a
  normal CI suite should fail when it unexpectedly selects no tests.

## Observability and Reporting

- Keep HTML reports for interactive diagnosis and JUnit for CI test reporting.
- Attach traces, screenshots, videos where justified, request/response details,
  console errors, and fallback metrics to the relevant test.
- Use unique artifact names containing test ID, retry, worker, and project to
  prevent parallel collisions.
- Keep logs structured and redact before writing them.
- Avoid logging full response bodies, credentials, or large repeated payloads.
- Report flaky tests separately from failed tests and assign ownership.
- Define retention limits for `test-results`, reports, traces, screenshots, and
  logs so CI storage does not grow without bound.
- Make failure messages actionable: include the expected value, actual value,
  URL, request method, and correlation ID where available.

## TypeScript, Quality Gates, and Repository Hygiene

- Keep `strict: true` and add `noUnusedLocals`, `noUnusedParameters`, and
  `noImplicitReturns` after cleaning existing violations.
- Replace `any` at framework boundaries with `unknown` and narrow explicitly.
- Add scripts for formatting, linting, type checking, BDD generation, and a
  fast smoke suite. Run them in CI.
- Use Prettier and ESLint consistently; make CI fail on lint errors.
- Add unit tests for data resolution, locator parsing, fallback tracking,
  visual comparison helpers, and API response parsing.
- Add focused integration tests for fixture lifecycle and authentication setup.
- Keep generated output, logs, reports, screenshots, and local storage state out
  of source control unless they are intentional baselines or documentation.
- Review dependency updates for security, browser compatibility, and breaking
  changes. Use automated dependency update pull requests with CI validation.
- Keep documentation synchronized with actual scripts, reporters, paths, and
  environment variables.

## MCP Guidance

The configured `.vscode/mcp.json` starts `@playwright/mcp` through `npx`. MCP
can help an engineer or Copilot inspect a running browser, discover accessible
locators, reproduce a workflow, and draft or refine Playwright tests.

MCP is not part of the production test runtime in this repository:

- Test execution uses Playwright Test and `playwright-bdd`.
- Framework code does not import an MCP client.
- CI should not depend on an interactive MCP session.
- Generated MCP suggestions must be reviewed for stable locators, assertions,
  privacy, test isolation, and maintainability.
- Pin or control the MCP package version in team workflows if reproducibility
  matters; avoid silently executing an unreviewed `@latest` package in a
  restricted environment.

## Recommended Improvement Backlog

### Priority 0: Security and reproducibility

1. Add typed startup validation for environment variables and remove duplicated
   environment loading.
2. Generate storage state using configured URLs and credentials; remove or
   protect committed authentication artifacts.
3. Redact API headers, request bodies, response bodies, cookies, and tokens from
   logs and attachments.
4. Replace `@playwright/mcp@latest` with a controlled version policy for shared
   development environments.

### Priority 1: Reliability and signal

1. Replace generic `networkidle` waits with observable readiness assertions.
2. Add unique screenshot and artifact names for parallel workers and retries.
3. Wire fallback locator tracking into the test result and trend it in CI.
4. Protect visual baseline updates with explicit approval and a dedicated job.
5. Make API service methods typed and return responses instead of storing only
   mutable request state.

### Priority 2: Maintainability

1. Adopt Playwright-native screenshot assertions for new visual tests.
2. Add lint, typecheck, format-check, and BDD-generation CI gates.
3. Tighten TypeScript rules and remove existing unused code before enabling
   additional strict lint rules.
4. Add unit coverage for utilities and focused integration coverage for fixture
   and authentication lifecycles.
5. Update framework documentation so scripts, reporters, paths, and worker
   behavior match the implementation.

### Priority 3: Scale and delivery

1. Add browser/device projects only where the product supports them and run a
   focused matrix in CI.
2. Add `webServer` or a documented external-environment readiness check.
3. Use blob reports and report merging when sharding becomes necessary.
4. Add test ownership, flake SLAs, and automatic expiry for quarantined tests.
5. Add dependency update automation and scheduled browser-version validation.

## Definition of Done for a New Test

- The scenario expresses a user or API behavior and has a stable test-case ID.
- The test is independent, deterministic, and safe to run in parallel.
- Locators use a stable accessible or test contract; no arbitrary waits exist.
- Setup data and cleanup are environment-aware and do not expose secrets.
- Assertions validate the business outcome and useful failure context.
- The test uses existing fixtures, page objects, services, and generic steps
  before introducing new abstractions.
- API tests validate status and meaningful response content.
- Visual tests control nondeterminism and have reviewed baselines.
- BDD generation, type checking, linting, and the relevant focused test pass.
- Reports and artifacts are useful, redacted, uniquely named, and retained by
  policy.
- Documentation and tags are updated when the test changes suite behavior.

## Review Checklist

Before merging framework or test changes, reviewers should ask:

- Does this test fail for the right reason?
- Could it run safely in parallel and on a retry?
- Is the locator or API contract stable and intentional?
- Is synchronization based on observable state?
- Are credentials and personal data protected in every artifact?
- Does the change preserve BDD generation and fixture isolation?
- Is a Playwright-native capability sufficient before adding custom code?
- Are retries, fallbacks, or visual thresholds hiding a real defect?
- Are the new artifacts, tags, scripts, and documentation consistent?
- Is there a focused test or validation command that proves the change?
