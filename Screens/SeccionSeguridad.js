import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#7C3DB8';
const PURPLE_BG = '#EDE8F5';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

// Escala de las 18 preguntas de frecuencia
const OPCIONES_LIKERT = ['Nunca', 'Una vez', 'Algunas veces', 'Frecuentemente'];

// Preguntas agrupadas por categoría, tal cual el cuestionario
const CATEGORIAS = [
  {
    nombre: 'Entorno universitario',
    preguntas: [
      { codigo: 'IV01', texto: '¿Has experimentado alguna situación dentro de la universidad que te hizo sentir insegura?' },
      { codigo: 'IV02', texto: '¿Has experimentado situaciones incómodas al interactuar con personas de tu entorno universitario?' },
      { codigo: 'IV03', texto: '¿Has evitado lugares dentro de la universidad por sentirte incómoda o insegura?' },
      { codigo: 'IV04', texto: '¿Has percibido miradas, gestos o comportamientos que te hicieron sentir incómoda?' },
    ],
  },
  {
    nombre: 'Bienestar emocional',
    preguntas: [
      { codigo: 'IV05', texto: '¿Has recibido comentarios que afectaron tu bienestar emocional?' },
      { codigo: 'IV06', texto: '¿Alguna persona ha intentado hacerte sentir inferior o menospreciarte?' },
      { codigo: 'IV07', texto: '¿Has sido objeto de burlas o críticas constantes?' },
      { codigo: 'IV08', texto: '¿Alguna persona te ha hablado de una forma que te hizo sentir intimidada?' },
    ],
  },
  {
    nombre: 'Interacciones no deseadas',
    preguntas: [
      { codigo: 'IV09', texto: '¿Has recibido mensajes o intentos de contacto que no deseabas?' },
      { codigo: 'IV10', texto: '¿Alguna persona ha insistido en interactuar contigo después de que expresaste que no lo deseabas?' },
      { codigo: 'IV11', texto: '¿Has sentido que alguna persona te sigue o vigila de una manera que te genera incomodidad?' },
      { codigo: 'IV12', texto: '¿Has recibido comentarios, insinuaciones o bromas de contenido sexual que te hicieron sentir incómoda?' },
    ],
  },
  {
    nombre: 'Control',
    preguntas: [
      { codigo: 'IV13', texto: '¿Alguna persona ha intentado influir o controlar decisiones relacionadas con tu vida personal o académica?' },
      { codigo: 'IV14', texto: '¿Has sentido presión para realizar actividades con las que no estabas de acuerdo?' },
      { codigo: 'IV15', texto: '¿Alguna persona ha invadido tu privacidad sin tu consentimiento (por ejemplo, revisando tu celular, redes sociales o pertenencias)?' },
    ],
  },
  {
    nombre: 'Contacto físico y seguridad',
    preguntas: [
      { codigo: 'IV16', texto: '¿Has experimentado contacto físico que ocurrió sin tu consentimiento o que te hizo sentir incómoda?' },
      { codigo: 'IV17', texto: '¿Has sentido miedo de que alguna persona pudiera hacerte daño?' },
      { codigo: 'IV18', texto: '¿Has estado en situaciones donde sentiste que no eras libre de decidir o retirarte?' },
    ],
  },
];

// Preguntas de apoyo — Sí/No, sección aparte porque no se puntúan igual
const PREGUNTAS_APOYO = [
  { codigo: 'IV19', texto: 'Siento que tengo a alguien en quien confiar si tengo un problema.' },
  { codigo: 'IV20', texto: 'Me gustaría recibir apoyo o hablar con alguien sobre mi situación.' },
];

// Todas las secciones en un solo arreglo, incluyendo Apoyo al final,
// para poder recorrerlas con un solo índice de paso
const SECCIONES = [
  ...CATEGORIAS.map((c) => ({ ...c, tipo: 'likert' })),
  { nombre: 'Apoyo', preguntas: PREGUNTAS_APOYO, tipo: 'sinNo' },
];

