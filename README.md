# DayToday

DayToday is your personal day manager — a pocket companion that helps you plan tasks, follow routines, stay productive, and track your daily life effortlessly.

## Project Overview
This is an Android/iOS application built with **React Native** and **Expo**. It focuses on helping users manage their daily routines and tasks efficiently.

## Features
- **Routine Management**: Create and follow daily habits.
- **Task Tracking**: Organize your to-dos.
- **Widgets**: Android home screen widgets for quick updates (requires native implementation).
- **Offline First**: All data is stored locally.

## Tech Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **State Management**: Zustand + AsyncStorage
- **Navigation**: React Navigation
- **Styling**: Standard StyleSheet with Theme System

## Getting Started

### Prerequisites
- Node.js
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the Expo development server:
```bash
npx expo start
```
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

## Native Widgets
This project is currently in the **Expo Managed Workflow**. To implement Home Screen Widgets, you must "eject" or use Expo Prebuild to add native code.

**See [WIDGET_GUIDE.md](./WIDGET_GUIDE.md) for detailed instructions on how to implement native widgets for iOS and Android.**

## Testing
Run unit tests:
```bash
npm test
```

## Project Structure
- `src/components`: Reusable UI components
- `src/screens`: Application screens
- `src/navigation`: Navigation configuration
- `src/store`: State management (Zustand)
- `src/services`: Background services (Notifications)
- `src/theme`: Design tokens
