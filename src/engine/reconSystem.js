// Reconnaissance system - drone reconnaissance and intel gathering

export function performReconnaissance(brigade, regions, weather) {
  const messages = [];
  
  if (!brigade.reconAssigned || brigade.droneCount <= 0) {
    return { brigade, regions, messages, success: false };
  }
  
  const location = regions.find(r => r.id === brigade.location);
  if (!location) {
    return { brigade, regions, messages, success: false };
  }
  
  // Calculate recon success chance
  let successChance = 0.7;
  
  // Weather affects recon
  const weatherModifiers = {
    clear: 0,
    rain: -0.15,
    heavy_rain: -0.35,
    mud: -0.1,
    snow: -0.25,
  };
  successChance += weatherModifiers[weather] || 0;
  
  // Electronic warfare reduces success
  if (location.electronicWarfareActive) {
    successChance -= 0.2;
  }
  
  // Air defense affects drone survival (but not intel gathering if successful)
  const airDefense = location.airDefenseLevel || 50;
  successChance -= (airDefense / 300); // Slight reduction
  
  const success = Math.random() < Math.max(0.1, successChance);
  
  if (success) {
    // Improve intel on adjacent enemy regions
    const adjacentRegions = location.adjacency
      .map(id => regions.find(r => r.id === id))
      .filter(r => r && (r.control === 'russia' || r.enemyStrengthEstimate > 20));
    
    const updatedRegions = regions.map(region => {
      const isAdjacent = adjacentRegions.some(r => r.id === region.id);
      
      if (isAdjacent) {
        // Improve accuracy of strength estimate
        // In a real implementation, you'd have hidden "true" values
        // For now, we add a small random variation to simulate better intel
        const intelBonus = Math.floor(10 + Math.random() * 15);
        
        messages.push(
          `Recon successful: ${brigade.name} gathered intelligence on ${region.name}. Enemy strength estimated at ${region.enemyStrengthEstimate}.`
        );
        
        return {
          ...region,
          intelQuality: 'high',
          lastReconTurn: true,
        };
      }
      
      return region;
    });
    
    return {
      brigade: { ...brigade, reconAssigned: false },
      regions: updatedRegions,
      messages,
      success: true,
    };
  } else {
    messages.push(
      `Recon failed: ${brigade.name}'s reconnaissance mission was unsuccessful due to poor conditions.`
    );
    
    return {
      brigade: { ...brigade, reconAssigned: false },
      regions,
      messages,
      success: false,
    };
  }
}

export function getIntelBonus(region) {
  if (region.intelQuality === 'high' && region.lastReconTurn) {
    return 15; // Combat bonus for good intel
  }
  return 0;
}

export function decayIntel(regions) {
  return regions.map(region => ({
    ...region,
    intelQuality: region.lastReconTurn ? 'medium' : 'low',
    lastReconTurn: false,
  }));
}

export function estimateEnemyStrength(region, hasRecentRecon) {
  const actual = region.enemyStrengthEstimate;
  
  if (hasRecentRecon || region.intelQuality === 'high') {
    // Accurate estimate
    return actual + Math.floor(Math.random() * 10 - 5);
  } else if (region.intelQuality === 'medium') {
    // Moderate uncertainty
    return actual + Math.floor(Math.random() * 20 - 10);
  } else {
    // High uncertainty
    return actual + Math.floor(Math.random() * 40 - 20);
  }
}
