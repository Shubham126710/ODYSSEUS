/**
 * Odyssey Companion Service Worker
 * Manifest V3 Background Engine
 */

const DEFAULT_ODYSSEUS_URL = 'https://odysseus.vercel.app';

// ---------------------------------------------------------------------------
// Installation & Context Menu Setup
// ---------------------------------------------------------------------------
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize default settings in chrome.storage.local (Rule 7: ephemeral SW)
  const current = await chrome.storage.local.get(['odysseusUrl', 'savedArticles', 'autoPurify']);
  if (!current.odysseusUrl) {
    await chrome.storage.local.set({
      odysseusUrl: DEFAULT_ODYSSEUS_URL,
      savedArticles: [],
      autoPurify: true,
    });
  }

  // Create context menus (Rule 9: user feedback after action)
  chrome.contextMenus.removeAll(async () => {
    chrome.contextMenus.create({
      id: 'save-to-odysseus',
      title: '✦ Save Story to Odysseus Salon',
      contexts: ['page', 'link'],
    });

    chrome.contextMenus.create({
      id: 'read-in-odysseus',
      title: '✦ Read Now in Zen Chamber ↗',
      contexts: ['page', 'link'],
    });

    chrome.contextMenus.create({
      id: 'save-quote-to-odysseus',
      title: '✦ Save Highlight to Odysseus Notebook',
      contexts: ['selection'],
    });
  });
});

// ---------------------------------------------------------------------------
// Helper: Flash Action Badge
// ---------------------------------------------------------------------------
async function flashBadge(text, color = '#FF6B4A') {
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
    setTimeout(async () => {
      await chrome.action.setBadgeText({ text: '' });
    }, 2800);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Helper: Show In-Page Luxury Toast Notification
// ---------------------------------------------------------------------------
async function showPageNotification(tabId, { title, message, url, actionUrl }) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css'],
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
    await chrome.tabs.sendMessage(tabId, {
      type: 'ODYSSEY_SHOW_TOAST',
      payload: { title, message, url, actionUrl },
    });
  } catch (err) {
    // If scripting failed (e.g. chrome:// or restricted page), fallback to badge
    console.warn('Could not inject toast:', err);
  }
}

// ---------------------------------------------------------------------------
// Core Action: Save Article
// ---------------------------------------------------------------------------
async function saveArticleFromTab(tab, overrideUrl = null, selectionText = null) {
  const targetUrl = overrideUrl || tab.url;
  if (!targetUrl || targetUrl.startsWith('chrome://') || targetUrl.startsWith('chrome-extension://')) {
    return;
  }

  const { odysseusUrl = DEFAULT_ODYSSEUS_URL, savedArticles = [] } = await chrome.storage.local.get([
    'odysseusUrl',
    'savedArticles',
  ]);

  const newArticle = {
    id: 'art_' + Date.now(),
    url: targetUrl,
    title: tab.title || 'Web Story',
    savedAt: new Date().toISOString(),
    excerpt: selectionText || null,
    source: new URL(targetUrl).hostname.replace('www.', ''),
  };

  // Deduplicate and prepend
  const updatedList = [newArticle, ...savedArticles.filter((a) => a.url !== targetUrl)].slice(0, 50);
  await chrome.storage.local.set({ savedArticles: updatedList });

  // Optional: Background sync to Odysseus server API if available
  try {
    fetch(`${odysseusUrl}/api/read-later`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl,
        title: tab.title || 'Imported Web Story',
        excerpt: selectionText || '',
        source_name: new URL(targetUrl).hostname.replace('www.', ''),
      }),
    }).catch(() => {});
  } catch {
    // offline/network safe
  }

  // Visual confirmations (Rule 9)
  await flashBadge('✓', '#5D8246');
  if (tab.id) {
    const chamberUrl = `${odysseusUrl}/saved?importUrl=${encodeURIComponent(targetUrl)}`;
    await showPageNotification(tab.id, {
      title: 'Saved to Odysseus Salon',
      message: 'Pure prose archived for distraction-free reading.',
      url: targetUrl,
      actionUrl: chamberUrl,
    });
  }
}

// ---------------------------------------------------------------------------
// Core Action: Open in Zen Chamber
// ---------------------------------------------------------------------------
async function openInZenChamber(targetUrl) {
  const { odysseusUrl = DEFAULT_ODYSSEUS_URL } = await chrome.storage.local.get('odysseusUrl');
  const readerUrl = `${odysseusUrl}/saved?importUrl=${encodeURIComponent(targetUrl)}`;
  await chrome.tabs.create({ url: readerUrl });
}

// ---------------------------------------------------------------------------
// Context Menu & Keyboard Command Handlers
// ---------------------------------------------------------------------------
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;
  const targetUrl = info.linkUrl || info.pageUrl;

  if (info.menuItemId === 'save-to-odysseus') {
    await saveArticleFromTab(tab, targetUrl);
  } else if (info.menuItemId === 'read-in-odysseus') {
    await openInZenChamber(targetUrl);
  } else if (info.menuItemId === 'save-quote-to-odysseus') {
    await saveArticleFromTab(tab, targetUrl, info.selectionText);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-save') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await saveArticleFromTab(tab);
    }
  }
});

// ---------------------------------------------------------------------------
// Runtime Message Listener (Popup & Content Scripts)
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'SAVE_CURRENT_TAB') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          await saveArticleFromTab(tab);
          sendResponse({ success: true, url: tab.url, title: tab.title });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      } else if (message.type === 'OPEN_IN_CHAMBER') {
        await openInZenChamber(message.url);
        sendResponse({ success: true });
      } else if (message.type === 'GET_RECENT_ARTICLES') {
        const { savedArticles = [], odysseusUrl = DEFAULT_ODYSSEUS_URL } = await chrome.storage.local.get([
          'savedArticles',
          'odysseusUrl',
        ]);
        sendResponse({ articles: savedArticles, odysseusUrl });
      }
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true; // Keep message channel open for async response (Rule 5)
});
