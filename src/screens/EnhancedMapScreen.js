// Enhanced MapScreen with better visual frontline representation

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Line, Polygon, Circle, Text as SvgText } from 'react-native-svg';
import { useGameEngine } from '../engine/gameEngine';
import ActionButton from '../components/ActionButton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = SCREEN_WIDTH - 40;
const MAP_HEIGHT = 700;

export default function EnhancedMapScreen({ navigation }) {
  const { gameState } = useGameEngine();
  const [selectedRegion, setSelectedRegion] = useState(null);

  if (!gameState.gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No active campaign</Text>
      </SafeAreaView>
    );
  }

  const handleRegionPress = (region) => {
    navigation.navigate('RegionDetail', { regionId: region.id });
  };

  // Region positions with actual coordinates
  const regionNodes = {
    'kyiv_center': { x: 200, y: 280, size: 65 },
    'kyiv_northwest': { x: 180, y: 180, size: 55 },
    'kyiv_south': { x: 190, y: 380, size: 50 },
    'belarus_border': { x: 100, y: 80, size: 50 },
    'supply_route': { x: 100, y: 500, size: 50 },
  };

  const getRegionColor = (control) => {
    const playerFaction = gameState.playerFaction || 'ukraine';
    
    if (control === playerFaction) {
      return playerFaction === 'ukraine' ? '#3b82f6' : '#ef4444'; // Blue for Ukraine player, Red for Russia player
    } else if (control === (playerFaction === 'ukraine' ? 'russia' : 'ukraine')) {
      return playerFaction === 'ukraine' ? '#ef4444' : '#3b82f6'; // Enemy color (opposite)
    }
    return '#f59e0b'; // Contested
  };

  const renderConnections = () => {
    const connections = [
      ['belarus_border', 'kyiv_northwest'],
      ['kyiv_northwest', 'kyiv_center'],
      ['kyiv_center', 'kyiv_south'],
      ['kyiv_south', 'supply_route'],
    ];

    return connections.map((conn, idx) => {
      const [from, to] = conn;
      const fromNode = regionNodes[from];
      const toNode = regionNodes[to];
      
      if (!fromNode || !toNode) return null;

      const fromRegion = gameState.regions.find(r => r.id === from);
      const toRegion = gameState.regions.find(r => r.id === to);
      
      const isFrontline = fromRegion?.control !== toRegion?.control;
      const color = isFrontline ? '#ef4444' : '#4b5563';
      const strokeWidth = isFrontline ? 4 : 2;
      const strokeDasharray = isFrontline ? '8,4' : '0';

      return (
        <Line
          key={`conn-${idx}`}
          x1={fromNode.x}
          y1={fromNode.y}
          x2={toNode.x}
          y2={toNode.y}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          opacity={0.7}
        />
      );
    });
  };

  const renderRegions = () => {
    return gameState.regions.map(region => {
      const node = regionNodes[region.id];
      if (!node) return null;

      const brigadeCount = gameState.brigades.filter(b => b.location === region.id).length;
      const color = getRegionColor(region.control);

      return (
        <TouchableOpacity
          key={region.id}
          onPress={() => handleRegionPress(region)}
          style={{ position: 'absolute', left: node.x - node.size/2, top: node.y - node.size/2 }}
        >
          <Svg width={node.size} height={node.size}>
            <Circle
              cx={node.size/2}
              cy={node.size/2}
              r={node.size/2 - 2}
              fill={color}
              stroke={region.isObjective ? '#fbbf24' : '#1f2937'}
              strokeWidth={region.isObjective ? 3 : 1}
              opacity={0.85}
            />
            
            {/* Brigade indicator */}
            {brigadeCount > 0 && (
              <Circle
                cx={node.size - 10}
                cy={10}
                r={8}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={1}
              />
            )}
            
            {/* Enemy indicator */}
            {region.enemyStrengthEstimate > 0 && (
              <Circle
                cx={10}
                cy={10}
                r={8}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={1}
              />
            )}
          </Svg>
          
          <View style={styles.regionLabel}>
            <Text style={styles.regionLabelText} numberOfLines={2}>
              {region.name.split(' ')[0]}
            </Text>
            {brigadeCount > 0 && (
              <Text style={styles.brigadeCountText}>🛡️{brigadeCount}</Text>
            )}
            {region.enemyStrengthEstimate > 0 && (
              <Text style={styles.enemyCountText}>⚔️{region.enemyStrengthEstimate}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tactical Map - Turn {gameState.turn}</Text>
        <Text style={styles.weather}>{gameState.weather.toUpperCase()}</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.mapContainer}>
          <Svg width={MAP_WIDTH} height={MAP_HEIGHT} style={styles.svg}>
            {renderConnections()}
          </Svg>
          {renderRegions()}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendCircle, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Ukraine Controlled</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendCircle, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Enemy Controlled</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendCircle, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Contested</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendLine} />
            <Text style={styles.legendText}>Connections</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendLine, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Frontline</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Tap any region for detailed information</Text>
          </View>
        </View>
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
  mapContainer: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    margin: 20,
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  regionLabel: {
    alignItems: 'center',
    marginTop: -5,
  },
  regionLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  brigadeCountText: {
    fontSize: 9,
    color: '#10b981',
    fontWeight: '700',
  },
  enemyCountText: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: '700',
  },
  legend: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  legendCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 12,
  },
  legendLine: {
    width: 30,
    height: 3,
    backgroundColor: '#4b5563',
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  infoBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
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
