// RegionCard component - displays region information

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RegionCard({ region }) {
  const getControlColor = (control) => {
    if (control === 'ukraine') return '#3b82f6';
    if (control === 'russia') return '#ef4444';
    return '#f59e0b';
  };

  const getControlText = (control) => {
    if (control === 'ukraine') return 'UKRAINE';
    if (control === 'russia') return 'RUSSIA';
    return 'CONTESTED';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{region.name}</Text>
        <View style={[styles.controlBadge, { backgroundColor: getControlColor(region.control) }]}>
          <Text style={styles.controlText}>{getControlText(region.control)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Terrain:</Text>
          <Text style={styles.value}>{region.terrain}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Supply Level:</Text>
          <Text style={styles.value}>{region.baseSupply}</Text>
        </View>

        {region.enemyStrengthEstimate > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Enemy Strength:</Text>
            <Text style={[styles.value, { color: '#ef4444' }]}>
              {region.enemyStrengthEstimate}
            </Text>
          </View>
        )}

        {region.artilleryIntensity > 20 && (
          <View style={styles.row}>
            <Text style={styles.label}>Artillery:</Text>
            <Text style={[styles.value, { color: '#f59e0b' }]}>
              {region.artilleryIntensity}
            </Text>
          </View>
        )}

        {region.electronicWarfareActive && (
          <View style={styles.ewBadge}>
            <Text style={styles.ewText}>⚡ EW ACTIVE</Text>
          </View>
        )}

        {region.isObjective && (
          <View style={styles.objectiveBadge}>
            <Text style={styles.objectiveText}>★ OBJECTIVE</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f3f4f6',
    flex: 1,
  },
  controlBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  controlText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  details: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  ewBadge: {
    backgroundColor: '#7c2d12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  ewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  objectiveBadge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  objectiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93c5fd',
  },
});
