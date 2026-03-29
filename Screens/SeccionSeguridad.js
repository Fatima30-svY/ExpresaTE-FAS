import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PREGUNTAS = [
  'Me siento segura dentro de mi institución.',
  'Me siento cómoda al interactuar con mis compañeros/as.',
  'Evito ciertos lugares por sentirme incómoda o insegura.',
  'He percibido miradas o comportamientos que me incomodan.',
];

const ESCALA = [1, 2, 3, 4, 5];

const PURPLE = '#7C3DB8';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: PURPLE,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  escalaCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0D0F0',
  },
  escalaLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  escalaFilas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  escalaColumna: {
    flex: 1,
  },
  escalaTexto: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  preguntaCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0D0F0',
  },
  preguntaTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1A4A',
    marginBottom: 14,
  },
  opcionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  opcionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C4A8E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActivo: {
    borderColor: PURPLE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },
  opcionNumero: {
    fontSize: 12,
    color: '#777',
  },
  opcionNumeroActivo: {
    color: PURPLE,
    fontWeight: '700',
  },
  botonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: BG,
  },
  botonSiguiente: {
    backgroundColor: PURPLE,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
  },
  botonTexto: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default function SeccionSeguridad({ navigation, route }) {
  const [respuestas, setRespuestas] = useState({});

  const seleccionar = (preguntaIndex, valor) => {
    setRespuestas((prev) => ({ ...prev, [preguntaIndex]: valor }));
  };

  const handleSiguiente = () => {
    if (Object.keys(respuestas).length < PREGUNTAS.length) {
      alert('Por favor responde todas las preguntas.');
      return;
    }
    console.log('Respuestas Seguridad:', respuestas);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PURPLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Sección 1: Seguridad</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.escalaCard}>
          <Text style={styles.escalaLabel}>Escala de respuesta</Text>
          <View style={styles.escalaFilas}>
            <View style={styles.escalaColumna}>
              <Text style={styles.escalaTexto}>1 Nunca</Text>
              <Text style={styles.escalaTexto}>2 Rara vez</Text>
              <Text style={styles.escalaTexto}>3 A veces</Text>
            </View>
            <View style={styles.escalaColumna}>
              <Text style={styles.escalaTexto}>4 Frecuentemente</Text>
              <Text style={styles.escalaTexto}>5 Siempre</Text>
            </View>
          </View>
        </View>

        {PREGUNTAS.map((pregunta, index) => (
          <View key={index} style={styles.preguntaCard}>
            <Text style={styles.preguntaTexto}>Pregunta {index + 1}. {pregunta}</Text>
            <View style={styles.opcionesRow}>
              {ESCALA.map((valor) => {
                const activo = respuestas[index] === valor;
                return (
                  <TouchableOpacity
                    key={valor}
                    style={styles.opcionBtn}
                    onPress={() => seleccionar(index, valor)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioOuter, activo && styles.radioOuterActivo]}>
                      {activo && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.opcionNumero, activo && styles.opcionNumeroActivo]}>
                      {valor}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.botonWrapper}>
        <TouchableOpacity style={styles.botonSiguiente} onPress={handleSiguiente}>
          <Text style={styles.botonTexto}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}