---
name: Class Center brand palette and icon/color design direction
description: Design decisions for the Class Center site after the user said it "looks AI-generated"
---

The user (French speaker, owner of "Class Center" recharge/subscription/card platform) asked to remove icons and unify colors because the site looked AI-generated — the classic tell was decorative lucide-react icons (feature card icon badges, badge/heading icons, star ratings, gradient icon circles) plus a rainbow of ad-hoc Tailwind colors (purple, indigo, violet, emerald, teal, pink, cyan) layered on top of the site's own design system.

**Decision:** Keep the existing `cc-` token system defined in `src/app/globals.css` (cc-orange primary, cc-yellow accent, cc-blue secondary, cc-black/cc-surface-*/cc-text-* for neutrals) as the single source of truth. Replace all ad-hoc decorative colors with the closest cc- token. Keep plain `red-*`/`green-*` only for genuine semantic states (real errors, real success/destructive actions) — never decoratively.

**Icon policy:** Remove decorative icons (next to headings/badges, inside feature/empty-state illustrations, purely ornamental button icons). Keep functional icons that aid usability: close (X), carousel/select chevrons, password show/hide (Eye/EyeOff), search, loading spinners, and true navigation affordances (e.g. list-row disclosure chevrons). This distinction avoids the "which icons stay" ambiguity if similar redesign requests come up again.

**Why:** Removing every icon indiscriminately breaks usability signals users rely on (e.g. "click to expand", "tap to see options"); the actual AI-generated-look complaint is about decorative/marketing icon clutter and inconsistent rainbow gradients, not functional UI affordances.

**How to apply:** When asked to declutter/de-AI-ify a similar template-feeling site, audit for (1) decorative icon badges in feature/marketing sections and (2) hardcoded off-brand Tailwind color utilities, and fix both against the project's existing design tokens rather than introducing new ones.
