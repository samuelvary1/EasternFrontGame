// Enhanced MapScreen with better visual frontline representation

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Line, Polygon, Circle, Text as SvgText } from 'react-native-svg';
import { useGameEngine } from '../engine/gameEngine';
import { useLanguage } from '../context/LanguageContext';
import ActionButton from '../components/ActionButton';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = SCREEN_WIDTH - 20;
const MAP_HEIGHT = SCREEN_WIDTH - 20;

const getWeatherDisplay = (weather, t) => {
  const weatherMap = {
    'clear': { emoji: '☀️', key: 'weather.clear' },
    'rain': { emoji: '🌧️', key: 'weather.rain' },
    'mud': { emoji: '🟤', key: 'weather.mud' },
    'snow': { emoji: '❄️', key: 'weather.snow' },
    'fog': { emoji: '🌫️', key: 'weather.fog' },
  };
  const weatherInfo = weatherMap[weather?.toLowerCase()] || { emoji: '🌤️', key: weather };
  const label = weatherInfo.key.startsWith('weather.') ? t(weatherInfo.key) : weather;
  return `${weatherInfo.emoji} ${label}`;
};

export default function EnhancedMapScreen({ navigation }) {
  const { gameState } = useGameEngine();
  const { t } = useLanguage();
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

  // Region positions - Geographically oriented Ukraine map (proportional to map size)
  const scale = MAP_WIDTH / 340; // Scale based on actual map width
  const regionNodes = {
    // WESTERN UKRAINE (far left)
    'lviv': { x: 30 * scale, y: 170 * scale, size: 35 * scale },
    'zhytomyr': { x: 91 * scale, y: 146 * scale, size: 29 * scale },
    
    // NORTHERN TIER (top row)
    'belarus_border': { x: 146 * scale, y: 36 * scale, size: 27 * scale },
    'chernihiv': { x: 200 * scale, y: 49 * scale, size: 30 * scale },
    'sumy': { x: 255 * scale, y: 55 * scale, size: 29 * scale },
    
    // KYIV SECTOR (north-central)
    'hostomel': { x: 134 * scale, y: 97 * scale, size: 30 * scale },
    'bucha': { x: 109 * scale, y: 121 * scale, size: 29 * scale },
    'kyiv': { x: 158 * scale, y: 127 * scale, size: 42 * scale },
    'brovary': { x: 206 * scale, y: 121 * scale, size: 29 * scale },
    'vasylkiv': { x: 146 * scale, y: 170 * scale, size: 27 * scale },
    
    // CENTRAL UKRAINE (middle)
    'poltava': { x: 231 * scale, y: 158 * scale, size: 30 * scale },
    
    // EASTERN FRONT (right side)
    'kharkiv': { x: 285 * scale, y: 109 * scale, size: 36 * scale },
    'donbas': { x: 304 * scale, y: 170 * scale, size: 35 * scale },
    
    // SOUTH-CENTRAL
    'dnipro': { x: 231 * scale, y: 212 * scale, size: 36 * scale },
    
    // SOUTHERN TIER (bottom row)
    'zaporizhzhia': { x: 267 * scale, y: 255 * scale, size: 32 * scale },
    'mariupol': { x: 310 * scale, y: 231 * scale, size: 30 * scale },
    'kherson': { x: 194 * scale, y: 291 * scale, size: 30 * scale },
    'odesa': { x: 109 * scale, y: 304 * scale, size: 35 * scale },
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
    // Build connections from region adjacency data
    const drawnConnections = new Set();
    const connections = [];
    
    gameState.regions.forEach(region => {
      region.adjacency.forEach(adjId => {
        const key1 = `${region.id}-${adjId}`;
        const key2 = `${adjId}-${region.id}`;
        
        // Avoid drawing duplicate lines
        if (!drawnConnections.has(key1) && !drawnConnections.has(key2)) {
          connections.push([region.id, adjId]);
          drawnConnections.add(key1);
        }
      });
    });

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
        <Text style={styles.title}>{t('map.title')} - {t('missionControl.turn')} {gameState.turn}</Text>
        <Text style={styles.weather}>{getWeatherDisplay(gameState.weather, t)}</Text>
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
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Your Brigades</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
            <Text style={styles.legendText}>Enemy Forces</Text>
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
    padding: 12,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
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
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#374151',
    marginHorizontal: 10,
    marginVertical: 10,
    alignSelf: 'center',
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
    fontSize: 8,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  brigadeCountText: {
    fontSize: 7,
    color: '#10b981',
    fontWeight: '700',
  },
  enemyCountText: {
    fontSize: 7,
    color: '#ef4444',
    fontWeight: '700',
  },
  legend: {
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  legendLine: {
    width: 24,
    height: 2,
    backgroundColor: '#4b5563',
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#d1d5db',
  },
  infoBox: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  infoText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 10,
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
