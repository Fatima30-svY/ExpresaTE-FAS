import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ejecutarAgenteRiesgo } from '../lib/agenteRiesgo';

const FRASES = [
  '"Eres más valiente de lo que crees y más fuerte de lo que piensas."',
  '"Hablar es el primer paso hacia el cambio."',
  '"Tu bienestar importa. No estás sola."',
  '"Cada día es una nueva oportunidad para sanar."',
  '"Pedir ayuda es un acto de valentía."',
];

export default function UltimaPantalla({ navigation, route }) {
  const [guardando, setGuardando] = useState(true);
  const [error, setError] = useState(null);
  const [recomendacion, setRecomendacion] = useState(null);
  const fraseRef = React.useRef(FRASES[Math.floor(Math.random() * FRASES.length)]);

  const { idEvaluacion, respuestas = [] } = route.params || {};

  useEffect(() => {
    guardarEvaluacion();
  }, []);

  const guardarEvaluacion = async () => {
    try {
      if (!idEvaluacion) {
        setGuardando(false);
        return;
      }

      const resultado = await ejecutarAgenteRiesgo(idEvaluacion, respuestas);

      console.log(
        `Nivel: ${resultado.nivel} (base: ${resultado.nivelBase}) — Puntaje: ${resultado.puntaje.toFixed(1)}/${resultado.puntajeMax.toFixed(1)}`
      );
      if (resultado.reglasActivadas.length > 0) {
        console.log('Reglas críticas activadas:', resultado.reglasActivadas.map((r) => r.id));
      }

      if (resultado.recomendaciones.length > 0) {
        setRecomendacion(resultado.recomendaciones[0]);
      }
    } catch (e) {
      console.error('Error al guardar la evaluación:', e);
      setError(e.message || 'No se pudo guardar tu evaluación. Intenta más tarde.');
    } finally {
      setGuardando(false);
    }
  };

  const handleFinalizar = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'PantallaPrincipal', params: route.params }],
    });
  };

  const irAMisReportes = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MisReportes' }],
    });
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/Icono.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.logoTexto}>ExpresaTE-SVB</Text>

      <View style={styles.fraseCard}>
        <Text style={styles.fraseTexto}>{fraseRef.current}</Text>
      </View>

      <View style={styles.mensajeCard}>
        <Text style={styles.mensajeTitulo}>¡Gracias por responder!</Text>
        {guardando ? (
          <>
            <ActivityIndicator color="#7C3DB8" style={{ marginVertical: 8 }} />
            <Text style={styles.mensajeTexto}>Guardando tus respuestas...</Text>
          </>
        ) : error ? (
          <Text style={[styles.mensajeTexto, { color: '#C0392B' }]}>{error}</Text>
        ) : (
          <Text style={styles.mensajeTexto}>
            Tus respuestas fueron almacenadas. Recuerda que no estás sola.
          </Text>
        )}
      </View>

      {!guardando && recomendacion && (
        <View style={styles.recomendacionCard}>
          <Text style={styles.recomendacionTitulo}>{recomendacion.titulo}</Text>
          <Text style={styles.recomendacionTexto}>{recomendacion.descripcion}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.boton, guardando && { opacity: 0.6 }]}
        onPress={handleFinalizar}
        disabled={guardando}
      >
        <Text style={styles.botonTexto}>Ir al Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.botonSecundario, guardando && { opacity: 0.6 }]}
        onPress={irAMisReportes}
        disabled={guardando}
      >
        <Text style={styles.botonSecundarioTexto}>Ver mis reportes</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  logoTexto: { fontSize: 16, fontWeight: '700', color: '#3C2066', marginBottom: 28 },
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
    fontWeight: '600',
  },
  mensajeCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4BBEE',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 90,
    justifyContent: 'center',
  },
  mensajeTitulo: { fontSize: 15, fontWeight: '700', color: '#3C2066', marginBottom: 8 },
  mensajeTexto: { fontSize: 13, color: '#5C3D8A', textAlign: 'center', lineHeight: 20 },
  recomendacionCard: {
    width: '100%',
    backgroundColor: '#EDE8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4BBEE',
    padding: 18,
    marginBottom: 24,
  },
  recomendacionTitulo: { fontSize: 14, fontWeight: '700', color: '#3C2066', marginBottom: 6 },
  recomendacionTexto: { fontSize: 13, color: '#5C3D8A', lineHeight: 19 },
  boton: {
    width: '100%',
    backgroundColor: '#7C3DB8',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  botonSecundario: { width: '100%', paddingVertical: 10, alignItems: 'center' },
  botonSecundarioTexto: {
    color: '#7C3DB8',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});