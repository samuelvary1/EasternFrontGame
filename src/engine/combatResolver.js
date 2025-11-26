// Combat resolver - resolves battles between player and enemy forces

import { applySupplyToCombat } from './supplySystem';
import { applyWeatherToCombat } from './weatherSystem';

// Risk-style dice rolling system
function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollDice(count) {
  const dice = [];
  for (let i = 0; i < count; i++) {
    dice.push(rollDie());
  }
  return dice.sort((a, b) => b - a); // Sort descending
}

function calculateDiceCount(power, isAttacker) {
  // Attackers get 1-3 dice, defenders get 1-2 dice (like Risk)
  // Based on power level
  if (isAttacker) {
    if (power >= 80) return 3;
    if (power >= 40) return 2;
    return 1;
  } else {
    if (power >= 60) return 2;
    return 1;
  }
}

function resolveDiceRolls(attackerDice, defenderDice) {
  let attackerWins = 0;
  let defenderWins = 0;
  const comparisons = [];
  
  // Compare highest dice first
  const compareCount = Math.min(attackerDice.length, defenderDice.length);
  
  for (let i = 0; i < compareCount; i++) {
    if (attackerDice[i] > defenderDice[i]) {
      attackerWins++;
      comparisons.push({ attacker: attackerDice[i], defender: defenderDice[i], winner: 'attacker' });
    } else {
      // Defender wins ties
      defenderWins++;
      comparisons.push({ attacker: attackerDice[i], defender: defenderDice[i], winner: 'defender' });
    }
  }
  
  return { attackerWins, defenderWins, comparisons };
}

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
  
  // Add combat details
  messages.push(`[COMBAT_START]${attackingBrigade.name}|${defendingRegion.name}[/COMBAT_START]`);
  messages.push(`[ATTACKER_BRIGADE]${attackingBrigade.name}|${attackingBrigade.type}|${attackingBrigade.strength}|${attackingBrigade.morale}[/ATTACKER_BRIGADE]`);
  messages.push(`[DEFENDER_INFO]${defendingRegion.name}|${defendingRegion.enemyStrengthEstimate}|${defendingRegion.terrain}[/DEFENDER_INFO]`);
  messages.push(`\n=== COMBAT: ${attackingBrigade.name} attacks ${defendingRegion.name} ===`);
  messages.push(`Attacker Power: ${Math.round(attackerPower)} (Strength ${attackingBrigade.strength}, Supply ${attackingBrigade.supply}%)`);
  messages.push(`Defender Power: ${Math.round(defenderPower)} (Enemy Strength ${defendingRegion.enemyStrengthEstimate}, Terrain: ${defendingRegion.terrain})`);
  
  // Dice rolling phase
  const attackerDiceCount = calculateDiceCount(attackerPower, true);
  const defenderDiceCount = calculateDiceCount(defenderPower, false);
  
  const attackerDice = rollDice(attackerDiceCount);
  const defenderDice = rollDice(defenderDiceCount);
  
  messages.push(`Attacker rolls ${attackerDiceCount} dice: [${attackerDice.join(', ')}]`);
  messages.push(`Defender rolls ${defenderDiceCount} dice: [${defenderDice.join(', ')}]`);
  
  const diceResult = resolveDiceRolls(attackerDice, defenderDice);
  
  // Show dice comparisons
  diceResult.comparisons.forEach((comp, i) => {
    const winner = comp.winner === 'attacker' ? 'Attacker' : 'Defender';
    messages.push(`  Roll ${i + 1}: ${comp.attacker} vs ${comp.defender} → ${winner} wins`);
  });
  
  messages.push(`Dice result: Attacker ${diceResult.attackerWins} wins, Defender ${diceResult.defenderWins} wins`);
  
  // Determine outcome based on dice results AND power ratio
  const powerRatio = attackerPower / Math.max(1, defenderPower);
  messages.push(`Combat Ratio: ${powerRatio.toFixed(2)}:1`);
  
  let outcome;
  let attackerLosses;
  let defenderLosses;
  let moraleChange;
  let controlChange = false;
  let outcomeDescription = '';
  
  // Base losses on dice wins
  const baseLossPerDie = 10;
  attackerLosses = diceResult.defenderWins * baseLossPerDie + Math.floor(Math.random() * 8);
  defenderLosses = diceResult.attackerWins * baseLossPerDie + Math.floor(Math.random() * 8);
  
  // Determine outcome based on combined dice + power ratio
  const netDiceAdvantage = diceResult.attackerWins - diceResult.defenderWins;
  
  if (netDiceAdvantage >= 2 && powerRatio > 1.3) {
    // Decisive victory - dominating dice and power
    outcome = 'decisive_victory';
    outcomeDescription = 'DECISIVE VICTORY';
    defenderLosses += 20;
    moraleChange = 10;
    controlChange = true;
    messages.push(`DECISIVE VICTORY! ${attackingBrigade.name} overwhelms the defenders!`);
  } else if ((netDiceAdvantage >= 1 && powerRatio > 1.0) || powerRatio > 1.6) {
    // Victory - good dice or strong power advantage
    outcome = 'victory';
    outcomeDescription = 'VICTORY';
    defenderLosses += 10;
    moraleChange = 5;
    controlChange = true;
    messages.push(`VICTORY! ${attackingBrigade.name} captures ${defendingRegion.name} after heavy fighting.`);
  } else if (netDiceAdvantage === 0 || (powerRatio > 0.8 && powerRatio < 1.2)) {
    // Stalemate - even dice or even power
    outcome = 'stalemate';
    outcomeDescription = 'STALEMATE';
    attackerLosses += 5;
    defenderLosses += 5;
    moraleChange = -2;
    messages.push(`STALEMATE: Fierce fighting with no clear victor at ${defendingRegion.name}.`);
  } else if (netDiceAdvantage === -1 || powerRatio < 0.9) {
    // Setback - lost dice or weak power
    outcome = 'setback';
    outcomeDescription = 'SETBACK';
    attackerLosses += 10;
    moraleChange = -5;
    messages.push(`SETBACK: ${attackingBrigade.name} forced to withdraw from ${defendingRegion.name}.`);
  } else {
    // Defeat - badly lost dice
    outcome = 'defeat';
    outcomeDescription = 'DEFEAT';
    attackerLosses += 15;
    moraleChange = -10;
    messages.push(`DEFEAT: ${attackingBrigade.name} suffers heavy casualties and retreats!`);
  }
  
  // Add casualty report
  messages.push(`Casualties: Your forces -${attackerLosses}, Enemy -${defenderLosses}`);
  messages.push(`Morale change: ${moraleChange > 0 ? '+' : ''}${moraleChange}`);
  messages.push(`[COMBAT_RESULTS]${attackingBrigade.name}|${attackerLosses}|${moraleChange}|${defendingRegion.name}|${defenderLosses}[/COMBAT_RESULTS]`);
  if (controlChange) {
    messages.push(`${defendingRegion.name} is now under your control!`);
  }
  messages.push(`[COMBAT_END]${outcomeDescription}[/COMBAT_END]`);
  
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
  
  messages.push(`\n=== DEFENSE: ${defendingBrigade.name} under attack ===`);
  messages.push(`Defender Power: ${Math.round(defenderPower)} (Stance: ${defendingBrigade.stance})`);
  messages.push(`Attacker Power: ${Math.round(attackerPower)} (Enemy: ${attackingRegion.enemyStrengthEstimate})`);
  
  // Dice rolling for defense
  const defenderDiceCount = calculateDiceCount(defenderPower, false);
  const attackerDiceCount = calculateDiceCount(attackerPower, true);
  
  const defenderDice = rollDice(defenderDiceCount);
  const attackerDice = rollDice(attackerDiceCount);
  
  messages.push(`Defender rolls ${defenderDiceCount} dice: [${defenderDice.join(', ')}]`);
  messages.push(`Attacker rolls ${attackerDiceCount} dice: [${attackerDice.join(', ')}]`);
  
  const diceResult = resolveDiceRolls(attackerDice, defenderDice);
  
  // Show dice comparisons
  diceResult.comparisons.forEach((comp, i) => {
    const winner = comp.winner === 'attacker' ? 'Attacker' : 'Defender';
    messages.push(`  Roll ${i + 1}: ${comp.attacker} vs ${comp.defender} → ${winner} wins`);
  });
  
  messages.push(`Dice result: Attacker ${diceResult.attackerWins} wins, Defender ${diceResult.defenderWins} wins`);
  messages.push(`Defense Ratio: ${powerRatio.toFixed(2)}:1`);
  
  let defenderLosses;
  let attackerLosses;
  let moraleChange;
  
  // Base losses on dice
  const baseLossPerDie = 8;
  defenderLosses = diceResult.attackerWins * baseLossPerDie + Math.floor(Math.random() * 6);
  attackerLosses = diceResult.defenderWins * baseLossPerDie + Math.floor(Math.random() * 6);
  
  // Determine outcome
  const netDefenseAdvantage = diceResult.defenderWins - diceResult.attackerWins;
  
  if (netDefenseAdvantage >= 2 || (netDefenseAdvantage >= 1 && powerRatio > 1.3)) {
    attackerLosses += 15;
    moraleChange = 8;
    messages.push(`STRONG DEFENSE! Enemy attack shattered with minimal losses.`);
  } else if (netDefenseAdvantage >= 1 || powerRatio > 1.0) {
    attackerLosses += 8;
    moraleChange = 3;
    messages.push(`POSITION HELD: Enemy attack repulsed despite heavy pressure.`);
  } else if (netDefenseAdvantage === 0) {
    defenderLosses += 5;
    moraleChange = -3;
    messages.push(`HARD FOUGHT: Significant casualties but position maintained.`);
  } else {
    defenderLosses += 10;
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
