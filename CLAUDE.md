# Tabylga — Claude Code Context

Read `docs/PROJECT.md` in full before answering any question or writing any code. That document is the single source of truth for this project. This file only contains operational rules.

## Stack (non-negotiable)
- Expo SDK 52+ with TypeScript (strict mode)
- Expo Router for navigation (file-based, in `/app`)
- NativeWind for styling (Tailwind className syntax, no inline styles)
- Zustand for global state (no Redux, no Context spaghetti)
- Supabase for backend (auth + database + storage + edge functions)
- React Hook Form for all forms
- Lucide React Native for icons
- expo-image instead of default Image
- tweetnacl for offline payment signing

## Folder conventions
- `/app` — screens and layouts via Expo Router
- `/components/ui` — primitive design system components (Button, Input, Card, Badge, etc.)
- `/components` — composed feature components
- `/lib` — Supabase client, API wrappers, crypto utils
- `/hooks` — custom React hooks
- `/constants` — color, typography, spacing tokens extracted from the design system
- `/stores` — Zustand stores

## Design source of truth
Design is imported from a Claude Design handoff. When I paste a design fetch command, read the design file first, extract tokens (colors, typography, spacing, shadows, radii) into `/constants`, then build components and screens that strictly follow those tokens. Never invent new colors or spacing values — if a value is missing, ask.

## Rules for every screen
1. Wrap in `SafeAreaView` from `react-native-safe-area-context` with correct edges.
2. Implement loading, empty, and error states — not just the happy path.
3. All async operations in try/catch with user-facing error handling.
4. No hardcoded strings for anything that could be translated later — use a central strings object even if we don't wire i18n yet.
5. Accessibility labels on all interactive elements.

## Rules for working with me
- When I ask you to build something, stop after each logical unit and show me what changed before continuing. Do not build 10 screens in one turn.
- If you're about to make an architectural decision that isn't written in `docs/PROJECT.md` or this file, ask me first.
- If you disagree with a decision I've already made, say so once, then follow the decision.
- Never install a package I didn't approve. List what you want to add and wait for confirmation.
- Use ripgrep (`rg`) not `grep`, use `fd` not `find` when searching the codebase.

## What not to do
- Do not create new backend servers — use Supabase Edge Functions only.
- Do not use `localStorage`, `sessionStorage`, `window.*` — this is React Native, not web.
- Do not use class components.
- Do not reach for styled-components, emotion, or StyleSheet.create — NativeWind classes only.
- Do not write placeholder comments like "// implement later" — either build it or leave a clear TODO with context.
- Do not run `npm install` without confirming the package list with me first.
