// FloatingEndTurnButton - A floating button to end turn from any screen

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameEngine } from '../engine/gameEngine';

export default function FloatingEndTurnButton() {
  const navigation = useNavigation();
  const { endTurn } = useGameEngine();

  const handleEndTurn = () => {
    endTurn();
    navigation.navigate('TurnSummary');
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleEndTurn}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>End{'\n'}Turn</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
});
