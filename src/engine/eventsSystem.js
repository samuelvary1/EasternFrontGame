// Events system - triggers and applies random events

import { ukrainianEvents, russianEvents, neutralEvents } from '../data/eventsCatalog';

export function triggerRandomEvents(trigger, brigades, regions, playerFaction = 'ukraine') {
  // Select appropriate event pool based on player faction
  const playerEvents = playerFaction === 'ukraine' ? ukrainianEvents : russianEvents;
  const enemyEvents = playerFaction === 'ukraine' ? russianEvents : ukrainianEvents;
  
  // Get eligible events from all pools
  const eligiblePlayerEvents = playerEvents.filter(e => e.trigger === trigger);
  const eligibleEnemyEvents = enemyEvents.filter(e => e.trigger === trigger);
  const eligibleNeutralEvents = neutralEvents.filter(e => e.trigger === trigger);
  
  const triggeredEvents = [];
  const messages = [];
  
  let updatedBrigades = [...brigades];
  let updatedRegions = [...regions];
  
  // Process player-favorable events
  eligiblePlayerEvents.forEach(event => {
    if (Math.random() < event.probability) {
      triggeredEvents.push(event);
      messages.push(`[EVENT] ${event.name}: ${event.description}`);
      
      const result = applyEventEffect(event, updatedBrigades, updatedRegions, true);
      updatedBrigades = result.brigades;
      updatedRegions = result.regions;
    }
  });
  
  // Process enemy events (affect player negatively)
  eligibleEnemyEvents.forEach(event => {
    if (Math.random() < event.probability) {
      triggeredEvents.push(event);
      messages.push(`[ENEMY] ${event.name}: ${event.description}`);
      
      const result = applyEventEffect(event, updatedBrigades, updatedRegions, false);
      updatedBrigades = result.brigades;
      updatedRegions = result.regions;
    }
  });
  
  // Process neutral events (affect both sides or environment)
  eligibleNeutralEvents.forEach(event => {
    if (Math.random() < event.probability) {
      triggeredEvents.push(event);
      messages.push(`[EVENT] ${event.name}: ${event.description}`);
      
      const result = applyEventEffect(event, updatedBrigades, updatedRegions, null);
      updatedBrigades = result.brigades;
      updatedRegions = result.regions;
    }
  });
  
  return {
    brigades: updatedBrigades,
    regions: updatedRegions,
    messages,
    events: triggeredEvents,
  };
}

