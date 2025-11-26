// TurnSummaryScreen - shows turn resolution log

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import LogEntry from '../components/LogEntry';
import ActionButton from '../components/ActionButton';
import ThreeDDiceRoll from '../components/ThreeDDiceRoll';
import CombatLogEntry from '../components/CombatLogEntry';

export default function TurnSummaryScreen({ navigation }) {
  const { gameState, saveGame } = useGameEngine();
  const [diceAnimationVisible, setDiceAnimationVisible] = useState(false);
  const [currentCombatIndex, setCurrentCombatIndex] = useState(0);
  const [combatEvents, setCombatEvents] = useState([]);
  const [animationsPlayed, setAnimationsPlayed] = useState(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only run initialization once per mount
    if (hasInitialized) return;
    setHasInitialized(true);
    
    // Extract combat events from the CURRENT turn only
    const currentTurnMarker = `=== Turn ${gameState.turn} Resolution ===`;
    const currentTurnStartIndex = gameState.eventLog.findIndex(entry => entry.includes(currentTurnMarker));
    
    // If we can't find the current turn marker, don't show any animations
    if (currentTurnStartIndex === -1) {
      console.log('No current turn marker found');
      return;
    }
    
    // Only look at logs from the current turn onwards
    const latestLog = gameState.eventLog.slice(currentTurnStartIndex);
    console.log('Current turn log entries:', latestLog);
    const combats = [];
    
    for (let i = 0; i < latestLog.length; i++) {
      const entry = latestLog[i];
      
      // Look for combat start marker
      if (entry.includes('[COMBAT_START]')) {
        console.log('Found combat start at index', i, ':', entry);
        const namesMatch = entry.match(/\[COMBAT_START\]([^|]+)\|([^\]]+)\[\/COMBAT_START\]/);
        const attackerName = namesMatch ? namesMatch[1] : 'Attacker';
        const defenderName = namesMatch ? namesMatch[2] : 'Defender';
        console.log('Attacker:', attackerName, 'Defender:', defenderName);
        
        // Parse attacker brigade info
        let attackerBrigadeInfo = null;
        let defenderInfo = null;
        let attackerMatch = null;
        let defenderMatch = null;
        
        // Search for the tagged info and dice rolls in the next several lines
        for (let searchIdx = i + 1; searchIdx < latestLog.length && searchIdx < i + 15; searchIdx++) {
          const line = latestLog[searchIdx];
          
          if (line.includes('[ATTACKER_BRIGADE]')) {
            const brigadeMatch = line.match(/\[ATTACKER_BRIGADE\]([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\[\/ATTACKER_BRIGADE\]/);
            if (brigadeMatch) {
              attackerBrigadeInfo = {
                name: brigadeMatch[1],
                type: brigadeMatch[2],
                strength: brigadeMatch[3],
                morale: brigadeMatch[4],
              };
            }
          }
          
          if (line.includes('[DEFENDER_INFO]')) {
            const defMatch = line.match(/\[DEFENDER_INFO\]([^|]+)\|([^|]+)\|([^\]]+)\[\/DEFENDER_INFO\]/);
            if (defMatch) {
              defenderInfo = {
                name: defMatch[1],
                strength: defMatch[2],
                terrain: defMatch[3],
              };
            }
          }
          
          if (line.includes('Attacker rolls') && !attackerMatch) {
            attackerMatch = line.match(/Attacker rolls (\d+) dice: \[([^\]]+)\]/);
            console.log('Found attacker dice at', searchIdx, ':', line);
          }
          
          if (line.includes('Defender rolls') && !defenderMatch) {
            defenderMatch = line.match(/Defender rolls (\d+) dice: \[([^\]]+)\]/);
            console.log('Found defender dice at', searchIdx, ':', line);
          }
          
          // Stop searching once we find combat end
          if (line.includes('[COMBAT_END]')) {
            break;
          }
        }        console.log('Attacker match:', attackerMatch);
        console.log('Defender match:', defenderMatch);
        
        if (attackerMatch && defenderMatch) {
          // Parse dice and sort descending for both animation and text
          const attackerDiceRaw = attackerMatch[2].split(', ').map(Number);
          const defenderDiceRaw = defenderMatch[2].split(', ').map(Number);
          const attackerDice = [...attackerDiceRaw].sort((a, b) => b - a);
          const defenderDice = [...defenderDiceRaw].sort((a, b) => b - a);

          // Extract comparisons using sorted dice arrays
          const comparisons = [];
          const numComparisons = Math.min(attackerDice.length, defenderDice.length);
          for (let k = 0; k < numComparisons; k++) {
            const attackerVal = attackerDice[k];
            const defenderVal = defenderDice[k];
            let winner = 'defender';
            if (attackerVal > defenderVal) winner = 'attacker';
            else if (attackerVal < defenderVal) winner = 'defender';
            else winner = 'stalemate';
            comparisons.push({
              attacker: attackerVal,
              defender: defenderVal,
              winner,
            });
          }
          
          // Find outcome
          let outcome = '';
          let combatResults = null;
          for (let k = i + 7; k < latestLog.length && k < i + 20; k++) {
            if (latestLog[k].includes('[COMBAT_RESULTS]')) {
              const resultsMatch = latestLog[k].match(/\[COMBAT_RESULTS\]([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\[\/COMBAT_RESULTS\]/);
              if (resultsMatch) {
                combatResults = {
                  attackerName: resultsMatch[1],
                  attackerLosses: resultsMatch[2],
                  moraleChange: resultsMatch[3],
                  defenderName: resultsMatch[4],
                  defenderLosses: resultsMatch[5],
                };
              }
            }
            if (latestLog[k].includes('[COMBAT_END]')) {
              const outcomeMatch = latestLog[k].match(/\[COMBAT_END\]([^\[]+)\[\/COMBAT_END\]/);
              if (outcomeMatch) {
                outcome = outcomeMatch[1];
              }
              break;
            }
          }
          
          combats.push({ 
            attackerName,
            defenderName, 
            attackerDice, 
            defenderDice, 
            comparisons,
            outcome,
            attackerBrigadeInfo,
            defenderInfo,
            combatResults,
          });
        }
      }
    }
    
    setCombatEvents(combats);
    
    console.log('Combats found:', combats.length);
    console.log('Combat details:', JSON.stringify(combats, null, 2));
    
    // Start showing combat animations if any exist
    if (combats.length > 0) {
      setCurrentCombatIndex(0);
      // Show dice animation after a short delay
      setTimeout(() => {
        setDiceAnimationVisible(true);
      }, 500);
    }
  }, [hasInitialized]);

  const handleCombatComplete = () => {
    // Dice animation completes - hide it
    setDiceAnimationVisible(false);
    
    // Show next combat after a delay
    if (currentCombatIndex < combatEvents.length - 1) {
      setTimeout(() => {
        setCurrentCombatIndex(prev => prev + 1);
        setDiceAnimationVisible(true);
      }, 1000);
    }
  };

  const handleContinue = async () => {
    await saveGame();
    
    if (gameState.gameOver) {
      navigation.navigate('MainMenu');
    } else {
      navigation.navigate('Campaign');
    }
  };

  const recentLog = gameState.eventLog.slice(-50).reverse();
  const currentCombat = combatEvents[currentCombatIndex];

  // Group log entries into combat sections and regular entries
  const groupedLog = [];
  let i = 0;
  const forwardLog = [...recentLog].reverse(); // Process in chronological order for grouping
  
  while (i < forwardLog.length) {
    const entry = forwardLog[i];
    
    if (entry.includes('[COMBAT_START]')) {
      // Collect all messages until COMBAT_END
      const combatMessages = [];
      let j = i;
      while (j < forwardLog.length) {
        combatMessages.push(forwardLog[j]);
        if (forwardLog[j].includes('[COMBAT_END]')) {
          break;
        }
        j++;
      }
      groupedLog.push({ type: 'combat', messages: combatMessages });
      i = j + 1;
    } else {
      groupedLog.push({ type: 'log', message: entry });
      i++;
    }
  }
  
  // Reverse back to show most recent first
  groupedLog.reverse();

  return (
    <SafeAreaView style={styles.container}>
      {diceAnimationVisible && (
        <View style={styles.combatContainer}>
          <View style={styles.combatHeader}>
            <Text style={styles.combatTitle}>
              {currentCombat?.attackerName || 'Attacker'} vs {currentCombat?.defenderName || 'Defender'}
            </Text>
          </View>
          
          <View style={styles.diceSection}>
            <ThreeDDiceRoll
              visible={diceAnimationVisible}
              attackerName={currentCombat?.attackerName || 'Attacker'}
              defenderName={currentCombat?.defenderName || 'Defender'}
              attackerDice={currentCombat?.attackerDice || []}
              defenderDice={currentCombat?.defenderDice || []}
              comparisons={currentCombat?.comparisons || []}
              outcome={currentCombat?.outcome || ''}
              attackerBrigadeInfo={currentCombat?.attackerBrigadeInfo}
              defenderInfo={currentCombat?.defenderInfo}
              combatResults={currentCombat?.combatResults}
              onComplete={handleCombatComplete}
            />
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Turn {gameState.turn - 1} Summary</Text>
        {gameState.gameOver && (
          <Text style={[styles.gameOverText, { color: gameState.victory ? '#10b981' : '#ef4444' }]}>
            {gameState.victory ? 'VICTORY!' : 'DEFEAT'}
          </Text>
        )}
      </View>

      <ScrollView style={styles.logContainer} contentContainerStyle={styles.logContent}>
        {groupedLog.map((item, index) => {
          if (item.type === 'combat') {
            return <CombatLogEntry key={`combat-${index}`} messages={item.messages} />;
          } else {
            return <LogEntry key={`log-${index}`} message={item.message} index={index} />;
          }
        })}
      </ScrollView>

      <View style={styles.footer}>
        <ActionButton
          title={gameState.gameOver ? 'Return to Menu' : 'Continue'}
          onPress={handleContinue}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  combatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1000,
  },
  combatHeader: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#60a5fa',
  },
  combatTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
  },
  diceSection: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 5,
  },
  gameOverText: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
  },
  logContainer: {
    flex: 1,
  },
  logContent: {
    padding: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#1f2937',
  },
});
