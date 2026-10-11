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

  const widths = [1440, 1100, 390];

  for (const width of widths) {
    console.log(`\n========================================`);
    console.log(`TESTING VIEWPORT WIDTH: ${width}px`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();
    
    // Listen for console logs
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[Browser error]`, msg.text());
    });

    await page.goto('http://localhost:3000/feed', { waitUntil: 'networkidle' });
    
    // Wait for content to render (wait for #for-you and articles)
    await page.waitForSelector('#for-you', { timeout: 10000 });
    // Wait an additional 2 seconds for images/RSS items to settle
    await page.waitForTimeout(2000);

    // Run DOM checks
    const data = await page.evaluate((w) => {
      const header = document.querySelector('header');
      const headerComputed = header ? window.getComputedStyle(header) : null;
      const headerRect = header ? header.getBoundingClientRect() : null;
      const nav = document.querySelector('nav[aria-label="Compass navigation"]');
      const navComputed = nav ? window.getComputedStyle(nav) : null;
      const navRect = nav ? nav.getBoundingClientRect() : null;
      
      const needle = nav ? nav.querySelector('.text-juice-orange, [class*="border-t-"], [class*="bg-juice-orange"]') : null;
      const compassButtons = nav ? Array.from(nav.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        width: b.getBoundingClientRect().width,
        opacity: window.getComputedStyle(b).opacity,
        fontWeight: window.getComputedStyle(b).fontWeight,
        isCurrent: b.getAttribute('aria-current') === 'page',
      })) : [];

      // Check Lead Story
      const leadSection = document.querySelector('section[aria-label="Lead Story"]');
      const leadRect = leadSection ? leadSection.getBoundingClientRect() : null;
      const colLeft = leadSection ? leadSection.querySelector('.lead-col-left') : null;
      const colRight = leadSection ? leadSection.querySelector('.lead-col-right') : null;
      const visibleLeadImg = leadSection ? Array.from(leadSection.querySelectorAll('img')).find(img => img.getBoundingClientRect().width > 0) : null;
      const leadImgRect = visibleLeadImg ? visibleLeadImg.getBoundingClientRect() : null;
      const leadHeadline = leadSection ? leadSection.querySelector('h2')?.textContent?.trim() : null;
      const leadSummary = leadSection ? leadSection.querySelector('p')?.textContent?.trim() : null;

      // Check Latest List
      const latestSection = document.querySelector('div[aria-label="Latest Stories"]');
      const latestRows = latestSection ? Array.from(latestSection.querySelectorAll('article')).map(r => ({
        source: r.querySelector('span')?.textContent?.trim(),
        headline: r.querySelector('h3')?.textContent?.trim(),
        hasImage: !!r.querySelector('img'),
      })) : [];

      // Check Bands
      const bandSections = Array.from(document.querySelectorAll('section[id]:not(#for-you)')).map(s => {
        const id = s.id;
        const title = s.querySelector('h2')?.textContent?.trim();
        const articles = Array.from(s.querySelectorAll('article')).map(a => {
          const headline = a.querySelector('h3')?.textContent?.trim();
          const source = a.querySelector('.font-mono')?.textContent?.trim();
          const img = a.querySelector('img');
          const imgRect = img ? img.getBoundingClientRect() : null;
          return {
            headline,
            source,
            hasImage: !!img,
            imgWidth: imgRect ? imgRect.width : 0,
            imgHeight: imgRect ? imgRect.height : 0,
          };
        });
        const computed = window.getComputedStyle(s);
        return {
          id,
          title,
          bgColor: computed.backgroundColor,
          textColor: computed.color,
          articleCount: articles.length,
          articles,
        };
      });

      // Check pull quote band
      const pullQuoteBand = document.querySelector('section[aria-label="Featured Pull-Quote"]');

      // Check all story headlines on the page for duplicates
      const allHeadlines = [];
      if (leadHeadline) allHeadlines.push({ location: 'Lead', title: leadHeadline });
      latestRows.forEach((r, idx) => allHeadlines.push({ location: `Latest-${idx + 1}`, title: r.headline }));
      bandSections.forEach(b => {
        b.articles.forEach((a, idx) => allHeadlines.push({ location: `${b.id}-${idx + 1}`, title: a.headline }));
      });

      const titles = allHeadlines.map(h => h.title);
      const duplicates = titles.filter((t, idx) => titles.indexOf(t) !== idx);

      return {
        header: {
          position: headerComputed?.position,
          top: headerComputed?.top,
          zIndex: headerComputed?.zIndex,
          backgroundColor: headerComputed?.backgroundColor,
          height: headerRect?.height || header?.offsetHeight,
        },
        compass: {
          navWidth: navRect?.width,
          navComputedWidth: navComputed?.width,
          buttons: compassButtons,
        },
        lead: {
          headline: leadHeadline,
          summary: leadSummary,
          hasImg: !!visibleLeadImg,
          imgWidth: leadImgRect?.width,
          imgHeight: leadImgRect?.height,
          colLeftWidth: colLeft?.getBoundingClientRect().width,
          colRightWidth: colRight?.getBoundingClientRect().width,
        },
        latestCount: latestRows.length,
        latestRows,
        bandSections,
        hasPullQuoteBand: !!pullQuoteBand,
        totalStoriesOnPage: allHeadlines.length,
        duplicates,
      };
    }, width);

    console.log(`Header: position=${data.header.position}, zIndex=${data.header.zIndex}, bg=${data.header.backgroundColor}`);
    console.log(`Compass width: ${data.compass.navWidth}px, button count: ${data.compass.buttons.length}`);
    data.compass.buttons.forEach((b, i) => {
      console.log(`  Compass Item ${i} (${b.text}): width=${b.width}px, active=${b.isCurrent}, opacity=${b.opacity}, weight=${b.fontWeight}`);
    });
    console.log(`Lead Story: "${data.lead.headline?.slice(0, 40)}..."`);
    console.log(`  Image: hasImg=${data.lead.hasImg}, width=${data.lead.imgWidth}px, height=${data.lead.imgHeight}px`);
    console.log(`Latest Rows (${data.latestCount}):`);
    data.latestRows.forEach((r, idx) => {
      console.log(`  [${idx + 1}] source: ${r.source} | headline: ${r.headline?.slice(0, 45)}... | hasThumbnail: ${r.hasImage}`);
    });
    console.log(`Has Pull Quote Band: ${data.hasPullQuoteBand} (MUST BE FALSE)`);
    console.log(`Bands rendered (${data.bandSections.length}):`);
    data.bandSections.forEach(b => {
      console.log(`  Band #${b.id} ("${b.title}"): bg=${b.bgColor}, articles=${b.articleCount}`);
      b.articles.forEach((a, i) => {
        console.log(`    Article ${i + 1}: [${a.source}] ${a.headline?.slice(0, 35)}... (img: ${a.imgWidth}x${a.imgHeight})`);
      });
    });
    console.log(`Total stories on page: ${data.totalStoriesOnPage} (Hard limit <= 21)`);
    console.log(`Duplicate stories found: ${data.duplicates.length === 0 ? 'NONE (Pass)' : JSON.stringify(data.duplicates)}`);

    // Take top screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `screenshot-${width}px-top.png`),
      fullPage: false,
    });

    // Scroll down to test sticky/fixed header over a band
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `screenshot-${width}px-scrolled-800.png`),
      fullPage: false,
    });

    // Scroll to tech band if exists
    const techEl = await page.$('#tech');
    if (techEl) {
      await page.evaluate(() => {
        const el = document.getElementById('tech');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `screenshot-${width}px-tech-band.png`),
        fullPage: false,
      });
    }

    // Full page screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `screenshot-${width}px-fullpage.png`),
      fullPage: true,
    });

    await context.close();
  }

  await browser.close();
  console.log(`\nALL SCREENSHOTS SAVED IN: ${SCREENSHOT_DIR}`);
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
