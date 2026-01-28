# RLW Express — Living Development Roadmap

**Purpose:** This is the single source of truth for all development on this project. Use it to plan features, fix bugs, and streamline the app. Update this document whenever you add features, change architecture, or decide on new priorities.

**Last updated:** January 28, 2026

---

## 1. Project Vision & Business Goals

### What This App Is
An **all-in-one vendor hub** for your artisan/artist business, accessible from **tablet, phone, or computer** via **GitHub Pages**. It supports:

- **Inventory** — Backstock and item management
- **Sales** — Point of sale (POS) at events
- **Analytics** — Revenue, profit, trends, and insights
- **Event discovery** — Finding nearby artist markets, craft fairs, comic cons, and vendor opportunities

### Business Outcomes
1. **Find opportunities** — Discover and evaluate events before committing
2. **Run events smoothly** — POS and inventory in one place
3. **Understand performance** — Data-driven decisions on events and products
4. **Access anywhere** — Same hub on booth tablet, phone, and home computer

---

## 2. Current State (As-Is)

### Pages & Features
| Page | File(s) | Purpose |
|------|---------|---------|
| **Home** | `index.html`, `home.js`, `common.js` | At-a-glance dashboard, links to all sections, mobile-friendly nav |
| **Inventory** | `inventory.html`, `app.js` | CRUD items, search/filter, CSV import/export, low-stock alerts |
| **POS** | `pos.html`, `pos.js`, `pos-styles.css` | Event selection, item grid, cart, checkout, logs to sales |
| **Events** | `events.html`, `events.js` | Add/edit events, table cost, link to sales |
| **Sales Log** | `sales-log.html`, `sales-log.js` | View/filter sales, export CSV |
| **Event Discovery** | `event-discovery.html`, `event-discovery.js` | Location search, manual event entry, save & add to Events |
| **Analytics** | `analytics.html`, `analytics.js` | Revenue/profit charts, event comparison, insights (Chart.js) |
| **Backup & Restore** | `backup.html`, `backup.js` | Download all data as JSON; restore on another device |

### Data & Tech
- **Storage:** Browser `localStorage` only — no server. Use **Backup & Restore** to move data between devices (download on one, restore on another).
- **Stack:** Vanilla JS, CSS, HTML; Chart.js via CDN; GitHub Actions deploys to GitHub Pages
- **Build:** `npm run build:gh-pages` → copies files into `dist/`; workflow deploys `dist/`

### Known Gaps (Fix Soon)
1. **Build/deploy:** `scripts/copy-files.js` must include every page and asset (including Backup) so the full site works on GitHub Pages.
2. **Cross-device:** Data does not auto-sync. Use **Backup & Restore** (download backup on one device, restore on another) to keep data in sync across devices.
3. **Mobile UX:** Home dashboard and hamburger nav are in place; POS may still benefit from a dedicated mobile layout (e.g. sticky cart).

---

## 3. Access Everywhere: Tablet, Phone, Computer

### How You Access It Today
- **URL:** `https://<your-username>.github.io/<repo-name>/` (after enabling GitHub Pages and deploying)
- **Dev locally:** Open `index.html` or run a local server (e.g. `npx http-server`) and use the same URL path structure

### Making It Reliable on All Devices
- **Bookmark the GitHub Pages URL** on tablet and phone home screen for one-tap access.
- **Use the same browser** (e.g. Chrome) on all devices if you rely on localStorage; data is per-browser per-device.
- **Same data on different devices:** Use **Backup & Restore** (in the nav): on device A click "Download backup" and save the file (e.g. to Google Drive or email); on device B open the site, go to Backup & Restore, click "Restore from file", and choose that file. All inventory, events, sales, and discovery data will load on the new device.
- **Back up regularly** so you don't lose data if you clear the browser or switch devices.

### Improvements to Prioritize (for “use anywhere”)
| Priority | Task | Why |
|----------|------|-----|
| High | Fix build so Discover + Analytics are in `dist/` and deployed | So all features work on the live site |
| High | Add a simple **PWA manifest** + **service worker** (optional) | “Add to Home Screen” and basic offline loading on phone/tablet |
| Medium | **Responsive nav** — hamburger or compact nav on small screens | Easier use on phone |
| Medium | **Touch-friendly** POS (bigger tap targets, sticky cart) | Better at events on tablet/phone |
| Later | **Cloud backup/sync** (e.g. export/import to Google Drive or a simple backend) | Same data on all devices |

---

## 4. GitHub Pages Deployment

### Current Setup
- **Workflow:** `.github/workflows/deploy.yml` runs on push to `main` and `workflow_dispatch`
- **Steps:** Checkout → `npm ci` → `npm run build:gh-pages` → upload `dist/` as Pages artifact → deploy
- **Repo setting:** In GitHub repo **Settings → Pages**, set source to **GitHub Actions**

### Checklist Before Each Release
- [ ] Run `npm run build:gh-pages` locally and open `dist/index.html` (and other pages) to confirm everything works
- [ ] Ensure `scripts/copy-files.js` lists every HTML/JS/CSS file the site needs (including event-discovery and analytics)
- [ ] Push to `main` and confirm the “Deploy to GitHub Pages” workflow succeeds
- [ ] Open the live URL on phone and tablet and click through main flows (Inventory, POS, Events, Sales Log, Discover, Analytics)

