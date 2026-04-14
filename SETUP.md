# DealKey Pro — Lemon Squeezy Setup Guide

Complete these steps before deploying. Takes about 15 minutes.

---

## Step 1 — Create Your Lemon Squeezy Account

1. Go to [lemonsqueezy.com](https://lemonsqueezy.com) and click **Get started free**
2. Sign up with your email
3. Complete email verification
4. You'll land on the Lemon Squeezy dashboard

---

## Step 2 — Create a Store

1. In the left sidebar, click **Settings → Store**
2. Fill in:
   - **Store name:** DealKey Pro (or your preferred brand name)
   - **Store slug:** `deal-key` (this becomes your checkout URL subdomain — e.g. `deal-key.lemonsqueezy.com`)
   - **Currency:** USD
3. Save the store
4. Note your **Store slug** — you'll need it in Step 6

> **Screenshot placeholder:** [Store settings page showing slug field]

---

## Step 3 — Create a Product

1. In the left sidebar, click **Products → New Product**
2. Fill in:
   - **Name:** DealKey Pro
   - **Description:** AI-powered discount code finder. Your AI, your savings.
   - **Price:** $19.00
   - **Payment type:** One-time payment (not subscription)
3. Under **Media**, upload your product icon (the sage green DealKey icon works great)
4. Click **Save**
5. Note your **Product ID** from the URL — it looks like `https://app.lemonsqueezy.com/products/123456`

> **Screenshot placeholder:** [Product creation page]

---

## Step 4 — Enable License Keys

This is the critical step that generates the email-delivered license keys.

1. On your product page, click the **License keys** tab (or find it in product settings)
2. Toggle **Enable license keys** to ON
3. Set:
   - **Activations limit:** 3 (allows user to use on up to 3 Chrome profiles — generous but controlled)
   - **Key expiry:** Never (one-time purchase, no expiry)
4. Save changes

> **Screenshot placeholder:** [License key settings with toggle enabled]

---

## Step 5 — Configure Thank-You Redirect

1. On your product page, find **Checkout settings** or **Confirmation**
2. Set the **Redirect URL** to: `https://deal-key.com/thanks.html`
3. Save

---

## Step 6 — Get Your API Key

1. Go to **Settings → API**
2. Click **New API key**
3. Name it: `DealKey Chrome Extension`
4. Copy the key immediately — Lemon Squeezy won't show it again
5. Store it temporarily in your `.env` file (see `.env.example`)

> **Note:** For the Chrome extension, the license *validation* API is designed to be client-facing. You do NOT need to keep this key secret for validation calls — but keep it out of public GitHub commits anyway.

---

## Step 7 — Get Your Webhook Signing Secret (Optional but Recommended)

If you want to process webhooks for events like refunds or license revocations:

1. Go to **Settings → Webhooks → Add webhook**
2. Set the endpoint URL to your webhook handler (requires a backend — skip for MVP)
3. The **signing secret** is displayed after creation
4. Store in `.env` as `LEMON_SQUEEZY_WEBHOOK_SECRET`

> For the MVP, webhooks are optional. License validation works without them.

---

## Step 8 — Hardcode Values into the Extension

Open `src/settings.js` and update the constants at the top of the file:

```js
const LEMON_SQUEEZY_STORE_ID = "YOUR_STORE_ID_HERE";    // e.g. "12345"
const LEMON_SQUEEZY_PRODUCT_ID = "YOUR_PRODUCT_ID_HERE"; // e.g. "67890"
const LEMON_SQUEEZY_CHECKOUT_URL = "https://YOUR-STORE-SLUG.lemonsqueezy.com/buy/YOUR-PRODUCT-VARIANT-ID";
```

**Where to find each value:**
| Value | Where to find it |
|---|---|
| Store ID | Settings → Store → store ID in URL |
| Product ID | Products → click product → ID in URL |
| Store slug | Settings → Store → slug field |
| Variant ID | Products → click product → Variants tab → ID in URL |
| Checkout URL | Products → click product → click **Share** or **Buy** to copy the checkout link |

---

## Step 9 — Update index.html Buy Button

Find this line in `index.html`:

```html
<!-- REPLACE THIS HREF with your Lemon Squeezy checkout URL -->
<a href="LEMON_SQUEEZY_CHECKOUT_URL_HERE" ...>Get DealKey Pro — $19</a>
```

Replace `LEMON_SQUEEZY_CHECKOUT_URL_HERE` with your actual checkout URL from Step 8.

---

## Step 10 — Test the Flow

1. Load the extension as unpacked in Chrome (`chrome://extensions` → Developer mode → Load unpacked → select `dealkey-pro/`)
2. Click the extension icon → you should see the upgrade prompt (no license yet)
3. Open a new tab to your Lemon Squeezy checkout URL
4. Use a test card: `4242 4242 4242 4242`, any future date, any CVC
5. Check the test email for your license key
6. Open extension settings → paste the license key → click Validate
7. Confirm the popup shows the deal search UI (not the upgrade prompt)

---

## Checklist Summary

- [ ] Lemon Squeezy account created
- [ ] Store created with slug noted
- [ ] Product created at $19 one-time
- [ ] License keys enabled (3 activations, no expiry)
- [ ] Thank-you redirect set to `https://deal-key.com/thanks.html`
- [ ] API key generated and stored in `.env`
- [ ] Store ID, Product ID, and Checkout URL hardcoded in `src/settings.js`
- [ ] Buy button updated in `index.html`
- [ ] End-to-end test completed with test card

---

*Generated for DealKey Pro — deal-key.com*
