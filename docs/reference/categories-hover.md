# Categories hover

Reference: Figma `j1cOxgS2tGUfkq1AeQwrEH`, node `689:2373`.

`src/pages/home/Categories` owns the category cover and hover interaction. The
resting list preserves the existing layout. The centered 431 × 618 cover at a
1920px viewport sits above inactive rows, with the active italic white title and
two terracotta numbers above it. Every category, including outerwear, uses the
same title size.

The buttons retain their geometry when active; the space between rows belongs
to the hit areas. Hover and keyboard focus crossfade the regular label into
an italic layer with a soft 700ms blur/lift reveal. The two numbers appear
after 120ms, over 600ms with a 40ms stagger. The cover reveals over 850ms,
crossfades images over 550ms, and exits over 300ms. Changes retarget current
GSAP values in one replaceable timeline, without a completion callback queue.
Images are mounted eagerly. A separate wrapper follows the pointer with two
reused GSAP quickTo tweens (650ms, power3.out), independently of the image fade.
Keyboard focus centers the cover. Reduced motion switches immediately and
keeps the cover centered; touch does not activate hover. Scroll/resize rechecks the stationary pointer, while a
keyboard selection retains priority until the next pointer movement.

`useTextMotion` continues to own each button's entrance. The hover owns only
the cover and inner label/number layers; the duplicate active label is hidden
from assistive technology. `data-line-cursor` remains on the section. The
category stage is at z-index 2, above the cursor line at 1. The cursor point
retains its upper layer.
Navigation remains the demo's existing disabled category action.

Assets downloaded from the reference: `category-dresses.jpg`,
`category-outerwear.jpg`, `category-skirts.jpg`. The blouse preview reuses the
identical existing `category-blouses.jpg`; tops reuse `edit-blouse.jpg` and
trousers reuse the trouser suit in `category-outerwear.jpg`.
