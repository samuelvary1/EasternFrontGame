// Weather configuration and modifiers

export const weatherTypes = {
  clear: {
    name: 'Clear',
    movementPenalty: 0,
    dronePenalty: 0,
    supplyPenalty: 0,
    combatPenalty: 0,
  },
  rain: {
    name: 'Rain',
    movementPenalty: 10,
    dronePenalty: 15,
    supplyPenalty: 5,
    combatPenalty: 5,
  },
  heavy_rain: {
    name: 'Heavy Rain',
    movementPenalty: 25,
    dronePenalty: 40,
    supplyPenalty: 15,
    combatPenalty: 15,
  },
  mud: {
    name: 'Mud',
    movementPenalty: 40,
    dronePenalty: 20,
    supplyPenalty: 25,
    combatPenalty: 20,
  },
  snow: {
    name: 'Snow',
    movementPenalty: 15,
    dronePenalty: 25,
    supplyPenalty: 10,
    combatPenalty: 10,
  },
};

// Weather probability table (simplified)
export const weatherProbabilities = {
  clear: 0.3,
  rain: 0.25,
  heavy_rain: 0.15,
  mud: 0.2,
  snow: 0.1,
};
