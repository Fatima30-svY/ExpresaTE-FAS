import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './Screens/Login.js';
import RegistrarCuenta from './Screens/RegistrarCuenta.js';
import PantallaPrincipal from './Screens/PantallaPrincipal.js';
import Perfil from './Screens/Perfil.js';
import RegistroEmociones from './Screens/RegistroEmociones.js';
import SeccionSeguridad from './Screens/SeccionSeguridad.js';
import SeccionPsicologica from './Screens/SeccionPsicologica.js';
import SeccionAcoso from './Screens/SeccionAcoso.js';
import SeccionScreen from './Screens/SeccionScreen';
import UltimaPantalla from './Screens/UltimaPantalla';

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
        <Stack.Screen name="RegistroEmociones" component={RegistroEmociones} />
        <Stack.Screen name="SeccionControl" component={SeccionScreen} />
        <Stack.Screen name="SeccionFisica" component={SeccionScreen} />
        <Stack.Screen name="SeccionApoyo" component={SeccionScreen} />
        <Stack.Screen name="UltimaPantalla" component={UltimaPantalla} />
        <Stack.Screen name="SeccionSeguridad" component={SeccionSeguridad} />
        <Stack.Screen name="SeccionPsicologica" component={SeccionPsicologica} />
        <Stack.Screen name="SeccionAcoso" component={SeccionAcoso} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}