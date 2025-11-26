// CombatLogEntry component - displays a bordered combat section

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CombatLogEntry({ messages }) {
  if (!messages || messages.length === 0) return null;

  // Parse combat info
  let attackerName = 'Attacker';
  let defenderName = 'Defender';
  let outcome = '';
  let casualties = null;
  let moraleChange = null;
  
  const startMatch = messages[0]?.match(/\[COMBAT_START\]([^|]+)\|([^\]]+)\[\/COMBAT_START\]/);
  if (startMatch) {
    attackerName = startMatch[1];
    defenderName = startMatch[2];
  }
  
  const endMatch = messages[messages.length - 1]?.match(/\[COMBAT_END\]([^[]+)\[\/COMBAT_END\]/);
  if (endMatch) {
    outcome = endMatch[1].trim();
  }
  
  // Extract casualties and morale from messages
  messages.forEach(msg => {
    if (msg.includes('Casualties:')) {
      const match = msg.match(/Casualties: (.+)/);
      if (match) casualties = match[1];
    }
    if (msg.includes('Morale change:')) {
      const match = msg.match(/Morale change: (.+)/);
      if (match) moraleChange = match[1];
    }
  });

  const getOutcomeColor = () => {
    if (outcome.includes('VICTORY') || outcome.includes('STRONG DEFENSE')) return '#10b981';
    if (outcome.includes('DEFEAT') || outcome.includes('ROUTED')) return '#ef4444';
    if (outcome.includes('STALEMATE')) return '#f59e0b';
    return '#f97316';
  };
  
  const getOutcomeIcon = () => {
    if (outcome.includes('VICTORY') || outcome.includes('STRONG DEFENSE')) return '✓';
    if (outcome.includes('DEFEAT') || outcome.includes('ROUTED')) return '✗';
    return '=';
  };

  return (
    <View style={[styles.container, { borderColor: getOutcomeColor() }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          <Text style={styles.attackerName}>{attackerName}</Text>
          {' ⚔️ '}
          <Text style={styles.defenderName}>{defenderName}</Text>
        </Text>
      </View>

      <View style={styles.content}>
        {casualties && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>💥 Casualties</Text>
            <Text style={styles.infoValue}>{casualties}</Text>
          </View>
        )}
        
        {moraleChange && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🎯 Morale</Text>
            <Text style={styles.infoValue}>{moraleChange}</Text>
          </View>
        )}
      </View>

      {outcome && (
        <View style={[styles.outcomeContainer, { backgroundColor: getOutcomeColor() + '30', borderTopColor: getOutcomeColor() }]}>
          <Text style={[styles.outcomeText, { color: getOutcomeColor() }]}>
            {getOutcomeIcon()} {outcome.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    marginVertical: 10,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 18,
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
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
    borderRadius: 6,
  },
  infoLabel: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: '#e5e7eb',
    fontWeight: '700',
  },
  outcomeContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 3,
    alignItems: 'center',
  },
  outcomeText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
