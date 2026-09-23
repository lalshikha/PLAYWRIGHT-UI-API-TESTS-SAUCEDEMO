@smoke @ui @regression @inventory
Feature: UI Inventory Functionality

  Background:
    Given user opens "saucedemoInventoryUrl"

  @TCId-Inv001
  Scenario: Verify user can login and access inventory page
    Then visual validation passes for "inventory" page    
    And page title should be "Products"
    And "inventory_hamburgerMenu" should be visible
    And "inventory_addToCartButton" should be visible

  @TCId-Inv002
  Scenario: Verify page title is not Products123 on inventory page
  # created using Playwright MCP
    Then page title should not be "Products123"
    And page title should be "Products"

  @TCId-Inv003
  Scenario: Verify first product details on inventory page
    Then "inventory_backpackTitleLink" text should be "Sauce Labs Backpack"
    And "inventory_backpackTitleLink" should be a clickable link
    And "inventory_backpackPrice" text should be "$29.99"
    And "inventory_addToCartButton" should be visible

  @TCId-Inv004
  Scenario: Verify second product is bike light with non-clickable price
    Then "inventory_bikeLightTitleLink" text should be "Sauce Labs Bike Light"
    And "inventory_bikeLightPrice" should not be clickable
    And "inventory_bikeLightAddToCart" should be clickable
