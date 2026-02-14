# Project Context: Fragments (V3)

## Overview
**Fragments** is a mobile-first, sophisticated yet whimsical habit tracker. It utilizes a vibrant teal-to-green gradient backdrop and a "Fragment Gradient" aesthetic. The UI focuses on tactile, rounded elements and a clear color language to distinguish types of progress.

## Tech Stack
- **Framework:** React 19 (Vite)
- **Language:** TypeScript
- **Styling:** 
  - TailwindCSS (via CDN).
  - `theme.css`: Central hub for CSS variables (colors, shadows, border-radius, stroke thickness).
  - Framer Motion (for fluid list transitions, particle celebrations, and micro-animations).
- **Icons:** Lucide React (Customized sizing/stroke for better visibility).
- **Persistence:** LocalStorage (`habitly_habits`, `habitly_categories`, `habitly_logs`).

## Design Philosophy: "Tactile Fragments"
- **Background:** High-contrast linear gradient (`#1CA2DC` to `#5AAA62`) that flows diagonally.
- **Color Language:**
  - **Orange (`--color-accent` / Amber):** Used for "Doing" progress — circular rings, step counters, timers, and the default "Play" button.
  - **Blue (`--color-fragment`):** Used for "Rewards" — fragment gems, celebration particles, and statistics.
  - **Green (`--color-success` / Emerald):** Used for "Completion" — filled check buttons and success indicators.
- **Structure:** Neutral shadows (`shadow-block`), high border-radius (`rounded-block` @ 1.7rem), and glassmorphism (white/15-20% opacity) for headers and filters.

## Core Concepts
- **Fragments (Frags):** The reward unit. Logic distinguishes between completing a habit and earning fragments.
- **Multi-Step Logic:** For habits with sub-steps (e.g., 25 pushups), fragments are awarded only upon completing a full "cycle" (defined by `goal` / `stepValue`).
- **Main Habits:** Users can pin up to 2 habits. They are highlighted with an amber Star badge and stay at the top of the list.
- **Micro-Progress:** Every habit icon is wrapped in a SVG circular ring that fills in real-time (for timers) or by segments (for steps).

## Project Structure
- `theme.css`: **The source of truth for styling.** Defines colors, shadows, and default progress ring stroke thickness.
- `App.tsx`: Central state management, persistence, and routing. Handles cycle-based fragment logic.
- `types.ts`: Interface definitions for `Habit`, `Category`, `DailyLog`, and `DailyProgress`.
- `components/`:
  - `HabitCard.tsx`: Compact design with circular SVG rings. Manages particle bursts on completion.
  - `HabitList.tsx`: Transparent filter/sort bar with white-on-green labels.
  - `Statistics.tsx`: Blue-accented fragments dashboard and charts.
  - `BottomNav.tsx`: Dark-green, high-contrast navigation bar.

## Key Logic
- **Full-Cycle Fragments:** If a habit has 25 steps to 1 fragment, 50 steps earned gives 2 fragments. Logic recalculates based on `Math.floor(steps / stepsCount)`.
- **Timer Persistence:** Timers are tracked globally in `App.tsx` and protected against tab inactivity or accidental refreshes.
- **Standardized Rounding:** Almost all containers use `rounded-block` which reads from the CSS variable `--radius-block` in `theme.css`.

## Guidelines for AI / Developers
1. **Styling Integrity:** **NEVER** use hardcoded hex codes for primary colors or shadows. Always check `theme.css` variables.
2. **Visual Hierarchy:** White text/borders for headers on the green background. Slate text for secondary info on white cards.
3. **Animations:** Always use `motion` and `AnimatePresence`. The "premium" feel comes from smooth layouts and bouncy particles.
4. **Mobile Polish:** Every button must have state (`active:scale-95`). Use `safe-bottom` for the navigation area.
5. **Logic Guardrails:** When modifying completion counts, ensure you use the `Math.floor` cycle logic for multi-step fragments.