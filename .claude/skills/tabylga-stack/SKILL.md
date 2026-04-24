# Tabylga Stack Skill

Activate when writing any code for the Tabylga mobile app.

## Stack constraints
- Expo SDK 52+ with TypeScript strict mode
- Expo Router for navigation (file-based in /app)
- NativeWind for styling — className syntax, no StyleSheet, no inline styles
- Zustand for global state
- Supabase for all backend (auth, database, storage, edge functions)
- React Hook Form for forms
- Lucide React Native for icons
- expo-image for images (never default Image)
- tweetnacl for Ed25519 offline payment signing

## Folder rules
- /app — screens via Expo Router
- /components/ui — primitive design components (Button, Input, Card, Badge, StarRating, Chip, Avatar)
- /components — composed feature components
- /lib — Supabase client, API wrappers, crypto utils
- /hooks — custom React hooks
- /constants — tokens extracted from design system (colors, typography, spacing, shadows)
- /stores — Zustand stores

## Hard rules
- Never invent colors, spacing, or radii outside /constants — tokens are law
- Every screen uses SafeAreaView from react-native-safe-area-context
- Every screen handles loading, empty, and error states explicitly
- All async operations wrapped in try/catch with user-facing error handling
- Accessibility labels on interactive elements
- No class components
- No hardcoded user-facing strings — use a strings constant even without full i18n
- Ask before installing any package
