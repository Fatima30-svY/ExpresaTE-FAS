import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const EMOCIONES = ['Feliz', 'Triste', 'Ansiosa', 'Enojada', 'Neutral'];

const INVOLUCRADOS = ['Compañero/a', 'Docente', 'Amigo/a', 'Pareja', 'Familiar'];

const PURPLE = '#7C3DB8';
const PURPLE_BG = '#EDE8F5';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTextos: {
    flex: 1,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  headerSub: {
    fontSize: 12,
    color: '#DDD',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
  },
  pregunta: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1A4A',
    marginBottom: 16,
  },
  emocionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emocionBtn: {
    width: '30%',
    backgroundColor: PURPLE_BG,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emocionBtnActivo: {
    borderColor: PURPLE,
    backgroundColor: '#F0E8FA',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C4A8E0',
    marginBottom: 6,
  },
  dotActivo: {
    backgroundColor: PURPLE,
  },
  emocionTexto: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  emocionTextoActivo: {
    color: PURPLE,
    fontWeight: '700',
  },
  listaInvolucrados: {
    gap: 10,
  },
  involucradoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_BG,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  involucradoBtnActivo: {
    borderColor: PURPLE,
    backgroundColor: '#F0E8FA',
  },
  dotInvolucrado: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C4A8E0',
    marginRight: 12,
  },
  dotInvolucradoActivo: {
    backgroundColor: PURPLE,
  },
  involucradoTexto: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  involucradoTextoActivo: {
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

export default function RegistroEmociones({ navigation }) {
  const [emocionSeleccionada, setEmocionSeleccionada] = useState(null);
  const [involucradoSeleccionado, setInvolucradoSeleccionado] = useState(null);
  const [idEvaluacion, setIdEvaluacion] = useState(null);
  const [creandoEvaluacion, setCreandoEvaluacion] = useState(true);

  // Al entrar a esta pantalla (primer paso del flujo), se crea la evaluacion
  useEffect(() => {
    crearEvaluacion();
  }, []);

  const crearEvaluacion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    // buscamos el id_usuario (de la tabla usuario) que corresponde a este auth_id
    const { data: usuario, error: errUsuario } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('auth_id', user.id)
      .single();

    if (errUsuario) {
      alert('No se pudo identificar tu usuario: ' + errUsuario.message);
      setCreandoEvaluacion(false);
      return;
    }

    const { data: evaluacion, error: errEvaluacion } = await supabase
      .from('evaluacion')
      .insert({ id_usuario: usuario.id_usuario })
      .select('id_evaluacion')
      .single();

    if (errEvaluacion) {
      alert('No se pudo iniciar la evaluación: ' + errEvaluacion.message);
      setCreandoEvaluacion(false);
      return;
    }

    setIdEvaluacion(evaluacion.id_evaluacion);
    setCreandoEvaluacion(false);
  };

  // Avisa antes de salir (botón atrás, gesto o botón físico) si ya hay
  // algo contestado o la evaluación ya se creó, para no perder el progreso sin querer.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Solo nos interesa un "atrás" de verdad (botón, gesto, swipe).
      // Un reset (como el que hace UltimaPantalla al terminar el cuestionario)
      // no debe disparar esta alerta.
      if (e.data.action.type !== 'GO_BACK') {
        return;
      }
      const hayProgreso = emocionSeleccionada || involucradoSeleccionado || idEvaluacion;
      if (!hayProgreso) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        '¿Salir del cuestionario?',
        'Si sales ahora, perderás las respuestas que ya diste.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => {} },
          {
            text: 'Salir',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, emocionSeleccionada, involucradoSeleccionado, idEvaluacion]);

  const handleSiguiente = () => {
    if (!emocionSeleccionada || !involucradoSeleccionado) {
      alert('Por favor selecciona una opción en cada pregunta.');
      return;
    }
    if (!idEvaluacion) {
      alert('Un momento, todavía se está preparando tu evaluación.');
      return;
    }
    // Arrastramos el id_evaluacion + las respuestas acumuladas hasta ahora
    navigation.navigate('SeccionSeguridad', {
      idEvaluacion,
      respuestas: [
        { pregunta: 'emocion', valor: emocionSeleccionada },
        { pregunta: 'involucrado', valor: involucradoSeleccionado },
      ],
      puntosTotales: 0,
    });
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextos}>
          <Text style={styles.headerTitulo}>¿Cómo me siento?</Text>
          <Text style={styles.headerSub}>Selecciona una opción por pregunta</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.pregunta}>¿Cómo me siento hoy?</Text>
          <View style={styles.emocionesGrid}>
            {EMOCIONES.map((emocion) => {
              const activo = emocionSeleccionada === emocion;
              return (
                <TouchableOpacity
                  key={emocion}
                  style={[styles.emocionBtn, activo && styles.emocionBtnActivo]}
                  onPress={() => setEmocionSeleccionada(emocion)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dot, activo && styles.dotActivo]} />
                  <Text style={[styles.emocionTexto, activo && styles.emocionTextoActivo]}>
                    {emocion}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.pregunta}>¿Quién estuvo involucrado?</Text>
          <View style={styles.listaInvolucrados}>
            {INVOLUCRADOS.map((persona) => {
              const activo = involucradoSeleccionado === persona;
              return (
                <TouchableOpacity
                  key={persona}
                  style={[styles.involucradoBtn, activo && styles.involucradoBtnActivo]}
                  onPress={() => setInvolucradoSeleccionado(persona)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dotInvolucrado, activo && styles.dotInvolucradoActivo]} />
                  <Text style={[styles.involucradoTexto, activo && styles.involucradoTextoActivo]}>
                    {persona}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.botonWrapper}>
        <TouchableOpacity style={styles.botonSiguiente} onPress={handleSiguiente} disabled={creandoEvaluacion}>
          {creandoEvaluacion ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.botonTexto}>Siguiente</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}