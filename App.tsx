import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import AddNodeScreen from './src/screens/AddNodeScreen';
// Temporarily disabled until we complete them
import NodeDashboardScreen from './src/screens/NodeDashboardScreen';
import OpenClashScreen from './src/screens/OpenClashScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#FFF' },
          headerShadowVisible: false,
          headerTintColor: '#1F2937',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Dashboard', headerShown: false }}
        />
        <Stack.Screen
          name="AddNode"
          component={AddNodeScreen}
          options={{ title: 'Node Configuration', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="NodeDashboard"
          component={NodeDashboardScreen}
          options={{ title: 'Overview', headerBackTitle: 'Nodes' }}
        />
        <Stack.Screen
          name="OpenClash"
          component={OpenClashScreen}
          options={{ title: 'OpenClash Panel', headerBackTitle: 'Overview' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