export default function SeccionSeguridad({ navigation, route }) {
  const [pasoActual, setPasoActual] = useState(0);
  const [respuestasLikert, setRespuestasLikert] = useState({}); // { IV01: 'Nunca', ... }
  const [respuestasApoyo, setRespuestasApoyo] = useState({});   // { IV19: 'SI', ... }

  const seccion = SECCIONES[pasoActual];
  const esUltimaSeccion = pasoActual === SECCIONES.length - 1;

  // Aquí siempre hay progreso (ya vienen de contestar la sección anterior),
  // así que se avisa siempre que intente salir de la pantalla.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Solo nos interesa un "atrás" de verdad (botón, gesto, swipe).
      // Un reset (como el que hace UltimaPantalla al terminar el cuestionario)
      // no debe disparar esta alerta.
      if (e.data.action.type !== 'GO_BACK') {
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
  }, [navigation]);

  const totalPreguntasSeccion = seccion.preguntas.length;
  const respondidasSeccion = seccion.preguntas.filter((p) =>
    seccion.tipo === 'likert' ? !!respuestasLikert[p.codigo] : !!respuestasApoyo[p.codigo]
  ).length;

  const seleccionarLikert = (codigo, opcion) => {
    setRespuestasLikert((prev) => ({ ...prev, [codigo]: opcion }));
  };

  const seleccionarApoyo = (codigo, valor) => {
    setRespuestasApoyo((prev) => ({ ...prev, [codigo]: valor }));
  };

  const handleSiguiente = () => {
    if (respondidasSeccion < totalPreguntasSeccion) {
      alert('Por favor responde todas las preguntas de esta sección antes de continuar.');
      return;
    }

    if (!esUltimaSeccion) {
      setPasoActual((prev) => prev + 1);
      return;
    }

    // Última sección (Apoyo) respondida: armamos el arreglo final de respuestas
    const nuevasRespuestas = [
      ...Object.entries(respuestasLikert).map(([codigo, valor]) => ({ codigo, valor })),
      ...Object.entries(respuestasApoyo).map(([codigo, valor]) => ({ codigo, valor })),
    ];

    navigation.navigate('UltimaPantalla', {
      idEvaluacion: route.params?.idEvaluacion,
      respuestas: [...(route.params?.respuestas || []), ...nuevasRespuestas],
      puntosTotales: route.params?.puntosTotales || 0,
    });
  };

  const handleAtras = () => {
    if (pasoActual === 0) {
      navigation.goBack();
      return;
    }
    setPasoActual((prev) => prev - 1);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAtras} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTextos}>
          <Text style={styles.headerTitulo}>{seccion.nombre}</Text>
          <Text style={styles.headerSub}>
            Sección {pasoActual + 1} de {SECCIONES.length} · {respondidasSeccion} de {totalPreguntasSeccion} respondidas
          </Text>
        </View>
      </View>

      {/* Barra de progreso por secciones */}
      <View style={styles.progresoWrapper}>
        {SECCIONES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progresoBarra,
              i <= pasoActual && styles.progresoBarraActiva,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {pasoActual === 0 && (
          <Text style={styles.instrucciones}>
            Las siguientes preguntas se refieren a situaciones que hayas experimentado en tu entorno
            universitario. Selecciona la opción que mejor describa la frecuencia con la que ocurrió
            cada situación.
          </Text>
        )}

        {seccion.tipo === 'likert' &&
          seccion.preguntas.map((p) => (
            <View key={p.codigo} style={styles.card}>
              <Text style={styles.pregunta}>{p.texto}</Text>
              <View style={styles.opcionesRow}>
                {OPCIONES_LIKERT.map((opcion) => {
                  const activo = respuestasLikert[p.codigo] === opcion;
                  return (
                    <TouchableOpacity
                      key={opcion}
                      style={[styles.opcionBtn, activo && styles.opcionBtnActivo]}
                      onPress={() => seleccionarLikert(p.codigo, opcion)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.opcionTexto, activo && styles.opcionTextoActivo]}>
                        {opcion}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

        {seccion.tipo === 'sinNo' &&
          seccion.preguntas.map((p) => (
            <View key={p.codigo} style={styles.card}>
              <Text style={styles.pregunta}>{p.texto}</Text>
              <View style={styles.opcionesRowSiNo}>
                {['SI', 'NO'].map((valor) => {
                  const activo = respuestasApoyo[p.codigo] === valor;
                  return (
                    <TouchableOpacity
                      key={valor}
                      style={[styles.opcionBtnSiNo, activo && styles.opcionBtnActivo]}
                      onPress={() => seleccionarApoyo(p.codigo, valor)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.opcionTexto, activo && styles.opcionTextoActivo]}>
                        {valor === 'SI' ? 'Sí' : 'No'}
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
          <Text style={styles.botonTexto}>{esUltimaSeccion ? 'Finalizar' : 'Siguiente'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTextos: { flex: 1 },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: WHITE },
  headerSub: { fontSize: 12, color: '#DDD', marginTop: 2 },
  progresoWrapper: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: PURPLE,
    paddingBottom: 16,
  },
  progresoBarra: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progresoBarraActiva: {
    backgroundColor: WHITE,
  },
  scroll: { flex: 1 },
  content: { padding: 20 },
  instrucciones: { fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 19 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  pregunta: { fontSize: 14, fontWeight: '600', color: '#2D1A4A', marginBottom: 12 },
  opcionesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcionesRowSiNo: { flexDirection: 'row', gap: 10 },
  opcionBtn: {
    flexGrow: 1,
    minWidth: '47%',
    backgroundColor: PURPLE_BG,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  opcionBtnSiNo: {
    flex: 1,
    backgroundColor: PURPLE_BG,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  opcionBtnActivo: {
    borderColor: PURPLE,
    backgroundColor: '#F0E8FA',
  },
  opcionTexto: { fontSize: 12, color: '#555', fontWeight: '500' },
  opcionTextoActivo: { color: PURPLE, fontWeight: '700' },
  botonWrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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
  botonTexto: { color: WHITE, fontSize: 16, fontWeight: '700' },
});