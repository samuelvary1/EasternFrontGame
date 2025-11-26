// CombatLogEntry component - displays a bordered combat section

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CombatLogEntry({ messages }) {
  if (!messages || messages.length === 0) return null;

  // Parse combat info
  let attackerName = 'Attacker';
  let defenderName = 'Defender';
  let outcome = '';
  
  const startMatch = messages[0]?.match(/\[COMBAT_START\]([^|]+)\|([^\]]+)\[\/COMBAT_START\]/);
  if (startMatch) {
    attackerName = startMatch[1];
    defenderName = startMatch[2];
  }
  
  const endMatch = messages[messages.length - 1]?.match(/\[COMBAT_END\]([^[]+)\[\/COMBAT_END\]/);
  if (endMatch) {
    outcome = endMatch[1];
  }

  // Filter out marker lines and format display messages
  const displayMessages = messages
    .filter(msg => !msg.includes('[COMBAT_START]') && !msg.includes('[COMBAT_END]'))
    .map(msg => msg.replace(/^===\s*COMBAT:\s*/i, '').trim());

  const getOutcomeStyle = () => {
    if (outcome.includes('VICTORY')) return styles.victory;
    if (outcome.includes('DEFEAT')) return styles.defeat;
    if (outcome.includes('STALEMATE')) return styles.stalemate;
    return styles.setback;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          <Text style={styles.attackerName}>{attackerName}</Text>
          {' vs '}
          <Text style={styles.defenderName}>{defenderName}</Text>
        </Text>
      </View>

      <View style={styles.content}>
        {displayMessages.map((msg, index) => (
          <Text key={index} style={styles.message}>
            {msg}
          </Text>
        ))}
      </View>

      {outcome && (
        <View style={[styles.outcomeContainer, getOutcomeStyle()]}>
          <Text style={styles.outcomeText}>{outcome}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: '#60a5fa',
    borderRadius: 8,
    backgroundColor: '#1f2937',
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#60a5fa',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
  },
  attackerName: {
    color: '#60a5fa',
  },
  defenderName: {
    color: '#ef4444',
  },
  content: {
    padding: 12,
  },
  message: {
    fontSize: 13,
    color: '#e5e7eb',
    marginVertical: 2,
    lineHeight: 18,
  },
  outcomeContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'center',
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  victory: {
    backgroundColor: '#064e3b',
    borderTopColor: '#10b981',
  },
  defeat: {
    backgroundColor: '#7f1d1d',
    borderTopColor: '#ef4444',
  },
  stalemate: {
    backgroundColor: '#78350f',
    borderTopColor: '#f59e0b',
  },
  setback: {
    backgroundColor: '#7c2d12',
    borderTopColor: '#f97316',
  },
});
