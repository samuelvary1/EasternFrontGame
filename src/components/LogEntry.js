// LogEntry component - displays log messages

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LogEntry({ message, index }) {
  const isEvent = message.includes('[EVENT]');
  const isPlayer = message.includes('[PLAYER]');
  const isEnemy = message.includes('[ENEMY]');
  const isCritical = message.includes('CRITICAL') || message.includes('DEFEAT') || message.includes('VICTORY');
  const isHeader = message.startsWith('===');
  
  // Skip technical/duplicate entries
  if (message.includes('[COMBAT_START]') || 
      message.includes('[COMBAT_END]') || 
      message.includes('[ATTACKER_BRIGADE]') ||
      message.includes('[DEFENDER_INFO]') ||
      message.includes('[COMBAT_RESULTS]') ||
      message.includes('rolls') ||
      message.includes('Roll ') ||
      message.includes('Defense Ratio') ||
      message.includes('Dice result')) {
    return null;
  }

  const getIcon = () => {
    if (isCritical) return '⚠️';
    if (isPlayer) return '🔵';
    if (isEnemy) return '🔴';
    if (isEvent) return '⭐';
    return '•';
  };

  const getContainerStyle = () => {
    if (isHeader) return styles.headerContainer;
    if (isCritical) return styles.criticalContainer;
    if (isPlayer) return styles.playerContainer;
    if (isEnemy) return styles.enemyContainer;
    if (isEvent) return styles.eventContainer;
    return styles.normalContainer;
  };

  const getTextStyle = () => {
    if (isHeader) return styles.headerText;
    if (isCritical) return styles.criticalText;
    return styles.normalText;
  };

  const displayMessage = message
    .replace('[PLAYER]', '')
    .replace('[ENEMY]', '')
    .replace('[EVENT]', '')
    .replace(/^===\s*|\s*===$/g, '')
    .trim();
  
  if (!displayMessage) return null;

  return (
    <View style={getContainerStyle()}>
      {!isHeader && <Text style={styles.icon}>{getIcon()}</Text>}
      <Text style={getTextStyle()}>{displayMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  normalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 6,
    gap: 8,
  },
  enemyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 6,
    gap: 8,
  },
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 2,
    borderColor: '#fbbf24',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  criticalContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 3,
    borderColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  headerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#60a5fa',
  },
  icon: {
    fontSize: 16,
    marginTop: 2,
  },
  normalText: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
    flex: 1,
  },
  criticalText: {
    fontSize: 18,
    color: '#fca5a5',
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerText: {
    fontSize: 17,
    color: '#93c5fd',
    lineHeight: 24,
    fontWeight: '700',
  },
});
