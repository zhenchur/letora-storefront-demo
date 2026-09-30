# Categories hover

Reference: Figma `j1cOxgS2tGUfkq1AeQwrEH`, homepage `1158:1460`, category layout `1158:1727`.

`src/pages/home/Categories` owns the six category rows. Every row covers the
entire viewport width, including both photograph columns. The rows
have contiguous hit areas; changing the active item does not change layout.
At 1920px, the central labels use 110px Livret, 0.9 line height and 12px gaps.
Resting labels are beige; the active label is italic indigo without brackets.

The active category shows two identical photographs, one on each side of
the text. Each is 202.599 × 248.584px at a 1920px viewport, half the previous
width and height. The left photograph retains its previous center; the right
one mirrors it across the section center. Both follow the horizontal centerline
of the active label and allow pointer events through to the full-width row.
The shared vertical anchor updates on selection and layout resize; it uses
the label's layout center, independent of its temporary entrance transform.
The “Перейти” action is removed.

Category names use `data-text-reveal="heading"` through the existing
`HomeContent` text-motion hook: 22px lift, 3° → 0° rotation around the bottom
left, opacity and 6px blur, 800ms power2.out, with the usual 80ms row stagger.
This opt-in heading profile extends the shared entrance without changing
ordinary links or splitting the resting and active label layers.
Only the label wrapper moves; full-width hit areas stay fixed. The section
title keeps its character entrance. Hover labels
share `createCharacterRevealVars` with `HoverText`:
opacity and 6px blur, 600ms quart.out, 28ms stagger, without translation.

Every incoming photograph opens from the center with the shared `setPhotoMask`
geometry. Hover uses a local 650ms power3.out profile so the opening is visible
from the first frame. Ordinary scroll entrances keep their 1800ms power4.inOut
profile. Every selected category starts a fresh 0 → 1 reveal; it never inherits
the previous photograph's time or progress. This avoids alternating between
an almost fully open image and a nearly invisible slow start during fast moves.
The previous pair is hidden immediately on selection changes and pointer exit.

Both images are decoded once ahead of hover. Ready pairs start synchronously
in the pointer event; an unfinished decode continues across selection changes.
A monotonically increasing request number allows only the latest selection to
start or complete a reveal, including A → B → A, exit and reentry. Failed images
are not shown. Both photographs share one progress tween with lazy rendering
disabled, so their masks open and reset together; resize updates both dimensions.

Keyboard focus selects a category. Reduced motion switches immediately;
touch does not start a hover. Scroll and resize recheck the pointer against
the current rows. Local `useCategoryEntrance` owns only the section title;
hover owns inner spans and label layers. The section uses the native cursor; `data-line-cursor` is omitted to disable the custom point and trail.
Navigation remains the demo's existing disabled category action.

The blouse state uses the exact Figma `22ea6.png`, shared with the refreshed
second arrival as `src/assets/home-refresh/new-puffer.png`. The other category
photographs reuse the existing category assets.

Browser verification covers a rapid sweep across all six rows, repeated A → B → A,
exit/reentry, and a new selection after a completed reveal. Each selection gets
its own immediate opening, with only the selected image visible on each side.
Both masks stay identical; completion removes the inline clip-path.
The recorded browser sweep selected nine rows in 699ms without a skipped pair.
`node .codex-qa/category-hover-race.mjs` additionally checks delayed decoding,
rapid resets, resize, focus/reduced motion, exit and cleanup with the real hook
and GSAP numeric tween; DOM and label animation are mocked in that test.
