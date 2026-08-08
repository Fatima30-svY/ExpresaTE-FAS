import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { obtenerDetalleEvaluacion } from '../lib/agenteRiesgo';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PURPLE = '#7C3DB8';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';
const NIVELES = ['Bajo', 'Medio', 'Alto'];

const COLOR_POR_NIVEL = {
  Bajo: '#4CAF50',
  Medio: '#FF9800',
  Alto: '#F44336',
};

const ICONO_POR_NIVEL = {
  Bajo: 'checkmark-circle',
  Medio: 'alert-circle',
  Alto: 'warning',
};

// Iconos en texto/emoji para el PDF (el visor de PDF no carga la fuente de Ionicons)
const EMOJI_POR_NIVEL = {
  Bajo: '✓',
  Medio: '!',
  Alto: '⚠',
};

const LINEAS_AYUDA = [
  { nombre: 'Emergencia', numero: '911' },
  { nombre: 'Línea de las Mujeres (079, opción 1)', numero: '079' },
  { nombre: 'Red Nacional de Refugios', numero: '8008224460' },
];

const colorPorPorcentaje = (pct) => {
  if (pct <= 33) return COLOR_POR_NIVEL.Bajo;
  if (pct <= 66) return COLOR_POR_NIVEL.Medio;
  return COLOR_POR_NIVEL.Alto;
};

// ─────────────────────────────────────────────────────────────
// Helpers de gráficas en SVG puro, para que se vean nítidas en el PDF
// (nada de capturas de pantalla, es vector real).
// ─────────────────────────────────────────────────────────────

