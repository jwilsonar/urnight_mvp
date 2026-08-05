# RAVENUE Design System

**RAVENUE** is a nightlife platform: it connects people with discotecas, bars and nightlife experiences, and connects venues ("locales") with customers — giving venues visibility, tools to manage their presence, and a path to convert foot traffic into business. Brand essence: *"Where nightlife finds its place."* The name blends **RAVE** (energy, night, experience) and **VENUE** (place, space), with a secondary echo of *revenue* — the platform's business value for venue partners.

Two audiences, one product surface:
- **Public / B2C** — discover events and venues, save favorites, report incorrect info.
- **Venue Admin / B2B** — venues manage their profile, events, images and see performance.
- **Super Admin** — Ravenue staff moderate venues, accounts, affiliation requests and reports.

## Sources provided
- `uploads/RAVENUE LOGO.png`, `uploads/RAVENUE.png`, `uploads/RAVENUE LETRAS.png` — the only real brand assets. Icon, horizontal lockup and wordmark-only, all on black. No vector/source file was provided — `assets/logo/` holds cropped, alpha-masked PNG derivatives (color + white + black monochrome) generated from these.
- `uploads/Design System 1–4.png` — four mockup pages (Brand/Logo, Foundations & Tokens, Typography/Grid, Core UI Components) that specify the exact palette, type scale, spacing/radius/shadow scale and component inventory used as the source of truth for this build.
- `uploads/UrNight Design System.html` — a prior, unrelated design system (purple/orange identity) supplied **only as structural reference** (page coverage, naming conventions). None of its visual identity was reused.

No Figma file or codebase was attached — this system was built from the reference mockups and brand assets only.

## Brand voice
Refined, energetic, confident, modern, clear, sober. Not juvenile, not gamer, not gothic, not loud. Spanish-market brand (copy in the source brief is Spanish) but the shipped UI copy is English per the reference mockups — see CONTENT FUNDAMENTALS.

