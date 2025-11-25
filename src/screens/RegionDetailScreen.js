// RegionDetailScreen - detailed view of a region with tactical options

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import ActionButton from '../components/ActionButton';
import BrigadeCard from '../components/BrigadeCard';

export default function RegionDetailScreen({ route, navigation }) {
  const { regionId } = route.params;
  const { gameState, issueOrder } = useGameEngine();

  const region = gameState.regions.find(r => r.id === regionId);
  
  if (!region) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Region not found</Text>
      </SafeAreaView>
    );
  }

  // Find brigades in this region
  const brigadesHere = gameState.brigades.filter(b => b.location === region.id);

  // Find adjacent regions
  const adjacentRegions = region.adjacency
    .map(id => gameState.regions.find(r => r.id === id))
    .filter(r => r);

  // Find potential attackers (enemy brigades in adjacent regions)
  const potentialAttackers = adjacentRegions.flatMap(adjRegion => {
    const enemyBrigades = gameState.brigades.filter(b => b.location === adjRegion.id);
    return enemyBrigades.map(brigade => ({
      brigade,
      fromRegion: adjRegion,
    }));
  }).filter(item => item.brigade.location !== region.id);

  // Enemy forces that could attack from adjacent enemy/contested regions
  const enemyThreats = adjacentRegions.filter(r => 
    r.control === 'russia' || (r.control === 'contested' && r.enemyStrengthEstimate > 0)
  );

  // Friendly adjacent regions (for reinforcement)
  const friendlyAdjacent = adjacentRegions.filter(r => r.control === 'ukraine');

  // Potential targets to attack (enemy adjacent)
  const potentialTargets = adjacentRegions.filter(r => 
    r.control !== 'ukraine' || r.enemyStrengthEstimate > 20
  );

  const handleMoveBrigadeHere = (fromRegionId) => {
    const brigadesInSource = gameState.brigades.filter(b => b.location === fromRegionId);
    
    if (brigadesInSource.length === 0) {
      Alert.alert('No Brigades', 'No brigades available in that region');
      return;
    }

    if (brigadesInSource.length === 1) {
      issueOrder({
        type: 'move',
        brigadeId: brigadesInSource[0].id,
        targetRegion: region.id,
      });
      Alert.alert('Order Issued', `${brigadesInSource[0].name} will move to ${region.name}`);
    } else {
      // Show selection if multiple brigades
      Alert.alert(
        'Select Brigade',
        'Multiple brigades available',
        brigadesInSource.map(b => ({
          text: b.name,
          onPress: () => {
            issueOrder({
              type: 'move',
              brigadeId: b.id,
              targetRegion: region.id,
            });
            Alert.alert('Order Issued', `${b.name} will move to ${region.name}`);
          },
        }))
      );
    }
  };

  const handleAttackFrom = (targetRegionId) => {
    if (brigadesHere.length === 0) {
      Alert.alert('No Forces', 'No brigades in this region to attack with');
      return;
    }

    const targetRegion = gameState.regions.find(r => r.id === targetRegionId);

    if (brigadesHere.length === 1) {
      issueOrder({
        type: 'attack',
        brigadeId: brigadesHere[0].id,
        targetRegion: targetRegionId,
      });
      Alert.alert('Order Issued', `${brigadesHere[0].name} will attack ${targetRegion.name}`);
    } else {
      // Show selection if multiple brigades
      Alert.alert(
        'Select Brigade',
        'Choose which brigade will attack',
        brigadesHere.map(b => ({
          text: `${b.name} (STR: ${b.strength})`,
          onPress: () => {
            issueOrder({
              type: 'attack',
              brigadeId: b.id,
              targetRegion: targetRegionId,
            });
            Alert.alert('Order Issued', `${b.name} will attack ${targetRegion.name}`);
          },
        }))
      );
    }
  };

  const getControlColor = (control) => {
    if (control === 'ukraine') return '#3b82f6';
    if (control === 'russia') return '#ef4444';
    return '#f59e0b';
  };

  const getThreatLevel = () => {
    const totalEnemyStrength = enemyThreats.reduce((sum, r) => sum + r.enemyStrengthEstimate, 0);
    if (totalEnemyStrength > 150) return { level: 'CRITICAL', color: '#dc2626' };
    if (totalEnemyStrength > 100) return { level: 'HIGH', color: '#f59e0b' };
    if (totalEnemyStrength > 50) return { level: 'MODERATE', color: '#fbbf24' };
    return { level: 'LOW', color: '#10b981' };
  };

  const threat = getThreatLevel();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Region Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{region.name}</Text>
          <View style={[styles.controlBadge, { backgroundColor: getControlColor(region.control) }]}>
            <Text style={styles.controlText}>{region.control.toUpperCase()}</Text>
          </View>
        </View>

        {/* Region Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Region Information</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="Terrain" value={region.terrain} />
            <InfoItem label="Supply Level" value={region.baseSupply} />
            <InfoItem label="Air Defense" value={region.airDefenseLevel} />
          </View>
          
          {region.artilleryIntensity > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                💥 Artillery Intensity: {region.artilleryIntensity}
              </Text>
            </View>
          )}

          {region.electronicWarfareActive && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚡ Electronic Warfare Active - Communications Degraded
              </Text>
            </View>
          )}

          {region.isObjective && (
            <View style={styles.objectiveBox}>
              <Text style={styles.objectiveText}>
                ★ STRATEGIC OBJECTIVE - Must Hold
              </Text>
            </View>
          )}
        </View>

        {/* Threat Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Threat Assessment</Text>
          <View style={[styles.threatBox, { borderColor: threat.color }]}>
            <Text style={[styles.threatLevel, { color: threat.color }]}>
              Threat Level: {threat.level}
            </Text>
            {region.enemyStrengthEstimate > 0 && (
              <Text style={styles.threatDetail}>
                Local Enemy Forces: {region.enemyStrengthEstimate}
              </Text>
            )}
          </View>
        </View>

        {/* Brigades in Region */}
        {brigadesHere.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Forces ({brigadesHere.length})</Text>
            {brigadesHere.map(brigade => (
              <BrigadeCard
                key={brigade.id}
                brigade={brigade}
                onPress={() => navigation.navigate('BrigadeDetail', { brigadeId: brigade.id })}
              />
            ))}
          </View>
        )}

        {/* Enemy Threats from Adjacent Regions */}
        {enemyThreats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Can Be Attacked By</Text>
            {enemyThreats.map(enemyRegion => (
              <View key={enemyRegion.id} style={styles.threatCard}>
                <View style={styles.threatHeader}>
                  <Text style={styles.threatName}>{enemyRegion.name}</Text>
                  <Text style={styles.threatStrength}>
                    Enemy: {enemyRegion.enemyStrengthEstimate}
                  </Text>
                </View>
                <Text style={styles.threatTerrain}>
                  Terrain: {enemyRegion.terrain}
                </Text>
                {enemyRegion.artilleryIntensity > 30 && (
                  <Text style={styles.threatArtillery}>
                    💥 Heavy Artillery Support
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Potential Targets */}
        {potentialTargets.length > 0 && brigadesHere.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Can Attack</Text>
            {potentialTargets.map(target => (
              <View key={target.id} style={styles.targetCard}>
                <View style={styles.targetHeader}>
                  <Text style={styles.targetName}>{target.name}</Text>
                  <View style={[styles.targetControl, { backgroundColor: getControlColor(target.control) }]}>
                    <Text style={styles.targetControlText}>{target.control}</Text>
                  </View>
                </View>
                <Text style={styles.targetDetail}>
                  Enemy Strength: {target.enemyStrengthEstimate} | Terrain: {target.terrain}
                </Text>
                <ActionButton
                  title="Order Attack"
                  onPress={() => handleAttackFrom(target.id)}
                  variant="danger"
                />
              </View>
            ))}
          </View>
        )}

        {/* Reinforcement Options */}
        {friendlyAdjacent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reinforce From</Text>
            {friendlyAdjacent.map(friendlyRegion => {
              const brigadesAvailable = gameState.brigades.filter(
                b => b.location === friendlyRegion.id
              ).length;
              
              if (brigadesAvailable === 0) return null;

              return (
                <View key={friendlyRegion.id} style={styles.reinforceCard}>
                  <Text style={styles.reinforceName}>{friendlyRegion.name}</Text>
                  <Text style={styles.reinforceDetail}>
                    {brigadesAvailable} brigade{brigadesAvailable > 1 ? 's' : ''} available
                  </Text>
                  <ActionButton
                    title="Move Brigade Here"
                    onPress={() => handleMoveBrigadeHere(friendlyRegion.id)}
                    variant="secondary"
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Adjacent Regions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adjacent Regions ({adjacentRegions.length})</Text>
          {adjacentRegions.map(adj => (
            <TouchableRegionCard
              key={adj.id}
              region={adj}
              onPress={() => navigation.replace('RegionDetail', { regionId: adj.id })}
            />
          ))}
        </View>

        <ActionButton
          title="Back to Map"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TouchableRegionCard({ region, onPress }) {
  const getControlColor = (control) => {
    if (control === 'ukraine') return '#3b82f6';
    if (control === 'russia') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <View style={styles.adjacentCard} onStartShouldSetResponder={() => { onPress(); return true; }}>
      <View style={styles.adjacentHeader}>
        <Text style={styles.adjacentName}>{region.name}</Text>
        <View style={[styles.adjacentControl, { backgroundColor: getControlColor(region.control) }]}>
          <Text style={styles.adjacentControlText}>{region.control}</Text>
        </View>
      </View>
      {region.enemyStrengthEstimate > 0 && (
        <Text style={styles.adjacentEnemy}>⚔️ Enemy: {region.enemyStrengthEstimate}</Text>
      )}
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
    marginBottom: 8,
  },
  controlBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  controlText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 10,
  },
  infoItem: {
    alignItems: 'center',
    minWidth: 100,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  warningBox: {
    backgroundColor: '#7c2d12',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  objectiveBox: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  objectiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93c5fd',
  },
  threatBox: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#1f2937',
  },
  threatLevel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  threatDetail: {
    fontSize: 14,
    color: '#d1d5db',
  },
  threatCard: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  threatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  threatName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fca5a5',
    flex: 1,
  },
  threatStrength: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  threatTerrain: {
    fontSize: 13,
    color: '#fecaca',
    marginBottom: 4,
  },
  threatArtillery: {
    fontSize: 12,
    color: '#fb923c',
    fontWeight: '600',
  },
  targetCard: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f3f4f6',
    flex: 1,
  },
  targetControl: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  targetControlText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  targetDetail: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 10,
  },
  reinforceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  reinforceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  reinforceDetail: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 10,
  },
  adjacentCard: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  adjacentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adjacentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    flex: 1,
  },
  adjacentControl: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adjacentControlText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  adjacentEnemy: {
    fontSize: 12,
    color: '#f87171',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});
