/**
 * DealKey Popup — Main Logic
 * Manages popup state transitions and deal display
 */

const STATES = {
  LOADING: 'stateLoading',
  RESULTS: 'stateResults',
  SETUP: 'stateSetup',
  IDLE: 'stateIdle'
};

// Show a specific state, hide others
function showState(stateId) {
  document.querySelectorAll('.popup-state').forEach(el => {
    el.classList.remove('active');
  });
  const target = document.getElementById(stateId);
  if (target) target.classList.add('active');
}

// Create a deal card element
function createDealCard(deal) {
  const card = document.createElement('div');
  card.className = 'deal-card';

  // Confidence dots
  const confidenceDots = [1, 2, 3].map(i => {
    if (deal.confidence === 'high') {
      return '<span class="confidence-dot confidence-dot--filled"></span>';
    } else if (deal.confidence === 'medium') {
      return i <= 2
        ? '<span class="confidence-dot confidence-dot--filled"></span>'
        : '<span class="confidence-dot"></span>';
    } else {
      return i <= 1
        ? '<span class="confidence-dot confidence-dot--filled"></span>'
        : '<span class="confidence-dot"></span>';
    }
  }).join('');

  card.innerHTML = `
    <div class="deal-card__top">
      <span class="deal-card__code">${escapeHtml(deal.code)}</span>
      <div class="deal-card__confidence">${confidenceDots}</div>
    </div>
    <p class="deal-card__desc">${escapeHtml(deal.description)}</p>
    <div class="deal-card__actions">
      <button class="btn-apply" data-code="${escapeHtml(deal.code)}">Apply</button>
      <button class="btn-copy" data-code="${escapeHtml(deal.code)}">Copy</button>
    </div>
  `;

  // Copy handler
  card.querySelector('.btn-copy').addEventListener('click', (e) => {
    const code = e.target.dataset.code;
    navigator.clipboard.writeText(code).then(() => {
      e.target.textContent = 'Copied';
      e.target.classList.add('copied');
      setTimeout(() => {
        e.target.textContent = 'Copy';
        e.target.classList.remove('copied');
      }, 1500);
    });
  });

  // Apply handler — sends message to content script
  card.querySelector('.btn-apply').addEventListener('click', (e) => {
    const code = e.target.dataset.code;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'applyCode',
            code: code
          });
        }
      });
      e.target.textContent = 'Applied';
      setTimeout(() => { e.target.textContent = 'Apply'; }, 1500);
    }
  });

  return card;
}

// Render deal results
function renderDeals(storeName, deals) {
  document.getElementById('storeName').textContent = storeName;
  const list = document.getElementById('resultsList');
  list.innerHTML = '';
  deals.forEach(deal => {
    list.appendChild(createDealCard(deal));
  });
  showState(STATES.RESULTS);
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Extract store name from URL
function getStoreName(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return 'this store';
  }
}

// Initialize popup
async function init() {
  // Open settings handlers
  document.getElementById('openSettings').addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('settings.html', '_blank');
    }
  });

  document.getElementById('openSettingsSetup').addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('settings.html', '_blank');
    }
  });

  // Search anyway handler
  document.getElementById('searchAnyway').addEventListener('click', () => {
    showState(STATES.LOADING);
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.runtime.sendMessage({
            action: 'searchDeals',
            url: tabs[0].url,
            forced: true
          });
        }
      });
    }
  });

  // Check for API key first
  const hasKey = await checkApiKey();
  if (!hasKey) {
    showState(STATES.SETUP);
    return;
  }

  // Get current tab info
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      const storeName = getStoreName(tabs[0].url);
      document.getElementById('currentStoreName').textContent = storeName;

      // Check if background has cached results
      chrome.runtime.sendMessage(
        { action: 'getDeals', tabId: tabs[0].id },
        (response) => {
          if (response && response.deals && response.deals.length > 0) {
            renderDeals(response.storeName || storeName, response.deals);
          } else if (response && response.isCheckout) {
            showState(STATES.LOADING);
            chrome.runtime.sendMessage({
              action: 'searchDeals',
              url: tabs[0].url,
              tabId: tabs[0].id
            });
          } else {
            showState(STATES.IDLE);
          }
        }
      );
    });
  } else {
    // Demo mode outside extension
    showDemoState();
  }

  // Listen for results from background
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'dealsFound') {
        renderDeals(msg.storeName, msg.deals);
      } else if (msg.action === 'noDeals') {
        showState(STATES.IDLE);
      }
    });
  }
}

function checkApiKey() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['apiKey'], (result) => {
        resolve(!!result.apiKey);
      });
    } else {
      resolve(!!localStorage.getItem('dealkey_apiKey'));
    }
  });
}

// Demo state for testing outside Chrome extension
function showDemoState() {
  renderDeals('Patagonia', [
    { code: 'WINTER25', description: '25% off full price items', confidence: 'high' },
    { code: 'FREESHIP', description: 'Free standard shipping', confidence: 'medium' },
    { code: 'GEAR10', description: '10% off gear and accessories', confidence: 'low' }
  ]);
}

init();
