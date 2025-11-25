// MainMenuScreen - entry point for the game

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import { hasSavedGame } from '../storage/saveGame';
import { DIFFICULTY_LEVELS } from '../config/difficultySettings';
import ActionButton from '../components/ActionButton';

export default function MainMenuScreen({ navigation }) {
  const { startNewGame, loadGame } = useGameEngine();
  const [saveExists, setSaveExists] = useState(false);
  const [showFactionSelect, setShowFactionSelect] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState('ukraine');
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_LEVELS.NORMAL);

  useEffect(() => {
    checkSave();
  }, []);

  const checkSave = async () => {
    const exists = await hasSavedGame();
    setSaveExists(exists);
  };

  const handleNewGame = () => {
    setShowFactionSelect(true);
  };

  const handleFactionSelected = (faction) => {
    setSelectedFaction(faction);
    setShowFactionSelect(false);
    setShowDifficulty(true);
  };

  const handleStartWithDifficulty = () => {
    startNewGame(selectedDifficulty, selectedFaction);
    navigation.navigate('Campaign');
  };

  const handleContinue = async () => {
    const loaded = await loadGame();
    if (loaded) {
      navigation.navigate('Campaign');
    }
  };

  const handleHowToPlay = () => {
    alert('Defend Ukraine by managing brigades, supply routes, and tactical decisions. Hold Kyiv and key supply corridors for 20 turns to win.');
  };

  if (showFactionSelect) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>SELECT FACTION</Text>
          <Text style={styles.subtitle}>Choose your side in the conflict</Text>

          <TouchableOpacity
            style={[styles.factionCard, styles.ukraineCard]}
            onPress={() => handleFactionSelected('ukraine')}
          >
            <Text style={styles.factionFlag}>🇺🇦</Text>
            <Text style={styles.factionName}>Ukraine</Text>
            <Text style={styles.factionDescription}>
              Defend your homeland. Hold Kyiv and vital supply routes against the invasion.
            </Text>
            <Text style={styles.factionObjective}>
              Victory: Control Kyiv and supply routes after 20 turns
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.factionCard, styles.russiaCard]}
            onPress={() => handleFactionSelected('russia')}
          >
            <Text style={styles.factionFlag}>🇷🇺</Text>
            <Text style={styles.factionName}>Russia</Text>
            <Text style={styles.factionDescription}>
              Execute the offensive. Capture Kyiv and cut Ukrainian supply lines.
            </Text>
            <Text style={styles.factionObjective}>
              Victory: Capture Kyiv within 20 turns
            </Text>
          </TouchableOpacity>

          <ActionButton
            title="Back"
            onPress={() => setShowFactionSelect(false)}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (showDifficulty) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.difficultyContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.difficultyTitle}>SELECT</Text>
            <Text style={styles.difficultyTitle}>DIFFICULTY</Text>
          </View>

          {Object.values(DIFFICULTY_LEVELS).map(level => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.difficultyCard,
                selectedDifficulty.id === level.id && styles.difficultyCardSelected
              ]}
              onPress={() => setSelectedDifficulty(level)}
            >
              <Text style={styles.difficultyName}>{level.name}</Text>
              <Text style={styles.difficultyDescription}>{level.description}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.buttonContainer}>
            <ActionButton
              title="Start Campaign"
              onPress={handleStartWithDifficulty}
              variant="primary"
            />
            <ActionButton
              title="Back"
              onPress={() => {
                setShowDifficulty(false);
                setShowFactionSelect(true);
              }}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>EASTERN</Text>
          <Text style={styles.title}>FRONT</Text>
        </View>
        <Text style={styles.subtitle}>A Modern Operational Wargame</Text>
        <Text style={styles.description}>Ukraine 2022</Text>

        <View style={styles.buttonContainer}>
          <ActionButton
            title="New Campaign"
            onPress={handleNewGame}
            variant="primary"
          />

          <ActionButton
            title="Continue Campaign"
            onPress={handleContinue}
            variant="secondary"
            disabled={!saveExists}
          />

          <ActionButton
            title="How to Play"
            onPress={handleHowToPlay}
            variant="secondary"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a strategic simulation focusing on operational decisions and logistics.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  difficultyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 64,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 60,
    textAlign: 'center',
    letterSpacing: 2,
  },
  difficultyTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 56,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  difficultyCard: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#374151',
    width: '100%',
    maxWidth: 350,
  },
  difficultyCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  difficultyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 8,
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  factionCard: {
    padding: 25,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 3,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  ukraineCard: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  russiaCard: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  factionFlag: {
    fontSize: 48,
    marginBottom: 10,
  },
  factionName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  factionDescription: {
    fontSize: 15,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  factionObjective: {
    fontSize: 13,
    color: '#fbbf24',
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
