# Project Context: Fragments

## Overview
**Fragments** is a mobile-first, sophisticated yet whimsical habit tracker. It uses the "Mature Cozy Blue" aesthetic—a combination of deep indigos, ceruleans, and slates paired with bubbly, rounded UI elements—to create a professional yet delightful habit-building experience.

## Tech Stack
- **Framework:** React 19 (Vite)
- **Language:** TypeScript
- **Styling:** 
  - TailwindCSS (via CDN) with custom `rounded-cozy` (2rem) and `rounded-bubble` (3rem) utilities.
  - Framer Motion (for "bubbly" transitions and micro-animations).
- **Icons:** Lucide React (Expanded library).
- **Charts:** Recharts (Themed to Indigo/Cerulean).
- **Persistence:** LocalStorage (`habitly_habits`, `habitly_categories`, `habitly_logs`).

## Design Philosophy: "Mature Cozy Blue"
- **Navigation & Brand:** Uses `cozy-indigo` (#6366F1) and `cozy-slate` (#94A3B8) for headers, navigation, and structural elements.
- **Intentional Green:** Uses `emerald-500` for all progress-related "doing" actions (Plus button, counter bubble, progress bars, active timers). This distinguishes "action" from "structure".
- **Structure:** Soft shadows, high border-radius, and "bubbly" buttons that feel tactile and responsive.

## Core Concepts
- **Fragments (Frags):** The unit of progress. Habits can reward multiple fragments (defined by `rewardValue`).
- **Habits:** Supports manual increment (completions) and timers (goal-based). Supports "Undo" via completion decrementing.
- **Categories:** Customizable with a preset "Cozy Palette" or custom hex codes. Color selection is hidden behind a collapsible toggle in Settings.
- **Mood Tracking:** Represented on a scale from -3 (😫) to 3 (🤩) with indigo-themed visual indicators.

## Project Structure
- `App.tsx`: Central state hub. Handles timer logic, day rollover, and persistence.
- `HabitCard.tsx`: The primary interaction unit. Features emerald "progress" elements and particle animations.
- `HabitList.tsx`: Displays habits with "Daily Progress" score header. Includes a scrollable category filter with hidden scrollbars.
- `Settings.tsx`: Manages category creation and color customization via a collapsible selection panel.

## Guidelines for AI / Developers
1. **Color Language:** Indigo for Navigation/Viewing. Emerald for Actions/Completions. Slate for tertiary info.
2. **Tactile UI:** Always use the `rounded-bubble` and layered shadows for interactive elements.
3. **Animations:** Use `framer-motion` `layout` prop for moving list items and `AnimatePresence` for visibility toggles.
4. **Clean Filters:** Use the `.scrollbar-hide` utility on horizontal scroll areas.
