// Events system - triggers and applies random events

import { eventsCatalog } from '../data/eventsCatalog';

export function triggerRandomEvents(trigger, brigades, regions) {
  const eligibleEvents = eventsCatalog.filter(e => e.trigger === trigger);
  const triggeredEvents = [];
  const messages = [];
  
  let updatedBrigades = [...brigades];
  let updatedRegions = [...regions];
  
  eligibleEvents.forEach(event => {
    if (Math.random() < event.probability) {
      triggeredEvents.push(event);
      messages.push(`[EVENT] ${event.name}: ${event.description}`);
      
      // Apply event effects
      const result = applyEventEffect(event, updatedBrigades, updatedRegions);
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

function applyEventEffect(event, brigades, regions) {
  let updatedBrigades = [...brigades];
  let updatedRegions = [...regions];
  
  switch (event.effectType) {
    case 'moraleChange':
      if (event.scope === 'allBrigades') {
        updatedBrigades = updatedBrigades.map(b => ({
          ...b,
          morale: Math.max(0, Math.min(100, b.morale + event.effectValue)),
        }));
      } else if (event.scope === 'singleBrigade') {
        const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
        randomBrigade.morale = Math.max(0, Math.min(100, randomBrigade.morale + event.effectValue));
      }
      break;
      
    case 'supplyChange':
      if (event.scope === 'singleBrigade') {
        const randomBrigade = updatedBrigades[Math.floor(Math.random() * updatedBrigades.length)];
        randomBrigade.supply = Math.max(0, Math.min(100, randomBrigade.supply + event.effectValue));
        randomBrigade.artilleryAmmo = Math.max(0, Math.min(100, randomBrigade.artilleryAmmo + event.effectValue));
      } else if (event.scope === 'allBrigades') {
        updatedBrigades = updatedBrigades.map(b => ({
          ...b,
          supply: Math.max(0, Math.min(100, b.supply + event.effectValue)),
        }));
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
