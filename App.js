// App.js - Main entry point

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameEngineProvider } from './src/engine/gameEngine';
import { LanguageProvider } from './src/context/LanguageContext';
import MainMenuScreen from './src/screens/MainMenuScreen';
import MissionControlScreen from './src/screens/MissionControlScreen';
import BrigadesListScreen from './src/screens/BrigadesListScreen';
import RegionsListScreen from './src/screens/RegionsListScreen';
import BrigadeDetailScreen from './src/screens/BrigadeDetailScreen';
import RegionDetailScreen from './src/screens/RegionDetailScreen';
import TurnSummaryScreen from './src/screens/TurnSummaryScreen';
import MapScreen from './src/screens/EnhancedMapScreen';
import PendingOrdersScreen from './src/screens/PendingOrdersScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <LanguageProvider>
      <GameEngineProvider>
        <NavigationContainer>
        <Stack.Navigator
          initialRouteName="MainMenu"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1f2937',
            },
            headerTintColor: '#f3f4f6',
            headerTitleStyle: {
              fontWeight: '700',
            },
          }}
        >
          <Stack.Screen
            name="MainMenu"
            component={MainMenuScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Campaign"
            component={MissionControlScreen}
            options={{ title: 'Mission Control', headerLeft: () => null }}
          />
          <Stack.Screen
            name="BrigadesList"
            component={BrigadesListScreen}
            options={{ title: 'Force Management' }}
          />
          <Stack.Screen
            name="RegionsList"
            component={RegionsListScreen}
            options={{ title: 'Territory Intel' }}
          />
          <Stack.Screen
            name="BrigadeDetail"
            component={BrigadeDetailScreen}
            options={{ title: 'Brigade Details' }}
          />
          <Stack.Screen
            name="RegionDetail"
            component={RegionDetailScreen}
            options={{ title: 'Region Details' }}
          />
          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ title: 'Tactical Map' }}
          />
          <Stack.Screen
            name="PendingOrders"
            component={PendingOrdersScreen}
            options={{ title: 'Pending Orders' }}
          />
          <Stack.Screen
            name="TurnSummary"
            component={TurnSummaryScreen}
            options={{ title: 'Turn Summary', headerLeft: () => null }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GameEngineProvider>
    </LanguageProvider>
  );
}
