# Counselling App — Seat Finder (Angular + Material + Tailwind)

Angular 21 frontend for the Seat Finder feature, built to match the original
design reference exactly. Uses **both** Tailwind CSS v4 (layout, custom
brand utilities) and Angular Material (select, button-toggle) — both draw
their colors from **one file**: `src/styles.scss`.

## Setup

```bash
npm install
npm start
```
Opens at `http://localhost:4200`. Point it at your API in
`src/environments/environment.development.ts`.

## ⚠️ Auth — read this before testing

`GET /api/counselling/seat-finder` is `[Authorize]`-protected on the backend.
This build has **no login UI and no token-paste workaround** (removed on
request) — so as things stand, every search will fail with a 401 until one
of these is true:

1. **You build real login UI** and call `inject(TokenStorageService).setToken(accessToken)`
   after a successful `POST /api/auth/login` — `TokenStorageService` and
   `authInterceptor` already exist and need no changes, they just need
   something to call `setToken()`.
2. **Or** you make the backend endpoint public to match this design's intent
   (the reference design has no login concept at all — it reads as a public
   tool). One-line change in `CounsellingController.cs`:
   ```csharp
   [HttpGet("seat-finder")]
   [AllowAnonymous]   // add this line
   public async Task<IActionResult> SeatFinder(...)
   ```

Pick whichever matches your actual plan for this app — happy to help with
either when you're ready.

## Single-file color theming

`src/styles.scss` is the only place colors are defined. It:
1. Sets a base Angular Material M3 theme (`mat.theme(...)`) using a built-in
   palette as structural scaffolding,
2. **Overrides** the key Material system tokens (`--mat-sys-primary`, etc.)
   with our own brand hex values,
3. Feeds those same custom properties into Tailwind's `@theme` block, so
   `bg-hero`, `text-primary`, `border-amber`, etc. all resolve to the exact
   same source values as the Material components.

Change a color once at the top of that file — everything using it (Tailwind
utility classes AND Material components) updates together.

```scss
:root {
  --color-hero: #7ec6d9;         // hero card background
  --color-hero-deep: #3f7a8c;    // eyebrow text on hero
  --color-ink: #0d1b22;          // page background
  --color-surface: #14242c;      // form card background
  --color-surface-alt: #0f1e25;  // summary bar background
  --color-primary: #5fa8be;      // inputs, links, buttons
  --color-amber: #d9822b;        // "closed just before you"
  --color-emerald: #34d399;      // "within reach"
}
```

## Project structure

```
src/app/
├── core/
│   ├── interceptors/auth.interceptor.ts   Attaches Bearer token IF one exists
│   ├── services/
│   │   ├── token-storage.service.ts       Reads/writes JWT to localStorage
│   │   └── counselling.service.ts         API calls: seat-finder, states, courses
│   └── models/counselling.models.ts       TypeScript types matching backend DTOs
├── features/seat-finder/
│   ├── seat-finder.ts / .html             Hero card + filters + summary bar + results
│   └── components/
│       ├── seat-filters/                  Rank/category/institute-type/course/state form
│       └── seat-card/                     One result card (near-miss or within-reach)
```

## Notes

- **Standalone components, signals, new control flow** (`@if`/`@for`/`@switch`) throughout.
- Institute type is rendered as a single-select pill group (`mat-button-toggle-group`),
  matching the reference design's pill look. The backend's `USP_API_USER_SEARCH_SEATS`
  currently only accepts **one** institute type per search — if you want true multi-select
  (Govt + Private simultaneously), that needs a backend change first (back to the
  comma-separated list the stored procedure used earlier in this project).
- The reference design's "SAMPLE DATA" banner/badge was **removed** — that label existed
  in the original mockup specifically because its numbers were fake placeholders for design
  review. This build calls your real API, so showing "sample data" would be misleading.
- Fonts: IBM Plex Sans (UI), IBM Plex Mono (ranks), Source Serif 4 (the "Seat Finder"
  hero title) — loaded via Google Fonts in `index.html`, inlined at production build time
  (needs real internet access to `fonts.googleapis.com` during `ng build`).

## Known gaps

- No Register/Login/Forgot Password screens.
- No route guard (only one route right now).
- No pagination on results.
