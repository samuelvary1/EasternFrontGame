//TurnSummaryScreen - shows turn resolution log

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Animated, TouchableOpacity } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import LogEntry from '../components/LogEntry';
import ActionButton from '../components/ActionButton';
import ThreeDDiceRoll from '../components/ThreeDDiceRoll';
import CombatLogEntry from '../components/CombatLogEntry';

export default function TurnSummaryScreen({ navigation }) {
  const { gameState, saveGame, markTurnSummaryViewed } = useGameEngine();
  const [diceAnimationVisible, setDiceAnimationVisible] = useState(false);
  const [currentCombatIndex, setCurrentCombatIndex] = useState(0);
  const [combatEvents, setCombatEvents] = useState([]);
  const [completedCombats, setCompletedCombats] = useState(new Set());
  const [viewingTurnNumber, setViewingTurnNumber] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const scrollViewRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimeoutRef = useRef(null);
  const previewOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initialize to most recent turn if not set (only runs once)
    const mostRecentTurn = gameState.turn - 1;
    if (viewingTurnNumber === null) {
      setViewingTurnNumber(mostRecentTurn);
    }
  }, [gameState.turn, viewingTurnNumber]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Separate effect for parsing combat data and controlling animations
  useEffect(() => {
    if (viewingTurnNumber === null) return;
    
    console.log('=== TurnSummaryScreen parsing combats for turn:', viewingTurnNumber);
    
    // Extract combat events from the VIEWING turn
    const currentTurnMarker = `Turn ${viewingTurnNumber} Resolution`;
    
    // Find the LAST occurrence of the turn marker (most recent)
    let currentTurnStartIndex = -1;
    for (let i = gameState.eventLog.length - 1; i >= 0; i--) {
      if (gameState.eventLog[i].includes(currentTurnMarker)) {
        currentTurnStartIndex = i;
        break;
      }
    }
    
    console.log('Looking for marker:', currentTurnMarker);
    console.log('Marker found at index:', currentTurnStartIndex);
    
    // If we can't find the current turn marker, don't show any animations
    if (currentTurnStartIndex === -1) {
      console.log('No current turn marker found - no animations will play');
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
    
    // Check if this turn has already been viewed or if we're navigating to an old turn
    const mostRecentTurn = gameState.turn - 1;
    const isViewingOldTurn = viewingTurnNumber < mostRecentTurn;
    const alreadyViewedThisTurn = gameState.lastViewedTurnSummary === viewingTurnNumber;
    
    // Only show preview and animations if:
    // 1. This is the most recent turn AND
    // 2. We haven't viewed it before
    const shouldAnimate = viewingTurnNumber === mostRecentTurn && !alreadyViewedThisTurn;
    
    if (shouldAnimate) {
      console.log('First time viewing current turn - showing preview and animations');
      
      // Mark that we're viewing this turn's summary
      markTurnSummaryViewed(viewingTurnNumber);
      
      // Reset completed combats
      setCompletedCombats(new Set());
      
      // Show preview of the turn summary first
      setShowPreview(true);
      progressAnim.setValue(0);
      previewOpacity.setValue(1);
      
      // Start showing combat animations if any exist
      if (combats.length > 0) {
        setCurrentCombatIndex(0);
        
        // Animate progress bar but DON'T auto-advance
        // User must click "Start Battles Now" button
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }).start();
      } else {
        // No combats, auto-hide preview after showing stats
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          setShowPreview(false);
        }, 1000);
      }
    } else {
      // Already viewed or viewing old turn - show everything immediately, no animations
      console.log('Already viewed or old turn - showing all results immediately');
      setShowPreview(false);
      setDiceAnimationVisible(false);
      const allCompleted = new Set(combats.map((_, idx) => idx));
      setCompletedCombats(allCompleted);
    }
  }, [viewingTurnNumber, markTurnSummaryViewed, progressAnim]);

  const handleCombatComplete = () => {
    // Mark this combat as completed so we can show its results
    setCompletedCombats(prev => new Set([...prev, currentCombatIndex]));
    
    // Dice animation completes - hide it
    setDiceAnimationVisible(false);
    
    // Scroll to top when animation completes
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
    
    // Show next combat after a delay
    if (currentCombatIndex < combatEvents.length - 1) {
      setTimeout(() => {
        setCurrentCombatIndex(prev => prev + 1);
        setDiceAnimationVisible(true);
      }, 1000);
    }
  };

  const handleSkipPreview = () => {
    // Clear any pending auto-advance timeouts
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    // Start animation IMMEDIATELY so it's behind the fading preview
    setDiceAnimationVisible(true);
    
    // Then fade out preview on top of it
    Animated.timing(previewOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // After fade completes, hide preview
      setShowPreview(false);
    });
  };

  const handleContinue = async () => {
    await saveGame();
    
    if (gameState.gameOver) {
      navigation.navigate('MainMenu');
    } else {
      navigation.navigate('Campaign');
    }
  };

  const currentCombat = combatEvents[currentCombatIndex];

  // Extract only the VIEWING turn's log entries
  const effectiveViewingTurn = viewingTurnNumber ?? (gameState.turn - 1);
  const currentTurnMarker = `Turn ${effectiveViewingTurn} Resolution`;
  let currentTurnStartIndex = -1;
  
  // Find the start of the current turn
  for (let i = gameState.eventLog.length - 1; i >= 0; i--) {
    if (gameState.eventLog[i].includes(currentTurnMarker)) {
      currentTurnStartIndex = i;
      break;
    }
  }
  
  // Get only this turn's entries (or show a message if turn not found)
  const currentTurnLog = currentTurnStartIndex !== -1 
    ? gameState.eventLog.slice(currentTurnStartIndex)
    : [];
  
  // Filter out the turn header and guidance messages
  const filteredLog = currentTurnLog.filter(entry => {
    // Skip turn resolution header
    if (entry.includes('=== Turn') && entry.includes('Resolution ===')) return false;
    // Skip guidance messages from turn 0/1
    if (entry.includes('FIRST TURN GUIDANCE')) return false;
    if (entry.includes('Campaign begins')) return false;
    if (entry.includes('Check the MAP')) return false;
    if (entry.includes('Review your brigades')) return false;
    if (entry.includes('When ready, end your turn')) return false;
    if (entry.trim().startsWith('•')) return false;
    if (entry.trim() === '') return false;
    return true;
  });

  // Group log entries into combat sections and regular entries
  const groupedLog = [];
  let i = 0;
  const forwardLog = filteredLog; // Already in chronological order
  
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
  
  // Keep events in chronological order (no sorting)
  // This makes it easier to follow what happened during the turn

  return (
    <SafeAreaView style={styles.container}>
      {/* Preview overlay - shows briefly before animations */}
      {showPreview && combatEvents.length > 0 && (
        <Animated.View style={[styles.previewOverlay, { opacity: previewOpacity }]}>
          <View style={styles.previewContent}>
            <Text style={styles.previewTitle}>Turn {effectiveViewingTurn} Complete</Text>
            <View style={styles.previewStats}>
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatValue}>{combatEvents.length}</Text>
                <Text style={styles.previewStatLabel}>
                  {combatEvents.length === 1 ? 'Battle' : 'Battles'}
                </Text>
              </View>
              <View style={styles.previewStatItem}>
                <Text style={styles.previewStatValue}>{filteredLog.length}</Text>
                <Text style={styles.previewStatLabel}>Events</Text>
              </View>
            </View>
            <View style={styles.previewLoadingContainer}>
              <View style={styles.previewLoadingBar}>
                <Animated.View 
                  style={[
                    styles.previewLoadingFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]} 
                />
              </View>
              <Text style={styles.previewLoadingText}>Preparing battle animations...</Text>
            </View>
            <TouchableOpacity 
              style={styles.previewSkipButton}
              onPress={handleSkipPreview}
              activeOpacity={0.8}
            >
              <Text style={styles.previewSkipButtonText}>Start Battles Now ▶</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {diceAnimationVisible && (
        <View style={styles.combatContainer}>
          <View style={styles.combatHeader}>
            <Text style={styles.battleCounter}>
              Battle {currentCombatIndex + 1} of {combatEvents.length}
            </Text>
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
        <View style={styles.turnNavigation}>
          <ActionButton
            title="◀ Previous"
            onPress={() => {
              if (effectiveViewingTurn > 1) {
                setViewingTurnNumber(effectiveViewingTurn - 1);
                setDiceAnimationVisible(false);
              }
            }}
            variant="secondary"
            disabled={effectiveViewingTurn <= 1}
            style={styles.navButton}
          />
          <View style={styles.turnInfo}>
            <Text style={styles.title}>Turn {effectiveViewingTurn}</Text>
            {effectiveViewingTurn === gameState.turn - 1 && (
              <Text style={styles.currentTurnBadge}>Current</Text>
            )}
          </View>
          <ActionButton
            title="Next ▶"
            onPress={() => {
              if (effectiveViewingTurn < gameState.turn - 1) {
                setViewingTurnNumber(effectiveViewingTurn + 1);
                setDiceAnimationVisible(false);
              }
            }}
            variant="secondary"
            disabled={effectiveViewingTurn >= gameState.turn - 1}
            style={styles.navButton}
          />
        </View>
        {gameState.gameOver && (
          <Text style={[styles.gameOverText, { color: gameState.victory ? '#10b981' : '#ef4444' }]}>
            {gameState.victory ? 'VICTORY!' : 'DEFEAT'}
          </Text>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.logContainer} 
        contentContainerStyle={styles.logContent}
      >
        {groupedLog.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No significant events this turn</Text>
            <Text style={styles.emptyStateSubtext}>Your forces maintained their positions</Text>
          </View>
        ) : (
          groupedLog.map((item, index) => {
            if (item.type === 'combat') {
              // Find which combat this is (match by messages)
              const combatIndex = combatEvents.findIndex(c => 
                item.messages.some(msg => 
                  msg.includes(c.attackerName) && msg.includes(c.defenderName)
                )
              );
              
              // Only show combat results if animation has completed or no animations exist
              const shouldShow = combatEvents.length === 0 || completedCombats.has(combatIndex);
              
              if (!shouldShow) {
                return null; // Hide combat results until animation completes
              }
              
              return <CombatLogEntry key={`combat-${index}`} messages={item.messages} />;
            } else {
              return <LogEntry key={`log-${index}`} message={item.message} index={index} />;
            }
          })
        )}
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
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111827',
    zIndex: 1001,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#60a5fa',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  previewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 4,
  },
  previewStatLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  previewLoadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewLoadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  previewLoadingFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  previewLoadingText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  previewSkipButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  previewSkipButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  battleCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
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
  turnNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    minWidth: 100,
  },
  turnInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 5,
  },
  currentTurnBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#065f46',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#1f2937',
  },
});
