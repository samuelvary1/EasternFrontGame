// Artillery system - counterbattery and fire support

export function performCounterbattery(brigade, regions) {
  const messages = [];
  
  if (brigade.artilleryAmmo < 20) {
    return { brigade, regions, messages };
  }
  
  const location = regions.find(r => r.id === brigade.location);
  if (!location) {
    return { brigade, regions, messages };
  }
  
  // Find adjacent regions with high artillery intensity
  const targets = location.adjacency
    .map(id => regions.find(r => r.id === id))
    .filter(r => r && r.artilleryIntensity > 30);
  
  if (targets.length === 0) {
    return { brigade, regions, messages };
  }
  
  const target = targets.reduce((max, current) => 
    current.artilleryIntensity > max.artilleryIntensity ? current : max
  );
  
  // Perform counterbattery
  const effectiveness = Math.floor(20 + Math.random() * 20);
  const ammoUsed = 25;
  
  const updatedRegions = regions.map(region => {
    if (region.id === target.id) {
      return {
        ...region,
        artilleryIntensity: Math.max(0, region.artilleryIntensity - effectiveness),
      };
    }
    return region;
  });
  
  messages.push(
    `${brigade.name} conducted counterbattery fire against positions in ${target.name}, reducing enemy artillery by ${effectiveness}%.`
  );
  
  return {
    brigade: {
      ...brigade,
      artilleryAmmo: Math.max(0, brigade.artilleryAmmo - ammoUsed),
    },
    regions: updatedRegions,
    messages,
  };
}

export function applyArtillerySupport(attackingBrigade, targetRegion) {
  if (attackingBrigade.artilleryAmmo < 15) {
    return { bonus: 0, ammoUsed: 0 };
  }
  
  const bonus = Math.floor(15 + Math.random() * 10);
  const ammoUsed = 15;
  
  return { bonus, ammoUsed };
}

export function calculateArtilleryDamage(region, brigades) {
  if (region.artilleryIntensity < 20) {
    return { damage: 0, moraleLoss: 0 };
  }
  
  const intensity = region.artilleryIntensity;
  const damage = Math.floor(intensity / 10);
  const moraleLoss = Math.floor(intensity / 15);
  
  return { damage, moraleLoss };
}

export function resupplyArtillery(brigade, supplyAvailable) {
  if (supplyAvailable < 30) {
    return brigade;
  }
  
  const resupplyAmount = Math.min(40, 100 - brigade.artilleryAmmo);
  
  return {
    ...brigade,
    artilleryAmmo: Math.min(100, brigade.artilleryAmmo + resupplyAmount),
  };
}
