import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import LoginScreen from './Screens/Login.js';
import RegistrarCuenta from './Screens/RegistrarCuenta';
import PantallaPrincipal from './Screens/PantallaPrincipal.js';
import Finalizar from './Screens/UltimaPantalla.js';
import SeccionScreen from './Screens/SeccionScreen';

import Perfil from './Screens/Perfil.js';
import RegistroEmociones from './Screens/RegistroEmociones.js';
import SeccionSeguridad from './Screens/SeccionSeguridad.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Finalizar" component={Finalizar} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegistrarCuenta" component={RegistrarCuenta} />
        <Stack.Screen name="PantallaPrincipal" component={PantallaPrincipal} />
        <Stack.Screen name="Seccion1" component={SeccionScreen} />
        <Stack.Screen name="Seccion2" component={SeccionScreen} />
        <Stack.Screen name="Seccion3" component={SeccionScreen} />
        <Stack.Screen name="Finalizar" component={Finalizar} />
        <Stack.Screen name="Perfil" component={Perfil} />
        <Stack.Screen name="RegistroEmociones" component={RegistroEmociones} />
        <Stack.Screen name="SeccionSeguridad" component={SeccionSeguridad} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}