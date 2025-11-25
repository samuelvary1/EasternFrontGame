// Air defense system - models air defense effectiveness

export function updateAirDefense(regions, brigades) {
  const updatedRegions = regions.map(region => {
    let totalAirDefense = region.airDefenseLevel || 50;
    
    // Add bonuses from brigades in region
    const localBrigades = brigades.filter(b => b.location === region.id);
    const airDefenseBonus = localBrigades.reduce((sum, b) => sum + (b.airDefenseBonus || 0), 0);
    
    totalAirDefense = Math.min(100, totalAirDefense + airDefenseBonus);
    
    return {
      ...region,
      effectiveAirDefense: totalAirDefense,
    };
  });
  
  return updatedRegions;
}

export function checkAirStrikeSuccess(region, targetType = 'ground') {
  const airDefense = region.effectiveAirDefense || region.airDefenseLevel || 50;
  
  // Higher air defense = lower success chance
  const baseSuccessChance = 0.7;
  const airDefenseModifier = (100 - airDefense) / 100;
  
  const successChance = baseSuccessChance * airDefenseModifier;
  
  return Math.random() < successChance;
}

export function processDroneLoss(brigade, region, weather) {
  if (brigade.droneCount <= 0) return brigade;
  
  const airDefense = region.effectiveAirDefense || region.airDefenseLevel || 50;
  
  // Calculate drone loss chance
  let lossChance = airDefense / 200; // Base 0-50% depending on air defense
  
  // Weather affects drones
  const weatherModifiers = {
    clear: 0,
    rain: 0.1,
    heavy_rain: 0.2,
    mud: 0.05,
    snow: 0.15,
  };
  
  lossChance += weatherModifiers[weather] || 0;
  
  // EW increases loss chance
  if (region.electronicWarfareActive) {
    lossChance += 0.15;
  }
  
  let dronesLost = 0;
  for (let i = 0; i < brigade.droneCount; i++) {
    if (Math.random() < lossChance) {
      dronesLost++;
    }
  }
  
  return {
    ...brigade,
    droneCount: Math.max(0, brigade.droneCount - dronesLost),
  };
}

export function applyAirDefenseToEvent(event, region) {
  const airDefense = region.effectiveAirDefense || region.airDefenseLevel || 50;
  
  // High air defense reduces enemy air event effectiveness
  if (event.effectType === 'combatDebuff' && airDefense > 70) {
    return {
      ...event,
      effectValue: Math.floor(event.effectValue * 0.5),
    };
  }
  
  return event;
}
