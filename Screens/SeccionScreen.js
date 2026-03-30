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

const SECCIONES = {
  SeccionControl: {
    titulo: 'Sección 4: Control',
    preguntas: [
      'Alguien intenta influir en mis decisiones personales.',
      'Me han presionado para hacer cosas que no quiero.',
      'Siento que mi privacidad ha sido invadida (celular, redes, etc.).',
    ],
    siguiente: 'SeccionFisica',
  },
  SeccionFisica: {
    titulo: 'Sección 5: Física',
    preguntas: [
      'He experimentado contacto físico que me hizo sentir incómoda o en riesgo.',
      'He sentido miedo de que alguien pueda hacerme daño.',
      'He estado en situaciones donde no me sentí libre de decidir.',
    ],
    siguiente: 'SeccionApoyo',
  },
  SeccionApoyo: {
    titulo: 'Sección 6: Apoyo',
    preguntas: [
      'Siento que tengo a alguien en quien confiar si tengo un problema.',
      'Me gustaría recibir apoyo o hablar con alguien sobre mi situación.',
    ],
    siguiente: 'UltimaPantalla',
  },
};

export default function SeccionScreen({ navigation, route }) {
  const nombreSeccion = route.name;
  const seccion = SECCIONES[nombreSeccion] || {};
  const { titulo = '', preguntas = [], siguiente = '' } = seccion;

  const [respuestas, setRespuestas] = useState(
    Array(preguntas.length).fill(null)
  );

  const seleccionar = (preguntaIndex, valor) => {
    const nuevas = [...respuestas];
    nuevas[preguntaIndex] = valor;
    setRespuestas(nuevas);
  };

  const handleSiguiente = () => {
    if (respuestas.includes(null)) {
      alert('Por favor responde todas las preguntas.');
      return;
    }
    navigation.navigate(siguiente);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#7C3DB8" />
        </TouchableOpacity>
        <Text style={styles.titulo}>{titulo}</Text>
      </View>

      <View style={styles.escalaCard}>
        <Text style={styles.escalaTitle}>Escala de respuesta</Text>
        <View style={styles.escalaGrid}>
          <Text style={styles.escalaItem}>1 Nunca</Text>
          <Text style={styles.escalaItem}>4 Frecuentemente</Text>
          <Text style={styles.escalaItem}>2 Rara vez</Text>
          <Text style={styles.escalaItem}>5 Siempre</Text>
          <Text style={styles.escalaItem}>3 A veces</Text>
        </View>
      </View>

      {preguntas.map((pregunta, qi) => (
        <View key={qi} style={styles.preguntaCard}>
          <Text style={styles.preguntaTexto}>Pregunta {qi + 1}. {pregunta}</Text>
          <View style={styles.opcionesRow}>
            {[1, 2, 3, 4, 5].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => seleccionar(qi, val)}
              >
                <View style={[
                  styles.radio,
                  respuestas[qi] === val && styles.radioSeleccionado,
                ]}>
                  {respuestas[qi] === val && <View style={styles.radioDot} />}
                </View>
                <Text style={[
                  styles.opcionTexto,
                  respuestas[qi] === val && styles.opcionTextoSel,
                ]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.boton} onPress={handleSiguiente}>
        <Text style={styles.botonTexto}>Siguiente</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3DB8',
  },
  escalaCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4BBEE',
    padding: 14,
    marginBottom: 16,
  },
  escalaTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C3D8A',
    marginBottom: 8,
  },
  escalaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  escalaItem: {
    fontSize: 12,
    color: '#7A5AA0',
    width: '48%',
  },
  preguntaCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4BBEE',
    padding: 14,
    marginBottom: 12,
  },
  preguntaTexto: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3C2066',
    marginBottom: 14,
    lineHeight: 20,
  },
  opcionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C0A0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  radioSeleccionado: {
    borderColor: '#7C3DB8',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3DB8',
  },
  opcionTexto: {
    fontSize: 12,
    color: '#9B72CF',
    textAlign: 'center',
  },
  opcionTextoSel: {
    color: '#7C3DB8',
    fontWeight: '600',
  },
  boton: {
    marginTop: 8,
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