import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/shubhamupadhyay/.gemini/antigravity/brain/d226b35e-4fc3-42fa-ba20-4092177ad9a1';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/feed...');
  await page.goto('http://localhost:3000/feed', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Navbar Utilities and Dossier Popover
  console.log('Testing Streak / Traveler Dossier popover...');
  const streakBtn = page.locator('button[aria-label="Streak"]');
  await streakBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'window_4_dossier.png') });
  console.log('Saved window_4_dossier.png');
  await streakBtn.click(); // close
  await page.waitForTimeout(300);

  // 2. Search Modal
  console.log('Testing Search Modal...');
  const searchBtn = page.locator('button[aria-label="Search"]');
  await searchBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'window_1_search.png') });
  console.log('Saved window_1_search.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 3. Import Modal
  console.log('Testing Import Web Article Modal...');
  const importBtn = page.locator('button[aria-label="Import Article"]');
  await importBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'window_2_import.png') });
  console.log('Saved window_2_import.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 4. Onboarding Modal
  console.log('Testing Onboarding Orientation Modal...');
  const guideBtn = page.locator('button[aria-label="Guide"]');
  await guideBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'window_3_onboarding_step1.png') });
  console.log('Saved window_3_onboarding_step1.png');
  
  // Click continue to see step 2
  const continueBtn = page.locator('button:has-text("Continue")');
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'window_3_onboarding_step2.png') });
    console.log('Saved window_3_onboarding_step2.png');
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 5. Reading Modal
  console.log('Testing Reading Chamber Modal...');
  // Click on the headline of the featured story
  const featuredHeadline = page.locator('main h3').first();
  await featuredHeadline.waitFor({ state: 'visible', timeout: 5000 });
  await featuredHeadline.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'window_5_reading_chamber.png') });
  console.log('Saved window_5_reading_chamber.png');

  await browser.close();
  console.log('All verification snapshots completed successfully!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
