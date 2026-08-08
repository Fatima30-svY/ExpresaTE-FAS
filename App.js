import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './Screens/Login.js';
import RegistrarCuenta from './Screens/RegistrarCuenta.js';
import PantallaPrincipal from './Screens/PantallaPrincipal.js';
import MisReportes from './Screens/MisReportes.js';
import Perfil from './Screens/Perfil.js';
import RegistroEmociones from './Screens/RegistroEmociones.js';
import SeccionSeguridad from './Screens/SeccionSeguridad.js';
import UltimaPantalla from './Screens/UltimaPantalla.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegistrarCuenta" component={RegistrarCuenta} />
        <Stack.Screen name="PantallaPrincipal" component={PantallaPrincipal} />
        <Stack.Screen name="Perfil" component={Perfil} />
        <Stack.Screen name="MisReportes" component={MisReportes} />
        <Stack.Screen name="RegistroEmociones" component={RegistroEmociones} />
        <Stack.Screen name="SeccionSeguridad" component={SeccionSeguridad} />
        <Stack.Screen name="UltimaPantalla" component={UltimaPantalla} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}