// PendingOrdersScreen - View and manage pending orders before ending turn

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useGameEngine } from '../engine/gameEngine';
import ActionButton from '../components/ActionButton';

export default function PendingOrdersScreen({ navigation }) {
  const { gameState, cancelOrder } = useGameEngine();

  if (!gameState.gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No active campaign</Text>
      </SafeAreaView>
    );
  }

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            cancelOrder(orderId);
          }
        },
      ]
    );
  };

  const getOrderDescription = (order) => {
    const brigade = gameState.brigades.find(b => b.id === order.brigadeId);
    const brigadeName = brigade?.name || 'Unknown Brigade';

    switch (order.type) {
      case 'move':
        const moveRegion = gameState.regions.find(r => r.id === order.targetRegion);
        return `${brigadeName} will move to ${moveRegion?.name || order.targetRegion}`;
      
      case 'attack':
        const attackRegion = gameState.regions.find(r => r.id === order.targetRegion);
        return `${brigadeName} will attack ${attackRegion?.name || order.targetRegion}`;
      
      case 'stance':
        return `${brigadeName} will change orders to ${order.stance}`;
      
      case 'reinforce':
        return `${brigadeName} will be reinforced (+20 strength, -10 morale temporarily)`;
      
      default:
        return `${brigadeName}: ${order.type}`;
    }
  };

  const getOrderIcon = (order) => {
    switch (order.type) {
      case 'move':
        return '🚚';
      case 'attack':
        return '⚔️';
      case 'stance':
        return '📋';
      case 'reinforce':
        return '🔧';
      default:
        return '❓';
    }
  };

  const getOrderTypeColor = (order) => {
    switch (order.type) {
      case 'move':
        return '#3b82f6';
      case 'attack':
        return '#ef4444';
      case 'stance':
        return '#f59e0b';
      case 'reinforce':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PENDING ORDERS</Text>
        <Text style={styles.subtitle}>
          {gameState.orders.length} {gameState.orders.length === 1 ? 'order' : 'orders'} queued for execution
        </Text>
      </View>

      {gameState.orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No pending orders</Text>
          <Text style={styles.emptySubtext}>
            Issue orders to your brigades from the Brigade Details screen
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {gameState.orders.map((order, index) => (
            <View key={order.id || index} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderTitleRow}>
                  <Text style={styles.orderIcon}>{getOrderIcon(order)}</Text>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderType}>
                      {order.type.toUpperCase()}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: getOrderTypeColor(order) }]}>
                      <Text style={styles.typeBadgeText}>Order #{index + 1}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <Text style={styles.orderDescription}>
                {getOrderDescription(order)}
              </Text>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(order.id || index)}
              >
                <Text style={styles.cancelButtonText}>✕ Cancel Order</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <ActionButton
          title="Back to Mission Control"
          onPress={() => navigation.goBack()}
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
    fontSize: 24,
    fontWeight: '800',
    color: '#f3f4f6',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#374151',
  },
  orderHeader: {
    marginBottom: 12,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  orderDescription: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#991b1b',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fecaca',
  },
  footer: {
    padding: 16,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});
