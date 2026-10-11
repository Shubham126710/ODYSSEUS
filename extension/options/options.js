/**
 * Odyssey Options Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('odysseus-url');
  const saveUrlBtn = document.getElementById('save-url-btn');
  const autoPurifyToggle = document.getElementById('auto-purify');
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const toast = document.getElementById('toast');

  // Load existing settings
  const { odysseusUrl = 'https://odysseus.vercel.app', autoPurify = true } =
    await chrome.storage.local.get(['odysseusUrl', 'autoPurify']);

  urlInput.value = odysseusUrl;
  autoPurifyToggle.checked = autoPurify;

  // Save URL
  saveUrlBtn.addEventListener('click', async () => {
    let val = urlInput.value.trim();
    if (!val) val = 'https://odysseus.vercel.app';
    if (!val.startsWith('http://') && !val.startsWith('https://')) {
      val = 'https://' + val;
    }
    // Remove trailing slash
    val = val.replace(/\/+$/, '');
    urlInput.value = val;

    await chrome.storage.local.set({ odysseusUrl: val });
    showToast('Odysseus URL Saved ✓');
  });

  // Presets
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      urlInput.value = btn.dataset.url;
      saveUrlBtn.click();
    });
  });

  // Toggle Auto Purify
  autoPurifyToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ autoPurify: autoPurifyToggle.checked });
    showToast('Purification Preferences Updated ✓');
  });

  // Clear Cache
  clearCacheBtn.addEventListener('click', async () => {
    if (confirm('Clear your local saved article history?')) {
      await chrome.storage.local.set({ savedArticles: [] });
      showToast('Saved Article Cache Cleared ✓');
    }
  });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }
});
