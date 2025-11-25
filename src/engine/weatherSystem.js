// Weather system - rolls and applies weather each turn

import { weatherTypes, weatherProbabilities } from '../data/weatherConfig';

export function rollWeather() {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [weatherKey, probability] of Object.entries(weatherProbabilities)) {
    cumulative += probability;
    if (roll <= cumulative) {
      return weatherKey;
    }
  }
  
  return 'clear';
}

export function getWeatherModifiers(weatherKey) {
  return weatherTypes[weatherKey] || weatherTypes.clear;
}

export function applyWeatherToMovement(baseMovement, weatherKey) {
  const modifiers = getWeatherModifiers(weatherKey);
  return Math.max(0, baseMovement - modifiers.movementPenalty);
}

export function applyWeatherToDrones(baseDroneEffectiveness, weatherKey) {
  const modifiers = getWeatherModifiers(weatherKey);
  return Math.max(0, baseDroneEffectiveness - modifiers.dronePenalty);
}

export function applyWeatherToSupply(baseSupply, weatherKey) {
  const modifiers = getWeatherModifiers(weatherKey);
  return Math.max(0, baseSupply - modifiers.supplyPenalty);
}

export function applyWeatherToCombat(baseCombatPower, weatherKey) {
  const modifiers = getWeatherModifiers(weatherKey);
  return Math.max(0, baseCombatPower - modifiers.combatPenalty);
}
