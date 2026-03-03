# HealEasy Mobile App

React Native (Expo) mobile client for the HealEasy Cohort Delivery Dashboard.

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- iOS Simulator (macOS) or Android Emulator, or Expo Go app on a physical device
- The Next.js backend running (locally or deployed)

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `EXPO_PUBLIC_API_URL` to your backend URL:
   - **Local dev (physical device):** Use your machine's LAN IP, e.g., `http://192.168.1.100:3000`
   - **Local dev (simulator):** Use `http://localhost:3000`
   - **Production:** Use your deployed URL, e.g., `https://healeasy.yourdomain.com`

3. **Start the Next.js backend** (in the parent directory):
   ```bash
   cd ..
   npm run dev
   ```

## Development

```bash
# Start Expo development server
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android
```

- Press `i` for iOS simulator, `a` for Android emulator
- Scan the QR code with Expo Go app on a physical device

## Project Structure

```
mobile/
├── app/              # Screens (expo-router file-based navigation)
│   ├── (auth)/       # Login screen
│   ├── (tabs)/       # Main app tabs (Dashboard, Progress, Support, Profile)
│   └── day/          # Day detail screen
├── components/       # Reusable UI components
├── services/         # API client and auth service
├── contexts/         # React contexts (AuthContext)
├── constants/        # Theme and config
└── shared.ts         # Barrel re-exports from parent project
```

## Shared Code

The mobile app imports types, constants, and utilities from the parent Next.js project:
- `types/index.ts` — TypeScript interfaces
- `lib/constants.ts` — Program constants (PROGRAM_DAYS, MOOD_EMOJIS, etc.)
- `lib/dates.ts` — Date calculation utilities
- `lib/phone.ts` — Phone number validation

These are imported via `mobile/shared.ts` and resolved by Metro bundler via `metro.config.js`.

## Building for App Stores

### Using EAS Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build for Android (APK/AAB):**
   ```bash
   # Development build
   eas build --platform android --profile development

   # Production build (for Play Store)
   eas build --platform android --profile production
   ```

5. **Build for iOS:**
   ```bash
   # Development build
   eas build --platform ios --profile development

   # Production build (for App Store)
   eas build --platform ios --profile production
   ```

6. **Submit to stores:**
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

### Local Builds (Without EAS)

```bash
# Generate native projects
npx expo prebuild

# Build Android
cd android && ./gradlew assembleRelease

# Build iOS (macOS only)
cd ios && xcodebuild -workspace HealEasy.xcworkspace -scheme HealEasy -configuration Release
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `https://healeasy.yourdomain.com` |

## Auth Architecture

The mobile app uses Bearer token authentication:
- On login, the backend returns a JWT token in the response body
- The token is stored securely using `expo-secure-store`
- All API requests include an `Authorization: Bearer <token>` header
- The backend accepts both cookies (web) and Bearer tokens (mobile)
