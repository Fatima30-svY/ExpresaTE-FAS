import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RegistrarCuenta from './Screens/RegistrarCuenta.js';

// Aquí irás agregando las demás pantallas conforme las creemos
// import LoginScreen from './Screens/LoginScreen';
// import HomeScreen from './Screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="RegistrarCuenta"
        screenOptions={{ headerShown: false }}
      >
        {/* Pantalla de registro — ya lista */}
        <Stack.Screen name="RegistrarCuenta" component={RegistrarCuenta} />

        {/* Descomenta estas líneas cuando tengas las demás pantallas */}
        {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
        {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}