# Chrome Web Store Listing — Odyssey Companion

*Last Updated: October 2026*  
*Version: 1.0.0*

---

## 1. Store Listing Metadata

| Field | Value |
|---|---|
| **Extension Name** | Odyssey • Read Later & Pure Prose Purifier |
| **Short Name** | Odyssey |
| **Version** | 1.0.0 |
| **Category** | Productivity / News & Weather |
| **Primary Language** | English |
| **Visibility** | Public |
| **Price** | Free |

---

## 2. Store Descriptions

### Short Description (Max 132 chars)
> Save articles from any website with one click. Strips noise and sends pure, distraction-free prose to your Odysseus reading chamber.

### Detailed Description
> **Odyssey** is the companion browser extension for the **Odysseus** slow-journalism salon. 
> 
> Turn the noisy, ad-cluttered web into a calm, focused reading sanctuary. With a single click or keyboard shortcut, Odyssey purifies any article on the web—removing author bios, social sharing widgets, cookie notices, and newsletter popups—and sends clean, readable prose directly to your personal Odysseus library.
> 
> ### Key Features:
> ✦ **One-Click Instant Save**: Click the Odyssey compass icon or press `Alt+Shift+S` to instantly archive any web page into your offline salon.
> ✦ **Direct Zen Chamber Reading**: Open any article immediately in the Odysseus luxury reading interface, complete with font customization and a live progress scroll wheel.
> ✦ **Right-Click Context Menu**: Save pages, open links, or archive highlighted text excerpts without interrupting your browsing flow.
> ✦ **In-Page Confirmation**: A subtle, non-intrusive toast confirms your story has been saved and gives you a one-click shortcut to start reading.
> ✦ **Recent Saves History**: View and reopen your most recently archived stories directly from the extension popup.
> ✦ **Local & Cloud Sync**: Works seamlessly with your Odysseus deployment, whether hosted on Vercel or running locally.
> 
> ### Why Odyssey?
> Modern websites are crowded with animated banners, tracking scripts, and intrusive subscription overlays. Odyssey strips away the noise so you can savor high-signal writing at your own pace.

---

## 3. Permissions Justification

Every permission is strictly scoped to delivering the extension's core read-later functionality:

| Permission | Review Team Justification |
|---|---|
| `activeTab` | Required to access the URL and page title of the specific tab the user explicitly chooses to save or purify when clicking the extension icon or context menu. |
| `tabs` | Required to query the active tab's title and URL across windows to facilitate instant one-click saves and seamlessly launch the Odysseus Zen Chamber in a new tab. |
| `storage` | Required to locally store the user's recent saved articles list and persist custom settings (such as custom Odysseus instance URL). |
| `contextMenus` | Required to provide right-click options ("Save Story to Odysseus Salon", "Read in Zen Chamber", and "Save Highlight") directly from the browser context menu. |
| `scripting` | Required to display the in-page confirmation banner on the saved webpage confirming the article was archived. |
| `host_permissions` (`<all_urls>`) | Required because users read and import articles from across the entire open web—including news sites, Substack newsletters, Medium blogs, and independent publications. |

---

## 4. Privacy & Data Use

- **Data Collection**: Odyssey does NOT collect, sell, or monetize user personal data.
- **Storage**: Articles and configuration settings are stored locally in the user's browser using `chrome.storage.local`.
- **Transmission**: URLs and titles are transmitted only to the user's designated Odysseus backend instance for article extraction and sync.
- **Single Purpose Compliance**: The extension serves one clear purpose: allowing users to save and purify web articles for reading in the Odysseus salon.
