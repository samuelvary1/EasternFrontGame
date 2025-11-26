// LogEntry component - displays log messages

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LogEntry({ message, index }) {
  const isEvent = message.includes('[EVENT]');
  const isPlayer = message.includes('[PLAYER]');
  const isEnemy = message.includes('[ENEMY]');
  const isCritical = message.includes('CRITICAL') || message.includes('DEFEAT') || message.includes('VICTORY');
  const isHeader = message.startsWith('===');

  const getStyle = () => {
    if (isHeader) return styles.header;
    if (isCritical) return styles.critical;
    if (isPlayer) return styles.player;
    if (isEnemy) return styles.enemy;
    if (isEvent) return styles.event;
    return styles.normal;
  };

  const displayMessage = message.replace('[PLAYER]', '').replace('[ENEMY]', '').replace('[EVENT]', '').trim();

  return (
    <View style={styles.container}>
      <Text style={getStyle()}>{displayMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  normal: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  event: {
    fontSize: 14,
    color: '#fbbf24',
    lineHeight: 20,
    fontWeight: '500',
  },
  player: {
    fontSize: 14,
    color: '#60a5fa',
    lineHeight: 20,
    fontWeight: '600',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enemy: {
    fontSize: 14,
    color: '#fb923c',
    lineHeight: 20,
    fontWeight: '600',
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  critical: {
    fontSize: 15,
    color: '#f87171',
    lineHeight: 22,
    fontWeight: '700',
  },
  header: {
    fontSize: 16,
    color: '#93c5fd',
    lineHeight: 24,
    fontWeight: '700',
    marginTop: 8,
  },
});
