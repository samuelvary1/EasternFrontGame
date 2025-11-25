// App.js - Main entry point

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameEngineProvider } from './src/engine/gameEngine';
import MainMenuScreen from './src/screens/MainMenuScreen';
import CampaignScreen from './src/screens/CampaignScreen';
import BrigadeDetailScreen from './src/screens/BrigadeDetailScreen';
import TurnSummaryScreen from './src/screens/TurnSummaryScreen';
import MapScreen from './src/screens/EnhancedMapScreen';
import RegionDetailScreen from './src/screens/RegionDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
            component={CampaignScreen}
            options={{ title: 'Campaign', headerLeft: () => null }}
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
            name="TurnSummary"
            component={TurnSummaryScreen}
            options={{ title: 'Turn Summary', headerLeft: () => null }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GameEngineProvider>
  );
}
