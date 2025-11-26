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

// Helper function for stance impact descriptions
function getStanceImpact(oldStance, newStance) {
  const impacts = {
    'hold': '+20% defense, no movement',
    'mobile defense': 'Balanced combat, can react',
    'offensive': '+30% attack, -10% defense',
    'counterattack': 'Auto-strike attackers, -supplies',
  };
  return impacts[newStance] || '';
}

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
          '• Check the MAP to see your positions and threats',
          '• Review your brigades - manage Strength, Morale, and Supply',
          '• Kyiv Northwest is under heavy threat - reinforce if needed',
          '• Protect your supply routes from the west',
          '• Change brigade stances (hold, mobile defense, etc.)',
          '• Move brigades between adjacent regions to respond to attacks',
          '',
          'When ready, end your turn to see combat results.',
        ]
      : [
          'Campaign begins. Execute the offensive.',
          '',
          'FIRST TURN GUIDANCE:',
          '• Check the MAP to see enemy positions and your forces',
          '• Review your brigades - manage Strength, Morale, and Supply',
          '• Your forces are staged at Belarus Border',
          '• Attack Kyiv Northwest to begin the assault',
          '• Cut off Ukrainian supply lines from the west',
          '• Change stances to offensive for maximum attack power',
          '',
          'Capture Kyiv within 20 turns to achieve victory.',
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

  const cancelOrder = useCallback((orderId) => {
    setGameState(prev => ({
      ...prev,
      orders: prev.orders.filter((order, index) => {
        // Support both order.id and index-based identification
        if (order.id !== undefined) {
          return order.id !== orderId;
        }
        return index !== orderId;
      }),
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

      // 2. Apply player orders
      prev.orders.forEach(order => {
        if (order.type === 'move') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          if (brigadeIdx >= 0) {
            brigades[brigadeIdx] = consumeSuppliesForMovement(brigades[brigadeIdx]);
            brigades[brigadeIdx].location = order.targetRegion;
            turnLog.push(`[PLAYER] ${brigades[brigadeIdx].name} moved to ${order.targetRegion}. (-10 supplies, repositioned)`);
          }
        } else if (order.type === 'stance') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          if (brigadeIdx >= 0) {
            const oldStance = brigades[brigadeIdx].stance;
            brigades[brigadeIdx].stance = order.stance;
            const impact = getStanceImpact(oldStance, order.stance);
            turnLog.push(`[PLAYER] ${brigades[brigadeIdx].name} changed orders to ${order.stance}. ${impact}`);
          }
        } else if (order.type === 'attack') {
          const brigadeIdx = brigades.findIndex(b => b.id === order.brigadeId);
          const targetRegion = regions.find(r => r.id === order.targetRegion);
          
          if (brigadeIdx >= 0 && targetRegion) {
            brigades[brigadeIdx] = consumeSuppliesForCombat(brigades[brigadeIdx]);
            
            turnLog.push(`[PLAYER] ${brigades[brigadeIdx].name} attacks ${order.targetRegion}. (-20 supplies, combat initiated)`);
            
            const combatResult = resolveCombat(brigades[brigadeIdx], targetRegion, weather, turnLog);
            brigades[brigadeIdx] = combatResult.brigade;
            
            const regionIdx = regions.findIndex(r => r.id === order.targetRegion);
            regions[regionIdx] = combatResult.region;
            
            turnLog.push(...combatResult.messages);
          }
        }
      });

      // 3. Update supply
      brigades = brigades.map(brigade => {
        const updated = updateSupply(brigade, regions, weather);
        return {
          ...updated,
          morale: applySupplyToMorale(updated.morale, updated.supply),
        };
      });

      // 4. Trigger turn start events
      const eventChance = Math.random();
      if (eventChance < 0.15 * prev.difficulty.eventFrequencyModifier) {
        const startEvents = triggerRandomEvents('turnStart', brigades, regions, prev.playerFaction);
        brigades = startEvents.brigades;
        regions = startEvents.regions;
        turnLog.push(...startEvents.messages);
      }

      // 4. AI actions
      const aiDecisions = computeAIActions(regions, brigades, weather, prev.difficulty, prev.playerFaction);
      turnLog.push(...aiDecisions.messages);

      aiDecisions.actions.forEach(action => {
        const aiResult = applyAIAction(action, regions, brigades);
        regions = aiResult.regions;
        brigades = aiResult.brigades;
        turnLog.push(...aiResult.messages);
      });

      // 5. Resolve defensive battles (AI attacks)
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

      // 6. Trigger turn end events
      const endEventChance = Math.random();
      if (endEventChance < 0.15 * prev.difficulty.eventFrequencyModifier) {
        const endEvents = triggerRandomEvents('turnEnd', brigades, regions, prev.playerFaction);
        brigades = endEvents.brigades;
        regions = endEvents.regions;
        turnLog.push(...endEvents.messages);
      }

      // 7. Regenerate drones based on difficulty
      brigades = brigades.map(brigade => ({
        ...brigade,
        droneCount: Math.min(brigade.droneCount + prev.difficulty.playerDroneRegen, 8),
      }));

      // 8. Check victory/defeat conditions
      const kyivRegion = regions.find(r => r.id === 'kyiv');
      const lvivRegion = regions.find(r => r.id === 'lviv');
      const kharkivRegion = regions.find(r => r.id === 'kharkiv');
      const allBrigadesDestroyed = brigades.every(b => b.strength <= 0);
      
      let gameOver = false;
      let victory = false;

      if (prev.playerFaction === 'ukraine') {
        // Ukrainian victory conditions
        const kyivControlled = kyivRegion?.control === 'ukraine';
        const lvivControlled = lvivRegion?.control === 'ukraine';
        const majorCitiesHeld = [kyivRegion, lvivRegion, kharkivRegion].filter(r => r?.control === 'ukraine').length;

        if (allBrigadesDestroyed) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: All brigades have been destroyed. ***');
        } else if (!kyivControlled) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: Kyiv has fallen to enemy forces. ***');
        } else if (!lvivControlled) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: Western supply lines cut! Lviv has fallen. ***');
        } else if (turn >= 20 && kyivControlled && lvivControlled && majorCitiesHeld >= 2) {
          gameOver = true;
          victory = true;
          turnLog.push('\n*** VICTORY: Ukraine has successfully defended its sovereignty! ***');
        }
      } else {
        // Russian victory conditions
        const kyivCaptured = kyivRegion?.control === 'russia';
        const majorCitiesCaptured = [kyivRegion, lvivRegion, kharkivRegion].filter(r => r?.control === 'russia').length;

        if (allBrigadesDestroyed) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: All divisions have been destroyed. ***');
        } else if (kyivCaptured) {
          gameOver = true;
          victory = true;
          turnLog.push('\n*** VICTORY: Kyiv captured! Ukraine capitulates! ***');
        } else if (turn >= 20 && majorCitiesCaptured >= 2) {
          gameOver = true;
          victory = true;
          turnLog.push('\n*** VICTORY: Strategic objectives achieved! Ukraine sues for peace. ***');
        } else if (turn >= 20) {
          gameOver = true;
          victory = false;
          turnLog.push('\n*** DEFEAT: Failed to achieve strategic objectives. Operation failed. ***');
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
    
    // Auto-save after turn ends
    setTimeout(() => {
      saveGame();
    }, 100);
  }, [saveGame]);

  const value = {
    gameState,
    startNewGame,
    loadGame,
    saveGame,
    issueOrder,
    clearOrders,
    cancelOrder,
    endTurn,
  };

  return (
    <GameEngineContext.Provider value={value}>
      {children}
    </GameEngineContext.Provider>
  );
}
