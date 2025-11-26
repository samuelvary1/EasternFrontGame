// Regions List - Dedicated screen for viewing all regions

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import RegionCard from '../components/RegionCard';
import ActionButton from '../components/ActionButton';

export default function RegionsListScreen({ navigation }) {
  const { gameState } = useGameEngine();

  if (!gameState.gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No active campaign</Text>
        <ActionButton
          title="Return to Menu"
          onPress={() => navigation.navigate('MainMenu')}
        />
      </SafeAreaView>
    );
  }

  const factionEmoji = gameState.playerFaction === 'ukraine' ? '🇺🇦' : '🇷🇺';
  const playerControlledRegions = gameState.regions.filter(
    r => r.control === gameState.playerFaction
  ).length;

  // Sort regions: player-controlled first, then contested, then enemy
  const sortedRegions = [...gameState.regions].sort((a, b) => {
    const getControlPriority = (region) => {
      if (region.control === gameState.playerFaction) return 0;
      if (region.control === 'contested') return 1;
      return 2;
    };
    return getControlPriority(a) - getControlPriority(b);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{factionEmoji} TERRITORY INTEL</Text>
        <Text style={styles.subtitle}>Turn {gameState.turn} • Controlled: {playerControlledRegions}/{gameState.regions.length}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {sortedRegions.map(region => (
          <RegionCard 
            key={region.id} 
            region={region}
            onPress={() => navigation.navigate('RegionDetail', { regionId: region.id })}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <ActionButton
          title="Back to Mission Control"
          onPress={() => navigation.goBack()}
          variant="secondary"
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
    backgroundColor: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f3f4f6',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
});
