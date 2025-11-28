# GitHub Copilot Instructions for Eastern Front Game

## Project Overview
Eastern Front is a React Native mobile wargame simulating the 2022 Ukraine conflict. It features turn-based operational gameplay with asymmetric factions, supply logistics, weather systems, and AI opponents.

## Architecture

### Core Game Loop
The game uses a centralized state management pattern via React Context ([`src/engine/gameEngine.js`](src/engine/gameEngine.js)):
- `GameEngineProvider` wraps the entire app and manages global game state
- `useGameEngine()` hook provides access to game state and actions
- Turn resolution happens in `endTurn()` which orchestrates: orders → combat → supply → AI → events
- **CRITICAL**: Always deep copy `brigades` and `regions` at the start of `endTurn()` to avoid state mutation

### Key Systems
1. **Combat Resolution** ([`src/engine/combatResolver.js`](src/engine/combatResolver.js)): Card-based dice system with terrain/stance/weather modifiers
2. **Supply System** ([`src/engine/supplySystem.js`](src/engine/supplySystem.js)): Regional supply calculation affecting morale/strength
3. **AI System** ([`src/engine/aiSystem.js`](src/engine/aiSystem.js)): Faction-aware decisions (attack/defend/reinforce) based on difficulty
4. **Weather System** ([`src/engine/weatherSystem.js`](src/engine/weatherSystem.js)): 5 weather types with movement/combat/supply penalties

### Data Flow
```
User Issues Orders → gameState.orders array → endTurn() → 
  → Apply player orders → Resolve combat → Update supply → 
  → AI computes actions → Apply AI actions → Trigger events → 
  → Update turn counter → Auto-save
```

### Turn Summary Screen Pattern
The Turn Summary Screen shows only the **current turn's events**, not historical logs:
- Extract events from `Turn X Resolution` marker to end of log
- Filter out guidance messages and turn headers
- Track which combat animations have played using `gameState.lastViewedTurnSummary`
- Hide combat results until animations complete using `completedCombats` Set
- Events shown in chronological order (not sorted by priority)

## Development Patterns

### Faction-Aware Design
The game supports both Ukrainian (defensive) and Russian (offensive) campaigns. Always check `gameState.playerFaction` and handle both paths:
```javascript
const unitType = gameState.playerFaction === 'ukraine' ? 'Brigades' : 'Divisions';
const factionEmoji = gameState.playerFaction === 'ukraine' ? '🇺🇦' : '🇷🇺';
```

### Translation System
All user-facing text uses [`src/config/translations.js`](src/config/translations.js):
```javascript
const { t } = useLanguage();
<Text>{t('missionControl.title')}</Text>
```
Keys follow dot notation: `category.subkey` (e.g., `brigades.strength`, `map.title`)

### Playing Card System
Units are associated with playing card SVG images ([`src/components/PlayingCard.js`](src/components/PlayingCard.js)). Cards use Unicode emoji notation (e.g., `🂡` for Ace of Spades) in brigade data and map to SVG files in [`assets/cards/`](assets/cards/).

### Navigation Structure
Stack navigation with persistent game state ([`App.js`](App.js)):
- `MainMenu` → `Campaign` (Mission Control) → Detail screens
- `headerLeft: () => null` prevents back navigation on critical screens
- Use `navigation.navigate()` for forward nav, `navigation.goBack()` for back

## Critical Workflows

### State Immutability
**ALWAYS** deep copy arrays/objects when modifying game state in `endTurn()`:
```javascript
let brigades = JSON.parse(JSON.stringify(prev.brigades));
let regions = JSON.parse(JSON.stringify(prev.regions));
```
Never destructure with `let { brigades, regions } = prev` - this creates shallow references that mutate previous state.

### Adding New Regions
1. Add region to [`src/data/initialRegions.js`](src/data/initialRegions.js) or [`src/data/initialRegionsRussian.js`](src/data/initialRegionsRussian.js)
2. Update adjacency arrays bidirectionally
3. Add position to [`src/screens/MapScreen.js`](src/screens/MapScreen.js) `regionPositions` object
4. For 3D map: add to [`src/components/ThreeDMap.js`](src/components/ThreeDMap.js) `regionCoords`