## Index
- `styles.css` — root stylesheet, `@import`s everything below. Link this one file.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css` (Google Fonts import for Sora/Inter/JetBrains Mono).
- `assets/logo/` — icon mark, horizontal lockup, wordmark; each in color, all-white and all-black, transparent PNG.
- `guidelines/` — foundation specimen cards (Brand, Colors, Type, Spacing groups in the Design System tab).
- `components/` — 28 reusable React primitives, grouped by concern (see below). Each folder: `Name.jsx` + `Name.d.ts` + `Name.prompt.md`, plus one `*.card.html`.
- `ui_kits/public-app/` — Home, Events listing, Event detail, Venues listing, Venue detail (click-through).
- `ui_kits/venue-admin/` — Dashboard, Events list, Create/Edit event, Venue profile, Image management (click-through).
- `ui_kits/super-admin/` — Global dashboard, Venues management, Admin accounts, Affiliation requests, Audit log (click-through).
- `SKILL.md` — Claude-Code-compatible skill wrapper for this design system.

## Components
**Icon** — `icon/Icon.jsx`
**Buttons** — `buttons/Button.jsx` (primary/secondary/ghost/destructive), `buttons/IconButton.jsx`
**Forms** — `forms/TextInput.jsx`, `forms/SearchField.jsx`, `forms/Select.jsx`, `forms/DatePicker.jsx`, `forms/Textarea.jsx`
**Chips** — `chips/Chip.jsx` (filter/removable/category/district), `chips/StatusPill.jsx` (exported from Chip.jsx)
**Badges** — `badges/Badge.jsx` (published/draft/cancelled/archived/verified/featured/active/inactive/suspended)
**Cards** — `cards/EventCard.jsx`, `cards/VenueCard.jsx`, `cards/KpiCard.jsx`, `cards/InfoCard.jsx`, `cards/EmptyStateCard.jsx`
**Navigation** — `navigation/TopNav.jsx`, `navigation/Sidebar.jsx`, `navigation/BottomNav.jsx`, `navigation/Tabs.jsx`, `navigation/Breadcrumbs.jsx`, `navigation/Pagination.jsx`, `navigation/MobileDrawer.jsx`
**Overlay** — `overlay/Modal.jsx`, `overlay/Drawer.jsx` (side panel + mobile bottom sheet via `sheet` prop)
**Table** — `table/Table.jsx`
**Feedback** — `feedback/Toast.jsx`, `feedback/Alert.jsx` (+ `InlineError`), `feedback/Skeleton.jsx`
**Media** — `media/ImageUploader.jsx` (empty/drag/uploading/filled/error states)

### Intentional additions
None of the above were invented beyond the source mockups' "Core UI Components" page — every family listed there (buttons, inputs, chips/filters, badges, cards, navigation, modal/drawer, table, feedback, media uploads) is built. `Icon` was added as a shared glyph wrapper since the mockups show icon usage throughout but no icon library was attached (see ICONOGRAPHY).

## CONTENT FUNDAMENTALS
- **Voice**: refined, confident, declarative. Short sentence fragments over long copy ("Where nightlife finds its place.", "Elevate the Night.", "Designed for the Night.").
- **Case**: Sentence case for headings and body ("Designed for the Night"); UPPERCASE with wide tracking reserved for the wordmark, nav labels, eyebrows/labels and section numbers ("PAGE 2", "OFFICIAL COLOR PALETTE").
- **Person**: second person for marketing ("Find the perfect venue for any night"), neutral/functional for product UI ("Enter text", "No events found").
- **Numbers/data**: dates and IDs use the mono family (`EVT-1823`, `May 24, 2025`) to read as precise, technical detail against the display type.
- **Emoji**: never used — icon glyphs carry meaning instead.
- **Vibe**: curated, not chatty. No exclamation points, no hype language ("amazing", "don't miss out"). Confidence over enthusiasm.

## VISUAL FOUNDATIONS
- **Color**: dark-luxury direction. Obsidian Black (`#0B0B0D`) is the dominant surface; Carbon Charcoal and an Elevated tone (`#23222A`) stack above it for cards/panels. Crimson Red (`#B21E45`) is the single accent — used for primary CTAs, the wordmark's "V", active states and focus rings — never as a background fill for large areas. Deep Wine (`#6E1833`) is a secondary/pressed tone and the gradient partner to Obsidian. Moon White is primary text on dark; Smoke Gray is secondary text/metadata.
- **Type**: Sora (600/700) for display and headings — geometric, premium, slightly wide default tracking works well large. Inter (400–700) for all UI/body copy — high legibility at small sizes. JetBrains Mono for IDs, dates, technical/tabular data only.
- **Backgrounds**: solid dark surfaces, not full-bleed photography by default. The one gradient in the system (`--gradient-luxury`, Obsidian → Deep Wine) is reserved for hero-scale marketing surfaces — used sparingly, never on cards or components. A soft `--gradient-spotlight` (white glow fading to transparent) echoes the logo's spotlight motif for hero sections.
- **Animation**: fast (120ms) for hover/press feedback, normal (220ms) for panel/drawer/modal transitions, slow (360ms) for page-level moves. Standard ease `cubic-bezier(0.4,0,0.2,1)`; no bounce, no spring — motion is efficient and confident, never playful.
- **Hover states**: primary buttons lighten to Crimson Hover (`#C62850`); secondary/ghost surfaces gain a subtle Carbon Charcoal background; icons/text lighten from Smoke Gray toward Moon White. No glow/blur hover effects.
- **Press states**: buttons scale to 0.97 — a small, crisp compression, not a color-only change.
- **Borders**: 1px hairlines, Steel Border (`#302E38`) for default dividers/inputs, Border Soft (`#44414D`) for elevated-surface borders (modals, popovers) — slightly lighter so raised panels read as "above" the base surface.
- **Shadows**: dark, soft, no color tint — `sm/md/lg` all pure black at low-to-moderate opacity (0.35/0.45/0.55). Elevation communicates through shadow + a lighter surface tone together, not shadow alone.
- **Focus**: a 3px crimson glow ring (`rgba(178,30,69,0.55)`) on focused inputs/buttons — the only "glow" effect permitted in the system, and only on focus, never ambient.
- **Corner radii**: 8/12/16/20px scale plus a 999px pill. Buttons and chips are pill-shaped; cards/panels use 12–16px; inputs 12px; small controls (icon buttons, radius chips) 8px.
- **Cards**: Charcoal/Elevated background, 1px Steel/Border-Soft outline, 12–16px radius, `shadow-sm` at rest rising to `shadow-md` on hover — no colored left-border accents, no glassmorphism.
- **Transparency/blur**: minimal — only the modal backdrop (`rgba(11,11,13,0.7)`, no blur) and toast/chip tint backgrounds (10–15% opacity semantic color washes). No frosted-glass panels.
- **Imagery**: nightlife, architecture, lighting, crowds — elegant and atmospheric, never explicit, never neon-saturated or "gamer". No real photography was supplied; `guidelines/brand-imagery.html` and UI-kit imagery use dark gradient placeholders pending real venue/event photography (see Caveats).
- **Grid**: Desktop 12 columns / 1440 max / 24 gutter / 48 margin. Tablet 8 columns / 1024 max / 20 gutter / 32 margin. Mobile 4 columns / 375 max / 16 gutter / 20 margin.
- **Spacing**: strict 4px scale — 4, 8, 12, 16, 24, 32, 48, 64.

## ICONOGRAPHY
No icon font or SVG set was provided with the brand assets. `components/icon/Icon.jsx` implements a small curated set of line icons (Lucide-style paths, ISC-licensed convention: minimal geometric strokes) covering the glyphs the reference mockups show — map-pin, calendar, tag, heart, user, search, filter, bookmark, bell, star, share, home, and admin glyphs (grid, building, shield-check, users, flag, edit, trash, upload, download, clock, chevron/x/check). Default size 20/24px, 1.5px stroke, matching the spec. `filled` prop renders the solid variant for active/saved states (e.g. a saved heart). No emoji, no unicode glyphs-as-icons anywhere in the system.

## Caveats — please help iterate
1. **No vector logo source** — only rasters were provided. `assets/logo/*.png` are alpha-masked derivatives of the given PNGs (color, all-white, all-black). If you have the original vector/AI file, send it and I'll replace these with crisp vector-derived exports.
2. **No real photography** — imagery direction is documented but every image slot in guidelines and UI kits is a placeholder gradient. Send venue/event photos (or stock references you've licensed) and I'll wire them in.
3. **No Figma file or codebase was attached** — everything here is built from the four reference mockup images and the written brief, not a live product surface. If a Figma file or repo exists, attach it and I'll reconcile this system against the real source of truth.
4. **Icon set is an original curated line-icon implementation**, not a copied library — flag if you'd prefer a named CDN set (Lucide/Heroicons) linked directly instead.

Tell me what to refine — palette balance, a specific component's states, or which UI kit screen to push further — and I'll iterate.
