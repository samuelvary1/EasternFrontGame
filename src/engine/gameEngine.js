// Game Engine - Core game state and turn resolution

import React, { createContext, useContext, useState, useCallback } from 'react';
import { initialBrigades } from '../data/initialBrigades';
import { initialRegions } from '../data/initialRegions';
import { initialRussianBrigades } from '../data/initialRussianBrigades';
import { initialRegionsRussian } from '../data/initialRegionsRussian';
import { DEFAULT_DIFFICULTY } from '../config/difficultySettings';
import { saveGameState, loadGameState } from '../storage/saveGame';
import { rollWeather } from './weatherSystem';
import { updateSupply, consumeSuppliesForMovement, consumeSuppliesForCombat, applySupplyToMorale } from './supplySystem';
import { resolveCombat, resolveDefensiveBattle } from './combatResolver';
import { computeAIActions, applyAIAction } from './aiSystem';
import { triggerRandomEvents } from './eventsSystem';
import { updateAirDefense, processDroneLoss } from './airDefenseSystem';
import { performReconnaissance, decayIntel } from './reconSystem';
import { performCounterbattery, calculateArtilleryDamage } from './artillerySystem';
import { checkAntiArmorEngagement } from './antiArmorSystem';
import { updateElectronicWarfare } from './electronicWarfareSystem';

const GameEngineContext = createContext();

export function useGameEngine() {
  return useContext(GameEngineContext);
}

