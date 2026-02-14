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
- **Main Habits:** Users can designate up to **2 habits** as "Main". These are pinned to the top of the list, maintain priority even when completed, and feature special visual highlights (indigo glow, star icons).
- **Categories:** Customizable with a preset "Cozy Palette" or custom hex codes. Color selection is hidden behind a collapsible toggle in Settings.
- **Mood Tracking:** Represented on a scale from -3 (😫) to 3 (🤩) with indigo-themed visual indicators.

## Project Structure
- `App.tsx`: Central hub for state management, persistence logic, and view routing. Handles fragment increments based on `rewardValue`.
- `types.ts`: Interface definitions for `Habit` (now including `rewardValue`), `Category`, `DailyLog`, and `DailyProgress`.
- `constants.tsx`: Default categories and Lucide icon mappings.
- `components/`:
  - `BottomNav.tsx`: Main navigation (Habits, Mood, Stats, Settings).
  - `HabitList.tsx`: Handles sorting (by time/category) and filtering.
  - `HabitCard.tsx`: Visual representation of a habit with timer, completion logic, and **particle celebration animations**.
  - `HabitForm.tsx`: Creation/Editing interface.
  - `MoodBar.tsx`: Interactive mood slider.
  - `Statistics.tsx`: Performance dashboard with Bar and Line charts.
  - `Settings.tsx`: Management of categories and habit deletion/editing.

## Key Logic
- **Timer System:** `App.tsx` runs a global `setInterval` that updates `elapsedTime` for all habits in the `activeHabitIds` set.
- **Day Rollover:** A background timer checks every minute if the date has changed to reset active habit timers.
- **Sorting:** Habits are sorted primarily by completion status (completed to bottom), then by time of day or category.

## Guidelines for AI / Developers
1. **Color Language:** Indigo for Navigation/Viewing. Emerald for Actions/Completions. Slate for tertiary info.
2. **Tactile UI:** Always use the `rounded-bubble` and layered shadows for interactive elements.
3. **Animations:** Use `framer-motion` `layout` prop for moving list items and `AnimatePresence` for visibility toggles.
4. **Clean Filters:** Use the `.scrollbar-hide` utility on horizontal scroll areas.
5. **Styling:** Use Tailwind utility classes. Maintain the "indigo" primary branding and "emerald" for success/completion.
6. **Animation:** Always use `AnimatePresence` and `motion` from Framer Motion for UI changes to keep the "vibe" premium.
7. **State:** Keep global state in `App.tsx` unless it's strictly UI-local.
8. **Mobile First:** Design everything to be touch-friendly and fit within a mobile viewport. Use `safe-bottom` for navigation on modern mobile browsers.