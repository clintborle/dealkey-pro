/**
 * DealKey Background Service Worker
 * Handles AI API calls and deal caching
 */

// Cache deals per tab
const dealCache = new Map();

// Provider API configurations
const PROVIDERS = {
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-5-20250929',
    buildRequest: (apiKey, prompt) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    }),
    parseResponse: (data) => {
      const text = data.content?.[0]?.text || '';
      return parseDealsFromText(text);
    }
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    buildRequest: (apiKey, prompt) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    }),
    parseResponse: (data) => {
      const text = data.choices?.[0]?.message?.content || '';
      return parseDealsFromText(text);
    }
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    buildRequest: (apiKey, prompt) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    }),
    parseResponse: (data) => {
      const text = data.choices?.[0]?.message?.content || '';
      return parseDealsFromText(text);
    }
  }
};

// Build the search prompt
function buildPrompt(context) {
  return `You are a discount code finder. Find current, valid coupon codes and discount codes for ${context.storeName} (${context.hostname}).

Return ONLY a JSON array of deals. Each deal should have:
- "code": the coupon code string
- "description": brief description of the discount
- "confidence": "high", "medium", or "low" based on how likely the code is to work

Example format:
[
  {"code": "SAVE20", "description": "20% off your order", "confidence": "high"},
  {"code": "FREESHIP", "description": "Free shipping on orders over $50", "confidence": "medium"}
]

Return up to 5 codes. Only return codes you believe are currently active. If you cannot find any valid codes, return an empty array [].

Important: Return ONLY the JSON array, no other text.`;
}

// Parse deals from AI response text
function parseDealsFromText(text) {
  try {
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const deals = JSON.parse(match[0]);
    return deals
      .filter(d => d.code && d.description)
      .slice(0, 5)
      .map(d => ({
        code: String(d.code).trim(),
        description: String(d.description).trim(),
        confidence: ['high', 'medium', 'low'].includes(d.confidence) ? d.confidence : 'low'
      }));
  } catch {
    return [];
  }
}

// Search for deals using AI
async function searchDeals(context) {
  const settings = await getSettings();
  if (!settings.apiKey || !settings.provider) return [];

  const provider = PROVIDERS[settings.provider];
  if (!provider) return [];

  const prompt = buildPrompt(context);
  const request = provider.buildRequest(settings.apiKey, prompt);

  try {
    const response = await fetch(provider.url, request);
    if (!response.ok) {
      console.error('DealKey API error:', response.status);
      return [];
    }
    const data = await response.json();
    return provider.parseResponse(data);
  } catch (err) {
    console.error('DealKey search error:', err);
    return [];
  }
}

// Get saved settings
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['provider', 'apiKey'], (result) => {
      resolve({
        provider: result.provider || 'claude',
        apiKey: result.apiKey || ''
      });
    });
  });
}

// Update badge on tab
function updateBadge(tabId, count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: String(count), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#6B8F6B', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'checkoutDetected') {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    // Auto-search on checkout detection
    searchDeals(msg.context).then(deals => {
      dealCache.set(tabId, {
        storeName: msg.context.storeName,
        deals,
        timestamp: Date.now()
      });
      updateBadge(tabId, deals.length);
    });
  }

  if (msg.action === 'getDeals') {
    const tabId = msg.tabId;
    const cached = dealCache.get(tabId);

    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      sendResponse(cached);
    } else {
      // Check if it's a checkout page
      chrome.tabs.sendMessage(tabId, { action: 'checkCheckout' }, (response) => {
        sendResponse({
          deals: [],
          isCheckout: response?.isCheckout || false
        });
      });
      return true; // Keep channel open for async response
    }
  }

  if (msg.action === 'searchDeals') {
    const context = {
      storeName: new URL(msg.url).hostname.replace(/^www\./, '').split('.')[0],
      hostname: new URL(msg.url).hostname,
      url: msg.url
    };

    searchDeals(context).then(deals => {
      const tabId = msg.tabId;
      if (tabId) {
        dealCache.set(tabId, {
          storeName: context.storeName,
          deals,
          timestamp: Date.now()
        });
        updateBadge(tabId, deals.length);
      }

      // Notify popup
      chrome.runtime.sendMessage({
        action: deals.length > 0 ? 'dealsFound' : 'noDeals',
        storeName: context.storeName,
        deals
      }).catch(() => {}); // Popup might be closed
    });
  }

  return false;
});

// Clean up cache when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  dealCache.delete(tabId);
});

// Clean up badge on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    dealCache.delete(tabId);
    updateBadge(tabId, 0);
  }
});
