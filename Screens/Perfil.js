import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

function getInitials(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

const PURPLE = '#7C3DB8';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

// Clave del caché local del perfil (pantalla completa), para que el nombre
// y el avatar salgan de inmediato en vez de mostrar "—" mientras se espera
// la respuesta de Supabase.
const CACHE_KEY_PERFIL = 'expresate_perfil_pantalla_cache';

export default function Perfil({ navigation }) {
  const [userData, setUserData] = useState({
    nombre: '',
    correo: '',
    carreraNombre: '',
    no_control: '',
    edad: ''
  });

  // Solo al primer montaje: pinta el caché local de inmediato, si existe,
  // para evitar el parpadeo/"—" en la primera vista de la pantalla.
  useEffect(() => {
    cargarCacheInicial();
  }, []);

  const cargarCacheInicial = async () => {
    try {
      const cache = await AsyncStorage.getItem(CACHE_KEY_PERFIL);
      if (cache) {
        setUserData(JSON.parse(cache));
      }
    } catch (e) {
      // si el caché falla no pasa nada, de todos modos se carga de la red
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [])
  );

  const cargarPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    // trae la fila de usuario junto con el nombre de su carrera (join)
    const { data, error } = await supabase
      .from('usuario')
      .select('nombre, apellido_paterno, apellido_materno, correo, no_control, edad, carrera(nombre)')
      .eq('auth_id', user.id)
      .single();

    if (error) {
      alert('No se pudo cargar tu perfil: ' + error.message);
      return;
    }

    const datosFormateados = {
      nombre: [data.nombre, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' '),
      correo: data.correo,
      carreraNombre: data.carrera?.nombre || '',
      no_control: data.no_control,
      edad: data.edad,
    };

    setUserData(datosFormateados);
    AsyncStorage.setItem(CACHE_KEY_PERFIL, JSON.stringify(datosFormateados)).catch(() => {});
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    navigation.navigate('Login');
  };

  const handleInicio = () => {
    navigation.navigate('PantallaPrincipal');
  };

  const handleIrAReportes = () => {
    navigation.navigate('MisReportes');
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Mi perfil</Text>
      </View>

      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{getInitials(userData.nombre)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.nombre}>{userData.nombre || '—'}</Text>
        <Text style={styles.carreraTexto}>{userData.carreraNombre || '—'}</Text>

        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Correo</Text>
          <Text style={styles.campoValor}>{userData.correo || '—'}</Text>
        </View>

        <View style={styles.campo}>
          <Text style={styles.campoLabel}>No. de cuenta</Text>
          <Text style={styles.campoValor}>{userData.no_control || '—'}</Text>
        </View>

        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Edad</Text>
          <Text style={styles.campoValor}>{userData.edad || '—'}</Text>
        </View>

        <TouchableOpacity style={styles.botonCerrar} onPress={handleCerrarSesion}>
          <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={styles.espacioTabBar} />
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleInicio}>
          <View style={styles.tabPill}>
            <Ionicons name="home-outline" size={22} color="#A69BB5" />
            <Text style={styles.tabLabel}>Inicio</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleIrAReportes}>
          <View style={styles.tabPill}>
            <Ionicons name="clipboard-outline" size={22} color="#A69BB5" />
            <Text style={styles.tabLabel}>Registro</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <View style={[styles.tabPill, styles.tabPillActivo]}>
            <Ionicons name="person" size={22} color={PURPLE} />
            <Text style={[styles.tabLabel, styles.tabLabelActivo]}>Perfil</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  header: { backgroundColor: PURPLE, paddingTop: Platform.OS === 'android' ? 48 : 56, paddingBottom: 56, alignItems: 'center' },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: WHITE },
  avatarWrapper: { alignItems: 'center', marginTop: -44, marginBottom: 8, zIndex: 10 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#C4A8E0', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WHITE },
  avatarTexto: { fontSize: 30, fontWeight: '700', color: WHITE },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, alignItems: 'center' },
  nombre: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 4, textAlign: 'center' },
  carreraTexto: { fontSize: 13, color: PURPLE, marginBottom: 24, textAlign: 'center' },
  campo: { width: '100%', backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 },
  campoLabel: { fontSize: 11, color: '#999' },
  campoValor: { fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  botonCerrar: { marginTop: 16, width: '100%', borderRadius: 24, borderWidth: 1.5, borderColor: PURPLE, paddingVertical: 13, alignItems: 'center' },
  botonCerrarTexto: { color: PURPLE, fontSize: 15, fontWeight: '600' },
  espacioTabBar: { height: 80 },
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
  tabPillActivo: { backgroundColor: '#F1E7FA' },
  tabLabel: { fontSize: 10.5, color: '#A69BB5', fontWeight: '600' },
  tabLabelActivo: { color: PURPLE, fontWeight: '700' },
});