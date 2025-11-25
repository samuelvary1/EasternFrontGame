// LogEntry component - displays log messages

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LogEntry({ message, index }) {
  const isEvent = message.includes('[EVENT]');
  const isCritical = message.includes('CRITICAL') || message.includes('DEFEAT') || message.includes('VICTORY');
  const isHeader = message.startsWith('===');

  const getStyle = () => {
    if (isHeader) return styles.header;
    if (isCritical) return styles.critical;
    if (isEvent) return styles.event;
    return styles.normal;
  };

  return (
    <View style={styles.container}>
      <Text style={getStyle()}>{message}</Text>
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
