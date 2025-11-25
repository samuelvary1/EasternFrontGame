// Difficulty settings for the game

export const DIFFICULTY_LEVELS = {
  EASY: {
    id: 'EASY',
    name: 'Recruit',
    description: 'Recommended for first-time players. Weaker enemy forces, better supply.',
    enemyStrengthModifier: 0.7,
    playerSupplyModifier: 1.3,
    enemyActivityModifier: 0.6,
    eventFrequencyModifier: 0.5,
    playerDroneRegen: 2,
    enemyDroneRegen: 1,
    startingDrones: 6,
  },
  NORMAL: {
    id: 'NORMAL',
    name: 'Veteran',
    description: 'Balanced gameplay. Realistic enemy strength and supply conditions.',
    enemyStrengthModifier: 1.0,
    playerSupplyModifier: 1.0,
    enemyActivityModifier: 0.8,
    eventFrequencyModifier: 1.0,
    playerDroneRegen: 1,
    enemyDroneRegen: 1,
    startingDrones: 4,
  },
  HARD: {
    id: 'HARD',
    name: 'Elite',
    description: 'For experienced commanders. Strong enemy forces, challenging logistics.',
    enemyStrengthModifier: 1.3,
    playerSupplyModifier: 0.8,
    enemyActivityModifier: 1.0,
    eventFrequencyModifier: 1.5,
    playerDroneRegen: 1,
    enemyDroneRegen: 2,
    startingDrones: 3,
  },
};

export const DEFAULT_DIFFICULTY = DIFFICULTY_LEVELS.NORMAL;
