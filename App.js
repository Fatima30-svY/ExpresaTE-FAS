import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RegistrarCuenta from './Screens/RegistrarCuenta.js';
import LoginScreen from './Screens/Login.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegistrarCuenta" component={RegistrarCuenta} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}