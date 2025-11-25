# Eastern Front - Mobile Wargame

A turn-based operational wargame simulating the 2022 Ukraine conflict for iOS and Android.

## Features

- **Two Playable Factions**: Ukraine (defensive) or Russia (offensive)
- **Three Difficulty Levels**: Recruit, Veteran, Elite
- **Asymmetric Gameplay**: Different victory conditions for each side
- **Combined Arms Warfare**: Infantry, armor, drones, artillery, air defense
- **Supply & Logistics**: Realistic supply chain simulation
- **Weather System**: 5 weather types affecting operations
- **AI Opponent**: Adaptive enemy AI
- **Save/Load**: Persistent game state

## Game Overview

### Ukrainian Campaign (Defensive)
- **Objective**: Hold Kyiv and Western Supply Route for 20 turns
- **Forces**: 3 brigades defending key positions
- **Strategy**: Defend in depth, protect supply lines, outlast the enemy

### Russian Campaign (Offensive)
- **Objective**: Capture Kyiv before Turn 20
- **Forces**: 3 divisions attacking from Belarus
- **Strategy**: Quick offensive, cut supply routes, capture capital

## Technical Stack

- **Framework**: React Native 0.82.1
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **Graphics**: react-native-svg
- **Platform**: iOS & Android

## Getting Started

### Prerequisites
- Node.js 18+
- Xcode 14+ (for iOS)
- Android Studio (for Android)
- CocoaPods

### Installation

```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```

## Project Structure

```
src/
├── data/           # Initial game data (brigades, regions)
├── engine/         # Core game systems (combat, supply, AI)
├── components/     # Reusable UI components
├── screens/        # Game screens (menu, campaign, map)
├── storage/        # Save/load functionality
└── config/         # Game configuration (difficulty)
```

## Game Systems

### Combat Resolution
- Power calculation based on unit type, morale, supply
- Terrain modifiers (urban, forest, rural, highway)
- Weather effects on operations
- Experience-based combat effectiveness

### Supply System
- Regional supply rates
- Weather penalties
- Control bonuses/penalties
- Isolation effects
- Enemy pressure impact

### AI System
- Faction-aware decision making
- Difficulty-based behavior
- Attack/defend decisions
- Reinforcement logic

### Victory Conditions
**Ukraine**: Survive 20 turns while holding Kyiv + Supply Route
**Russia**: Capture Kyiv before Turn 20

## Development

Built with React Native for cross-platform mobile deployment.

## License

MIT
