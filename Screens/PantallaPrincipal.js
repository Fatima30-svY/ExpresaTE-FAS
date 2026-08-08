import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const LINEAS_AYUDA = [
  { nombre: 'Emergencia', numero: '911' },
  { nombre: 'Línea de las Mujeres (079, opción 1)', numero: '079' },
  { nombre: 'Red Nacional de Refugios', numero: '8008224460' },
];

// Clave del caché local del perfil, para que el saludo salga de inmediato
// en vez de mostrar "..." mientras se espera la respuesta de Supabase.
const CACHE_KEY_PERFIL = 'expresate_perfil_cache';

// 1. CONFIGURACIÓN DE IDIOMA (ESPAÑOL)
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// 2. FUNCIÓN PARA FECHA LOCAL (MÉXICO)
const formatearFechaLocal = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const obtenerFechaLocal = () => formatearFechaLocal(new Date());

const hoy = obtenerFechaLocal();

export default function Principal({ navigation }) {
  // Estado para datos del usuario, ahora vienen de Supabase, no de route.params
  const [userData, setUserData] = useState({});
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);
  const [diasEncuestados, setDiasEncuestados] = useState([]); // ['2026-08-05', ...]

  // 3. AL ABRIR LA PANTALLA: primero pinta el caché local (si existe) para que
  // el saludo salga de inmediato, y luego trae el dato fresco de Supabase.
  useEffect(() => {
    cargarPerfilCacheado();
  }, []);

  // Recarga los días con encuesta contestada cada vez que se vuelve a esta
  // pantalla (por ejemplo, justo después de terminar un cuestionario nuevo).
  useFocusEffect(
    useCallback(() => {
      if (userData.id_usuario) {
        cargarDiasEncuestados(userData.id_usuario);
      }
    }, [userData.id_usuario])
  );

  const cargarPerfilCacheado = async () => {
    try {
      const cache = await AsyncStorage.getItem(CACHE_KEY_PERFIL);
      if (cache) {
        setUserData(JSON.parse(cache));
      }
    } catch (e) {
      // si el caché falla no pasa nada, de todos modos se carga de la red
    }
    cargarPerfil();
  };

  const cargarPerfil = async () => {
    // Quién está logueado ahorita
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    // Su fila en la tabla usuario, ligada por auth_id
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error) {
      alert('No se pudo cargar tu perfil: ' + error.message);
      return;
    }

    setUserData(data);
    AsyncStorage.setItem(CACHE_KEY_PERFIL, JSON.stringify(data)).catch(() => {});
    cargarDiasEncuestados(data.id_usuario);
  };

  // Trae las fechas (sin hora) de todas las evaluaciones que ha contestado
  // este usuario, para marcarlas con un puntito en el calendario.
  const cargarDiasEncuestados = async (idUsuario) => {
    if (!idUsuario) return;

    const { data, error } = await supabase
      .from('evaluacion')
      .select('fecha_hora')
      .eq('id_usuario', idUsuario);

    if (error) {
      console.error('Error al cargar días con encuesta contestada:', error);
      return;
    }

    const dias = (data || [])
      .filter((e) => e.fecha_hora)
      .map((e) => formatearFechaLocal(new Date(e.fecha_hora)));

    setDiasEncuestados([...new Set(dias)]);
  };

  const irAPerfil = () => {
    navigation.navigate('Perfil', userData);
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo con Negritas */}
        <Text style={styles.saludo}>¡Hola, {userData.nombre || '...'}!</Text>
        <Text style={styles.subSaludo}>¿Cómo te sientes hoy?</Text>

        {/* Calendario Forzado a Español */}
        <View style={styles.calendarioCard}>
          <Calendar
            current={hoy}
            locale={'es'} // <-- FUERZA EL ESPAÑOL
            onDayPress={(day) => setDiaSeleccionado(day.dateString)}
            markedDates={{
              ...diasEncuestados.reduce((acc, fecha) => {
                acc[fecha] = { marked: true, dotColor: '#7C3DB8' };
                return acc;
              }, {}),
              [hoy]: {
                ...(diasEncuestados.includes(hoy) ? { marked: true, dotColor: '#7C3DB8' } : {}),
                marked: true,
                dotColor: '#7C3DB8',
              },
              [diaSeleccionado]: {
                ...(diasEncuestados.includes(diaSeleccionado) ? { marked: true, dotColor: '#7C3DB8' } : {}),
                selected: true,
                selectedColor: '#7C3DB8',
              },
            }}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#7A5FA0',
              selectedDayBackgroundColor: '#7C3DB8',
              selectedDayTextColor: '#fff',
              todayTextColor: '#7C3DB8',
              dayTextColor: '#2D1A4A',
              textMonthFontWeight: '700', // Negrita en Mes
              textDayHeaderFontWeight: '600',
            }}
          />
        </View>

        {/* Líneas de ayuda */}
        <View style={styles.ayudaCard}>
          <Text style={styles.ayudaTitulo}>Líneas de ayuda</Text>
          {LINEAS_AYUDA.map((linea) => (
            <TouchableOpacity
              key={linea.numero}
              style={styles.ayudaFila}
              onPress={() => Linking.openURL(`tel:${linea.numero}`)}
            >
              <Text style={styles.ayudaTexto}>{linea.nombre}</Text>
              <Text style={styles.ayudaNumero}>{linea.numero}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Registrar */}
        <View style={styles.registrarCard}>
          <Text style={styles.registrarTitulo}>Registrar cómo me siento hoy</Text>
          <Text style={styles.registrarSub}>Tómate un tiempo para ti</Text>
          <TouchableOpacity 
            style={styles.botonVamos} 
            onPress={() => navigation.navigate('RegistroEmociones', userData)}
          >
            <Text style={styles.botonVamosTexto}>¡Vamos!</Text>
          </TouchableOpacity>
        </View>

        {/* Consejos */}
        <Text style={styles.seccionTitulo}>Consejos</Text>
        <View style={styles.consejosRow}>
          <View style={styles.consejoCard}>
            <Text style={styles.consejoTitulo}>Respira profundo</Text>
            <Text style={styles.consejoTexto}>Dedica 5 min a ejercicios de respiración</Text>
          </View>
          <View style={styles.consejoCard}>
            <Text style={styles.consejoTitulo}>Escribe tus logros</Text>
            <Text style={styles.consejoTexto}>Anota 3 cosas positivas del día</Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <View style={[styles.tabPill, styles.tabPillActivo]}>
            <Ionicons name="home" size={22} color={PURPLE} />
            <Text style={[styles.tabLabel, styles.tabLabelActivo]}>Inicio</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('MisReportes', userData)}
        >
          <View style={styles.tabPill}>
            <Ionicons name="clipboard-outline" size={22} color="#A69BB5" />
            <Text style={styles.tabLabel}>Registro</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={irAPerfil}>
          <View style={styles.tabPill}>
            <Ionicons name="person-outline" size={22} color="#A69BB5" />
            <Text style={styles.tabLabel}>Perfil</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PURPLE = '#7C3DB8';
const PURPLE_BG = '#EDE8F5';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 20,
  },
  saludo: {
    fontSize: 26,
    fontWeight: '700', // NEGRITA
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subSaludo: { fontSize: 14, color: '#666', marginBottom: 20 },
  calendarioCard: { backgroundColor: PURPLE_BG, borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  ayudaCard: {
    backgroundColor: '#FFF3F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4C7BC',
    padding: 16,
    marginBottom: 20,
  },
  ayudaTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B5442E',
    marginBottom: 10,
  },
  ayudaFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ayudaTexto: {
    fontSize: 12,
    color: '#5C3D8A',
    flex: 1,
    paddingRight: 8,
  },
  ayudaNumero: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B5442E',
  },
  registrarCard: {
    backgroundColor: PURPLE_BG,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  registrarTitulo: {
    fontSize: 16,
    fontWeight: '700', // NEGRITA
    color: '#2D1A4A',
    textAlign: 'center',
    marginBottom: 6,
  },
  registrarSub: { fontSize: 13, color: '#7A5FA0', marginBottom: 16 },
  botonVamos: {
    backgroundColor: PURPLE,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  botonVamosTexto: {
    color: WHITE,
    fontWeight: '700', // NEGRITA
    fontSize: 15,
  },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: '700', // NEGRITA
    color: '#1A1A2E',
    marginBottom: 12,
  },
  consejosRow: { flexDirection: 'row', gap: 12 },
  consejoCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
  },
  consejoTitulo: { fontSize: 13, fontWeight: '700', color: '#2D1A4A', marginBottom: 6 },
  consejoTexto: { fontSize: 12, color: '#666', lineHeight: 17 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    paddingTop: 12,
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    shadowColor: '#3C2066',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 14,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  tabPillActivo: {
    backgroundColor: '#F1E7FA',
  },
  tabLabel: { fontSize: 10.5, color: '#A69BB5', fontWeight: '600' },
  tabLabelActivo: { color: PURPLE, fontWeight: '700' },
});