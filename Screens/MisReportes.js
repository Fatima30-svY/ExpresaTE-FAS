import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // <-- Para recargar datos al entrar

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PURPLE = '#7C3DB8';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: WHITE },
  headerSub: { fontSize: 12, color: '#DDD', marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: '#2D1A4A', marginBottom: 12 },
  reporteCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0D0F0',
    elevation: 2,
  },
  reporteFecha: { fontSize: 14, fontWeight: '600', color: '#2D1A4A', marginBottom: 8 },
  reporteEstadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reporteEstado: { fontSize: 13, color: '#555' },
  reportePorcentaje: { fontSize: 13, fontWeight: '700' },
  barra: { height: 10, borderRadius: 5, backgroundColor: '#EEE', overflow: 'hidden', marginTop: 4 },
  barraRelleno: { height: 10, borderRadius: 5 },
  porcentajeTexto: { fontSize: 11, color: '#999', marginTop: 4 },
  botonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: BG,
  },
  botonGenerar: {
    backgroundColor: PURPLE,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
  },
  botonTexto: { color: WHITE, fontSize: 16, fontWeight: '700' },
  vacioTexto: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 }
});

export default function MisReportes({ navigation }) {
  // Estado para guardar los reportes reales
  const [reportes, setReportes] = useState([]);

  // Función para cargar los datos del teléfono
  const cargarReportes = async () => {
    try {
      const datosGuardados = await AsyncStorage.getItem('@mis_reportes');
      if (datosGuardados !== null) {
        setReportes(JSON.parse(datosGuardados));
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    }
  };

  // Se ejecuta cada vez que el usuario entra a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarReportes();
    }, [])
  );

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    const [anio, mes, dia] = partes;
    return `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]} de ${anio}`;
  };

  const getColor = (porcentaje) => {
    if (porcentaje >= 70) return '#4CAF50';
    if (porcentaje >= 40) return '#FF9800';
    return '#F44336';
  };

  const generarPDF = async () => {
    if (reportes.length === 0) {
      Alert.alert('Atención', 'No tienes reportes para generar un PDF.');
      return;
    }

    try {
      const totalReportes = reportes.length;
      const sumaPorcentajes = reportes.reduce((acc, curr) => acc + curr.porcentaje, 0);
      const promedio = Math.round(sumaPorcentajes / totalReportes) || 0;
      const colorPromedio = getColor(promedio);

      const tarjetasHtml = reportes.map((r) => {
        const color = getColor(r.porcentaje);
        const bgEtiqueta = `${color}15`; 
        
        return `
          <div class="card">
            <div class="card-header">
              <span class="fecha">${formatearFecha(r.fecha)}</span>
              <span class="estado-etiqueta" style="color: ${color}; background-color: ${bgEtiqueta}; border: 1px solid ${color}40;">
                ${r.estadoAnimo}
              </span>
            </div>
            <div class="barra-fondo">
              <div class="barra-relleno" style="width: ${r.porcentaje}%; background-color: ${color};"></div>
            </div>
            <div class="porcentaje-texto">${r.porcentaje}% de bienestar registrado</div>
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body { font-family: 'Inter', Arial, sans-serif; padding: 40px; background-color: #FAFAFA; color: #333; }
            .header-container { border-bottom: 2px solid #7C3DB8; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #7C3DB8; font-size: 28px; margin: 0 0 8px 0; }
            .subtitle { color: #666; font-size: 14px; margin: 0; }
            .resumen-container { display: flex; gap: 20px; margin-bottom: 40px; }
            .resumen-box { background: #fff; padding: 20px; border-radius: 12px; flex: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #eee; }
            .resumen-titulo { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .resumen-valor { font-size: 24px; font-weight: 700; color: #2D1A4A; }
            h2 { font-size: 18px; color: #2D1A4A; margin-bottom: 20px; }
            .card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #E0D0F0; box-shadow: 0 4px 12px rgba(124, 61, 184, 0.05); }
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .fecha { font-size: 15px; font-weight: 600; color: #2D1A4A; }
            .estado-etiqueta { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
            .barra-fondo { height: 12px; background-color: #F0F0F0; border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
            .barra-relleno { height: 100%; border-radius: 6px; }
            .porcentaje-texto { font-size: 12px; color: #777; text-align: right; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1>ExpresaTE-SVB</h1>
            <p class="subtitle">Reporte de Bienestar Emocional • Información confidencial</p>
          </div>
          <div class="resumen-container">
            <div class="resumen-box">
              <div class="resumen-titulo">Total de Registros</div>
              <div class="resumen-valor">${totalReportes}</div>
            </div>
            <div class="resumen-box">
              <div class="resumen-titulo">Bienestar Promedio</div>
              <div class="resumen-valor" style="color: ${colorPromedio};">${promedio}%</div>
            </div>
          </div>
          <h2>Detalle de Entradas</h2>
          ${tarjetasHtml}
          <div class="footer">
            Documento generado el ${formatearFecha(new Date().toISOString().split('T')[0])} <br> 
            © ExpresaTE-SVB
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const destino = FileSystem.documentDirectory + 'ReporteExpresaTE.pdf';
      await FileSystem.moveAsync({ from: uri, to: destino });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destino, { mimeType: 'application/pdf', dialogTitle: 'Descargar Reporte PDF' });
      } else {
        Alert.alert('PDF Generado', `Tu reporte se guardó en: ${destino}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Mis Reportes</Text>
        <Text style={styles.headerSub}>Historial de bienestar</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.seccionTitulo}>Fechas de registro</Text>
        
        {reportes.length === 0 ? (
          <Text style={styles.vacioTexto}>Aún no has completado ningún cuestionario.</Text>
        ) : (
          reportes.map((reporte, index) => {
            const color = getColor(reporte.porcentaje);
            return (
              <View key={index} style={styles.reporteCard}>
                <Text style={styles.reporteFecha}>{formatearFecha(reporte.fecha)}</Text>
                <View style={styles.reporteEstadoRow}>
                  <Text style={styles.reporteEstado}>Estado de animo:</Text>
                  <Text style={[styles.reportePorcentaje, { color }]}>{reporte.estadoAnimo}</Text>
                </View>
                <View style={styles.barra}>
                  <View style={[styles.barraRelleno, { width: `${reporte.porcentaje}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.porcentajeTexto}>{reporte.porcentaje}% bienestar</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.botonWrapper}>
        <TouchableOpacity 
          style={[styles.botonGenerar, reportes.length === 0 && { opacity: 0.5 }]} 
          onPress={generarPDF}
          disabled={reportes.length === 0}
        >
          <Text style={styles.botonTexto}>Generar Reporte PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}