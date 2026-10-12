import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Browser error]', msg.text());
  });

  console.log('Navigating to http://localhost:3005/feed ...');
  await page.goto('http://localhost:3005/feed', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#for-you', { timeout: 15000 });
  await page.waitForTimeout(3000);

  // Find a Guardian article on the page
  const articles = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('article, section[aria-label="Lead Story"]'));
    return list.map((el, i) => {
      const source = el.querySelector('span, .font-mono')?.textContent?.trim() || '';
      const headline = el.querySelector('h2, h3')?.textContent?.trim() || '';
      return { index: i, source, headline };
    });
  });

  console.log(`Found ${articles.length} article blocks on page.`);
  const guardianStory = articles.find(a => a.source.toLowerCase().includes('guardian'));
  const vergeStory = articles.find(a => a.source.toLowerCase().includes('verge'));

  console.log('Guardian story found:', guardianStory);
  console.log('Verge story found:', vergeStory);

  // 1. Test Guardian story reading modal
  if (guardianStory) {
    console.log('\n--- Testing Guardian Reading Modal ---');
    const clicked = await page.evaluate((headline) => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      const target = headings.find(h => h.textContent?.trim().includes(headline));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, guardianStory.headline);

    if (clicked) {
      console.log('Clicked Guardian headline. Waiting for reading modal...');
      await page.waitForSelector('.rm-prose', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const modalInfo = await page.evaluate(() => {
        const prose = document.querySelector('.rm-prose');
        const text = prose ? prose.textContent?.trim() : '';
        const html = prose ? prose.innerHTML : '';
        const hasContinueReading = text.toLowerCase().includes('continue reading');
        const paragraphCount = prose ? prose.querySelectorAll('p').length : 0;
        const words = text.split(/\s+/).filter(Boolean).length;
        return {
          wordCount: words,
          paragraphCount,
          hasContinueReading,
          snippet: text.slice(0, 300),
          lastSnippet: text.slice(-300),
        };
      });

      console.log('Guardian Modal Results:');
      console.log(`  Word count: ${modalInfo.wordCount} (should be > 200, full article)`);
      console.log(`  Paragraphs: ${modalInfo.paragraphCount}`);
      console.log(`  Has "continue reading" teaser: ${modalInfo.hasContinueReading} (should be false)`);
      console.log(`  End snippet: "${modalInfo.lastSnippet}"`);

      await page.screenshot({
        path: path.resolve(process.cwd(), 'screenshots/guardian-reader-modal.png'),
      });

      // Close modal
      await page.evaluate(() => {
        const closeBtn = document.querySelector('button[title="Close reader"]');
        if (closeBtn) closeBtn.click();
      });
      await page.waitForTimeout(1000);
    }
  }

  // 2. Test Verge story reading modal
  if (vergeStory) {
    console.log('\n--- Testing Verge Reading Modal ---');
    const clicked = await page.evaluate((headline) => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      const target = headings.find(h => h.textContent?.trim().includes(headline));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, vergeStory.headline);

    if (clicked) {
      console.log('Clicked Verge headline. Waiting for reading modal...');
      await page.waitForSelector('.rm-prose', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const modalInfo = await page.evaluate(() => {
        const prose = document.querySelector('.rm-prose');
        const text = prose ? prose.textContent?.trim() : '';
        const html = prose ? prose.innerHTML : '';
        const hasReadFullStory = text.toLowerCase().includes('read the full story');
        const paragraphCount = prose ? prose.querySelectorAll('p').length : 0;
        const words = text.split(/\s+/).filter(Boolean).length;
        return {
          wordCount: words,
          paragraphCount,
          hasReadFullStory,
          snippet: text.slice(0, 300),
          lastSnippet: text.slice(-300),
        };
      });

      console.log('Verge Modal Results:');
      console.log(`  Word count: ${modalInfo.wordCount} (should be > 200, full article)`);
      console.log(`  Paragraphs: ${modalInfo.paragraphCount}`);
      console.log(`  Has "read the full story" teaser: ${modalInfo.hasReadFullStory} (should be false)`);
      console.log(`  End snippet: "${modalInfo.lastSnippet}"`);

      await page.screenshot({
        path: path.resolve(process.cwd(), 'screenshots/verge-reader-modal.png'),
      });
    }
  }

  await browser.close();
  console.log('\nReader modal verification complete.');
}

run().catch(console.error);
