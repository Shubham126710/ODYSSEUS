import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/tmp/odysseus_verification';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('--- Starting Comprehensive Odysseus Hub & Reader Verification ---');
  const browser = await chromium.launch({ headless: true });

  // ==========================================
  // TEST 1: Hub Layout & Hero Section (Desktop 1440x900)
  // ==========================================
  console.log('\n[Test 1] Testing Desktop Hub Layout (1440x900)...');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3005/feed', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Measure Header
  const headerBox = await page.locator('header').boundingBox();
  console.log(`Header dimensions: width=${headerBox?.width}px, height=${headerBox?.height}px`);

  // Measure Main and Ticker
  const ticker = page.locator('text=TRENDING').first();
  const tickerVisible = await ticker.isVisible();
  const tickerBox = tickerVisible ? await ticker.boundingBox() : null;
  console.log(`Ticker visible: ${tickerVisible}, y-offset=${tickerBox?.y}px, height=${tickerBox?.height}px`);

  // Verify Ticker sits directly below header
  if (tickerBox && headerBox) {
    const gap = tickerBox.y - headerBox.height;
    console.log(`Gap between header bottom and ticker top: ${gap.toFixed(1)}px (Expected: ~0px)`);
  }

  // Check Ticker animation duration
  const marqueeTrack = page.locator('.animate-marquee').first();
  const animDuration = await marqueeTrack.evaluate((el) => window.getComputedStyle(el).animationDuration);
  console.log(`Marquee animation duration: ${animDuration} (Expected: 38s)`);

  // Check For You hero section height and background
  const forYouSection = page.locator('#for-you');
  const forYouBox = await forYouSection.boundingBox();
  console.log(`For-You hero section height: ${forYouBox?.height}px (Viewport: 900px, should fill or exceed viewport)`);

  // Take screenshot of Desktop Hub Initial Viewport
  const hubInitialPath = path.join(SCREENSHOT_DIR, '01_hub_desktop_initial.png');
  await page.screenshot({ path: hubInitialPath });
  console.log(`Saved screenshot: ${hubInitialPath}`);

  // ==========================================
  // TEST 2: Reading Modal - Paper Theme (Default)
  // ==========================================
  console.log('\n[Test 2] Testing Reading Modal Default (Paper Theme)...');
  
  // Click first story in Latest Dispatches or Lead Story
  const readStoryBtn = page.locator('text=Read story').first();
  if (await readStoryBtn.isVisible()) {
    await readStoryBtn.click();
  } else {
    await page.locator('text=READ→').first().click();
  }

  await page.waitForTimeout(2000);

  // Verify modal is open
  const modalHeader = page.locator('header:has-text("BACK")').first();
  await modalHeader.waitFor({ state: 'visible', timeout: 5000 });
  const modalHeaderBox = await modalHeader.boundingBox();
  console.log(`Reader sticky header height: ${modalHeaderBox?.height}px (Expected: 56-60px)`);

  // Verify Default Theme is "paper"
  const modalContainer = modalHeader.locator('..');
  const modalBg = await modalContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  console.log(`Reader modal background: ${modalBg} (Expected: cream rgb(255, 253, 208))`);

  // Verify Button Clipping: scrollWidth <= clientWidth for every button in reader header
  const headerButtons = modalHeader.locator('button, a');
  const buttonCount = await headerButtons.count();
  console.log(`Inspecting ${buttonCount} header controls for clipping...`);
  let anyClipped = false;
  for (let i = 0; i < buttonCount; i++) {
    const btn = headerButtons.nth(i);
    const text = (await btn.innerText()).trim().replace(/\n/g, ' ') || (await btn.getAttribute('aria-label')) || 'icon';
    const dimensions = await btn.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    const isClipped = dimensions.scrollWidth > dimensions.clientWidth;
    if (isClipped) anyClipped = true;
    console.log(`  - Control [${text}]: scrollW=${dimensions.scrollWidth}, clientW=${dimensions.clientWidth} -> ${isClipped ? 'CLIPPED!' : 'PASS'}`);
  }
  console.log(`Button clipping test result: ${anyClipped ? 'FAILED' : 'PASSED (0 buttons clipped)'}`);

  // Take screenshot of Paper Theme Reader
  const paperReaderPath = path.join(SCREENSHOT_DIR, '02_reader_paper_theme.png');
  await page.screenshot({ path: paperReaderPath });
  console.log(`Saved screenshot: ${paperReaderPath}`);

  // ==========================================
  // TEST 3: Theme Switching (Olive & Dark)
  // ==========================================
  console.log('\n[Test 3] Testing Theme Switching...');
  
  // Switch to Olive theme (2nd dot)
  const oliveDot = page.locator('button[aria-label="Olive theme"]');
  await oliveDot.click();
  await page.waitForTimeout(500);
  const oliveBg = await modalContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  console.log(`Olive theme background: ${oliveBg} (Expected: rgb(93, 130, 70))`);
  const oliveReaderPath = path.join(SCREENSHOT_DIR, '03_reader_olive_theme.png');
  await page.screenshot({ path: oliveReaderPath });
  console.log(`Saved screenshot: ${oliveReaderPath}`);

  // Switch to Dark theme (3rd dot)
  const darkDot = page.locator('button[aria-label="Dark theme"]');
  await darkDot.click();
  await page.waitForTimeout(500);
  const darkBg = await modalContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  console.log(`Dark theme background: ${darkBg} (Expected: rgb(17, 19, 23))`);
  const darkReaderPath = path.join(SCREENSHOT_DIR, '04_reader_dark_theme.png');
  await page.screenshot({ path: darkReaderPath });
  console.log(`Saved screenshot: ${darkReaderPath}`);

  // Switch back to Paper
  const paperDot = page.locator('button[aria-label="Paper theme"]');
  await paperDot.click();
  await page.waitForTimeout(300);

  // ==========================================
  // TEST 4: Hero Image Deduplication Check
  // ==========================================
  console.log('\n[Test 4] Checking Hero Image Deduplication...');
  const heroImgSrc = await page.locator('figure img').first().getAttribute('src');
  const bodyImgs = await page.locator('.rm-body img').all();
  console.log(`Hero image src found: ${heroImgSrc ? heroImgSrc.slice(0, 60) + '...' : 'none'}`);
  console.log(`Total body images: ${bodyImgs.length}`);
  if (heroImgSrc && bodyImgs.length > 0) {
    const firstBodySrc = await bodyImgs[0].getAttribute('src');
    const isDup = firstBodySrc === heroImgSrc;
    console.log(`Is first body image duplicate of hero? ${isDup ? 'DUPLICATE (FAIL)' : 'CLEAN (PASS)'}`);
  }

  // ==========================================
  // TEST 5: Escape Key Closes Modal
  // ==========================================
  console.log('\n[Test 5] Testing Escape Key to Close Reader...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  const isModalVisibleAfterEsc = await modalHeader.isVisible();
  console.log(`Is reader modal visible after Escape? ${isModalVisibleAfterEsc} (Expected: false)`);

  // ==========================================
  // TEST 6: Mobile Responsiveness (390x844 - iPhone 14)
  // ==========================================
  console.log('\n[Test 6] Testing Mobile Responsiveness (390x844)...');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:3005/feed', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(2500);

  // Check Mobile Header & Ticker
  const mobileHeaderBox = await mobilePage.locator('header').boundingBox();
  const mobileTickerBox = await mobilePage.locator('text=TRENDING').boundingBox();
  console.log(`Mobile header height: ${mobileHeaderBox?.height}px, Ticker y: ${mobileTickerBox?.y}px`);

  // Check horizontal scroll on feed
  const feedScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  console.log(`Mobile feed scrollWidth: ${feedScrollWidth}px (Viewport: 390px, overflow=${feedScrollWidth > 390})`);

  // Open reader on mobile
  await mobilePage.locator('text=Read story').first().click();
  await mobilePage.waitForTimeout(2000);

  // Verify mobile reader header controls
  const mobileReaderHeader = mobilePage.locator('header:has-text("BACK")').first();
  await mobileReaderHeader.waitFor({ state: 'visible', timeout: 5000 });
  const mobileHeaderButtons = mobileReaderHeader.locator('button, a');
  const mobBtnCount = await mobileHeaderButtons.count();
  let mobClipped = false;
  for (let i = 0; i < mobBtnCount; i++) {
    const btn = mobileHeaderButtons.nth(i);
    const text = (await btn.innerText()).trim() || (await btn.getAttribute('aria-label')) || 'icon';
    const dims = await btn.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    if (dims.scrollWidth > dims.clientWidth) mobClipped = true;
    console.log(`  - Mobile Control [${text}]: scrollW=${dims.scrollWidth}, clientW=${dims.clientWidth}`);
  }
  console.log(`Mobile button clipping: ${mobClipped ? 'FAIL' : 'PASS (0 clipped)'}`);

  // Check horizontal scroll on mobile reader
  const readerScrollWidth = await mobilePage.evaluate(() => {
    const scrollContainer = document.querySelector('[data-lenis-prevent="true"]');
    return scrollContainer ? scrollContainer.scrollWidth : document.body.scrollWidth;
  });
  console.log(`Mobile reader container scrollWidth: ${readerScrollWidth}px (<= 390px: ${readerScrollWidth <= 390})`);

  const mobileReaderPath = path.join(SCREENSHOT_DIR, '05_reader_mobile_390.png');
  await mobilePage.screenshot({ path: mobileReaderPath });
  console.log(`Saved screenshot: ${mobileReaderPath}`);

  await browser.close();
  console.log('\n--- All Verifications Complete ---');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