function applyEventEffect(event, brigades, regions, isPlayerEvent) {
  let updatedBrigades = [...brigades];
  let updatedRegions = [...regions];
  
  // For enemy events, invert the effect value for player-affecting events
  // Enemy strengthBoost/moraleChange/supplyChange should weaken player regions instead
  const effectMultiplier = isPlayerEvent === false ? -1 : 1;
  
  switch (event.effectType) {
    case 'moraleChange':
      if (isPlayerEvent !== false) {
        // Only apply to player brigades for player/neutral events
        if (event.scope === 'allBrigades') {
          updatedBrigades = updatedBrigades.map(b => ({
            ...b,
            morale: Math.max(0, Math.min(100, b.morale + (event.effectValue * effectMultiplier))),
          }));
        } else if (event.scope === 'singleBrigade') {
          const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
          randomBrigade.morale = Math.max(0, Math.min(100, randomBrigade.morale + (event.effectValue * effectMultiplier)));
        }
      }
      break;
      
    case 'supplyChange':
      if (isPlayerEvent !== false) {
        if (event.scope === 'singleBrigade') {
          const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
          randomBrigade.supply = Math.max(0, Math.min(100, randomBrigade.supply + (event.effectValue * effectMultiplier)));
          randomBrigade.artilleryAmmo = Math.max(0, Math.min(100, randomBrigade.artilleryAmmo + (event.effectValue * effectMultiplier)));
        } else if (event.scope === 'allBrigades') {
          updatedBrigades = updatedBrigades.map(b => ({
            ...b,
            supply: Math.max(0, Math.min(100, b.supply + (event.effectValue * effectMultiplier))),
          }));
        }
      }
      break;
      
    case 'strengthBoost':
      if (isPlayerEvent !== false) {
        if (event.scope === 'singleBrigade') {
          const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
          randomBrigade.strength = Math.max(0, Math.min(100, randomBrigade.strength + (event.effectValue * effectMultiplier)));
        } else if (event.scope === 'allBrigades') {
          updatedBrigades = updatedBrigades.map(b => ({
            ...b,
            strength: Math.max(0, Math.min(100, b.strength + (event.effectValue * effectMultiplier))),
          }));
        }
      }
      break;
      
    case 'fullRecovery':
      if (isPlayerEvent !== false && event.scope === 'singleBrigade') {
        const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
        randomBrigade.strength = Math.min(100, randomBrigade.strength + (event.effectValue * effectMultiplier));
        randomBrigade.morale = Math.min(100, randomBrigade.morale + (event.effectValue * effectMultiplier));
        randomBrigade.supply = Math.min(100, randomBrigade.supply + (event.effectValue * effectMultiplier));
      }
      break;
      
    case 'intelBonus':
      if (event.scope === 'region') {
        const ukrainianRegions = updatedRegions.filter(r => r.control === 'ukraine' && r.enemyStrengthEstimate > 0);
        if (ukrainianRegions.length > 0) {
          const targetRegion = ukrainianRegions[Math.floor(Math.random() * ukrainianRegions.length)];
          // Intel makes estimates more accurate (closer to true value)
          targetRegion.enemyStrengthEstimate = Math.max(0, targetRegion.enemyStrengthEstimate);
        }
      }
      break;
      
    case 'enemyWeakening':
      if (event.scope === 'region') {
        const enemyRegions = updatedRegions.filter(r => r.control === 'russia' || r.enemyStrengthEstimate > 30);
        if (enemyRegions.length > 0) {
          const targetRegion = enemyRegions[Math.floor(Math.random() * enemyRegions.length)];
          targetRegion.enemyStrengthEstimate = Math.max(0, targetRegion.enemyStrengthEstimate + event.effectValue);
        }
      }
      break;
      
    case 'combatBuff':
      // Temporarily boost strength (simplified)
      if (event.scope === 'region') {
        const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
        randomBrigade.strength = Math.min(100, randomBrigade.strength + Math.abs(event.effectValue));
      }
      break;
      
    case 'combatDebuff':
      if (event.scope === 'region') {
        const ukrainianRegions = updatedRegions.filter(r => r.control === 'ukraine');
        if (ukrainianRegions.length > 0) {
          const targetRegion = ukrainianRegions[Math.floor(Math.random() * ukrainianRegions.length)];
          const affectedBrigades = updatedBrigades.filter(b => b.location === targetRegion.id);
          
          affectedBrigades.forEach(brigade => {
            brigade.strength = Math.max(0, brigade.strength + event.effectValue);
            brigade.supply = Math.max(0, brigade.supply + Math.floor(event.effectValue / 2));
          });
        }
      }
      break;
      
    case 'antiArmorBoost':
      if (event.scope === 'singleBrigade') {
        const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
        randomBrigade.antiArmorRating = Math.min(100, randomBrigade.antiArmorRating + event.effectValue);
      }
      break;
      
    case 'weatherIntensify':
      // Weather events don't directly modify state here
      // They're handled in weatherSystem
      break;
      
    case 'enemySupplyDisrupt':
      // Reduce enemy strength globally
      updatedRegions = updatedRegions.map(r => ({
        ...r,
        enemyStrengthEstimate: r.control === 'russia' 
          ? Math.max(0, r.enemyStrengthEstimate + event.effectValue)
          : r.enemyStrengthEstimate,
      }));
      break;
      
    case 'ewIntensify':
      if (event.scope === 'region') {
        const randomRegion = updatedRegions[Math.floor(Math.random() * updatedRegions.length)];
        randomRegion.electronicWarfareActive = true;
      }
      break;
      
    case 'artillerySuccess':
      if (event.scope === 'region') {
        const enemyRegions = updatedRegions.filter(r => r.artilleryIntensity > 30);
        if (enemyRegions.length > 0) {
          const targetRegion = enemyRegions[Math.floor(Math.random() * enemyRegions.length)];
          targetRegion.artilleryIntensity = Math.max(0, targetRegion.artilleryIntensity + event.effectValue);
        }
      }
      break;
  }
  
  return { brigades: updatedBrigades, regions: updatedRegions };
}

export function getEventLog(events) {
  return events.map(e => ({
    type: 'event',
    message: `${e.name}: ${e.description}`,
  }));
}
