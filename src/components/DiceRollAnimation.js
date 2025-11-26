// DiceRollAnimation component - animated dice roll display

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';

export default function DiceRollAnimation({ 
  visible, 
  attackerName = 'Attacker',
  defenderName = 'Defender',
  attackerDice = [], 
  defenderDice = [], 
  comparisons = [],
  outcome = '',
  onComplete 
}) {
  const [stage, setStage] = useState('rolling'); // rolling -> showing -> comparing -> complete
  const [currentComparison, setCurrentComparison] = useState(0);
  const diceAnimations = useRef(attackerDice.map(() => new Animated.Value(0))).current;
  const defenderDiceAnimations = useRef(defenderDice.map(() => new Animated.Value(0))).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setStage('rolling');
      setCurrentComparison(0);
      return;
    }

    // Stage 1: Rolling animation (shake)
    const shakeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ])
    );

    shakeAnimation.start();

    // After 1 second, show dice values
    setTimeout(() => {
      shakeAnimation.stop();
      shakeAnim.setValue(0);
      setStage('showing');

      // Animate dice appearance
      Animated.stagger(100, [
        ...diceAnimations.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
          })
        ),
        ...defenderDiceAnimations.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
          })
        ),
      ]).start();

      // After showing dice, start comparisons
      setTimeout(() => {
        setStage('comparing');
      }, 1000);
    }, 1000);

  }, [visible]);

  useEffect(() => {
    if (stage === 'comparing' && currentComparison < comparisons.length) {
      const timer = setTimeout(() => {
        setCurrentComparison(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (stage === 'comparing' && currentComparison >= comparisons.length) {
      // All comparisons shown, complete after delay
      setTimeout(() => {
        setStage('complete');
        if (onComplete) onComplete();
      }, 1500);
    }
  }, [stage, currentComparison, comparisons.length]);

  if (!visible) return null;

  const renderDie = (value, index, isAttacker, anim) => {
    const opacity = stage === 'rolling' ? 0 : anim;
    const scale = stage === 'rolling' ? 0 : anim;

    return (
      <Animated.View
        key={index}
        style={[
          styles.die,
          isAttacker ? styles.attackerDie : styles.defenderDie,
          {
            opacity,
            transform: [
              { scale },
              { translateX: stage === 'rolling' ? shakeAnim : 0 },
            ],
          },
        ]}
      >
        <Text style={styles.dieText}>{stage === 'rolling' ? '?' : value}</Text>
      </Animated.View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>DICE COMBAT</Text>
          <Text style={styles.subtitle}>{attackerName} vs {defenderName}</Text>

          <View style={styles.section}>
            <Text style={styles.label}>{attackerName}</Text>
            <View style={styles.diceRow}>
              {attackerDice.map((value, index) => 
                renderDie(value, index, true, diceAnimations[index] || new Animated.Value(1))
              )}
            </View>
          </View>

          <Text style={styles.vs}>VS</Text>

          <View style={styles.section}>
            <Text style={styles.label}>{defenderName}</Text>
            <View style={styles.diceRow}>
              {defenderDice.map((value, index) => 
                renderDie(value, index, false, defenderDiceAnimations[index] || new Animated.Value(1))
              )}
            </View>
          </View>

          {stage === 'comparing' && (
            <View style={styles.comparisons}>
              {comparisons.slice(0, currentComparison + 1).map((comp, i) => (
                <View key={i} style={styles.comparison}>
                  <Text style={styles.comparisonText}>
                    <Text style={styles.attackerColor}>{comp.attacker}</Text>
                    {' vs '}
                    <Text style={styles.defenderColor}>{comp.defender}</Text>
                    {' → '}
                    <Text style={comp.winner === 'attacker' ? styles.attackerColor : styles.defenderColor}>
                      {comp.winner === 'attacker' ? attackerName : defenderName}
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          )}

          {stage === 'comparing' && currentComparison >= comparisons.length && outcome && (
            <View style={styles.outcomeContainer}>
              <Text style={[
                styles.outcomeText,
                outcome.includes('VICTORY') && styles.victoryText,
                outcome.includes('DEFEAT') && styles.defeatText,
                outcome.includes('STALEMATE') && styles.stalemateText,
              ]}>
                {outcome}
              </Text>
            </View>
          )}

          {stage === 'rolling' && (
            <Text style={styles.statusText}>Rolling dice...</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#60a5fa',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
  },
  diceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  die: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  attackerDie: {
    backgroundColor: '#1e3a8a',
    borderColor: '#60a5fa',
  },
  defenderDie: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  dieText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  vs: {
    fontSize: 20,
    fontWeight: '900',
    color: '#f59e0b',
    textAlign: 'center',
    marginVertical: 15,
  },
  comparisons: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  comparison: {
    marginVertical: 4,
  },
  comparisonText: {
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  attackerColor: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  defenderColor: {
    color: '#ef4444',
    fontWeight: '700',
  },
  statusText: {
    fontSize: 16,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
  outcomeContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#374151',
    alignItems: 'center',
  },
  outcomeText: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  victoryText: {
    color: '#10b981',
  },
  defeatText: {
    color: '#ef4444',
  },
  stalemateText: {
    color: '#f59e0b',
  },
});
