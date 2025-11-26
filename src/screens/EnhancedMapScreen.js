// Enhanced MapScreen with better visual frontline representation

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import { useLanguage } from '../context/LanguageContext';
import ActionButton from '../components/ActionButton';
import FloatingEndTurnButton from '../components/FloatingEndTurnButton';
import ThreeDMap from '../components/ThreeDMap';

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('map.title')} - {t('missionControl.turn')} {gameState.turn}</Text>
        <Text style={styles.weather}>{getWeatherDisplay(gameState.weather, t)}</Text>
      </View>

      <ThreeDMap 
        regions={gameState.regions}
        brigades={gameState.brigades}
        playerFaction={gameState.playerFaction}
        onRegionPress={handleRegionPress}
      />

      <View style={styles.footer}>
        <ActionButton
          title="Back to Campaign"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
      <FloatingEndTurnButton />
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
