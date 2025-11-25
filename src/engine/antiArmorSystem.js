// Anti-armor system - models effectiveness of anti-tank weapons

export function checkAntiArmorEngagement(attackingForce, defendingBrigade, region) {
  const messages = [];
  
  if (defendingBrigade.antiArmorRating < 30) {
    return { bonus: 0, enemyLosses: 0, messages };
  }
  
  // Determine if attacking force is mechanized/armor
  const isArmoredAttack = attackingForce.type === 'armor' || attackingForce.type === 'mechanized';
  
  if (!isArmoredAttack) {
    // Anti-armor less effective against infantry
    return { bonus: 5, enemyLosses: 0, messages };
  }
  
  // Calculate anti-armor effectiveness
  const antiArmorRating = defendingBrigade.antiArmorRating;
  const effectivenessModifier = antiArmorRating / 100;
  
  // Terrain affects anti-armor
  const terrainBonus = getTerrainAntiArmorBonus(region.terrain);
  
  const totalEffectiveness = effectivenessModifier * terrainBonus;
  
  // Calculate bonuses
  const defensiveBonus = Math.floor(20 * totalEffectiveness);
  const enemyLosses = Math.floor(15 * totalEffectiveness);
  
  if (defensiveBonus > 10) {
    messages.push(
      `${defendingBrigade.name}'s anti-armor teams inflicted heavy losses on attacking armor.`
    );
  }
  
  return {
    bonus: defensiveBonus,
    enemyLosses,
    messages,
  };
}

function getTerrainAntiArmorBonus(terrain) {
  const bonuses = {
    urban: 1.5,
    forest: 1.3,
    rural: 1.0,
    highway: 0.7,
    'river crossing': 1.2,
  };
  
  return bonuses[terrain] || 1.0;
}

export function applyAntiArmorToOffensive(brigade, enemyArmorPresence) {
  if (!enemyArmorPresence || brigade.antiArmorRating < 40) {
    return { bonus: 0, messages: [] };
  }
  
  const bonus = Math.floor(brigade.antiArmorRating / 5);
  const messages = [
    `${brigade.name} used anti-armor weapons to neutralize enemy armor.`
  ];
  
  return { bonus, messages };
}

export function resupplyAntiArmor(brigade, supplyAvailable) {
  if (supplyAvailable < 40) {
    return brigade;
  }
  
  const resupplyAmount = Math.min(15, 100 - brigade.antiArmorRating);
  
  return {
    ...brigade,
    antiArmorRating: Math.min(100, brigade.antiArmorRating + resupplyAmount),
  };
}

export function degradeAntiArmor(brigade, combatIntensity) {
  // Anti-armor weapons get used up in combat
  const degradation = Math.floor(combatIntensity / 10);
  
  return {
    ...brigade,
    antiArmorRating: Math.max(0, brigade.antiArmorRating - degradation),
  };
}
