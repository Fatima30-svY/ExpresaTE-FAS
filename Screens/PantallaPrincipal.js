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
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configurar español
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

const hoy = new Date().toISOString().split('T')[0];

export default function Principal({ navigation, route }) {
  const { nombre } = route.params || {};
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo */}
        <Text style={styles.saludo}>¡Hola, {nombre}!</Text>
        <Text style={styles.subSaludo}>¿Cómo te sientes hoy?</Text>

        {/* Calendario */}
        <View style={styles.calendarioCard}>
          <Calendar
            current={hoy}
            onDayPress={(day) => setDiaSeleccionado(day.dateString)}
            markedDates={{
              [diaSeleccionado]: {
                selected: true,
                selectedColor: '#7C3DB8',
              },
              [hoy]: {
                marked: true,
                dotColor: '#7C3DB8',
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
              textDisabledColor: '#C0A0E0',
              dotColor: '#7C3DB8',
              selectedDotColor: '#fff',
              arrowColor: '#7C3DB8',
              monthTextColor: '#2D1A4A',
              textDayFontSize: 14,
              textMonthFontSize: 15,
              textMonthFontWeight: '700',
              textDayHeaderFontSize: 12,
              textDayHeaderFontWeight: '600',
            }}
          />
        </View>

        {/* Card Registrar */}
        <View style={styles.registrarCard}>
          <Text style={styles.registrarTitulo}>Registrar cómo me siento hoy</Text>
          <Text style={styles.registrarSub}>Tómate un tiempo para ti</Text>
          <TouchableOpacity style={styles.botonVamos}>
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
          <Ionicons name="home" size={24} color="#7C3DB8" />
          <Text style={[styles.tabLabel, styles.tabActivo]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="clipboard-outline" size={24} color="#999" />
          <Text style={styles.tabLabel}>Registro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person" size={24} color="#999" />
          <Text style={styles.tabLabel}>Perfil</Text>
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
  flex: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 20,
  },

  // Saludo
  saludo: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subSaludo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },

  // Calendario
  calendarioCard: {
    backgroundColor: PURPLE_BG,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },

  // Card registrar
  registrarCard: {
    backgroundColor: PURPLE_BG,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  registrarTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1A4A',
    textAlign: 'center',
    marginBottom: 6,
  },
  registrarSub: {
    fontSize: 13,
    color: '#7A5FA0',
    marginBottom: 16,
  },
  botonVamos: {
    backgroundColor: PURPLE,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  botonVamosTexto: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
  },

  // Consejos
  seccionTitulo: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  consejosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  consejoCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  consejoTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1A4A',
    marginBottom: 6,
  },
  consejoTexto: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },

  // Tab bar
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