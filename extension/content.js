/**
 * Odyssey Content Script
 * Injects in-page toast feedback when an article is saved.
 */

(() => {
  // Guard against multiple injections
  if (window.__odyssey_injected) return;
  window.__odyssey_injected = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ODYSSEY_SHOW_TOAST') {
      showToast(message.payload);
      sendResponse({ success: true });
    }
  });

  function showToast({ title, message, actionUrl }) {
    let container = document.getElementById('odyssey-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'odyssey-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'odyssey-toast';
    toast.innerHTML = `
      <div class="odyssey-toast-icon">✦</div>
      <div class="odyssey-toast-content">
        <div class="odyssey-toast-title">${escapeHtml(title || 'Saved to Salon')}</div>
        <div class="odyssey-toast-subtitle">${escapeHtml(message || 'Distraction-free pure prose')}</div>
        ${actionUrl ? `<a href="${actionUrl}" target="_blank" class="odyssey-toast-action">Read In Zen Chamber →</a>` : ''}
      </div>
      <button class="odyssey-toast-close" title="Dismiss">✕</button>
    `;

    const closeBtn = toast.querySelector('.odyssey-toast-close');
    closeBtn.addEventListener('click', () => {
      dismissToast(toast);
    });

    container.appendChild(toast);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      dismissToast(toast);
    }, 4500);
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.animation = 'odysseySlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
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
})();
