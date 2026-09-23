// utils/testData.ts

export type TestData = {
  saucedemoUrl: string; 
  saucedemoInventoryUrl: string;
  googleUrl: string;
};

// Pull from env first, fallback to default
export const saucedemoUrl =
  process.env.APP_URL ??
  process.env.BASE_URL ??
  'https://www.saucedemo.com/';

export const googleUrl = process.env.GOOGLE_URL ?? 'https://www.google.com/';
export const saucedemoInventoryUrl = `${saucedemoUrl.replace(/\/$/, '')}/inventory.html`;

export const testData: TestData = {
  saucedemoUrl,
  saucedemoInventoryUrl,
  googleUrl,
};
