// Mission Control - Central hub for navigating game functions

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import { useLanguage } from '../context/LanguageContext';
import ActionButton from '../components/ActionButton';

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

export default function MissionControlScreen({ navigation }) {
  const { gameState, endTurn, saveGame } = useGameEngine();
  const { t } = useLanguage();

  if (!gameState.gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{t('common.noActiveCampaign')}</Text>
        <ActionButton
          title={t('missionControl.returnToMenu')}
          onPress={() => navigation.navigate('MainMenu')}
        />
      </SafeAreaView>
    );
  }

  const handleEndTurn = () => {
    endTurn();
    navigation.navigate('TurnSummary');
  };

  const handleSave = async () => {
    await saveGame();
    Alert.alert(t('common.success'), t('common.gameSaved'));
  };

  const playerControlledRegions = gameState.regions.filter(
    r => r.control === (gameState.playerFaction === 'ukraine' ? 'ukraine' : 'russia')
  ).length;
  const totalRegions = gameState.regions.length;
  
  const factionEmoji = gameState.playerFaction === 'ukraine' ? '🇺🇦' : '🇷🇺';
  const unitType = gameState.playerFaction === 'ukraine' 
    ? t('missionControl.brigades') 
    : t('missionControl.divisions');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{factionEmoji} {t('missionControl.title')}</Text>
        <Text style={styles.subtitle}>{t('missionControl.turn')} {gameState.turn} • {getWeatherDisplay(gameState.weather, t)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('missionControl.controlledRegions')}</Text>
            <Text style={styles.statValue}>{playerControlledRegions}/{totalRegions}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{unitType}</Text>
            <Text style={styles.statValue}>{gameState.brigades.length}</Text>
          </View>
        </View>
        {gameState.orders.length > 0 && (
          <TouchableOpacity 
            style={styles.ordersAlert}
            onPress={() => navigation.navigate('PendingOrders')}
          >
            <Text style={styles.ordersText}>⚠️ {gameState.orders.length} {t('missionControl.pendingOrders')}</Text>
            <Text style={styles.ordersSubtext}>Tap to review →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.grid}>
          {/* Intelligence Section */}
          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.gridIcon}>🗺️</Text>
            <Text style={styles.gridTitle}>{t('missionControl.tacticalMap')}</Text>
            <Text style={styles.gridSubtitle}>{t('missionControl.tacticalMapSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('RegionsList')}
          >
            <Text style={styles.gridIcon}>🏙️</Text>
            <Text style={styles.gridTitle}>{t('missionControl.regions')}</Text>
            <Text style={styles.gridSubtitle}>{t('missionControl.regionsSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('BrigadesList')}
          >
            <Text style={styles.gridIcon}>⚔️</Text>
            <Text style={styles.gridTitle}>{unitType.toUpperCase()}</Text>
            <Text style={styles.gridSubtitle}>{t('missionControl.forceManagement')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => navigation.navigate('TurnSummary')}
          >
            <Text style={styles.gridIcon}>📋</Text>
            <Text style={styles.gridTitle}>{t('missionControl.turnLog')}</Text>
            <Text style={styles.gridSubtitle}>{t('missionControl.turnLogSub')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <ActionButton
            title={t('missionControl.saveGame')}
            onPress={handleSave}
            variant="secondary"
            style={styles.footerButton}
          />
          <ActionButton
            title={t('missionControl.endTurn')}
            onPress={handleEndTurn}
            variant="primary"
            style={styles.footerButton}
          />
        </View>
        <ActionButton
          title={t('missionControl.returnToMenu')}
          onPress={() => navigation.navigate('MainMenu')}
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
    fontSize: 28,
    fontWeight: '800',
    color: '#f3f4f6',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 140,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#60a5fa',
    marginTop: 4,
  },
  ordersAlert: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  ordersText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  ordersSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350f',
    textAlign: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  gridIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f3f4f6',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
});
