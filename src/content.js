/**
 * DealKey Content Script
 * Detects checkout pages and applies coupon codes
 */

(function() {
  'use strict';

  // Common coupon input selectors across e-commerce platforms
  const COUPON_SELECTORS = [
    'input[name*="coupon"]',
    'input[name*="promo"]',
    'input[name*="discount"]',
    'input[name*="voucher"]',
    'input[name*="gift"]',
    'input[id*="coupon"]',
    'input[id*="promo"]',
    'input[id*="discount"]',
    'input[id*="voucher"]',
    'input[placeholder*="coupon"]',
    'input[placeholder*="promo"]',
    'input[placeholder*="discount"]',
    'input[placeholder*="voucher"]',
    'input[placeholder*="code"]',
    'input[aria-label*="coupon"]',
    'input[aria-label*="promo"]',
    'input[aria-label*="discount"]',
    '[data-testid*="coupon"] input',
    '[data-testid*="promo"] input',
  ];

  // Common checkout URL patterns
  const CHECKOUT_PATTERNS = [
    /checkout/i,
    /cart/i,
    /order/i,
    /payment/i,
    /billing/i,
    /purchase/i,
  ];

  // Detect if current page is a checkout
  function isCheckoutPage() {
    const url = window.location.href.toLowerCase();
    const hasCheckoutUrl = CHECKOUT_PATTERNS.some(pattern => pattern.test(url));
    const hasCouponField = findCouponInput() !== null;
    return hasCheckoutUrl || hasCouponField;
  }

  // Find the coupon input field
  function findCouponInput() {
    for (const selector of COUPON_SELECTORS) {
      const input = document.querySelector(selector);
      if (input && isVisible(input)) return input;
    }
    return null;
  }

  // Check if an element is visible
  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  // Find the submit button near the coupon input
  function findApplyButton(couponInput) {
    const parent = couponInput.closest('form') || couponInput.parentElement;
    if (!parent) return null;

    const buttons = parent.querySelectorAll('button, input[type="submit"], [role="button"]');
    for (const btn of buttons) {
      const text = (btn.textContent || btn.value || '').toLowerCase();
      if (text.includes('apply') || text.includes('submit') || text.includes('redeem')) {
        return btn;
      }
    }

    // Fallback: any button in the same container
    return buttons[0] || null;
  }

  // Apply a coupon code to the input field
  function applyCode(code) {
    const input = findCouponInput();
    if (!input) return false;

    // Clear existing value
    input.value = '';
    input.focus();

    // Simulate typing for React/Vue compatibility
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(input, code);

    // Dispatch events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Try to click apply button
    setTimeout(() => {
      const applyBtn = findApplyButton(input);
      if (applyBtn) applyBtn.click();
    }, 200);

    return true;
  }

  // Get page context for AI search
  function getPageContext() {
    const hostname = window.location.hostname.replace(/^www\./, '');
    const storeName = hostname.split('.')[0];
    const title = document.title;
    const hasCouponField = findCouponInput() !== null;

    // Get cart total if visible
    let cartTotal = '';
    const totalSelectors = [
      '[class*="total"]', '[class*="Total"]',
      '[data-testid*="total"]', '[id*="total"]'
    ];
    for (const sel of totalSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        if (/\$[\d,.]+/.test(text)) {
          cartTotal = text.match(/\$[\d,.]+/)[0];
          break;
        }
      }
    }

    return {
      storeName,
      hostname,
      title,
      url: window.location.href,
      hasCouponField,
      cartTotal,
      isCheckout: isCheckoutPage()
    };
  }

  // Listen for messages from popup or background
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'applyCode') {
        const success = applyCode(msg.code);
        sendResponse({ success });
      } else if (msg.action === 'getPageContext') {
        sendResponse(getPageContext());
      } else if (msg.action === 'checkCheckout') {
        sendResponse({ isCheckout: isCheckoutPage() });
      }
      return true;
    });

    // Notify background that this page loaded
    const context = getPageContext();
    if (context.isCheckout) {
      chrome.runtime.sendMessage({
        action: 'checkoutDetected',
        context
      });
    }
  }
})();
