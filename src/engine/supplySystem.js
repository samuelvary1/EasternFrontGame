// Supply system - updates brigade supply based on location, weather, and logistics

export function updateSupply(brigade, regions, weather) {
  const location = regions.find(r => r.id === brigade.location);
  if (!location) return brigade;

  let newSupply = brigade.supply;
  let newFuel = brigade.fuel;
  let newAmmo = brigade.ammo;

  // Base supply from region
  const supplyRate = location.baseSupply / 100;
  
  // Weather penalty
  const weatherPenalty = getWeatherSupplyPenalty(weather);
  
  // Control matters
  const controlBonus = location.control === 'ukraine' ? 1.0 : 0.3;
  
  // Check if isolated (no friendly neighbors)
  const isIsolated = checkIfIsolated(location, regions);
  const isolationPenalty = isIsolated ? 0.5 : 1.0;
  
  // Enemy pressure
  const pressurePenalty = location.enemyStrengthEstimate > 60 ? 0.8 : 1.0;
  
  // Calculate supply change
  const effectiveSupplyRate = supplyRate * controlBonus * isolationPenalty * pressurePenalty * (1 - weatherPenalty);
  
  // Update supply, fuel, ammo
  const supplyChange = (effectiveSupplyRate * 25) - 10; // Net change per turn
  newSupply = Math.max(0, Math.min(100, brigade.supply + supplyChange));
  
  const fuelChange = (effectiveSupplyRate * 20) - 8;
  newFuel = Math.max(0, Math.min(100, brigade.fuel + fuelChange));
  
  const ammoChange = (effectiveSupplyRate * 15) - 5;
  newAmmo = Math.max(0, Math.min(100, brigade.ammo + ammoChange));
  
  return {
    ...brigade,
    supply: Math.round(newSupply),
    fuel: Math.round(newFuel),
    ammo: Math.round(newAmmo),
  };
}

function getWeatherSupplyPenalty(weather) {
  const penalties = {
    clear: 0,
    rain: 0.1,
    heavy_rain: 0.2,
    mud: 0.35,
    snow: 0.15,
  };
  return penalties[weather] || 0;
}

function checkIfIsolated(region, regions) {
  const friendlyNeighbors = region.adjacency.filter(adjId => {
    const neighbor = regions.find(r => r.id === adjId);
    return neighbor && neighbor.control === 'ukraine';
  });
  
  return friendlyNeighbors.length === 0;
}

export function applySupplyToCombat(basePower, supply) {
  if (supply > 70) return basePower * 1.0;
  if (supply > 50) return basePower * 0.9;
  if (supply > 30) return basePower * 0.7;
  if (supply > 10) return basePower * 0.5;
  return basePower * 0.3;
}

export function applySupplyToMorale(morale, supply) {
  if (supply < 20) return Math.max(0, morale - 5);
  if (supply < 40) return Math.max(0, morale - 2);
  if (supply > 80) return Math.min(100, morale + 1);
  return morale;
}

export function consumeSuppliesForMovement(brigade) {
  return {
    ...brigade,
    fuel: Math.max(0, brigade.fuel - 10),
    supply: Math.max(0, brigade.supply - 5),
  };
}

export function consumeSuppliesForCombat(brigade) {
  return {
    ...brigade,
    ammo: Math.max(0, brigade.ammo - 15),
    fuel: Math.max(0, brigade.fuel - 5),
    supply: Math.max(0, brigade.supply - 10),
  };
}
