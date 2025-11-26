// Combat resolver - resolves battles between player and enemy forces

import { applySupplyToCombat } from './supplySystem';
import { applyWeatherToCombat } from './weatherSystem';

export function resolveCombat(attackingBrigade, defendingRegion, weather, log) {
  const messages = [];
  
  // Calculate attacker power
  let attackerPower = calculateBrigadePower(attackingBrigade);
  attackerPower = applySupplyToCombat(attackerPower, attackingBrigade.supply);
  attackerPower = applyWeatherToCombat(attackerPower, weather);
  
  // Apply stance modifiers
  const stanceModifier = getStanceModifier(attackingBrigade.stance, 'attack');
  attackerPower *= stanceModifier;
  
  // Calculate defender power (enemy)
  let defenderPower = defendingRegion.enemyStrengthEstimate;
  
  // Terrain defense bonus
  const terrainBonus = getTerrainDefenseBonus(defendingRegion.terrain);
  defenderPower *= terrainBonus;
  
  // Combat resolution
  const powerRatio = attackerPower / Math.max(1, defenderPower);
  
  // Add combat details
  messages.push(`\n=== COMBAT: ${attackingBrigade.name} attacks ${defendingRegion.name} ===`);
  messages.push(`Attacker Power: ${Math.round(attackerPower)} (Strength ${attackingBrigade.strength}, Supply ${attackingBrigade.supply}%)`);
  messages.push(`Defender Power: ${Math.round(defenderPower)} (Enemy Strength ${defendingRegion.enemyStrengthEstimate}, Terrain: ${defendingRegion.terrain})`);
  messages.push(`Combat Ratio: ${powerRatio.toFixed(2)}:1`);
  
  let outcome;
  let attackerLosses;
  let defenderLosses;
  let moraleChange;
  let controlChange = false;
  
  if (powerRatio > 1.8) {
    // Decisive victory
    outcome = 'decisive_victory';
    attackerLosses = Math.floor(5 + Math.random() * 10);
    defenderLosses = Math.floor(30 + Math.random() * 20);
    moraleChange = 10;
    controlChange = true;
    messages.push(`DECISIVE VICTORY! ${attackingBrigade.name} overwhelms the defenders!`);
  } else if (powerRatio > 1.3) {
    // Victory
    outcome = 'victory';
    attackerLosses = Math.floor(10 + Math.random() * 15);
    defenderLosses = Math.floor(20 + Math.random() * 15);
    moraleChange = 5;
    controlChange = true;
    messages.push(`VICTORY! ${attackingBrigade.name} captures ${defendingRegion.name} after heavy fighting.`);
  } else if (powerRatio > 0.9) {
    // Stalemate
    outcome = 'stalemate';
    attackerLosses = Math.floor(15 + Math.random() * 15);
    defenderLosses = Math.floor(15 + Math.random() * 15);
    moraleChange = -2;
    messages.push(`STALEMATE: Fierce fighting with no clear victor at ${defendingRegion.name}.`);
  } else if (powerRatio > 0.6) {
    // Setback
    outcome = 'setback';
    attackerLosses = Math.floor(20 + Math.random() * 15);
    defenderLosses = Math.floor(10 + Math.random() * 10);
    moraleChange = -5;
    messages.push(`SETBACK: ${attackingBrigade.name} forced to withdraw from ${defendingRegion.name}.`);
  } else {
    // Defeat
    outcome = 'defeat';
    attackerLosses = Math.floor(25 + Math.random() * 20);
    defenderLosses = Math.floor(5 + Math.random() * 10);
    moraleChange = -10;
    messages.push(`DEFEAT: ${attackingBrigade.name} suffers heavy casualties and retreats!`);
  }
  
  // Add casualty report
  messages.push(`Casualties: Your forces -${attackerLosses}, Enemy -${defenderLosses}`);
  messages.push(`Morale change: ${moraleChange > 0 ? '+' : ''}${moraleChange}`);
  if (controlChange) {
    messages.push(`${defendingRegion.name} is now under your control!`);
  }
  
  // Apply losses
  const updatedBrigade = {
    ...attackingBrigade,
    strength: Math.max(0, attackingBrigade.strength - attackerLosses),
    morale: Math.max(0, Math.min(100, attackingBrigade.morale + moraleChange)),
    experience: Math.min(100, attackingBrigade.experience + 2),
  };
  
  const updatedRegion = {
    ...defendingRegion,
    enemyStrengthEstimate: Math.max(0, defendingRegion.enemyStrengthEstimate - defenderLosses),
    control: controlChange ? 'ukraine' : defendingRegion.control,
  };
  
  return {
    brigade: updatedBrigade,
    region: updatedRegion,
    outcome,
    messages,
  };
}

