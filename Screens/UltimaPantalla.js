import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

const FRASES = [
  '"Eres más valiente de lo que crees y más fuerte de lo que piensas."',
  '"Hablar es el primer paso hacia el cambio."',
  '"Tu bienestar importa. No estás sola."',
  '"Cada día es una nueva oportunidad para sanar."',
  '"Pedir ayuda es un acto de valentía."',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#9B72CF',
    marginBottom: 8,
  },
  logoTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C2066',
    marginBottom: 28,
  },
  fraseCard: {
    width: '100%',
    backgroundColor: '#C084FC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  fraseTexto: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  mensajeCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4BBEE',
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  mensajeTitulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C2066',
    marginBottom: 8,
  },
  mensajeTexto: {
    fontSize: 13,
    color: '#5C3D8A',
    textAlign: 'center',
    lineHeight: 20,
  },
  boton: {
    width: '100%',
    backgroundColor: '#7C3DB8',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function Finalizar({ navigation, route }) {
  const frase = FRASES[Math.floor(Math.random() * FRASES.length)];

  return (
    <View style={styles.container}>

      <Image
        source={require('../assets/Icono.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.logoTexto}>ExpresaTE-SVB</Text>

      <View style={styles.fraseCard}>
        <Text style={styles.fraseTexto}>{frase}</Text>
      </View>

      <View style={styles.mensajeCard}>
        <Text style={styles.mensajeTitulo}>¡Gracias por responder!</Text>
        <Text style={styles.mensajeTexto}>
          Tus respuestas fueron almacenadas y enviadas al área correspondiente.
          Recuerda que no estás sola.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.boton}
        onPress={() => navigation.navigate('PantallaPrincipal', route.params)}
      >
        <Text style={styles.botonTexto}>Finalizar</Text>
      </TouchableOpacity>

    </View>
  );
}