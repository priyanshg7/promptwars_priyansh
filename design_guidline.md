# UI/UX Architectural Specification for "Pact" (Micro-App)

**Context:** You are building a B2B React/Tailwind micro-app. This app is an ephemeral, client-facing "Deal Room" generated from an AI transcript. The UI must be fiercely minimalist, highly professional, and perfectly responsive.

**Design System & Tailwind Config:**
*   **Font Family:** Set primary font to 'Inter', sans-serif. Set secondary font (for pricing, dates, percentages) to 'Space Grotesk' or standard mono.
*   **Color Palette (Strict):**
    *   Background: `bg-gray-50`
    *   Cards/Containers: `bg-white` with `shadow-sm` and `border border-gray-200`
    *   Primary Text: `text-gray-900`
    *   Secondary Text: `text-gray-500`
    *   Brand Accent (Buttons/Progress): `bg-indigo-600` (hover: `bg-indigo-700`)
    *   Success State: `bg-emerald-500` and `text-emerald-600`
*   **Border Radius:** Use `rounded-md` (6px) globally for buttons, cards, and inputs. Avoid heavy rounding.

**Layout Rules:**
*   The client-facing app must be a single-column layout centered on the screen.
*   Wrapper container: `max-w-3xl mx-auto p-4 md:p-8`.
*   Maintain aggressive whitespace. Use `gap-6` or `gap-8` between major sections.

**Core Component Rules:**
1.  **Progress Bar:** Must be prominently placed at the top. Use an `h-3` div with `bg-gray-200`, containing an inner div with `bg-indigo-600` that dynamically updates its `width` percentage based on checked tasks. Add `transition-all duration-500 ease-in-out` for smooth filling.
2.  **Task Checkboxes:** Must be custom-styled, large (min `h-6 w-6`), and highly clickable. When `checked === true`, text should become `line-through text-gray-400` and the checkbox should turn `bg-emerald-500`.
3.  **Data Displays (Pricing/Scope):** Render pricing and key metrics in a slightly tinted callout box (`bg-gray-50 border border-gray-100 p-4 rounded-md`) using the monospaced/Space Grotesk font to look technical and concrete.
4.  **Buttons:** Primary buttons must be solid `bg-indigo-600 text-white font-medium px-4 py-2 rounded-md`.

**Interaction Patterns:**
*   Implement a React state array for `tasks` [{id, title, completed, owner}].
*   Clicking a task must instantly update the Progress Bar state.
*   When all tasks are complete, the bottom "Sign Off" button transitions from `disabled` (opacity-50, cursor-not-allowed) to active.

**Accessibility & Mobile:**
*   All interactive elements must have `focus:ring-2 focus:ring-indigo-500 focus:outline-none`.
*   Ensure the layout stacks perfectly on mobile without horizontal scrolling.

Generate the React components strictly adhering to this Tailwind design system.