function calculateBrigadePower(brigade) {
  // Base power from strength
  let power = brigade.strength;
  
  // Morale multiplier
  const moraleMultiplier = 0.5 + (brigade.morale / 100) * 0.5;
  power *= moraleMultiplier;
  
  // Experience bonus
  const experienceBonus = 1 + (brigade.experience / 200);
  power *= experienceBonus;
  
  // Type bonuses
  const typeMultipliers = {
    mechanized: 1.2,
    armor: 1.3,
    airmobile: 1.1,
    'territorial defense': 0.9,
    artillery: 0.8,
  };
  power *= typeMultipliers[brigade.type] || 1.0;
  
  return power;
}

function getStanceModifier(stance, action) {
  const modifiers = {
    hold: { attack: 0.7, defense: 1.3 },
    'mobile defense': { attack: 0.9, defense: 1.1 },
    counterattack: { attack: 1.3, defense: 0.8 },
    fallback: { attack: 0.5, defense: 0.9 },
  };
  
  return modifiers[stance]?.[action] || 1.0;
}

function getTerrainDefenseBonus(terrain) {
  const bonuses = {
    urban: 1.5,
    forest: 1.3,
    rural: 1.0,
    highway: 0.9,
    'river crossing': 1.4,
  };
  
  return bonuses[terrain] || 1.0;
}

export function resolveDefensiveBattle(defendingBrigade, attackingRegion, weather) {
  const messages = [];
  
  let defenderPower = calculateBrigadePower(defendingBrigade);
  defenderPower = applySupplyToCombat(defenderPower, defendingBrigade.supply);
  
  const stanceModifier = getStanceModifier(defendingBrigade.stance, 'defense');
  defenderPower *= stanceModifier;
  
  let attackerPower = attackingRegion.enemyStrengthEstimate;
  attackerPower = applyWeatherToCombat(attackerPower, weather);
  
  const powerRatio = defenderPower / Math.max(1, attackerPower);
  
  messages.push(`\n=== DEFENSE: ${defendingBrigade.name} under attack at ${attackingRegion.name} ===`);
  messages.push(`Defender Power: ${Math.round(defenderPower)} (Stance: ${defendingBrigade.stance})`);
  messages.push(`Attacker Power: ${Math.round(attackerPower)} (Enemy: ${attackingRegion.enemyStrengthEstimate})`);
  messages.push(`Defense Ratio: ${powerRatio.toFixed(2)}:1`);
  
  let defenderLosses;
  let attackerLosses;
  let moraleChange;
  
  if (powerRatio > 1.5) {
    defenderLosses = Math.floor(5 + Math.random() * 8);
    attackerLosses = Math.floor(25 + Math.random() * 20);
    moraleChange = 8;
    messages.push(`STRONG DEFENSE! Enemy attack shattered with minimal losses.`);
  } else if (powerRatio > 1.0) {
    defenderLosses = Math.floor(10 + Math.random() * 12);
    attackerLosses = Math.floor(15 + Math.random() * 15);
    moraleChange = 3;
    messages.push(`POSITION HELD: Enemy attack repulsed despite heavy pressure.`);
  } else if (powerRatio > 0.7) {
    defenderLosses = Math.floor(15 + Math.random() * 15);
    attackerLosses = Math.floor(10 + Math.random() * 10);
    moraleChange = -3;
    messages.push(`HARD FOUGHT: Significant casualties but position maintained.`);
  } else {
    defenderLosses = Math.floor(20 + Math.random() * 20);
    attackerLosses = Math.floor(8 + Math.random() * 8);
    moraleChange = -8;
    messages.push(`HEAVY LOSSES: Brigade badly mauled but holds position.`);
  }
  
  messages.push(`Casualties: Your forces -${defenderLosses}, Enemy -${attackerLosses}`);
  messages.push(`Morale change: ${moraleChange > 0 ? '+' : ''}${moraleChange}`);
  
  return {
    brigade: {
      ...defendingBrigade,
      strength: Math.max(0, defendingBrigade.strength - defenderLosses),
      morale: Math.max(0, Math.min(100, defendingBrigade.morale + moraleChange)),
      experience: Math.min(100, defendingBrigade.experience + 1),
    },
    region: {
      ...attackingRegion,
      enemyStrengthEstimate: Math.max(0, attackingRegion.enemyStrengthEstimate - attackerLosses),
    },
    messages,
  };
}
