# Shared shell

- Header: named export `SiteHeader` from `src/components/SiteHeader.tsx`.
- Prop: `tone?: 'overlay' | 'light'`, default `overlay`.
- Prop: `fixed?: boolean`, default `false`. The homepage shows the fixed light header after the hero leaves the viewport and removes it on return to the hero. `HomePage` observes the hero boundary, including viewport changes and restored scroll positions; the header does not take space in the layout.
- `overlay`: absolute, white logo and actions; parent must be positioned.
- `light`: white background, indigo logo and actions. The product route passes `fixed`, keeping the header at the top of the viewport above the gallery; product content already reserves its space.
- Both use original Figma SVG silhouettes, 120 × 25 logo and 16 × 16 action icons. Account is an SVG exported by outlining the 1.3px stroke on a temporary copy of node `356:1322`; the copy was removed after export. This preserves both contours and avoids the regular exporter dropping the body with windingRule NONE. The previous 16 × 16 PNG blurred on high-density displays and has been replaced. AssetIcon applies white (`#fff`) on the homepage and indigo (`#37557d`) on the product page, matching the source nodes.
- The light header additionally has centered categories from Figma `602:417`; gap 74px at 1920, reducing on narrower desktops.
- The first delivery is static. Header service buttons are disabled; home logo navigates to `/`.
- Palette: `src/styles/colors.css`, `--palette-indigo`, `--palette-terracotta`, `--palette-white`, etc.
- Fonts: `--font-serif` (TT Livret Subhead, regular and italic), `--font-sans` (Wix Madefor Display, weights 400–800).
- Tabs: `font: var(--font-tabs)` (Wix Madefor Display SemiBold 600, 16px / 16px), `letter-spacing: 0`, indigo text. This shared token is for collection tabs and product description tabs; section titles and action links keep their own styles.
- Geometry: `--page-gutter: 32px`, `--grid-gap: 16px`.
- The homepage task owns App, common components, global styles, configs and dependencies, with current delegated exceptions documented in `docs/coordination.md`.
- The animations task owns the common GSAP registry, preloader, Lenis, `NavigationProvider`, and the routing integration in `main.tsx`/`App.tsx`. Hero motion belongs to the homepage task; shared text helpers belong to the product task. See `docs/coordination.md` for the current file ownership. `SiteIntro` stays mounted above route changes. Page entrances use `useSiteReady()` from `src/motion/SiteIntro.tsx`, which waits for both the startup loader and the destination scroll position. See `docs/motion.md` for the entry/reload policy and timings.
- Product task owns `src/pages/product/*` and `public/assets/product/*`.
- Product route: `/product/barelyef`; default export from `src/pages/product/ProductPage.tsx`, with shared light header outside the page.
- `SiteHeader` and `SiteFooter` accept `motion?: boolean` (default `false`) for shared text entrances and hovers. Each component owns its scoped text animation; page hooks should not target its elements again.
- `usePageTransition` owns the persistent `.site-content` opacity and `.page-backdrop`. `.site-shell[data-page-transition]` exposes `idle`, `exiting`, `preparing`, and `entering`. Keep page readiness true through exit; release the new page entrances after its shell fade. During transitions the light header uses the common backdrop fill.
