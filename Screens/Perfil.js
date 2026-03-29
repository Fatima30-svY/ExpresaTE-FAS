import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function getInitials(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

const PURPLE = '#7C3DB8';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

export default function Perfil({ navigation, route }) {
  const params = route.params || {};
  const nombre = params.nombre || '';
  const correo = params.correo || '';
  const carrera = params.carrera || '';
  const noCuenta = params.noCuenta || '';
  const edad = params.edad || '';

  const handleCerrarSesion = () => {
    navigation.navigate('Login');
  };

  const handleInicio = () => {
    navigation.navigate('PantallaPrincipal', route.params);
  };

  return (
    <View style={styles.flex}>

      {/* Header morado */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Mi perfil</Text>
      </View>

      {/* Avatar flotante */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{getInitials(nombre)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.nombre}>{nombre || '—'}</Text>
        <Text style={styles.carreraTexto}>{carrera || '—'}</Text>

        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Correo</Text>
          <Text style={styles.campoValor}>{correo || '—'}</Text>
        </View>

        <View style={styles.campo}>
          <Text style={styles.campoLabel}>No. de cuenta</Text>
          <Text style={styles.campoValor}>{noCuenta || '—'}</Text>
        </View>

        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Edad</Text>
          <Text style={styles.campoValor}>{edad || '—'}</Text>
        </View>

        <TouchableOpacity style={styles.botonCerrar} onPress={handleCerrarSesion}>
          <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={styles.espacioTabBar} />
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleInicio}>
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="clipboard-outline" size={24} color="#999" />
          <Text style={styles.tabLabel}>Registro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person" size={24} color={PURPLE} />
          <Text style={[styles.tabLabel, styles.tabActivo]}>Perfil</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 56,
    alignItems: 'center',
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -44,
    marginBottom: 8,
    zIndex: 10,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#C4A8E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: WHITE,
  },
  avatarTexto: {
    fontSize: 30,
    fontWeight: '700',
    color: WHITE,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: 'center',
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
    textAlign: 'center',
  },
  carreraTexto: {
    fontSize: 13,
    color: PURPLE,
    marginBottom: 24,
    textAlign: 'center',
  },
  campo: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  campoLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  campoValor: {
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  botonCerrar: {
    marginTop: 16,
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: PURPLE,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonCerrarTexto: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '600',
  },
  espacioTabBar: {
    height: 80,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
  },
  tabActivo: {
    color: PURPLE,
    fontWeight: '600',
  },
});