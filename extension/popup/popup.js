/**
 * Odyssey Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  let activeTab = null;
  let odysseusBaseUrl = 'https://odysseus.vercel.app';

  const domainEl = document.getElementById('page-domain');
  const readTimeEl = document.getElementById('page-read-time');
  const titleEl = document.getElementById('page-title');
  const urlEl = document.getElementById('page-url');
  const saveBtn = document.getElementById('save-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const chamberBtn = document.getElementById('chamber-btn');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const recentList = document.getElementById('recent-list');
  const viewAllLink = document.getElementById('view-all-link');
  const openSettingsBtn = document.getElementById('open-settings-btn');

  // 1. Fetch settings from storage
  const settings = await chrome.storage.local.get(['odysseusUrl', 'savedArticles']);
  if (settings.odysseusUrl) {
    odysseusBaseUrl = settings.odysseusUrl;
  }
  viewAllLink.href = `${odysseusBaseUrl}/saved`;

  // 2. Fetch current active tab info
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tab;

    if (activeTab && activeTab.url) {
      const urlObj = new URL(activeTab.url);
      domainEl.textContent = urlObj.hostname.replace('www.', '');
      titleEl.textContent = activeTab.title || 'Untitled Web Page';
      urlEl.textContent = activeTab.url;

      // Check if already in saved articles
      const alreadySaved = (settings.savedArticles || []).some((a) => a.url === activeTab.url);
      if (alreadySaved) {
        saveBtnText.textContent = '✓ Saved In Salon';
        saveBtn.style.backgroundColor = '#5D8246';
      }

      // Try estimating reading time from tab text if accessible
      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            const text = document.body?.innerText || '';
            const words = text.trim().split(/\s+/).length;
            return Math.max(1, Math.ceil(words / 220));
          },
        });
        if (result) {
          readTimeEl.textContent = `${result} min read`;
        }
      } catch {
        readTimeEl.textContent = '3 min read';
      }
    }
  } catch (err) {
    titleEl.textContent = 'Unable to access current tab';
    domainEl.textContent = 'RESTRICTED';
  }

  // 3. Render recent saves
  renderRecentList(settings.savedArticles || []);

  // 4. Save Button Handler
  saveBtn.addEventListener('click', async () => {
    if (!activeTab || !activeTab.url) return;

    saveBtn.disabled = true;
    saveBtnText.textContent = 'Purifying Prose...';

    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_CURRENT_TAB',
    });

    if (response && response.success) {
      saveBtnText.textContent = '✓ Saved To Salon';
      saveBtn.style.backgroundColor = '#5D8246';
      showStatus('Pure article text purified & saved to your salon!');

      // Refresh recent list
      const updated = await chrome.storage.local.get('savedArticles');
      renderRecentList(updated.savedArticles || []);
    } else {
      saveBtnText.textContent = 'Save To Odysseus Salon';
      showStatus('Error saving: ' + (response?.error || 'Unknown error'), true);
    }
    saveBtn.disabled = false;
  });

  // 5. Open in Zen Chamber Button
  chamberBtn.addEventListener('click', async () => {
    if (!activeTab || !activeTab.url) return;
    await chrome.runtime.sendMessage({
      type: 'OPEN_IN_CHAMBER',
      url: activeTab.url,
    });
    window.close();
  });

  // 6. View All Link Handler
  viewAllLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${odysseusBaseUrl}/saved` });
  });

  // 7. Open Settings Options
  openSettingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

  function showStatus(msg, isError = false) {
    statusText.textContent = msg;
    statusBanner.className = 'status-banner';
    if (isError) {
      statusBanner.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
      statusBanner.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      statusBanner.style.color = '#dc2626';
    }
    statusBanner.classList.remove('hidden');
    setTimeout(() => {
      statusBanner.classList.add('hidden');
    }, 4000);
  }

  function renderRecentList(articles) {
    if (!articles || articles.length === 0) {
      recentList.innerHTML = '<div class="empty-state">No stories saved yet. Click above to save this page!</div>';
      return;
    }

    recentList.innerHTML = '';
    articles.slice(0, 4).forEach((art) => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `
        <span class="recent-item-title" title="${escapeHtml(art.title)}">${escapeHtml(art.title)}</span>
        <span class="recent-item-source">${escapeHtml(art.source || 'web')}</span>
      `;
      item.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          type: 'OPEN_IN_CHAMBER',
          url: art.url,
        });
        window.close();
      });
      recentList.appendChild(item);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
