// BrigadeDetailScreen - detailed view and orders for a single brigade

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import ActionButton from '../components/ActionButton';
import PlayingCard from '../components/PlayingCard';
import FloatingEndTurnButton from '../components/FloatingEndTurnButton';

export default function BrigadeDetailScreen({ route, navigation }) {
  const { brigadeId } = route.params;
  const { gameState, issueOrder } = useGameEngine();
  const [selectedStance, setSelectedStance] = useState(null);
  const [pendingMoveRegion, setPendingMoveRegion] = useState(null);
  const [pendingAttackRegion, setPendingAttackRegion] = useState(null);

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
    setPendingMoveRegion(targetRegionId);
    setPendingAttackRegion(null);
    Alert.alert('Order Issued', `${brigade.name} will move to ${targetRegionId}`);
  };

  const handleAttack = (targetRegionId) => {
    issueOrder({
      type: 'attack',
      brigadeId: brigade.id,
      targetRegion: targetRegionId,
    });
    setPendingAttackRegion(targetRegionId);
    setPendingMoveRegion(null);
    Alert.alert('Order Issued', `${brigade.name} will attack ${targetRegionId}`);
  };

  const handleChangeStance = (stance) => {
    issueOrder({
      type: 'stance',
      brigadeId: brigade.id,
      stance,
    });
    setSelectedStance(stance);
    Alert.alert('Order Issued', `${brigade.name} orders changed to ${stance}`);
  };

  const stances = ['hold', 'mobile defense', 'counterattack', 'fallback'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {brigade.card && (
            <PlayingCard card={brigade.card} size="medium" />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{brigade.name}</Text>
            <Text style={styles.type}>{brigade.type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Strength" value={brigade.strength} />
            <StatItem label="Morale" value={brigade.morale} />
            <StatItem label="Supply" value={brigade.supply} />
            <StatItem label="Experience" value={brigade.experience} />
            <StatItem label="Drones" value={brigade.droneCount ?? brigade.drones ?? 0} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <Text style={styles.locationText}>{currentRegion.name}</Text>
          <Text style={styles.terrainText}>Terrain: {currentRegion.terrain}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Orders</Text>
          <Text style={styles.currentStance}>Current: {brigade.stance}</Text>
          <View style={styles.ordersButtons}>
            {stances.map(stance => (
              <ActionButton
                key={stance}
                title={stance}
                onPress={() => handleChangeStance(stance)}
                variant={stance === brigade.stance ? 'primary' : 'secondary'}
                style={styles.ordersButton}
              />
            ))}
          </View>
        </View>

        {adjacentRegions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Move To</Text>
            <View style={styles.ordersButtons}>
              {adjacentRegions.map(region => (
                <ActionButton
                  key={region.id}
                  title={`${region.name}`}
                  onPress={() => handleMove(region.id)}
                  variant={pendingMoveRegion === region.id ? 'primary' : 'secondary'}
                  style={styles.ordersButton}
                />
              ))}
            </View>
          </View>
        )}

        {enemyRegions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attack</Text>
            <View style={styles.ordersButtons}>
              {enemyRegions.map(region => (
                <ActionButton
                  key={region.id}
                  title={`${region.name} (${region.enemyStrengthEstimate})`}
                  onPress={() => handleAttack(region.id)}
                  variant={pendingAttackRegion === region.id ? 'primary' : 'danger'}
                  style={styles.ordersButton}
                />
              ))}
            </View>
          </View>
        )}

        <ActionButton
          title="Back to Campaign"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </ScrollView>
      <FloatingEndTurnButton />
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
    padding: 12,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 3,
  },
  type: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 6,
    marginTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 65,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  locationText: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 2,
  },
  terrainText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  currentStance: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  ordersButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ordersButton: {
    width: '48%',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});
