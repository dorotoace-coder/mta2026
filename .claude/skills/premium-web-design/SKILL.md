---
name: "premium-web-design"
description: "Use when building or redesigning a marketing/landing page that needs to look like a premium, expensive, 3D-feeling website rather than generic AI-generated output. Applies across any brand or vertical — SaaS, ministry/church, music/artist, event, AI agency, local business. Triggers: 'make this look premium', 'this looks like AI slop', 'give it that 3D depth feel', 'build a beautiful landing page', 'redesign the homepage'. Not for authenticated app/dashboard screens, admin panels, or internal tools — those follow product-UI conventions, not marketing-page design."
---

# Premium Web Design (Brand-Agnostic)

Generic Claude-built websites default to a recognizable, cheap-looking pattern: centered hero,
purple-to-blue gradient blob, three identical icon-in-circle feature cards, Inter font, no
compositional hierarchy. This skill is a checklist for avoiding that and producing pages that read
as intentionally, expensively designed — regardless of what the site is selling.

Work through these in order. Each step compounds on the last; skipping straight to "make it pretty"
is why output regresses to generic.

## 1. Reference before you describe

Before writing layout code, gather 1-3 real reference points instead of describing the vibe in
adjectives. Good sources: Awwwards, Godly.io, Land-book, Dribbble, Mobbin. Screenshot or mood-board
the specific section you're chasing (hero composition, pricing layout, footer structure) and hand it
in alongside the brief. "Show, don't tell" reliably beats "premium, modern, clean" as a prompt —
those words have no visual meaning to a model on their own.

## 2. Establish a component foundation, don't hand-roll everything

Set up a real component system before writing bespoke JSX for every section:
- **shadcn/ui** (or the project's existing equivalent) for buttons, cards, tabs, accordions,
  dialogs — check if it's already installed (`components/ui/`, `components.json`) before adding a
  new one from scratch.
- **Design tokens over hardcoded hex** — colors, radius, spacing should route through CSS
  variables/theme tokens so the whole site stays visually consistent as pages get added.
- **A real type scale and spacing scale** — pick one (e.g. 1.25 modular scale for type, 4/8px base
  unit for spacing) and stick to it; ad hoc `text-[17px]` / `mt-[13px]` values are a tell.

## 3. Snipe components instead of generating them

For non-trivial interactive pieces — animated pricing toggles, marquee/logo walls, bento grids,
testimonial carousels, magnetic buttons, cursor-follow effects — check a component gallery first
and copy the real implementation in, then re-skin it to the brand:
- **21st.dev** — huge searchable gallery, filter by "featured" for the strongest ones.
- **Magic UI**, **Aceternity UI** — animation-heavy components (marquees, spotlight, beams, bento).
- **CodePen** — good for one-off effects (particles, shaders, custom cursors).

Copy code + the source URL into the prompt so the exact implementation gets adapted, not
reinvented from a text description — reinvented-from-scratch UI is the single biggest source of
"generic AI website" output.

## 4. Add real depth and motion, not flat cards

"3D-feeling" doesn't require literal 3D — but a few techniques reliably produce that sense of depth:
- **CSS 3D transforms** — `perspective` + `rotateX/Y` on hover for tilt cards, layered parallax
  planes on scroll.
- **react-three-fiber / Three.js** for an actual 3D hero object (product, orb, abstract shape) when
  the budget/complexity justifies it — a single well-lit rotating object beats a flat gradient blob.
- **Gradient meshes / animated orbs** as background texture instead of flat gradients — subtle hue
  shift over time, low opacity, positioned off-axis (not dead-center).
- **Glassmorphism used sparingly** — one frosted-glass surface per viewport, not everywhere.
- **framer-motion** for scroll-reveal (fade + slight translate-Y on enter), staggered children, and
  hover micro-interactions. One accent animation per section max — motion that competes with
  reading is worse than no motion.

## 5. Extract a design system from a reference when the ask is "make it feel like X"

When someone wants a specific site's *feel* without copying it, have Claude extract the underlying
design system rather than eyeballing it: color palette (with roles — background/accent/text, not
just hex codes), type scale and font pairing, spacing rhythm, motion language (what animates, how
fast, what easing), and layout grid. Apply that extracted system to the new brand/content rather
than re-describing the reference from memory each time — this produces far more consistent, more
faithful results than "make it feel like Stripe" as a one-line instruction.

## 6. Sanity-check against generic-AI-website tells before shipping

- Purple/blue gradient background with no relation to the brand's actual palette
- Three (or four) identical icon-in-circle cards with equal visual weight, no hierarchy
- Perfectly centered, symmetric layout throughout — no asymmetry or intentional grouping
- Default Inter font with no pairing or scale discipline
- Generic CTA copy ("Get Started", "Learn More") disconnected from what's actually being offered
- Feature list that reads like a spec sheet instead of a narrative/benefit order

If a page has more than one of these, it needs another pass — these are the fastest tells that a
page was generated rather than designed.