export function GameEngineProvider({ children }) {
  const [gameState, setGameState] = useState({
    turn: 1,
    brigades: [],
    regions: [],
    weather: 'clear',
    eventLog: [],
    orders: [],
    gameStarted: false,
    gameOver: false,
    victory: false,
    difficulty: DEFAULT_DIFFICULTY,
    playerFaction: 'ukraine',
  });

  const startNewGame = useCallback((difficulty = DEFAULT_DIFFICULTY, playerFaction = 'ukraine') => {
    const baseBrigades = playerFaction === 'ukraine' ? initialBrigades : initialRussianBrigades;
    const baseRegions = playerFaction === 'ukraine' ? initialRegions : initialRegionsRussian;
    
    const adjustedBrigades = JSON.parse(JSON.stringify(baseBrigades)).map(b => ({
      ...b,
      drones: difficulty.startingDrones,
    }));

    const guidanceMessage = playerFaction === 'ukraine' 
      ? [
          'Campaign begins. Defend Ukraine.',
          '',
          'FIRST TURN GUIDANCE:',
          '• Check the MAP to see your positions',
          '• Review your brigades\' status and location',
          '• Kyiv Northwest is under heavy threat - consider reinforcing',
          '• Protect your supply route from the west',
          '• Tap regions on the map for tactical details',
          '',
          'When ready, end your turn to begin combat.',
        ]
      : [
          'Campaign begins. Execute the offensive.',
          '',
          'FIRST TURN GUIDANCE:',
          '• Check the MAP to see enemy positions',
          '• Your forces are staged at Belarus Border',
          '• Kyiv Northwest is the first objective',
          '• Cut off Ukrainian supply from the west',
          '• Capture Kyiv to win the campaign',
          '',
          'When ready, end your turn to begin combat.',
        ];

    setGameState({
      turn: 1,
      brigades: adjustedBrigades,
      regions: JSON.parse(JSON.stringify(baseRegions)),
      weather: rollWeather(),
      eventLog: guidanceMessage,
      orders: [],
      gameStarted: true,
      gameOver: false,
      victory: false,
      difficulty,
      playerFaction,
    });
  }, []);

  const loadGame = useCallback(async () => {
    const loaded = await loadGameState();
    if (loaded) {
      setGameState(loaded);
      return true;
    }
    return false;
  }, []);

  const saveGame = useCallback(async () => {
    await saveGameState(gameState);
  }, [gameState]);

  const issueOrder = useCallback((order) => {
    setGameState(prev => ({
      ...prev,
      orders: [...prev.orders, order],
    }));
  }, []);

  const clearOrders = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      orders: [],
    }));
  }, []);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      const turnLog = [];
      let { brigades, regions, weather, turn } = prev;

      turnLog.push(`\n=== Turn ${turn} Resolution ===`);

      // 1. Roll weather
      weather = rollWeather();
      turnLog.push(`Weather: ${weather.toUpperCase()}`);

      // 2. Update air defense
      regions = updateAirDefense(regions, brigades);

      // 3. Update electronic warfare
      regions = updateElectronicWarfare(regions, weather);
      regions.forEach(r => {
        if (r.electronicWarfareActive) {
          turnLog.push(`Electronic warfare active in ${r.name}.`);
        }
      });

      // 4. Process recon missions
      brigades.forEach((brigade, idx) => {
        if (brigade.reconAssigned) {
          const reconResult = performReconnaissance(brigade, regions, weather);
          brigades[idx] = reconResult.brigade;
          regions = reconResult.regions;
          turnLog.push(...reconResult.messages);
        }
      });

      // 5. Decay intel from previous turns
      regions = decayIntel(regions);

      // 6. Apply player orders
      prev.orders.forEach(order => {
        if (order.type === 'move') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          if (brigadeIdx >= 0) {
            brigades[brigadeIdx] = consumeSuppliesForMovement(brigades[brigadeIdx]);
            brigades[brigadeIdx].location = order.targetRegion;
            turnLog.push(`${brigades[brigadeIdx].name} moved to ${order.targetRegion}.`);
          }
        } else if (order.type === 'stance') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          if (brigadeIdx >= 0) {
            brigades[brigadeIdx].stance = order.stance;
            turnLog.push(`${brigades[brigadeIdx].name} changed stance to ${order.stance}.`);
          }
        } else if (order.type === 'attack') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          const targetRegion = regions.find(r => r.id === order.targetRegion);
          
          if (brigadeIdx >= 0 && targetRegion) {
            brigades[brigadeIdx] = consumeSuppliesForCombat(brigades[brigadeIdx]);
            
            const combatResult = resolveCombat(brigades[brigadeIdx], targetRegion, weather, turnLog);
            brigades[brigadeIdx] = combatResult.brigade;
            
            const regionIdx = regions.findIndex(r => r.id === order.targetRegion);
            regions[regionIdx] = combatResult.region;
            
            turnLog.push(...combatResult.messages);
          }
        } else if (order.type === 'counterbattery') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          if (brigadeIdx >= 0) {
            const cbResult = performCounterbattery(brigades[brigadeIdx], regions);
            brigades[brigadeIdx] = cbResult.brigade;
            regions = cbResult.regions;
            turnLog.push(...cbResult.messages);
          }
        } else if (order.type === 'assignRecon') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          if (brigadeIdx >= 0) {
            brigades[brigadeIdx].reconAssigned = true;
          }
        }
      });

      // 7. Update supply
      brigades = brigades.map(brigade => {
        const updated = updateSupply(brigade, regions, weather);
        return {
          ...updated,
          morale: applySupplyToMorale(updated.morale, updated.supply),
        };
      });

      // 8. Process drone losses
      brigades = brigades.map(brigade => {
        const location = regions.find(r => r.id === brigade.location);
        return location ? processDroneLoss(brigade, location, weather) : brigade;
      });

      // 9. Trigger turn start events
      const eventChance = Math.random();
      if (eventChance < 0.15 * prev.difficulty.eventFrequencyModifier) {
        const startEvents = triggerRandomEvents('turnStart', brigades, regions);
        brigades = startEvents.brigades;
        regions = startEvents.regions;
        turnLog.push(...startEvents.messages);
      }

      // 10. AI actions
      const aiDecisions = computeAIActions(regions, brigades, weather, prev.difficulty, prev.playerFaction);
      turnLog.push(...aiDecisions.messages);

      aiDecisions.actions.forEach(action => {
        const aiResult = applyAIAction(action, regions, brigades);
        regions = aiResult.regions;
        brigades = aiResult.brigades;
        turnLog.push(...aiResult.messages);
      });

      // 11. Resolve defensive battles (AI attacks)
      const attackActions = aiDecisions.actions.filter(a => a.action === 'attack');
      attackActions.forEach(attack => {
        const targetRegion = regions.find(r => r.id === attack.target);
        const defendingBrigades = brigades.filter(b => b.location === attack.target);
        
        defendingBrigades.forEach(defender => {
          const battleResult = resolveDefensiveBattle(defender, targetRegion, weather);
          const brigadeIdx = brigades.findIndex(b => b.id === defender.id);
          brigades[brigadeIdx] = battleResult.brigade;
          
          const regionIdx = regions.findIndex(r => r.id === targetRegion.id);
          regions[regionIdx] = battleResult.region;
          
          turnLog.push(...battleResult.messages);
        });
      });

      // 12. Apply artillery damage
      regions.forEach(region => {
        if (region.artilleryIntensity > 20) {
          const damage = calculateArtilleryDamage(region, brigades);
          brigades.forEach(brigade => {
            if (brigade.location === region.id) {
              brigade.strength = Math.max(0, brigade.strength - damage.damage);
              brigade.morale = Math.max(0, brigade.morale - damage.moraleLoss);
            }
          });
          
          if (damage.damage > 0) {
            turnLog.push(`Artillery fire in ${region.name} caused ${damage.damage} casualties.`);
          }
        }
      });

      // 13. Trigger turn end events
      const endEventChance = Math.random();
      if (endEventChance < 0.15 * prev.difficulty.eventFrequencyModifier) {
        const endEvents = triggerRandomEvents('turnEnd', brigades, regions);
        brigades = endEvents.brigades;
        regions = endEvents.regions;
        turnLog.push(...endEvents.messages);
      }

      // 14. Regenerate drones based on difficulty
      brigades = brigades.map(brigade => ({
        ...brigade,
        drones: Math.min(brigade.drones + prev.difficulty.playerDroneRegen, 8),
      }));

      // 15. Check victory/defeat conditions
      const kyivRegion = regions.find(r => r.id === 'kyiv_center');
      const supplyRegion = regions.find(r => r.id === 'supply_route');
      const allBrigadesDestroyed = brigades.every(b => b.strength <= 0);
      
      let gameOver = false;
      let victory = false;

      if (prev.playerFaction === 'ukraine') {
        // Ukrainian victory conditions
        const kyivControlled = kyivRegion?.control === 'ukraine';
        const supplyOpen = supplyRegion?.control === 'ukraine';

        if (allBrigadesDestroyed) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: All brigades have been destroyed. ***');
        } else if (!kyivControlled) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: Kyiv has fallen to enemy forces. ***');
        } else if (turn >= 20 && kyivControlled && supplyOpen) {
          gameOver = true;
          victory = true;
          turnLog.push('\n*** VICTORY: You have successfully defended Ukraine! ***');
        }
      } else {
        // Russian victory conditions
        const kyivCaptured = kyivRegion?.control === 'russia';
        const supplyCut = supplyRegion?.control === 'russia';

        if (allBrigadesDestroyed) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: All divisions have been destroyed. ***');
        } else if (kyivCaptured) {
          gameOver = true;
          victory = true;
          turnLog.push('\n*** VICTORY: Kyiv has been captured! ***');
        } else if (turn >= 20) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: Failed to capture Kyiv in time. Operation failed. ***');
        }
      }

      return {
        ...prev,
        turn: turn + 1,
        brigades,
        regions,
        weather,
        eventLog: [...prev.eventLog, ...turnLog],
        orders: [],
        gameOver,
        victory,
      };
    });
  }, []);

  const value = {
    gameState,
    startNewGame,
    loadGame,
    saveGame,
    issueOrder,
    clearOrders,
    endTurn,
  };

  return (
    <GameEngineContext.Provider value={value}>
      {children}
    </GameEngineContext.Provider>
  );
}
