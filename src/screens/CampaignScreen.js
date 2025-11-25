// CampaignScreen - main game screen showing brigades and regions

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import BrigadeCard from '../components/BrigadeCard';
import RegionCard from '../components/RegionCard';
import ActionButton from '../components/ActionButton';

export default function CampaignScreen({ navigation }) {
  const { gameState, endTurn, saveGame } = useGameEngine();

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

  const handleEndTurn = () => {
    endTurn();
    navigation.navigate('TurnSummary');
  };

  const handleBrigadePress = (brigadeId) => {
    navigation.navigate('BrigadeDetail', { brigadeId });
  };

  const handleSave = async () => {
    await saveGame();
    alert('Game saved successfully');
  };

  const playerControlledRegions = gameState.regions.filter(
    r => r.control === (gameState.playerFaction === 'ukraine' ? 'ukraine' : 'russia')
  ).length;
  const totalRegions = gameState.regions.length;
  
  const factionEmoji = gameState.playerFaction === 'ukraine' ? '🇺🇦' : '🇷🇺';
  const factionName = gameState.playerFaction === 'ukraine' ? 'Ukraine' : 'Russia';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{factionEmoji} Turn {gameState.turn}</Text>
          <Text style={styles.weather}>Weather: {gameState.weather.toUpperCase()}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>Controlled: {playerControlledRegions}/{totalRegions}</Text>
          <Text style={styles.stat}>{gameState.playerFaction === 'ukraine' ? 'Brigades' : 'Divisions'}: {gameState.brigades.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your {gameState.playerFaction === 'ukraine' ? 'Brigades' : 'Divisions'}</Text>
          {gameState.brigades.map(brigade => (
            <BrigadeCard
              key={brigade.id}
              brigade={brigade}
              onPress={() => handleBrigadePress(brigade.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regions</Text>
          {gameState.regions.map(region => (
            <RegionCard key={region.id} region={region} />
          ))}
        </View>

        {gameState.orders.length > 0 && (
          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>Pending Orders: {gameState.orders.length}</Text>
            <Text style={styles.ordersHint}>Orders will execute when you end the turn</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <ActionButton
            title="View Map"
            onPress={() => navigation.navigate('Map')}
            variant="secondary"
            style={styles.footerButton}
          />
          <ActionButton
            title="Save Game"
            onPress={handleSave}
            variant="secondary"
            style={styles.footerButton}
          />
          <ActionButton
            title="End Turn"
            onPress={handleEndTurn}
            variant="primary"
            style={styles.footerButton}
          />
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
  header: {
    padding: 20,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  weather: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    fontSize: 14,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#93c5fd',
    marginBottom: 12,
  },
  ordersSection: {
    backgroundColor: '#1f2937',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  ordersHint: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 5,
  },
  footer: {
    padding: 15,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
});
