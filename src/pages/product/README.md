# Product page — desktop layout and text motion

Route: `/product/barelyef`.

Implemented from Figma file `j1cOxgS2tGUfkq1AeQwrEH`, frame `602:404`: breadcrumbs, product heading, article/model labels, four photos, size/color controls, price/purchase controls, information tabs, FAQ and recommendations. `App` supplies the shared light `SiteHeader` and `SiteFooter`.

Text entrances and hovers are implemented. Controls remain previews until the interaction stage: text buttons use `aria-disabled` so pointer and keyboard focus can demonstrate their hover, without changing tabs, FAQ, options or cart. Photos appear in the original vertical order. The description tab is selected, and the first FAQ answer is expanded as in Figma. Content for the other tabs and collapsed answers is deferred until that stage rather than invented. Recommendations retain the resting photo treatment. Both side panels use CSS sticky positioning at 96px from the viewport top and stop at the gallery boundary before the information sections.

At 1920px the photo column is 880px wide with 1080px tall images and 45px gaps, beginning at y=355. The column scales with the desktop viewport; outer gutters and control typography remain readable at 1280px. Shared palette and font variables come from `src/styles/`.

The information block starts at y=4952, FAQ at y=5338, recommendation photos at y=6177 and footer navigation at y=7247. The page height at 1920px is 7989px, matching the source frame. Vertical spacing scales on other desktop widths while text can wrap naturally. The footer component is reused as delivered by the homepage task; only its preceding space is adjusted for this page.

Information tabs use the shared `--font-tabs` token: Wix Madefor Display SemiBold 600, 16px / 16px, zero tracking. This matches the refreshed product tabs and homepage tabs (`599:368`, `610:1916`).

Exact assets in `public/assets/product/`:

- `front.png`: Figma node `602:435`.
- `back.png`: `602:462`.
- `lining.png`: `636:1928`.
- `full.png`: `636:1929`.
- `chevron-right.svg`: `602:441` (also used for breadcrumbs and rotated dropdown arrows).
- `tab-dot.svg`: `636:2024`.
- `slider-line.svg`: `639:2227`.

Gallery photos are 880×1080 exports of the individual photo nodes, preserving Figma's final layered fills and crop. Recommendations reuse the four `new-*.jpg` images from `src/assets/home/`. Runtime public asset paths currently target the site root, matching the local product route.

Verified in Chromium at 1920×900, 1440×900, 1280×800 and 2560×1440: all images load, all sections and the single shared footer are present, there is no horizontal overflow, and both panels stick at 96px then stop at the gallery boundary without covering the following sections. Lower sections and footer were visually checked against Figma; their 1920px positions match within a pixel.

## Text motion

`useTextMotion` in `src/motion/textMotion.ts` waits for `useSiteReady()` from the shared preloader. Visible text starts immediately after ready; lower text appears once at `clamp(top 88%)`, including the legal row at the bottom of the footer. `data-text-reveal="lines"` splits display headings such as the product name; `data-text-reveal="block"` animates a stable parent. Both use the same small lift. `data-text-reveal="copy"` preserves the separate line motion for running body copy (description, FAQ answer and the homepage editor's paragraph). SplitText recalculates both line modes on font or width changes. Optional `data-text-delay` is in seconds. Paragraph indents remain 44px on the first line only.

The shared factory `createTextRevealVars()` in `src/motion/textReveal.ts` uses a fixed `y: 22px → 0` and no rotation, as requested to make large headings, statements and controls move equally gently. This replaces height-dependent `yPercent: 125` and avoids the extra lift caused by rotating wide text. `createTextRevealVars({ bodyCopy: true })` retains the original line profile: `yPercent: 125 → 0`, rotation `3deg → 0`. Both keep the placeholder's timing and blur: 0.8s, `power2.out`, blur 6px to 0, opacity 0 to 1, stagger 0.08s, origin `0% 100%`. Sources are `placeholder-react/src/lib/motion.ts`, `src/lib/textReveal.ts` and `src/components/AboutPage/AboutPage.tsx`. Related labels also stagger in 0.08s steps. Motion properties are cleared after completion. The hook scopes cleanup to its own elements and responds to changes in reduced-motion preferences; it does not replay on ordinary React rerenders.

`HoverText` ports `placeholder-react/src/components/BlurHoverLink/BlurHoverLink.tsx`, preserving italic markup and natural word wrapping. Pointer entry or visible keyboard focus restarts a character reveal: 0.6s, `quart.out`, blur 6px to 0, opacity 0 to 1, stagger 0.028s. Source character indices include spaces, preserving the original timing between words while spaces can still wrap naturally. Touch does not trigger it. A single accessible label is preserved, and motion styles/listeners are cleaned on completion, unmount and reduced-motion changes. Entrance targets the parent while hover targets only inner characters.

The product route enables the shared Header/Footer `motion` option. Shared components default to `motion={false}`; other routes can opt in separately. GSAP, SplitText and ScrollTrigger come from the central registry, and scroll uses the single shared Lenis instance. This page creates no loader, ticker or scroll engine of its own. Gallery transitions, card-image effects and shopping interactions are separate work.

Motion QA in Chromium covers all four desktop widths above, immediate entrance after ready, lower sections including the footer's last row, no replay when scrolling back, hover/reentry/keyboard focus/touch exclusion and accessible labels. Resize 1920→1280→1920 preserves description 5→7→5 lines and FAQ 4→6→4 lines. Reduced-motion changes remove all SplitText wrappers and pending triggers and leave the full page text visible. No nested splits, duplicate triggers or stale animation styles remain. Production build and TypeScript checks pass.
