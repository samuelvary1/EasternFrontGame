// MapScreen - Visual representation of the operational situation

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import ActionButton from '../components/ActionButton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = SCREEN_WIDTH - 30;
const MAP_HEIGHT = 420;

export default function MapScreen({ navigation }) {
  const { gameState } = useGameEngine();
  const [selectedRegion, setSelectedRegion] = useState(null);

  if (!gameState.gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No active campaign</Text>
      </SafeAreaView>
    );
  }

  // Geographic positions - arranged in a grid matching adjacency
  // Using absolute pixel positions for precise border alignment
  const regionPositions = {
    // Row 1 (North) - y: 0
    'belarus_border': { x: 0, y: 0, width: MAP_WIDTH * 0.25, height: 70 },
    'chernihiv': { x: MAP_WIDTH * 0.25, y: 0, width: MAP_WIDTH * 0.25, height: 70 },
    'sumy': { x: MAP_WIDTH * 0.50, y: 0, width: MAP_WIDTH * 0.25, height: 70 },
    
    // Row 2 (North-Central) - y: 70
    'hostomel': { x: 0, y: 70, width: MAP_WIDTH * 0.25, height: 70 },
    'brovary': { x: MAP_WIDTH * 0.25, y: 70, width: MAP_WIDTH * 0.25, height: 70 },
    'kharkiv': { x: MAP_WIDTH * 0.50, y: 70, width: MAP_WIDTH * 0.50, height: 70 },
    
    // Row 3 (Central-West) - y: 140
    'bucha': { x: 0, y: 140, width: MAP_WIDTH * 0.20, height: 70 },
    'kyiv': { x: MAP_WIDTH * 0.20, y: 140, width: MAP_WIDTH * 0.30, height: 70 },
    'poltava': { x: MAP_WIDTH * 0.50, y: 140, width: MAP_WIDTH * 0.25, height: 70 },
    'donbas': { x: MAP_WIDTH * 0.75, y: 140, width: MAP_WIDTH * 0.25, height: 70 },
    
    // Row 4 (Central) - y: 210
    'zhytomyr': { x: 0, y: 210, width: MAP_WIDTH * 0.20, height: 70 },
    'vasylkiv': { x: MAP_WIDTH * 0.20, y: 210, width: MAP_WIDTH * 0.30, height: 70 },
    'dnipro': { x: MAP_WIDTH * 0.50, y: 210, width: MAP_WIDTH * 0.30, height: 70 },
    'mariupol': { x: MAP_WIDTH * 0.80, y: 210, width: MAP_WIDTH * 0.20, height: 70 },
    
    // Row 5 (South) - y: 280
    'lviv': { x: 0, y: 280, width: MAP_WIDTH * 0.30, height: 70 },
    'odesa': { x: MAP_WIDTH * 0.30, y: 280, width: MAP_WIDTH * 0.20, height: 70 },
    'kherson': { x: MAP_WIDTH * 0.50, y: 280, width: MAP_WIDTH * 0.25, height: 70 },
    'zaporizhzhia': { x: MAP_WIDTH * 0.75, y: 280, width: MAP_WIDTH * 0.25, height: 70 },
  };

  const getRegionColor = (region) => {
    if (region.control === 'ukraine') return '#3b82f6';
    if (region.control === 'russia') return '#ef4444';
    return '#f59e0b';
  };

  const handleRegionPress = (region) => {
    setSelectedRegion(selectedRegion?.id === region.id ? null : region);
  };

  const renderRegion = (region) => {
    const pos = regionPositions[region.id];
    if (!pos) return null;

    const brigadeCount = gameState.brigades.filter(b => b.location === region.id).length;
    const hasEnemies = region.enemyStrengthEstimate > 0;
    const isSelected = selectedRegion?.id === region.id;

    return (
      <TouchableOpacity
        key={region.id}
        style={[
          styles.region,
          {
            left: pos.x,
            top: pos.y,
            width: pos.width,
            height: pos.height,
            backgroundColor: getRegionColor(region),
            borderColor: '#1f2937',
            borderWidth: 1,
          },
          isSelected && styles.regionSelected,
        ]}
        onPress={() => handleRegionPress(region)}
        activeOpacity={0.7}
      >
        <Text style={styles.regionName} numberOfLines={1} adjustsFontSizeToFit>
          {region.name}
        </Text>

        {region.isObjective && (
          <Text style={styles.objectiveMarker}>⭐</Text>
        )}

        <View style={styles.regionIcons}>
          {brigadeCount > 0 && (
            <Text style={styles.iconText}>🛡️{brigadeCount}</Text>
          )}
          {hasEnemies && (
            <Text style={styles.iconText}>⚔️{region.enemyStrengthEstimate}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tactical Map - Turn {gameState.turn}</Text>
        <Text style={styles.weather}>{gameState.weather.toUpperCase()}</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.mapContainer}>
          <View style={styles.map}>
            {gameState.regions.map(region => renderRegion(region))}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Ukraine</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Russia</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Contested</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendIcon}>🛡️</Text>
              <Text style={styles.legendText}>Your Forces</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendIcon}>⚔️</Text>
              <Text style={styles.legendText}>Enemy</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendIcon}>⭐</Text>
              <Text style={styles.legendText}>Objective</Text>
            </View>
          </View>
        </View>

        {selectedRegion && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedTitle}>{selectedRegion.name}</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Control</Text>
                <Text style={[styles.infoValue, { color: getRegionColor(selectedRegion) }]}>
                  {selectedRegion.control.toUpperCase()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Terrain</Text>
                <Text style={styles.infoValue}>{selectedRegion.terrain}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Supply</Text>
                <Text style={styles.infoValue}>{selectedRegion.baseSupply}</Text>
              </View>
            </View>

            {selectedRegion.enemyStrengthEstimate > 0 && (
              <View style={styles.enemySection}>
                <Text style={styles.enemyText}>
                  Enemy Strength: {selectedRegion.enemyStrengthEstimate}
                </Text>
              </View>
            )}

            {gameState.brigades.filter(b => b.location === selectedRegion.id).length > 0 && (
              <View style={styles.brigadesSection}>
                <Text style={styles.brigadesTitle}>Your Forces:</Text>
                {gameState.brigades
                  .filter(b => b.location === selectedRegion.id)
                  .map(b => (
                    <Text key={b.id} style={styles.brigadeItem}>
                      • {b.name} - STR:{b.strength} MOR:{b.morale}
                    </Text>
                  ))}
              </View>
            )}

            <View style={styles.adjacentSection}>
              <Text style={styles.adjacentTitle}>Adjacent:</Text>
              <View style={styles.adjacentList}>
                {selectedRegion.adjacency.map(adjId => {
                  const adjRegion = gameState.regions.find(r => r.id === adjId);
                  return (
                    <View key={adjId} style={styles.adjacentChip}>
                      <View style={[styles.adjacentDot, { backgroundColor: getRegionColor(adjRegion) }]} />
                      <Text style={styles.adjacentName}>
                        {adjRegion?.name.split(' ')[0] || adjId}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('RegionDetail', { regionId: selectedRegion.id })}
            >
              <Text style={styles.viewDetailsText}>View Full Details →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <ActionButton
          title="Back to Campaign"
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
    padding: 15,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  weather: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93c5fd',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  mapContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  map: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#374151',
    position: 'relative',
    marginBottom: 15,
  },
  region: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  regionSelected: {
    borderWidth: 3,
    borderColor: '#fbbf24',
    zIndex: 10,
  },
  regionName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  objectiveMarker: {
    fontSize: 14,
    position: 'absolute',
    top: 2,
    right: 2,
  },
  regionIcons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  iconText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  legend: {
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  legendIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#d1d5db',
  },
  selectedInfo: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#93c5fd',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  enemySection: {
    backgroundColor: '#7f1d1d',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  enemyText: {
    fontSize: 13,
    color: '#fca5a5',
    fontWeight: '600',
  },
  brigadesSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  brigadesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 6,
  },
  brigadeItem: {
    fontSize: 12,
    color: '#d1d5db',
    marginVertical: 2,
  },
  adjacentSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginBottom: 12,
  },
  adjacentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 8,
  },
  adjacentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  adjacentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adjacentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  adjacentName: {
    fontSize: 11,
    color: '#d1d5db',
  },
  viewDetailsButton: {
    backgroundColor: '#1e40af',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#93c5fd',
  },
  footer: {
    padding: 15,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});
