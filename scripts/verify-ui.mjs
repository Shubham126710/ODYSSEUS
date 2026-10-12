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

  const widths = [1440, 1100];

  for (const width of widths) {
    console.log(`\n========================================`);
    console.log(`TESTING PRODUCTION BUILD VIEWPORT: ${width}px`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width, height: 900 },
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

    // Run DOM checks & measurements
    const audit = await page.evaluate(() => {
      const header = document.querySelector('header');
      const nav = document.querySelector('nav[aria-label="Compass navigation"]');
      const needleEl = nav ? nav.querySelector('div[aria-hidden="true"]') : null;
      const needleRect = needleEl ? needleEl.getBoundingClientRect() : null;

      const compassButtons = nav ? Array.from(nav.querySelectorAll('button')).map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.textContent?.trim(),
          width: rect.width,
          top: rect.top,
          bottom: rect.bottom,
          opacity: window.getComputedStyle(b).opacity,
          fontWeight: window.getComputedStyle(b).fontWeight,
          isCurrent: b.getAttribute('aria-current') === 'page',
        };
      }) : [];

      // Spacing checks:
      // Ticker is right below header
      const headerRect = header ? header.getBoundingClientRect() : null;
      const forYouSec = document.getElementById('for-you');
      const forYouContainer = forYouSec ? forYouSec.querySelector('.max-w-\\[1200px\\]') : null;
      const forYouContainerStyle = forYouContainer ? window.getComputedStyle(forYouContainer) : null;
      
      const greetingRow = forYouSec ? forYouSec.querySelector('.border-b') : null;
      const greetingRect = greetingRow ? greetingRow.getBoundingClientRect() : null;

      const leadStoryEl = document.querySelector('section[aria-label="Lead Story"]');
      const leadStoryRect = leadStoryEl ? leadStoryEl.getBoundingClientRect() : null;

      const latestSection = document.querySelector('div[aria-label="Latest Stories"]');
      const latestRect = latestSection ? latestSection.getBoundingClientRect() : null;
      const latestHeader = latestSection ? latestSection.querySelector('.border-b') : null;
      const latestHeaderRect = latestHeader ? latestHeader.getBoundingClientRect() : null;

      const latestRows = latestSection ? Array.from(latestSection.querySelectorAll('article')).map(r => {
        const computed = window.getComputedStyle(r);
        return {
          source: r.querySelector('span')?.textContent?.trim(),
          headline: r.querySelector('h3')?.textContent?.trim(),
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
          hasImg: !!r.querySelector('img'),
        };
      }) : [];

      // Lead headline & image check
      const leadHeadlineEl = leadStoryEl ? leadStoryEl.querySelector('h2') : null;
      const leadHeadlineStyle = leadHeadlineEl ? window.getComputedStyle(leadHeadlineEl) : null;
      const italicWords = leadHeadlineEl ? Array.from(leadHeadlineEl.querySelectorAll('.font-serif, [class*="italic"]')).map(el => el.textContent?.trim()) : [];
      
      const leadImg = leadStoryEl ? (leadStoryEl.querySelector('.lead-col-right img') || leadStoryEl.querySelector('img')) : null;
      const leadImgRect = leadImg ? leadImg.getBoundingClientRect() : null;
      const leadColLeft = leadStoryEl ? leadStoryEl.querySelector('.lead-col-left') : null;
      const leadColLeftRect = leadColLeft ? leadColLeft.getBoundingClientRect() : null;

      // Bands
      const bandEls = Array.from(document.querySelectorAll('section[id]:not(#for-you)'));
      const bands = bandEls.map(b => {
        const titleEl = b.querySelector('h2');
        const countBadge = b.querySelector('.font-mono');
        const articles = Array.from(b.querySelectorAll('article')).map(a => {
          const headline = a.querySelector('h3')?.textContent?.trim();
          const source = a.querySelector('.font-mono')?.textContent?.trim();
          const img = a.querySelector('img');
          const imgRect = img ? img.getBoundingClientRect() : null;
          return {
            headline,
            source,
            imgWidth: imgRect ? imgRect.width : 0,
            imgHeight: imgRect ? imgRect.height : 0,
          };
        });
        const computed = window.getComputedStyle(b);
        return {
          id: b.id,
          title: titleEl?.textContent?.trim(),
          countBadgeText: countBadge?.textContent?.trim(),
          articleCount: articles.length,
          bgColor: computed.backgroundColor,
          articles,
        };
      });

      return {
        header: {
          position: window.getComputedStyle(header).position,
          top: window.getComputedStyle(header).top,
          height: headerRect?.height,
        },
        needle: {
          needleTop: needleRect?.top,
          needleBottom: needleRect?.bottom,
          buttonTextBottom: compassButtons[0]?.bottom,
          // Needle is placed on the tick row below the labels (bottom > buttonTextBottom or tick row)
          isBelowText: needleRect && compassButtons[0] ? needleRect.top >= compassButtons[0].top + 16 : false,
        },
        compassButtons,
        spacing: {
          containerPaddingTop: forYouContainerStyle?.paddingTop,
          greetingRuleToLeadGap: leadStoryRect && greetingRect ? Math.round(leadStoryRect.top - greetingRect.bottom) : null,
          gapAboveLatest: latestSection && leadStoryRect ? Math.round(latestSection.getBoundingClientRect().top - leadStoryRect.bottom) : null,
          gapBelowLatestHeader: latestRows[0] && latestHeaderRect ? Math.round(latestSection.querySelectorAll('article')[0]?.getBoundingClientRect().top - latestHeaderRect.bottom) : null,
          containerPaddingBottom: forYouContainerStyle?.paddingBottom,
        },
        lead: {
          headline: leadHeadlineEl?.textContent?.trim(),
          fontSize: leadHeadlineStyle?.fontSize,
          lineHeight: leadHeadlineStyle?.lineHeight,
          letterSpacing: leadHeadlineStyle?.letterSpacing,
          italicWords,
          imgHeight: leadImgRect?.height,
          imgWidth: leadImgRect?.width,
          colLeftTop: leadColLeftRect?.top,
          imgTop: leadImgRect?.top,
          verticalDiff: leadColLeftRect && leadImgRect ? Math.abs(leadColLeftRect.top - leadImgRect.top) : null,
        },
        latestRows,
        bands,
      };
    });

    console.log(`\nAudit Findings for ${width}px:`);
    console.log(`Header: position=${audit.header.position}, height=${audit.header.height}px`);
    console.log(`Compass Needle: isBelowText=${audit.needle.isBelowText} (needleTop=${audit.needle.needleTop}, btnTextBottom=${audit.needle.buttonTextBottom})`);
    console.log(`Compass Buttons (${audit.compassButtons.length}):`, audit.compassButtons.map(b => b.text).join(' | '));
    console.log(`Spacing checks:`);
    console.log(`  Container paddingTop: ${audit.spacing.containerPaddingTop} (24px between ticker and greeting)`);
    console.log(`  Greeting rule to Lead story gap: ${audit.spacing.greetingRuleToLeadGap}px (target ~24px)`);
    console.log(`  Gap above "LATEST DISPATCHES": ${audit.spacing.gapAboveLatest}px (target ~48px)`);
    console.log(`  Gap below "LATEST DISPATCHES" rule: ${audit.spacing.gapBelowLatestHeader}px (target ~16px)`);
    console.log(`  Container paddingBottom: ${audit.spacing.containerPaddingBottom} (target 64px before Tech band)`);
    console.log(`Lead Story:`);
    console.log(`  Headline: "${audit.lead.headline?.slice(0, 50)}..."`);
    console.log(`  Font Size: ${audit.lead.fontSize}`);
    console.log(`  Line Height: ${audit.lead.lineHeight}`);
    console.log(`  Letter Spacing: ${audit.lead.letterSpacing}`);
    console.log(`  Italic words:`, audit.lead.italicWords);
    console.log(`  Image: ${audit.lead.imgWidth}x${audit.lead.imgHeight}px (capped <= 320px: ${audit.lead.imgHeight <= 320})`);
    console.log(`  Vertical diff (text col top vs img top): ${audit.lead.verticalDiff}px`);
    console.log(`Latest Rows (${audit.latestRows.length}):`);
    audit.latestRows.forEach((r, idx) => {
      console.log(`  [${idx + 1}] [${r.source}] ${r.headline?.slice(0, 30)}... padding: ${r.paddingTop}/${r.paddingBottom}`);
    });
    console.log(`Rendered Bands (${audit.bands.length}):`);
    audit.bands.forEach(b => {
      console.log(`  #${b.id} ("${b.title}"): badge="${b.countBadgeText}", count=${b.articleCount}, bg=${b.bgColor}`);
    });

    // Top screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `screenshot-prod-${width}px-top.png`),
      fullPage: false,
    });

    // Full page screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `screenshot-prod-${width}px-fullpage.png`),
      fullPage: true,
    });

    // Scrolled screenshot at each band
    for (const b of audit.bands) {
      await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, b.id);
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `screenshot-prod-${width}px-band-${b.id}.png`),
        fullPage: false,
      });
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nALL SCREENSHOTS SAVED IN: ${SCREENSHOT_DIR}`);
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
