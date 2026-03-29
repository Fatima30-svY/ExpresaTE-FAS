import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './Screens/Login.js';
import RegistrarCuenta from './Screens/RegistrarCuenta.js';
import PantallaPrincipal from './Screens/PantallaPrincipal.js';
import Perfil from './Screens/Perfil.js';

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
        <Stack.Screen name="PantallaPrincipal" component={PantallaPrincipal} />
        <Stack.Screen name="Perfil" component={Perfil} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}