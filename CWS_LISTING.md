# Chrome Web Store — Listing Copy

## Extension name
DealKey — AI Discount Code Finder

## Short description (132 chars max)
Find real discount codes at checkout using your own AI key. No tracking, no servers, no middlemen. Your AI. Your savings.

## Long description (CWS allows up to ~16,000 chars — keep it focused)

DealKey uses your own AI key to find working discount codes at checkout — automatically.

Unlike other coupon extensions that run through central servers, log your shopping behaviour, and replace affiliate links with their own, DealKey runs entirely in your browser. No data leaves your device except the direct call to your AI provider.

**How it works**

1. Browse to any checkout page
2. DealKey detects the checkout and searches for discount codes using your AI key
3. Found codes appear in the popup — click Apply to try them automatically

**Your AI. Your key. Your savings.**

DealKey supports three AI providers — you choose which one to use:
- Claude (Anthropic) — best accuracy for finding valid codes
- OpenAI (GPT-4o mini) — reliable alternative
- OpenRouter — access multiple models from a single key

A typical search costs less than $0.001. A $5 AI credit lasts months of daily shopping.

**What DealKey doesn't do**

- No central servers processing your requests
- No tracking of your shopping behaviour or purchase history
- No replacement of affiliate links
- No account required
- No subscription — $19 once, or free from GitHub

**Open source**

The full source code is available on GitHub. Verify exactly what the extension does and doesn't do.

**Privacy**

Your API key and browsing activity never leave your browser. DealKey has no analytics, no telemetry, and no servers. Full privacy policy at deal-key.com/privacy.html.

---

## Category
Shopping

## Language
English

## Privacy policy URL
https://deal-key.com/privacy.html

## Homepage URL
https://deal-key.com

## Support URL
https://deal-key.com (or mailto:hello@deal-key.com)

---

## Screenshots needed (1280x800px each)
1. Popup showing deal results on a checkout page (WINTER25, FREESHIP, GEAR10 codes)
2. Settings page showing provider selection + API key field + license key field
3. Upgrade card (what users without a license see)
4. Landing page hero (deal-key.com)
5. How it works — the 3-step flow

## Store icon
icons/dealkey-logo.png (500x500, already created)

---

## Justification notes for CWS review
(Use these if reviewer asks about permissions)

- activeTab: Required to detect checkout pages and read the current URL for AI code search
- storage: Required to save API key and settings locally — nothing is transmitted to DealKey servers
- scripting: Required to detect coupon input fields and apply codes automatically
- host_permissions (api.anthropic.com, api.openai.com, openrouter.ai): Direct AI API calls from user's browser using their own key
- host_permissions (api.gumroad.com): License key validation only — no personal data transmitted
