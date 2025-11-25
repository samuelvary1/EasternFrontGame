// BrigadeCard component - displays brigade information

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function BrigadeCard({ brigade, onPress }) {
  const getStrengthColor = (strength) => {
    if (strength > 70) return '#10b981';
    if (strength > 40) return '#f59e0b';
    return '#ef4444';
  };

  const getMoraleColor = (morale) => {
    if (morale > 70) return '#10b981';
    if (morale > 40) return '#f59e0b';
    return '#ef4444';
  };

  const getSupplyColor = (supply) => {
    if (supply > 60) return '#10b981';
    if (supply > 30) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name}>{brigade.name}</Text>
        <Text style={styles.type}>{brigade.type.toUpperCase()}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{brigade.location}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.label}>Stance:</Text>
          <Text style={styles.value}>{brigade.stance}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Strength</Text>
            <Text style={[styles.statValue, { color: getStrengthColor(brigade.strength) }]}>
              {brigade.strength}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Morale</Text>
            <Text style={[styles.statValue, { color: getMoraleColor(brigade.morale) }]}>
              {brigade.morale}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Supply</Text>
            <Text style={[styles.statValue, { color: getSupplyColor(brigade.supply) }]}>
              {brigade.supply}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Fuel</Text>
            <Text style={styles.statValue}>{brigade.fuel}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Drones</Text>
            <Text style={styles.statValue}>{brigade.droneCount}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Artillery</Text>
            <Text style={styles.statValue}>{brigade.artilleryAmmo}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
    flex: 1,
  },
  type: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
  },
  value: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 10,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
  },
});
