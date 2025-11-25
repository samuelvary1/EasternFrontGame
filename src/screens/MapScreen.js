// MapScreen - Visual representation of the operational situation

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import ActionButton from '../components/ActionButton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = SCREEN_WIDTH - 40;
const MAP_HEIGHT = 600;

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

  // Define region positions on the map (x, y coordinates as percentages)
  const regionPositions = {
    'kyiv_center': { x: 50, y: 50, width: 80, height: 60 },
    'kyiv_northwest': { x: 35, y: 25, width: 70, height: 50 },
    'kyiv_south': { x: 50, y: 75, width: 70, height: 45 },
    'chernihiv_approach': { x: 60, y: 10, width: 65, height: 45 },
    'belarus_border': { x: 25, y: 5, width: 60, height: 40 },
    'zhytomyr_highway': { x: 20, y: 75, width: 65, height: 40 },
    'western_supply': { x: 5, y: 85, width: 60, height: 40 },
    'kharkiv_front': { x: 85, y: 40, width: 70, height: 55 },
    'kharkiv_east': { x: 90, y: 25, width: 55, height: 45 },
    'izyum_axis': { x: 85, y: 65, width: 60, height: 45 },
    'russian_border': { x: 95, y: 15, width: 50, height: 40 },
  };

  // Define connections (adjacency lines)
  const connections = [
    ['kyiv_center', 'kyiv_northwest'],
    ['kyiv_center', 'kyiv_south'],
    ['kyiv_northwest', 'chernihiv_approach'],
    ['kyiv_northwest', 'belarus_border'],
    ['kyiv_south', 'zhytomyr_highway'],
    ['zhytomyr_highway', 'western_supply'],
    ['chernihiv_approach', 'belarus_border'],
    ['kharkiv_front', 'kharkiv_east'],
    ['kharkiv_front', 'izyum_axis'],
    ['kharkiv_east', 'russian_border'],
  ];

  const getRegionColor = (region) => {
    if (region.control === 'ukraine') return '#3b82f6';
    if (region.control === 'russia') return '#ef4444';
    return '#f59e0b';
  };

  const getRegionBorderColor = (region) => {
    if (region.isObjective) return '#fbbf24';
    return '#1f2937';
  };

  const handleRegionPress = (region) => {
    setSelectedRegion(region);
  };

  const renderRegion = (region) => {
    const pos = regionPositions[region.id];
    if (!pos) return null;

    const brigadeCount = gameState.brigades.filter(b => b.location === region.id).length;
    const hasEnemies = region.enemyStrengthEstimate > 0;

    return (
      <View
        key={region.id}
        style={[
          styles.region,
          {
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: pos.width,
            height: pos.height,
            backgroundColor: getRegionColor(region),
            borderColor: getRegionBorderColor(region),
            borderWidth: region.isObjective ? 3 : 1,
          },
        ]}
        onStartShouldSetResponder={() => {
          handleRegionPress(region);
          return true;
        }}
      >
        <Text style={styles.regionName} numberOfLines={2}>
          {region.name.split(' ').slice(0, 2).join(' ')}
        </Text>
        
        {brigadeCount > 0 && (
          <View style={styles.brigadeIndicator}>
            <Text style={styles.brigadeCount}>🛡️ {brigadeCount}</Text>
          </View>
        )}
        
        {hasEnemies && (
          <View style={styles.enemyIndicator}>
            <Text style={styles.enemyStrength}>⚔️ {region.enemyStrengthEstimate}</Text>
          </View>
        )}

        {region.electronicWarfareActive && (
          <View style={styles.ewIndicator}>
            <Text style={styles.ewIcon}>⚡</Text>
          </View>
        )}

        {region.artilleryIntensity > 30 && (
          <View style={styles.artilleryIndicator}>
            <Text style={styles.artilleryIcon}>💥</Text>
          </View>
        )}
      </View>
    );
  };

  const renderConnection = (connection, index) => {
    const [fromId, toId] = connection;
    const fromPos = regionPositions[fromId];
    const toPos = regionPositions[toId];
    
    if (!fromPos || !toPos) return null;

    const fromRegion = gameState.regions.find(r => r.id === fromId);
    const toRegion = gameState.regions.find(r => r.id === toId);

    // Determine if this is a frontline
    const isFrontline = fromRegion?.control !== toRegion?.control;

    return (
      <View
        key={`connection-${index}`}
        style={[
          styles.connection,
          {
            left: `${fromPos.x}%`,
            top: `${fromPos.y}%`,
            width: Math.abs(toPos.x - fromPos.x) + '%',
            height: Math.abs(toPos.y - fromPos.y) + '%',
            backgroundColor: isFrontline ? '#ef4444' : '#374151',
          },
        ]}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tactical Map - Turn {gameState.turn}</Text>
        <Text style={styles.weather}>{gameState.weather.toUpperCase()}</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.mapContainer}>
          <View style={styles.map}>
            {/* Render connections first (behind regions) */}
            {connections.map((conn, idx) => renderConnection(conn, idx))}
            
            {/* Render regions */}
            {gameState.regions.map(region => renderRegion(region))}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>Ukraine Controlled</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Enemy Controlled</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Contested</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendIcon}>🛡️</Text>
              <Text style={styles.legendText}>Your Brigades</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendIcon}>⚔️</Text>
              <Text style={styles.legendText}>Enemy Forces</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendIcon}>⚡</Text>
              <Text style={styles.legendText}>EW Active</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendIcon}>💥</Text>
              <Text style={styles.legendText}>Artillery</Text>
            </View>
          </View>
        </View>

        {selectedRegion && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedTitle}>{selectedRegion.name}</Text>
            <Text style={styles.selectedDetail}>Control: {selectedRegion.control.toUpperCase()}</Text>
            <Text style={styles.selectedDetail}>Terrain: {selectedRegion.terrain}</Text>
            <Text style={styles.selectedDetail}>Supply: {selectedRegion.baseSupply}</Text>
            {selectedRegion.enemyStrengthEstimate > 0 && (
              <Text style={styles.selectedDetail}>Enemy Strength: {selectedRegion.enemyStrengthEstimate}</Text>
            )}
            
            {gameState.brigades.filter(b => b.location === selectedRegion.id).length > 0 && (
              <View style={styles.brigadesInRegion}>
                <Text style={styles.brigadesTitle}>Your Forces:</Text>
                {gameState.brigades
                  .filter(b => b.location === selectedRegion.id)
                  .map(b => (
                    <Text key={b.id} style={styles.brigadeItem}>
                      • {b.name} ({b.strength})
                    </Text>
                  ))}
              </View>
            )}
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
    padding: 20,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
  },
  weather: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93c5fd',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  mapContainer: {
    marginBottom: 20,
  },
  map: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    position: 'relative',
    marginBottom: 20,
  },
  connection: {
    position: 'absolute',
    height: 2,
    opacity: 0.3,
    zIndex: 1,
  },
  region: {
    position: 'absolute',
    borderRadius: 8,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    opacity: 0.85,
  },
  regionName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  brigadeIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#10b981',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  brigadeCount: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  enemyIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  enemyStrength: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  ewIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  ewIcon: {
    fontSize: 10,
  },
  artilleryIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
  },
  artilleryIcon: {
    fontSize: 10,
  },
  legend: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 10,
  },
  legendIcon: {
    fontSize: 14,
    marginRight: 10,
    width: 20,
  },
  legendText: {
    fontSize: 13,
    color: '#d1d5db',
  },
  selectedInfo: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginBottom: 20,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#93c5fd',
    marginBottom: 10,
  },
  selectedDetail: {
    fontSize: 14,
    color: '#d1d5db',
    marginVertical: 2,
  },
  brigadesInRegion: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  brigadesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 5,
  },
  brigadeItem: {
    fontSize: 13,
    color: '#d1d5db',
    marginVertical: 2,
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
