// AI system - controls enemy actions

export function computeAIActions(regions, brigades, weather, difficulty, playerFaction = 'ukraine') {
  const actions = [];
  const messages = [];
  
  // AI controls the opposite faction
  const aiFaction = playerFaction === 'ukraine' ? 'russia' : 'ukraine';
  
  // Find all AI-controlled regions
  const aiRegions = regions.filter(r => r.control === aiFaction);
  
  aiRegions.forEach(region => {
    const action = decideRegionAction(region, regions, brigades, weather, difficulty, aiFaction);
    
    if (action) {
      actions.push({
        regionId: region.id,
        action: action.type,
        target: action.target,
        intensity: action.intensity,
      });
      
      if (action.message) {
        messages.push(action.message);
      }
    }
  });
  
  return { actions, messages };
}

function decideRegionAction(region, allRegions, brigades, weather, difficulty, aiFaction) {
  const strength = region.enemyStrengthEstimate * difficulty.enemyStrengthModifier;
  
  // Determine enemy faction (opposite of AI)
  const enemyFaction = aiFaction === 'ukraine' ? 'russia' : 'ukraine';
  
  // Find adjacent regions
  const adjacentRegions = region.adjacency
    .map(id => allRegions.find(r => r.id === id))
    .filter(r => r);
  
  const enemyNeighbors = adjacentRegions.filter(r => r.control === enemyFaction);
  const friendlyNeighbors = adjacentRegions.filter(r => r.control === aiFaction);
  
  // Decision weights (adjusted by difficulty)
  const baseActivityChance = difficulty.enemyActivityModifier;
  
  if (Math.random() > baseActivityChance) {
    return null; // AI inactive this turn based on difficulty
  }
  
  const weights = {
    hold: 30,
    attack: 0,
    reinforce: 0,
  };
  
  // Attack decision
  if (enemyNeighbors.length > 0 && strength > 60) {
    // Find weakest enemy neighbor
    const weakestTarget = enemyNeighbors.reduce((weakest, current) => {
      const currentDefense = getBrigadesInRegion(brigades, current.id).reduce((sum, b) => sum + b.strength, 0);
      const weakestDefense = getBrigadesInRegion(brigades, weakest.id).reduce((sum, b) => sum + b.strength, 0);
      return currentDefense < weakestDefense ? current : weakest;
    });
    
    const targetDefense = getBrigadesInRegion(brigades, weakestTarget.id).reduce((sum, b) => sum + b.strength, 0);
    
    if (strength > targetDefense * 1.3) {
      weights.attack = 40;
    } else if (strength > targetDefense) {
      weights.attack = 25;
    }
  }
  
  // Reinforce decision
  if (friendlyNeighbors.length > 0 && strength > 70) {
    const threatenedNeighbor = friendlyNeighbors.find(r => {
      const neighborEnemyNeighbors = r.adjacency
        .map(id => allRegions.find(reg => reg.id === id))
        .filter(reg => reg && reg.control === enemyFaction);
      return neighborEnemyNeighbors.length > 0;
    });
    
    if (threatenedNeighbor) {
      weights.reinforce = 20;
    }
  }
  // Weather affects aggression
  if (weather === 'mud' || weather === 'heavy_rain') {
    weights.attack *= 0.5;
    weights.hold *= 1.5;
  }
  
  // Choose action based on weights
  const action = weightedRandomChoice(weights);
  
  switch (action) {
    case 'attack':
      if (enemyNeighbors.length > 0) {
        const target = enemyNeighbors[Math.floor(Math.random() * enemyNeighbors.length)];
        const attackStrength = Math.floor(strength);
        return {
          type: 'attack',
          target: target.id,
          intensity: strength,
          message: `[ENEMY] Enemy forces from ${region.name} launch attack on ${target.name}. (Assault strength: ${attackStrength})`,
        };
      }
      return null;
      
    case 'reinforce':
      if (friendlyNeighbors.length > 0) {
        const target = friendlyNeighbors[Math.floor(Math.random() * friendlyNeighbors.length)];
        const reinforcementSize = Math.floor(strength * 0.3);
        return {
          type: 'reinforce',
          target: target.id,
          intensity: reinforcementSize,
          message: `[ENEMY] Enemy reinforcing ${target.name}. (+${reinforcementSize} enemy strength)`,
        };
      }
      return null;
      
    case 'hold':
    default:
      return {
        type: 'hold',
        target: null,
        intensity: 0,
        message: null,
      };
  }
}

function getBrigadesInRegion(brigades, regionId) {
  return brigades.filter(b => b.location === regionId);
}

function weightedRandomChoice(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;
  
  for (const [action, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return action;
    }
  }
  
  return 'hold';
}

export function applyAIAction(action, regions, brigades) {
  const updatedRegions = [...regions];
  const updatedBrigades = [...brigades];
  const messages = [];
  
  const sourceRegion = updatedRegions.find(r => r.id === action.regionId);
  
  switch (action.action) {
    case 'attack': {
      const targetRegion = updatedRegions.find(r => r.id === action.target);
      const defendingBrigades = updatedBrigades.filter(b => b.location === action.target);
      
      if (defendingBrigades.length > 0 && targetRegion) {
        // Simple attack resolution
        const totalDefense = defendingBrigades.reduce((sum, b) => sum + b.strength, 0);
        
        if (action.intensity > totalDefense * 1.5) {
          // Enemy breakthrough
          targetRegion.control = 'russia';
          targetRegion.enemyStrengthEstimate = Math.floor(action.intensity * 0.6);
          messages.push(`[ENEMY] CRITICAL: Enemy forces have seized ${targetRegion.name}!`);
          
          // Damage defending brigades
          let totalCasualties = 0;
          defendingBrigades.forEach(brigade => {
            const casualty = Math.floor(20 + Math.random() * 15);
            totalCasualties += casualty;
            brigade.strength = Math.max(0, brigade.strength - casualty);
            brigade.morale = Math.max(0, brigade.morale - 15);
          });
          messages.push(`[ENEMY] Your forces suffered heavy losses. (-${totalCasualties} total strength, -15 morale)`);
        } else {
          // Attack repelled
          targetRegion.enemyStrengthEstimate = Math.min(100, targetRegion.enemyStrengthEstimate + Math.floor(action.intensity * 0.2));
          messages.push(`[ENEMY] Enemy attack on ${targetRegion.name} repelled, but at a cost.`);
          
          let totalCasualties = 0;
          defendingBrigades.forEach(brigade => {
            const casualty = Math.floor(8 + Math.random() * 10);
            totalCasualties += casualty;
            brigade.strength = Math.max(0, brigade.strength - casualty);
            brigade.morale = Math.max(0, brigade.morale - 5);
          });
          messages.push(`[ENEMY] Defensive casualties taken. (-${totalCasualties} total strength, -5 morale)`);
        }
      }
      break;
    }
    
    case 'reinforce': {
      const targetRegion = updatedRegions.find(r => r.id === action.target);
      if (targetRegion) {
        targetRegion.enemyStrengthEstimate = Math.min(100, targetRegion.enemyStrengthEstimate + action.intensity);
        if (sourceRegion) {
          sourceRegion.enemyStrengthEstimate = Math.max(0, sourceRegion.enemyStrengthEstimate - action.intensity);
        }
      }
      break;
    }
  }
  
  return {
    regions: updatedRegions,
    brigades: updatedBrigades,
    messages,
  };
}
