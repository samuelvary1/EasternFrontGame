// Electronic warfare system - jamming and communication disruption

export function updateElectronicWarfare(regions, weather) {
  const updatedRegions = regions.map(region => {
    // EW has a chance to activate or deactivate each turn
    const activationChance = 0.15;
    const deactivationChance = 0.3;
    
    let ewActive = region.electronicWarfareActive || false;
    
    if (ewActive) {
      if (Math.random() < deactivationChance) {
        ewActive = false;
      }
    } else {
      // Higher chance in contested or enemy regions
      const ewChance = region.control === 'russia' ? activationChance * 2 : activationChance;
      if (Math.random() < ewChance) {
        ewActive = true;
      }
    }
    
    return {
      ...region,
      electronicWarfareActive: ewActive,
    };
  });
  
  return updatedRegions;
}

export function applyEWToRecon(reconSuccess, region) {
  if (!region.electronicWarfareActive) {
    return reconSuccess;
  }
  
  // EW reduces recon success chance
  const ewPenalty = 0.25;
  return Math.max(0, reconSuccess - ewPenalty);
}

export function applyEWToDrones(brigade, region) {
  if (!region.electronicWarfareActive || brigade.droneCount <= 0) {
    return { brigade, dronesFailed: 0 };
  }
  
  // EW can disable drones
  const failureChance = 0.3;
  let dronesFailed = 0;
  
  for (let i = 0; i < brigade.droneCount; i++) {
    if (Math.random() < failureChance) {
      dronesFailed++;
    }
  }
  
  return {
    brigade: {
      ...brigade,
      droneCount: Math.max(0, brigade.droneCount - dronesFailed),
    },
    dronesFailed,
  };
}

export function applyEWToCommunications(brigade, region) {
  if (!region.electronicWarfareActive) {
    return { penalty: 0, messages: [] };
  }
  
  // EW disrupts coordination, slight combat penalty
  const penalty = 5;
  const messages = [
    `Electronic warfare is disrupting ${brigade.name}'s communications in ${region.name}.`
  ];
  
  return { penalty, messages };
}

export function getEWIntensity(region) {
  if (!region.electronicWarfareActive) {
    return 0;
  }
  
  // Intensity based on enemy presence
  const baseIntensity = 40;
  const enemyBonus = region.enemyStrengthEstimate / 2;
  
  return Math.min(100, baseIntensity + enemyBonus);
}

export function applyEWCountermeasures(brigade, region) {
  if (!region.electronicWarfareActive) {
    return { brigade, success: false };
  }
  
  // Higher experience helps resist EW
  const resistChance = brigade.experience / 200;
  const success = Math.random() < resistChance;
  
  if (success) {
    return {
      brigade,
      success: true,
      message: `${brigade.name} successfully employed EW countermeasures.`,
    };
  }
  
  return { brigade, success: false };
}