// Dona de distribución por nivel de riesgo
function svgDonut(porcentajePorNivel, size = 138) {
  const r = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const circunferencia = 2 * Math.PI * r;
  let acumulado = 0;

  const segmentos = NIVELES.map((nivel) => {
    const pct = porcentajePorNivel[nivel] || 0;
    if (pct <= 0) return '';
    const largo = (pct / 100) * circunferencia;
    const hueco = circunferencia - largo;
    const svg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR_POR_NIVEL[nivel]}"
      stroke-width="22" stroke-dasharray="${largo} ${hueco}" stroke-dashoffset="${-acumulado}"
      transform="rotate(-90 ${cx} ${cy})" />`;
    acumulado += largo;
    return svg;
  }).join('');

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EEE6F7" stroke-width="22" />
      ${segmentos}
    </svg>
  `;
}

// Medidor tipo velocímetro (semicírculo) para el % de riesgo actual
function svgGauge(pct, color, size = 180) {
  const r = size / 2 - 24;
  const cx = size / 2;
  const cy = size / 2;
  const semiCircunferencia = Math.PI * r;
  const largo = (Math.max(0, Math.min(100, pct)) / 100) * semiCircunferencia;
  const hueco = semiCircunferencia - largo;
  const alturaSvg = size / 2 + 26;

  return `
    <svg width="${size}" height="${alturaSvg}" viewBox="0 0 ${size} ${alturaSvg}">
      <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
        fill="none" stroke="#EEE6F7" stroke-width="22" stroke-linecap="round" />
      <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
        fill="none" stroke="${color}" stroke-width="22" stroke-linecap="round"
        stroke-dasharray="${largo} ${hueco}" />
    </svg>
  `;
}

export default function MisReportes({ navigation }) {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [detalle, setDetalle] = useState(null); // lo que regresa el agente
  const [nivelDetalle, setNivelDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [noControl, setNoControl] = useState(null);

  const cargarReportes = async () => {
    setCargando(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    const { data: usuario, error: errUsuario } = await supabase
      .from('usuario')
      .select('id_usuario, no_control')
      .eq('auth_id', user.id)
      .single();

    if (errUsuario) {
      console.error('Error al identificar usuario:', errUsuario);
      setCargando(false);
      return;
    }

    setNoControl(usuario.no_control);

    const { data, error } = await supabase
      .from('evaluacion')
      .select('id_evaluacion, fecha_hora, id_nivel, nivel_riesgo(nombre)')
      .eq('id_usuario', usuario.id_usuario)
      .not('id_nivel', 'is', null)
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('Error al cargar reportes:', error);
      setCargando(false);
      return;
    }

    setReportes(data);
    setCargando(false);

    if (data && data.length > 0) {
      cargarDetalleUltimaEvaluacion(data[0]);
    } else {
      setDetalle(null);
      setNivelDetalle(null);
    }
  };

  // Le pide el detalle directo al agente — ya no calcula nada aquí.
  const cargarDetalleUltimaEvaluacion = async (evaluacionReciente) => {
    setCargandoDetalle(true);
    try {
      const resultado = await obtenerDetalleEvaluacion(
        evaluacionReciente.id_evaluacion,
        evaluacionReciente.id_nivel
      );
      setDetalle(resultado);
      setNivelDetalle(evaluacionReciente.nivel_riesgo?.nombre || 'Sin calcular');
    } catch (e) {
      console.error('Error al cargar el detalle de la última evaluación:', e);
      setDetalle(null);
      setNivelDetalle(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReportes();
    }, [])
  );

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  };

  const getColor = (nombreNivel) => COLOR_POR_NIVEL[nombreNivel] || '#999';
  const getIcono = (nombreNivel) => ICONO_POR_NIVEL[nombreNivel] || 'help-circle';

  const total = reportes.length;
  const conteoPorNivel = NIVELES.reduce((acc, n) => {
    acc[n] = reportes.filter((r) => (r.nivel_riesgo?.nombre || 'Sin calcular') === n).length;
    return acc;
  }, {});
  const porcentajePorNivel = NIVELES.reduce((acc, n) => {
    acc[n] = total > 0 ? Math.round((conteoPorNivel[n] / total) * 100) : 0;
    return acc;
  }, {});
  const ultimoNivel = reportes[0]?.nivel_riesgo?.nombre;
  const nivelMasFrecuente = NIVELES.reduce(
    (masFrecuente, n) => (conteoPorNivel[n] > (conteoPorNivel[masFrecuente] || 0) ? n : masFrecuente),
    NIVELES[0]
  );

  const generarPDF = async () => {
    if (reportes.length === 0) {
      Alert.alert('Atención', 'No tienes reportes para generar un PDF.');
      return;
    }

    try {
      const totalReportes = reportes.length;
      const primeraFecha = formatearFecha(reportes[reportes.length - 1]?.fecha_hora);
      const ultimaFecha = formatearFecha(reportes[0]?.fecha_hora);

      const filasTablaHtml = reportes.map((r, idx) => {
        const nombreNivel = r.nivel_riesgo?.nombre || 'Sin calcular';
        const color = getColor(nombreNivel);
        const fondoFila = idx % 2 === 0 ? '#FFFFFF' : '#FAF7FD';
        return `
          <tr style="background:${fondoFila};">
            <td class="td-fecha">${formatearFecha(r.fecha_hora)}</td>
            <td class="td-nivel">
              <span class="pill" style="color:${color}; background-color:${color}18; border:1px solid ${color}40;">
                ${EMOJI_POR_NIVEL[nombreNivel] || '·'} ${nombreNivel}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      const leyendaDonaHtml = NIVELES.map((n) => `
        <div class="leyenda-item">
          <span class="leyenda-dot" style="background:${getColor(n)};"></span>
          <span class="leyenda-nombre">${n}</span>
          <span class="leyenda-valor" style="color:${getColor(n)};">${porcentajePorNivel[n]}% · ${conteoPorNivel[n]} eval.</span>
        </div>
      `).join('');

      const categoriasHtml = detalle && detalle.porCategoria.length > 0
        ? `
          <div class="card">
            <div class="card-titulo">Mapa emocional — evaluación más reciente</div>
            <div class="card-subtitulo">Nivel de frecuencia reportado por área</div>
            ${detalle.porCategoria.map((c) => `
              <div class="barra-fila">
                <div class="barra-header">
                  <span class="barra-nombre">${c.nombre}</span>
                  <span class="barra-porcentaje" style="color:${colorPorPorcentaje(c.porcentaje)}">${c.porcentaje}%</span>
                </div>
                <div class="barra-fondo">
                  <div class="barra-relleno" style="width:${c.porcentaje}%; background:${colorPorPorcentaje(c.porcentaje)};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        `
        : '';

      // ─────────────────────────────────────────────────────────
      // NOTA DEL FIX: se quitó el @import de Google Fonts que estaba
      // aquí. Ese @import obligaba al WebView interno de expo-print a
      // hacer fetch de red durante el renderizado del PDF; si esa
      // petición fallaba o tardaba, el motor tiraba el error
      // "An error occured while writing the PDF data". Ahora se usa
      // una pila de fuentes del sistema (sin red) para que el render
      // sea 100% local.
      // ─────────────────────────────────────────────────────────
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8"/>
          <style>
            * { box-sizing: border-box; }
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: -apple-system, Roboto, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: #FAFAFA;
              color: #2D1A4A;
            }
            .pagina { padding: 28px 36px; }

            /* Evita que estos bloques se corten a la mitad entre una hoja y otra */
            .portada-header,
            .usuario-card,
            .kpi-row,
            .graficas-row,
            .card,
            .reporte-fila,
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .portada-header {
              background: linear-gradient(135deg, #7C3DB8 0%, #5B2D8E 100%);
              border-radius: 20px;
              padding: 22px 30px;
              color: #fff;
              margin-bottom: 18px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .portada-marca { display: flex; align-items: center; gap: 16px; }
            .portada-titulo { font-size: 24px; font-weight: 800; margin: 0; }
            .portada-subtitulo { font-size: 12.5px; opacity: 0.85; margin-top: 4px; }
            .portada-rango { text-align: right; font-size: 11.5px; opacity: 0.9; line-height: 1.6; }

            .usuario-card {
              display: flex; align-items: center; gap: 10px;
              background: #F3EBFA; border: 1px solid #E0C8F0;
              border-radius: 12px; padding: 10px 18px; margin-bottom: 14px;
            }
            .usuario-label { font-size: 11px; color: #9B72CF; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; }
            .usuario-valor { font-size: 13px; color: #3C2066; font-weight: 600; }

            .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
            .kpi-card {
              flex: 1; background: #fff; border-radius: 14px; padding: 12px 14px;
              border: 1px solid #E8DCF5; text-align: center;
            }
            .kpi-label { font-size: 10px; color: #9B8AAE; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 6px; font-weight: 600; }
            .kpi-valor { font-size: 20px; font-weight: 800; color: #2D1A4A; }

            .card {
              background: #fff; border-radius: 16px; padding: 16px 18px;
              margin-bottom: 14px; border: 1px solid #E8DCF5;
            }
            .card-titulo { font-size: 14px; font-weight: 700; color: #2D1A4A; }
            .card-subtitulo { font-size: 11px; color: #9B8AAE; margin-top: 2px; margin-bottom: 10px; }

            .graficas-row { display: flex; gap: 16px; margin-bottom: 14px; }
            .grafica-card { flex: 1; }
            .grafica-contenido { display: flex; align-items: center; justify-content: center; flex-direction: column; margin-top: 10px; }

            .dona-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
            .dona-centro {
              position: absolute; text-align: center;
            }
            .dona-centro-valor { font-size: 20px; font-weight: 800; color: #2D1A4A; }
            .dona-centro-label { font-size: 9.5px; color: #9B8AAE; font-weight: 600; }

            .leyenda { width: 100%; margin-top: 10px; }
            .leyenda-item { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11.5px; }
            .leyenda-dot { width: 9px; height: 9px; border-radius: 5px; flex-shrink: 0; }
            .leyenda-nombre { flex: 1; font-weight: 600; color: #444; }
            .leyenda-valor { font-weight: 700; }

            .gauge-badge {
              display: inline-flex; align-items: center; gap: 6px;
              padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
              margin-top: 8px;
            }

            .barra-fila { margin-bottom: 9px; }
            .barra-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .barra-nombre { font-size: 12px; color: #444; font-weight: 600; }
            .barra-porcentaje { font-size: 12px; font-weight: 700; }
            .barra-fondo { height: 11px; border-radius: 6px; background: #EEE6F7; overflow: hidden; }
            .barra-relleno { height: 100%; border-radius: 6px; }

            .consejo-item { display: flex; gap: 10px; padding: 12px 0; border-top: 1px solid #F0E8FA; }
            .consejo-item:first-of-type { border-top: none; padding-top: 4px; }
            .consejo-bullet { font-size: 15px; }
            .consejo-titulo { font-size: 13px; font-weight: 700; color: #3C2066; margin-bottom: 3px; }
            .consejo-texto { font-size: 12px; color: #5C3D8A; line-height: 1.5; }

            .card-ayuda { background: #FFF3F0; border-color: #F4C7BC; }
            .ayuda-fila { display: flex; justify-content: space-between; font-size: 12.5px; color: #7A4A3A; padding: 6px 0; }
            .ayuda-numero { font-weight: 700; color: #B5442E; }

            table { width: 100%; border-collapse: collapse; }
            .td-fecha { padding: 8px 10px; font-size: 12.5px; font-weight: 600; color: #2D1A4A; border-bottom: 1px solid #F0E8FA; }
            .td-nivel { padding: 8px 10px; text-align: right; border-bottom: 1px solid #F0E8FA; }
            .pill { display: inline-block; padding: 3px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; }

            .footer { margin-top: 18px; text-align: center; font-size: 10.5px; color: #B0A5C4; border-top: 1px solid #EEE; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="pagina">

            <div class="portada-header">
              <div class="portada-marca">
                <div>
                  <p class="portada-titulo">ExpresaTE-SVB</p>
                  <p class="portada-subtitulo">Historial de evaluaciones · Información confidencial</p>
                </div>
              </div>
              <div class="portada-rango">
                Periodo cubierto<br/>
                <strong>${primeraFecha}</strong> — <strong>${ultimaFecha}</strong>
              </div>
            </div>

            <div class="usuario-card">
              <span class="usuario-label">Usuario</span>
              <span class="usuario-valor">No. de cuenta: ${noControl || '—'}</span>
            </div>

            <div class="kpi-row">
              <div class="kpi-card">
                <div class="kpi-label">Evaluaciones totales</div>
                <div class="kpi-valor">${totalReportes}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Nivel más reciente</div>
                <div class="kpi-valor" style="color:${getColor(ultimoNivel)}">${ultimoNivel || '—'}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Nivel más frecuente</div>
                <div class="kpi-valor" style="color:${getColor(nivelMasFrecuente)}">${nivelMasFrecuente}</div>
              </div>
            </div>

            <div class="graficas-row">
              <div class="card grafica-card">
                <div class="card-titulo">Distribución por nivel</div>
                <div class="card-subtitulo">Todas tus evaluaciones registradas</div>
                <div class="grafica-contenido">
                  <div class="dona-wrap">
                    ${svgDonut(porcentajePorNivel)}
                    <div class="dona-centro">
                      <div class="dona-centro-valor">${totalReportes}</div>
                      <div class="dona-centro-label">EVAL.</div>
                    </div>
                  </div>
                  <div class="leyenda">${leyendaDonaHtml}</div>
                </div>
              </div>

              ${detalle ? `
              <div class="card grafica-card">
                <div class="card-titulo">Riesgo actual</div>
                <div class="card-subtitulo">Según tu evaluación más reciente</div>
                <div class="grafica-contenido">
                  ${svgGauge(detalle.porcentajeGeneral, getColor(nivelDetalle))}
                  <div style="margin-top:-8px; font-size:30px; font-weight:800; color:${getColor(nivelDetalle)};">
                    ${detalle.porcentajeGeneral}%
                  </div>
                  <div class="gauge-badge" style="color:${getColor(nivelDetalle)}; background:${getColor(nivelDetalle)}18;">
                    ${EMOJI_POR_NIVEL[nivelDetalle] || '·'} ${nivelDetalle}
                  </div>
                </div>
              </div>
              ` : ''}
            </div>

            ${categoriasHtml}

            <div class="card">
              <div class="card-titulo">Detalle de evaluaciones</div>
              <div class="card-subtitulo">${totalReportes} registros, ordenados del más reciente al más antiguo</div>
              <table>
                <tbody>
                  ${filasTablaHtml}
                </tbody>
              </table>
            </div>

            <div class="footer">
              Documento generado el ${formatearFecha(new Date().toISOString())} · © ExpresaTE-SVB
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const destino = FileSystem.documentDirectory + 'ReporteExpresaTE.pdf';
      await FileSystem.moveAsync({ from: uri, to: destino });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destino, { mimeType: 'application/pdf', dialogTitle: 'Descargar Reporte PDF' });
      } else {
        Alert.alert('PDF Generado', `Tu reporte se guardó en: ${destino}`);
      }
    } catch (error) {
      // FIX: se agrega el mensaje real del error al log y a la alerta,
      // para poder diagnosticar rápido si vuelve a fallar por otra causa.
      console.error('Error generando PDF:', error?.message || error);
      Alert.alert('Error', `No se pudo generar el PDF.\n${error?.message || ''}`);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBotonBack}
          onPress={() => navigation.navigate('PantallaPrincipal')}
        >
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitulo}>Mis Reportes</Text>
          <Text style={styles.headerSub}>Historial de evaluaciones</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {cargando ? (
          <Text style={styles.vacioTexto}>Cargando...</Text>
        ) : reportes.length === 0 ? (
          <Text style={styles.vacioTexto}>Aún no has completado ningún cuestionario.</Text>
        ) : (
          <>
            <View style={styles.resumenPrincipal}>
              <View style={styles.resumenPrincipalItem}>
                <Text style={styles.resumenPrincipalValor}>{total}</Text>
                <Text style={styles.resumenPrincipalLabel}>Evaluaciones{'\n'}totales</Text>
              </View>
              <View style={styles.resumenDivisor} />
              <View style={styles.resumenPrincipalItem}>
                <View style={styles.ultimoNivelRow}>
                  <Ionicons name={getIcono(ultimoNivel)} size={20} color={getColor(ultimoNivel)} />
                  <Text style={[styles.resumenPrincipalValor, { color: getColor(ultimoNivel), fontSize: 18 }]}>
                    {ultimoNivel || '—'}
                  </Text>
                </View>
                <Text style={styles.resumenPrincipalLabel}>Nivel más{'\n'}reciente</Text>
              </View>
            </View>

            {nivelDetalle === 'Alto' && (
              <View style={styles.ayudaUrgenteCard}>
                <View style={styles.ayudaUrgenteHeader}>
                  <Ionicons name="warning" size={20} color="#B5442E" />
                  <Text style={styles.ayudaUrgenteTitulo}>Si necesitas ayuda ahora, no esperes</Text>
                </View>
                {LINEAS_AYUDA.map((linea) => (
                  <TouchableOpacity
                    key={linea.numero}
                    style={styles.ayudaUrgenteFila}
                    onPress={() => Linking.openURL(`tel:${linea.numero}`)}
                  >
                    <Text style={styles.ayudaUrgenteTexto}>{linea.nombre}</Text>
                    <Text style={styles.ayudaUrgenteNumero}>{linea.numero}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {cargandoDetalle ? (
              <View style={styles.graficaCard}>
                <Text style={styles.vacioTexto}>Cargando tu último resultado...</Text>
              </View>
            ) : detalle ? (
              <>
                <View style={styles.graficaCard}>
                  <Text style={styles.graficaTitulo}>Tu nivel de riesgo actual</Text>
                  <View style={styles.medidorHeaderRow}>
                    <Text style={[styles.medidorPorcentaje, { color: getColor(nivelDetalle) }]}>
                      {detalle.porcentajeGeneral}%
                    </Text>
                    <View style={[styles.medidorBadge, { backgroundColor: `${getColor(nivelDetalle)}18` }]}>
                      <Ionicons name={getIcono(nivelDetalle)} size={14} color={getColor(nivelDetalle)} />
                      <Text style={[styles.medidorBadgeTexto, { color: getColor(nivelDetalle) }]}>
                        {nivelDetalle}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.medidorFondo}>
                    <View
                      style={[
                        styles.medidorRelleno,
                        { width: `${detalle.porcentajeGeneral}%`, backgroundColor: getColor(nivelDetalle) },
                      ]}
                    />
                  </View>
                  <View style={styles.medidorEscalaRow}>
                    <Text style={styles.medidorEscalaTexto}>Bajo</Text>
                    <Text style={styles.medidorEscalaTexto}>Medio</Text>
                    <Text style={styles.medidorEscalaTexto}>Alto</Text>
                  </View>
                </View>

                {detalle.porCategoria.length > 0 && (
                  <View style={styles.graficaCard}>
                    <Text style={styles.graficaTitulo}>Tu mapa emocional</Text>
                    <Text style={styles.graficaSubtitulo}>
                      Según tu evaluación más reciente, por área
                    </Text>
                    <View style={{ gap: 14, marginTop: 6 }}>
                      {detalle.porCategoria.map((cat) => (
                        <View key={cat.nombre}>
                          <View style={styles.categoriaHeaderRow}>
                            <Text style={styles.categoriaNombre}>{cat.nombre}</Text>
                            <Text style={[styles.categoriaPorcentaje, { color: colorPorPorcentaje(cat.porcentaje) }]}>
                              {cat.porcentaje}%
                            </Text>
                          </View>
                          <View style={styles.categoriaBarraFondo}>
                            <View
                              style={[
                                styles.categoriaBarraRelleno,
                                { width: `${cat.porcentaje}%`, backgroundColor: colorPorPorcentaje(cat.porcentaje) },
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {detalle.consejos.length > 0 && (
                  <View style={styles.graficaCard}>
                    <Text style={styles.graficaTitulo}>Consejos para ti</Text>
                    <View style={{ gap: 12, marginTop: 4 }}>
                      {detalle.consejos.map((c, idx) => (
                        <View key={idx} style={styles.consejoCard}>
                          <Ionicons name="bulb-outline" size={18} color={PURPLE} style={{ marginTop: 1 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.consejoTitulo}>{c.titulo}</Text>
                            <Text style={styles.consejoTexto}>{c.descripcion}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : null}

            <View style={styles.graficaCard}>
              <Text style={styles.graficaTitulo}>Distribución por nivel de riesgo</Text>

              <View style={styles.barraSegmentada}>
                {NIVELES.map((nivel) => {
                  const pct = porcentajePorNivel[nivel];
                  if (pct === 0) return null;
                  return (
                    <View key={nivel} style={{ flex: pct, backgroundColor: getColor(nivel) }} />
                  );
                })}
                {total === 0 && <View style={{ flex: 1, backgroundColor: '#E0D0F0' }} />}
              </View>

              <View style={styles.leyendaLista}>
                {NIVELES.map((nivel) => (
                  <View key={nivel} style={styles.leyendaFila}>
                    <View style={styles.leyendaFilaIzq}>
                      <View style={[styles.leyendaDot, { backgroundColor: getColor(nivel) }]} />
                      <Text style={styles.leyendaTexto}>{nivel}</Text>
                    </View>
                    <View style={styles.leyendaFilaDer}>
                      <Text style={styles.leyendaConteo}>{conteoPorNivel[nivel]} eval.</Text>
                      <Text style={[styles.leyendaPorcentaje, { color: getColor(nivel) }]}>
                        {porcentajePorNivel[nivel]}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.seccionTitulo}>Fechas de registro</Text>
            {reportes.map((reporte) => {
              const nombreNivel = reporte.nivel_riesgo?.nombre || 'Sin calcular';
              const color = getColor(nombreNivel);
              return (
                <View key={reporte.id_evaluacion} style={styles.reporteCard}>
                  <View style={[styles.reporteIconoWrap, { backgroundColor: `${color}18` }]}>
                    <Ionicons name={getIcono(nombreNivel)} size={22} color={color} />
                  </View>
                  <View style={styles.reporteInfo}>
                    <Text style={styles.reporteFecha}>{formatearFecha(reporte.fecha_hora)}</Text>
                    <Text style={styles.reporteEstado}>Nivel de riesgo</Text>
                  </View>
                  <View style={[styles.reporteBadge, { backgroundColor: `${color}18` }]}>
                    <Text style={[styles.reporteBadgeTexto, { color }]}>{nombreNivel}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={styles.botonWrapper}>
        <TouchableOpacity
          style={[styles.botonGenerar, reportes.length === 0 && { opacity: 0.5 }]}
          onPress={generarPDF}
          disabled={reportes.length === 0}
        >
          <Ionicons name="document-text-outline" size={18} color={WHITE} style={{ marginRight: 8 }} />
          <Text style={styles.botonTexto}>Generar Reporte PDF</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBotonBack: { paddingRight: 15 },
  headerTextContainer: { flex: 1, alignItems: 'center', paddingRight: 39 },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: WHITE },
  headerSub: { fontSize: 12, color: '#DDD', marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 110 },

  resumenPrincipal: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0D0F0',
    alignItems: 'center',
  },
  resumenPrincipalItem: { flex: 1, alignItems: 'center' },
  resumenDivisor: { width: 1, height: 44, backgroundColor: '#E0D0F0' },
  resumenPrincipalValor: { fontSize: 26, fontWeight: '700', color: '#2D1A4A' },
  resumenPrincipalLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  ultimoNivelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  ayudaUrgenteCard: {
    backgroundColor: '#FFF3F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4C7BC',
    padding: 16,
    marginBottom: 16,
  },
  ayudaUrgenteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ayudaUrgenteTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B5442E',
    flex: 1,
  },
  ayudaUrgenteFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ayudaUrgenteTexto: {
    fontSize: 12,
    color: '#5C3D8A',
    flex: 1,
    paddingRight: 8,
  },
  ayudaUrgenteNumero: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B5442E',
  },

  graficaCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0D0F0',
  },
  graficaTitulo: { fontSize: 14, fontWeight: '700', color: '#2D1A4A' },
  graficaSubtitulo: { fontSize: 12, color: '#999', marginTop: 2, marginBottom: 6 },

  medidorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  medidorPorcentaje: { fontSize: 34, fontWeight: '800' },
  medidorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  medidorBadgeTexto: { fontSize: 12, fontWeight: '700' },
  medidorFondo: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EEE6F7',
    overflow: 'hidden',
  },
  medidorRelleno: { height: '100%', borderRadius: 8 },
  medidorEscalaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  medidorEscalaTexto: { fontSize: 10, color: '#AAA', fontWeight: '600' },

  categoriaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoriaNombre: { fontSize: 12, color: '#444', fontWeight: '600', flex: 1, paddingRight: 8 },
  categoriaPorcentaje: { fontSize: 12, fontWeight: '700' },
  categoriaBarraFondo: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#EEE6F7',
    overflow: 'hidden',
  },
  categoriaBarraRelleno: { height: '100%', borderRadius: 6 },

  consejoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8F4FC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0D0F0',
  },
  consejoTitulo: { fontSize: 13, fontWeight: '700', color: '#3C2066', marginBottom: 3 },
  consejoTexto: { fontSize: 12, color: '#5C3D8A', lineHeight: 17 },

  barraSegmentada: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 16,
  },
  leyendaLista: { gap: 10 },
  leyendaFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leyendaFilaIzq: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaTexto: { fontSize: 13, color: '#444', fontWeight: '600' },
  leyendaFilaDer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leyendaConteo: { fontSize: 12, color: '#999' },
  leyendaPorcentaje: { fontSize: 14, fontWeight: '700', width: 42, textAlign: 'right' },

  seccionTitulo: { fontSize: 15, fontWeight: '700', color: '#2D1A4A', marginBottom: 12 },
  reporteCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0D0F0',
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporteIconoWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reporteInfo: { flex: 1 },
  reporteFecha: { fontSize: 14, fontWeight: '600', color: '#2D1A4A' },
  reporteEstado: { fontSize: 12, color: '#999', marginTop: 2 },
  reporteBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reporteBadgeTexto: { fontSize: 12, fontWeight: '700' },

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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  botonTexto: { color: WHITE, fontSize: 16, fontWeight: '700' },
  vacioTexto: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});