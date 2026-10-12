import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  const browser = await chromium.launch({
    headless: true,
  });

  const viewports = [
    { width: 1440, height: 900, name: '1440px' },
    { width: 1100, height: 900, name: '1100px' },
    { width: 390, height: 844, name: '390px' },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`TESTING PRODUCTION BUILD VIEWPORT: ${vp.name}`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[Browser error]`, msg.text());
    });

    await page.goto('http://localhost:3005/feed', { waitUntil: 'networkidle' });
    
    // Wait for content to render
    await page.waitForSelector('#for-you', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Initial audit of Lead, Header, Latest, and Bands
    const audit = await page.evaluate(() => {
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;

      // Find the currently visible Nav container (desktop or mobile)
      const navs = Array.from(document.querySelectorAll('nav[aria-label="Compass navigation"]'));
      const nav = navs.find(n => n.getBoundingClientRect().width > 0) || navs[0];
      const navButtons = nav ? Array.from(nav.querySelectorAll('button')).map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.textContent?.trim(),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          isCurrent: b.getAttribute('aria-current') === 'page',
          fontWeight: window.getComputedStyle(b).fontWeight,
          opacity: window.getComputedStyle(b).opacity,
        };
      }) : [];

      // Lead story
      const leadSection = document.querySelector('section[aria-label="Lead Story"]');
      const leadHeadline = leadSection ? leadSection.querySelector('h2') : null;
      const leadHeadlineStyle = leadHeadline ? window.getComputedStyle(leadHeadline) : null;
      const leadSummaryP = leadSection ? leadSection.querySelector('p.line-clamp-2') : null;
      const leadImg = leadSection ? (leadSection.querySelector('.lead-col-right img') || leadSection.querySelector('img')) : null;
      const leadImgRect = leadImg ? leadImg.getBoundingClientRect() : null;

      // Latest dispatches
      const latestSec = document.querySelector('div[aria-label="Latest Stories"]');
      const latestRows = latestSec ? Array.from(latestSec.querySelectorAll('article')).map(r => {
        const headline = r.querySelector('h3')?.textContent?.trim();
        const source = r.querySelector('span')?.textContent?.trim();
        return { source, headline };
      }) : [];

      // Greeting row
      const greetingRow = document.querySelector('#for-you .border-b');
      const greetingText = greetingRow ? greetingRow.textContent?.trim() : '';

      // Rendered Bands
      const bandEls = Array.from(document.querySelectorAll('section[id]:not(#for-you)'));
      const bands = bandEls.map(b => {
        const title = b.querySelector('h2')?.textContent?.trim();
        const badge = b.querySelector('.font-mono')?.textContent?.trim();
        const articles = Array.from(b.querySelectorAll('article')).map(a => {
          const headline = a.querySelector('h3')?.textContent?.trim();
          const source = a.querySelector('.font-mono')?.textContent?.trim();
          const hasImg = !!a.querySelector('img');
          return { headline, source, hasImg };
        });
        return {
          id: b.id,
          title,
          badge,
          articleCount: articles.length,
          articles,
        };
      });

      return {
        headerHeight: headerRect ? Math.round(headerRect.height) : 0,
        navButtons,
        greetingText,
        lead: {
          headline: leadHeadline?.textContent?.trim(),
          fontSize: leadHeadlineStyle?.fontSize,
          lineHeight: leadHeadlineStyle?.lineHeight,
          letterSpacing: leadHeadlineStyle?.letterSpacing,
          hasSummaryParagraph: !!leadSummaryP,
          imgWidth: leadImgRect ? Math.round(leadImgRect.width) : 0,
          imgHeight: leadImgRect ? Math.round(leadImgRect.height) : 0,
        },
        latestRows,
        bands,
      };
    });

    console.log(`\nAudit Results for ${vp.name}:`);
    console.log(`Header height: ${audit.headerHeight}px`);
    console.log(`Nav items (${audit.navButtons.length}):`, audit.navButtons.map(b => `${b.text} (${b.width}px)`).join(' | '));
    console.log(`Greeting: "${audit.greetingText.replace(/\s+/g, ' ')}"`);
    console.log(`Lead headline: "${audit.lead.headline}"`);
    console.log(`  FontSize: ${audit.lead.fontSize}, LineHeight: ${audit.lead.lineHeight}, LetterSpacing: ${audit.lead.letterSpacing}`);
    console.log(`  Has summary paragraph: ${audit.lead.hasSummaryParagraph} (should be false)`);
    console.log(`  Image: ${audit.lead.imgWidth}x${audit.lead.imgHeight}px (capped <= 320px)`);
    console.log(`Latest Rows (${audit.latestRows.length}):`);
    audit.latestRows.forEach((r, i) => console.log(`  [${i + 1}] [${r.source}] ${r.headline}`));
    console.log(`Rendered Bands (${audit.bands.length}):`);
    audit.bands.forEach(b => {
      console.log(`  #${b.id} (${b.title}): ${b.articleCount} articles, badge="${b.badge}"`);
      b.articles.forEach((a, i) => console.log(`    - [${a.source}] ${a.headline} (hasImg: ${a.hasImg})`));
    });

    // Check marker progression across bands
    console.log(`\n--- Measuring Marker Continuous Left-to-Right Progression ---`);
    const allSections = ['for-you', ...audit.bands.map(b => b.id)];
    const markerPositions = [];

    for (const secId of allSections) {
      await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, secId);

      await page.waitForTimeout(500);

      const markerData = await page.evaluate((currId) => {
        const navs = Array.from(document.querySelectorAll('nav[aria-label="Compass navigation"]'));
        const nav = navs.find(n => n.getBoundingClientRect().width > 0) || navs[0];
        if (!nav) return null;
        // Orange marker element has width: 2px, height: 12px, backgroundColor #FF6B4A
        const markerEl = nav.querySelector('div[style*="background-color: rgb(255, 107, 74)"][style*="width: 2px"]') 
          || nav.querySelector('div[style*="#FF6B4A"][style*="width: 2px"]')
          || Array.from(nav.querySelectorAll('div')).find(d => {
            const s = window.getComputedStyle(d);
            return (s.backgroundColor === 'rgb(255, 107, 74)' || s.backgroundColor === '#ff6b4a') && d.offsetHeight >= 10;
          });

        const navRect = nav.getBoundingClientRect();
        const markerRect = markerEl ? markerEl.getBoundingClientRect() : null;
        const relativeX = markerRect ? Math.round(markerRect.left - navRect.left + markerRect.width / 2) : null;

        const activeBtn = nav.querySelector('button[aria-current="page"]');

        return {
          sectionId: currId,
          markerRelativeX: relativeX,
          activeLabel: activeBtn?.textContent?.trim(),
          scrollY: Math.round(window.scrollY),
        };
      }, secId);

      markerPositions.push(markerData);
      console.log(`Section #${secId.padEnd(8)}: scrollY=${String(markerData?.scrollY).padStart(5)}px | marker relative X = ${markerData?.markerRelativeX}px | active = ${markerData?.activeLabel}`);

      // Save screenshot at this scrolled section
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `screenshot-prod-${vp.name}-band-${secId}.png`),
        fullPage: false,
      });
    }

    // Top screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `screenshot-prod-${vp.name}-top.png`),
      fullPage: false,
    });

    // Fullpage screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `screenshot-prod-${vp.name}-fullpage.png`),
      fullPage: true,
    });

    await context.close();
  }

  await browser.close();
  console.log(`\nALL VERIFICATION TESTS COMPLETED. Screenshots saved in: ${SCREENSHOT_DIR}`);
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