### Combat Log Markers
Combat events use tagged markers for parsing:
- `[COMBAT_START]AttackerName|DefenderName[/COMBAT_START]`
- `[ATTACKER_BRIGADE]name|type|strength|morale[/ATTACKER_BRIGADE]`
- `[DEFENDER_INFO]name|strength|terrain[/DEFENDER_INFO]`
- `[COMBAT_RESULTS]attacker|losses|morale|defender|losses[/COMBAT_RESULTS]`
- `[COMBAT_END]outcome[/COMBAT_END]`

These markers are parsed by `TurnSummaryScreen.js` to extract battle data for animations.

### Adding Combat Animations
Combat uses WebView-based HTML5 canvas animations:
- Battle animations: [`src/components/BattleAnimation.js`](src/components/BattleAnimation.js)
- Dice animations: [`src/components/ThreeDDiceRoll.js`](src/components/ThreeDDiceRoll.js)
- HTML/JS is embedded as template literals with Three.js CDN imports

### Event System
Random events ([`src/data/eventsCatalog.js`](src/data/eventsCatalog.js)) trigger during turn resolution:
- Categorized by faction: `ukrainianEvents`, `russianEvents`, `neutralEvents`
- Each has `trigger` (turnStart/turnEnd), `effectType`, `scope`, and `probability`
- Applied in [`src/engine/eventsSystem.js`](src/engine/eventsSystem.js) via `triggerRandomEvents()`

## Component Patterns

### Screen Template
All screens follow this structure:
```javascript
export default function ScreenName({ navigation }) {
  const { gameState, someAction } = useGameEngine();
  const { t } = useLanguage();
  
  if (!gameState.gameStarted) {
    return <SafeAreaView><Text>No active campaign</Text></SafeAreaView>;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>...</ScrollView>
      <FloatingEndTurnButton />
    </SafeAreaView>
  );
}
```

### Reusable Components
- [`ActionButton`](src/components/ActionButton.js): Primary/secondary/danger variants
- [`BrigadeCard`](src/components/BrigadeCard.js): Displays unit info with PlayingCard
- [`RegionCard`](src/components/RegionCard.js): Territory status display
- [`FloatingEndTurnButton`](src/components/FloatingEndTurnButton.js): Global turn advancement

### Styling Conventions
- Dark theme with color palette: `#111827` (bg), `#1f2937` (cards), `#3b82f6` (primary)
- Use `StyleSheet.create()` at file bottom
- Consistent spacing: 15-20px padding, 8-12px borderRadius

## Build & Test Commands
```bash
# Development
npm start                    # Start Metro bundler
npx react-native run-ios     # Run on iOS simulator
npx react-native run-android # Run on Android emulator

# iOS-specific
cd ios && pod install        # Install CocoaPods dependencies
```

## Key Files Reference
- **Game Engine**: [`src/engine/gameEngine.js`](src/engine/gameEngine.js) - Core state & turn logic
- **Initial Data**: [`src/data/initialBrigades.js`](src/data/initialBrigades.js), [`src/data/initialRegions.js`](src/data/initialRegions.js)
- **Combat**: [`src/engine/combatResolver.js`](src/engine/combatResolver.js) - Dice-based resolution
- **Save/Load**: [`src/storage/saveGame.js`](src/storage/saveGame.js) - AsyncStorage persistence
- **Translations**: [`src/config/translations.js`](src/config/translations.js) - EN/RU text
- **Difficulty**: [`src/config/difficultySettings.js`](src/config/difficultySettings.js) - Balance parameters

## Common Gotchas
- Always deep copy `brigades`/`regions` in `endTurn()` - shallow references cause state mutation bugs
- Update both factions' data files when adding regions/brigades
- Weather modifiers stack multiplicatively - check all affected systems
- AI uses opposite faction logic (`playerFaction === 'ukraine' ? 'russia' : 'ukraine'`)
- Save/load is async - wrap in try/catch and show user feedback
- Playing card mappings are case-sensitive and use specific Unicode ranges
- Turn Summary Screen only shows current turn's events - use turn marker to filter log
- Combat animations track completion via `completedCombats` Set to reveal results progressively
