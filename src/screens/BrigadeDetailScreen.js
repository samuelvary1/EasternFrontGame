// BrigadeDetailScreen - detailed view and orders for a single brigade

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import ActionButton from '../components/ActionButton';

export default function BrigadeDetailScreen({ route, navigation }) {
  const { brigadeId } = route.params;
  const { gameState, issueOrder } = useGameEngine();
  const [selectedStance, setSelectedStance] = useState(null);

  const brigade = gameState.brigades.find(b => b.id === brigadeId);
  const currentRegion = gameState.regions.find(r => r.id === brigade?.location);

  if (!brigade || !currentRegion) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Brigade not found</Text>
      </SafeAreaView>
    );
  }

  const adjacentRegions = currentRegion.adjacency
    .map(id => gameState.regions.find(r => r.id === id))
    .filter(r => r);

  const enemyRegions = adjacentRegions.filter(r => r.control !== 'ukraine' || r.enemyStrengthEstimate > 20);

  const handleMove = (targetRegionId) => {
    issueOrder({
      type: 'move',
      brigadeId: brigade.id,
      targetRegion: targetRegionId,
    });
    Alert.alert('Order Issued', `${brigade.name} will move to ${targetRegionId}`);
  };

  const handleAttack = (targetRegionId) => {
    issueOrder({
      type: 'attack',
      brigadeId: brigade.id,
      targetRegion: targetRegionId,
    });
    Alert.alert('Order Issued', `${brigade.name} will attack ${targetRegionId}`);
  };

  const handleChangeStance = (stance) => {
    issueOrder({
      type: 'stance',
      brigadeId: brigade.id,
      stance,
    });
    setSelectedStance(stance);
    Alert.alert('Order Issued', `${brigade.name} stance changed to ${stance}`);
  };

  const handleAssignRecon = () => {
    if (brigade.droneCount > 0) {
      issueOrder({
        type: 'assignRecon',
        brigadeId: brigade.id,
      });
      Alert.alert('Order Issued', `${brigade.name} will conduct reconnaissance`);
    } else {
      Alert.alert('No Drones', 'This brigade has no drones available for reconnaissance');
    }
  };

  const handleCounterbattery = () => {
    if (brigade.artilleryAmmo > 20) {
      issueOrder({
        type: 'counterbattery',
        brigadeId: brigade.id,
      });
      Alert.alert('Order Issued', `${brigade.name} will conduct counterbattery fire`);
    } else {
      Alert.alert('Low Ammo', 'Insufficient artillery ammunition for counterbattery fire');
    }
  };

  const stances = ['hold', 'mobile defense', 'counterattack', 'fallback'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{brigade.name}</Text>
          <Text style={styles.type}>{brigade.type.toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Strength" value={brigade.strength} />
            <StatItem label="Morale" value={brigade.morale} />
            <StatItem label="Supply" value={brigade.supply} />
            <StatItem label="Fuel" value={brigade.fuel} />
            <StatItem label="Ammo" value={brigade.ammo} />
            <StatItem label="Experience" value={brigade.experience} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Drones" value={brigade.droneCount} />
            <StatItem label="Artillery" value={brigade.artilleryAmmo} />
            <StatItem label="Anti-Armor" value={brigade.antiArmorRating} />
            <StatItem label="Air Defense" value={brigade.airDefenseBonus} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <Text style={styles.locationText}>{currentRegion.name}</Text>
          <Text style={styles.terrainText}>Terrain: {currentRegion.terrain}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Stance</Text>
          <Text style={styles.currentStance}>Current: {brigade.stance}</Text>
          <View style={styles.stanceButtons}>
            {stances.map(stance => (
              <ActionButton
                key={stance}
                title={stance}
                onPress={() => handleChangeStance(stance)}
                variant={stance === brigade.stance ? 'primary' : 'secondary'}
                style={styles.stanceButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Actions</Text>
          <ActionButton
            title="Assign Reconnaissance"
            onPress={handleAssignRecon}
            variant="secondary"
            disabled={brigade.droneCount === 0}
          />
          <ActionButton
            title="Counterbattery Fire"
            onPress={handleCounterbattery}
            variant="secondary"
            disabled={brigade.artilleryAmmo < 20}
          />
        </View>

        {adjacentRegions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Move To</Text>
            {adjacentRegions.map(region => (
              <ActionButton
                key={region.id}
                title={`${region.name} (${region.control})`}
                onPress={() => handleMove(region.id)}
                variant="secondary"
              />
            ))}
          </View>
        )}

        {enemyRegions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attack</Text>
            {enemyRegions.map(region => (
              <ActionButton
                key={region.id}
                title={`Attack ${region.name} (Enemy: ${region.enemyStrengthEstimate})`}
                onPress={() => handleAttack(region.id)}
                variant="danger"
              />
            ))}
          </View>
        )}

        <ActionButton
          title="Back to Campaign"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 5,
  },
  type: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  locationText: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 4,
  },
  terrainText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  currentStance: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 10,
  },
  stanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stanceButton: {
    flex: 1,
    minWidth: 140,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});