### If the Site Doesn’t Update
- Check **Actions** tab for failed workflow runs
- Confirm **Pages** is using the **GitHub Actions** source, not the `gh-pages` branch
- Wait a few minutes and hard-refresh (or clear cache) on the device

---

## 5. Streamlining & Code Health

### Navigation
- **Current:** Shared `app-nav` (Home, Inventory, POS, Events, Sales Log, Discover, Analytics) is included on every page with consistent HTML. `common.js` initializes the mobile hamburger menu (toggle, slide-out drawer, close on link click or resize).
- **Improve:** Optional: move nav HTML into a shared snippet or JS that injects it so adding a new page only updates one place.

### Styling
- **Current:** `styles.css` (global) + `pos-styles.css` (POS); some inline styles in HTML.
- **Improve:** Prefer global CSS variables in `styles.css` for colors/spacing; move inline styles into classes so tablet/phone overrides are easier.

### Scripts
- **Current:** One main JS per page; `inventoryManager` is global on the inventory page.
- **Improve:** Keep vanilla JS; consider a tiny shared `common.js` for nav, localStorage keys, and shared constants so adding new pages stays simple.

### Data Keys (localStorage)
Use these keys only; avoid new keys that overlap in purpose.

| Key | Used by | Purpose |
|-----|---------|---------|
| `inventory` | app.js, pos.js, sales-log.js, analytics.js | Inventory items |
| `events` | events.js, pos.js, sales-log.js, event-discovery.js, analytics.js | Events list |
| `posSales` | pos.js, sales-log.js, events.js, analytics.js | Sales/transactions |
| `posSaleNumber` | pos.js | Next sale number |
| `activeEventId` | pos.js, events.js | Currently selected event for POS |
| `userLocation` | event-discovery.js | Saved location for Discover |
| `discoveredEvents` | event-discovery.js | Discover: saved search results |
| `bookmarkedEvents` | event-discovery.js | Discover: bookmarked events |
| `trackedEvents` | event-discovery.js | Discover: tracked events |

### Build Script
- **Rule:** Every page that exists in the repo and is linked from the app must be in `scripts/copy-files.js` (and any assets it uses). When you add a new page, add it to the list and run the build.

---

## 6. Feature Roadmap (What to Build Next)

Use this list when planning work. Mark items **Done** when shipped and add new rows as you go.

### Immediate (Bug / Deploy)
- [ ] **Include event-discovery and analytics in build** — Add `event-discovery.html`, `event-discovery.js`, `analytics.html`, `analytics.js` to `copy-files.js` so they deploy to GitHub Pages.

### Short-Term (Improve “use anywhere”)
- [x] **Mobile nav** — Hamburger nav on small screens with slide-out drawer; all sections reachable on phone. (Done.)
- [ ] **POS touch UX** — Larger buttons and tap targets, sticky cart summary on scroll for tablet/phone.
- [ ] **PWA basics** — `manifest.json` + minimal service worker so the app can be “Add to Home Screen” and load from cache when offline.

### Medium-Term (Features)
- [ ] **Inventory forecasting** — Simple “reorder soon” or “top movers” based on sales history (see IMPROVEMENTS.md).
- [ ] **Event cost tracking** — Per-event expenses (travel, table, materials) and net profit in Events and Analytics.
- [x] **Backup/restore** — One-click "Download backup" (JSON) and "Restore from file" on Backup & Restore page; use to move data between devices. (Done.)
- [ ] **Filters and date ranges** — Consistent date-range and event filters across Sales Log and Analytics.

### Later (Larger Bets)
- [ ] **Optional cloud sync** — e.g. export/import to a cloud drive or a small backend so the same data appears on all devices.
- [ ] **External event APIs** — Eventbrite/Facebook/Google for “Discover” (requires API keys and CORS/proxy strategy for GitHub Pages).
- [ ] **Customer/contact list** — Optional list of buyers for follow-up (stored locally at first).

---

## 7. How to Use This Document When Coding

1. **Before starting work:** Read the section that’s relevant (e.g. “Access Everywhere”, “Feature Roadmap”, “Streamlining”).
2. **When adding a feature:** Add it to the roadmap (Section 6) as unchecked, then implement; when done, check it off and note any new files or data keys in Section 2 or 5.
3. **When fixing a bug:** If it’s deploy-related, update Section 4; if it’s data-related, update Section 5 (e.g. data keys).
4. **When changing structure:** Update “Current State” (Section 2) and “Streamlining” (Section 5) so the next session (or another dev) knows the new layout.
5. **Once per release:** Run the “Checklist Before Each Release” in Section 4 and test on at least one phone and one tablet.

---

## 8. Quick Reference

| Need | Where |
|------|--------|
| Add a new page | Create HTML/JS/CSS → add to `copy-files.js` → add nav link in `.nav-links` on every page (and in `index.html` dashboard grid if desired) → update this doc Section 2 |
| Change deploy | `.github/workflows/deploy.yml` and `scripts/copy-files.js` |
| Change global styles | `styles.css` (variables at top, then responsive at bottom) |
| Where data lives | Browser localStorage; keys in app.js, events.js, sales-log.js, event-discovery.js, analytics.js |
| Existing ideas and phases | `IMPROVEMENTS.md`, `SUMMARY.md`, `QUICK_START.md` |

---

*This document is the living roadmap. Keep it updated as the project evolves.*
