// TurnSummaryScreen - shows turn resolution log

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import LogEntry from '../components/LogEntry';
import ActionButton from '../components/ActionButton';

export default function TurnSummaryScreen({ navigation }) {
  const { gameState, saveGame } = useGameEngine();

  const handleContinue = async () => {
    await saveGame();
    
    if (gameState.gameOver) {
      navigation.navigate('MainMenu');
    } else {
      navigation.navigate('Campaign');
    }
  };

  const recentLog = gameState.eventLog.slice(-50);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turn {gameState.turn - 1} Summary</Text>
        {gameState.gameOver && (
          <Text style={[styles.gameOverText, { color: gameState.victory ? '#10b981' : '#ef4444' }]}>
            {gameState.victory ? 'VICTORY!' : 'DEFEAT'}
          </Text>
        )}
      </View>

      <ScrollView style={styles.logContainer} contentContainerStyle={styles.logContent}>
        {recentLog.map((entry, index) => (
          <LogEntry key={index} message={entry} index={index} />
        ))}
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
