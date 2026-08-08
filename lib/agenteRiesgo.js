// lib/agenteRiesgo.js
//
// Conecta el motor de inferencia (motorInferencia.js) con Supabase.
// Este archivo SÍ sabe de base de datos; motorInferencia.js no.
//
// Expone dos funciones:
//   - ejecutarAgenteRiesgo: se usa al TERMINAR el cuestionario, calcula y guarda.
//   - obtenerDetalleEvaluacion: se usa para MOSTRAR resultados ya guardados
//     (por ejemplo en Mis Reportes), sin volver a calcular ni guardar nada.

import { supabase } from './supabase';
import { calcularNivelRiesgo } from './motorInferencia';
import { CATEGORIAS_CUESTIONARIO, PONDERACION_MAXIMA } from './categoriasCuestionario';

/**
 * Ejecuta el agente completo para una evaluación recién contestada:
 * 1. Lee los indicadores y opciones de respuesta (catálogo, con peso/ponderación).
 * 2. Cruza eso con las respuestas crudas que trae la app ({ codigo, valor }).
 * 3. Separa las respuestas de Apoyo (IV19/IV20) — no llevan ponderación en el
 *    catálogo, pero sí se usan como modificador del nivel dentro del motor.
 * 4. Corre el motor de inferencia (puntuación + reglas críticas + modificador de apoyo).
 * 5. Guarda las respuestas reales (IV01-IV18) en la tabla respuesta.
 * 6. Actualiza la evaluacion con el nivel de riesgo Y las reglas que se activaron
 *    (para poder explicar después "por qué" salió ese nivel).
 * 7. Trae las recomendaciones que le corresponden a ese nivel.
 *
 * @param {number} idEvaluacion
 * @param {Array<{codigo: string, valor: string}>} respuestasCrudas
 * @returns {Promise<{ nivel: string, nivelBase: string, puntaje: number, puntajeMax: number, reglasActivadas: Array, recomendaciones: Array }>}
 */
export async function ejecutarAgenteRiesgo(idEvaluacion, respuestasCrudas) {
  const { data: indicadores, error: errInd } = await supabase
    .from('indicador')
    .select('id_indicador, codigo, peso');
  if (errInd) throw errInd;

  const { data: opciones, error: errOpc } = await supabase
    .from('opcion_respuesta')
    .select('id_opcion_respuesta, descripcion, ponderacion');
  if (errOpc) throw errOpc;

  if (!indicadores || indicadores.length === 0) {
    throw new Error('La tabla "indicador" llegó vacía. Revisa que tenga las 18 preguntas cargadas.');
  }
  if (!opciones || opciones.length === 0) {
    throw new Error('La tabla "opcion_respuesta" llegó vacía. Revisa que tenga Nunca/Una vez/Algunas veces/Frecuentemente cargadas.');
  }

  const mapaIndicador = Object.fromEntries(indicadores.map((i) => [i.codigo, i]));
  const mapaOpcion = Object.fromEntries(opciones.map((o) => [o.descripcion, o]));

  // Las respuestas de Apoyo (IV19/IV20) no están en el catálogo de indicador
  // (son Sí/No, no Likert), así que se extraen aparte ANTES de filtrar por
  // el catálogo — se usan como modificador del nivel, no como puntaje.
  const respuestaTieneConfianza = (respuestasCrudas || []).find((r) => r && r.codigo === 'IV19');
  const respuestaQuiereApoyo = (respuestasCrudas || []).find((r) => r && r.codigo === 'IV20');
  const apoyo = {
    tieneConfianza: respuestaTieneConfianza ? respuestaTieneConfianza.valor === 'SI' : null,
    quiereApoyo: respuestaQuiereApoyo ? respuestaQuiereApoyo.valor === 'SI' : null,
  };

  // Solo nos interesan respuestas que correspondan a un indicador real (IV01-IV18)
  // para el puntaje y para guardar en la tabla respuesta. Esto excluye
  // automáticamente las preguntas de Apoyo (IV19, IV20) de esa parte.
  const respuestasValidas = (respuestasCrudas || []).filter(
    (r) => r && r.codigo && mapaIndicador[r.codigo]
  );

  const sinOpcion = respuestasValidas.filter((r) => !mapaOpcion[r.valor]);
  if (sinOpcion.length > 0) {
    console.warn(
      'Respuestas sin opcion_respuesta correspondiente (revisa el texto exacto):',
      sinOpcion.map((r) => `${r.codigo} -> "${r.valor}"`)
    );
  }

  const respuestasConDatos = respuestasValidas
    .filter((r) => mapaOpcion[r.valor])
    .map((r) => {
      const indicador = mapaIndicador[r.codigo];
      const opcion = mapaOpcion[r.valor];
      return {
        codigo: r.codigo,
        valor: r.valor,
        ponderacion: opcion.ponderacion,
        peso: indicador.peso,
        id_indicador: indicador.id_indicador,
        id_opcion_respuesta: opcion.id_opcion_respuesta,
      };
    });

  if (respuestasConDatos.length === 0) {
    throw new Error('Ninguna respuesta pudo cruzarse con el catálogo. Revisa indicador/opcion_respuesta.');
  }

  const resultado = calcularNivelRiesgo(respuestasConDatos, apoyo);

  const filasRespuesta = respuestasConDatos.map((r) => ({
    id_evaluacion: idEvaluacion,
    id_indicador: r.id_indicador,
    id_opcion_respuesta: r.id_opcion_respuesta,
  }));

  const { error: errInsert } = await supabase.from('respuesta').insert(filasRespuesta);
  if (errInsert) throw errInsert;

  const { data: nivelRow, error: errNivel } = await supabase
    .from('nivel_riesgo')
    .select('id_nivel')
    .eq('nombre', resultado.nivelFinal)
    .maybeSingle();
  if (errNivel) throw errNivel;
  if (!nivelRow) {
    throw new Error(`No existe nivel_riesgo con nombre "${resultado.nivelFinal}".`);
  }

  const { error: errUpdate } = await supabase
    .from('evaluacion')
    .update({
      id_nivel: nivelRow.id_nivel,
      reglas_activadas: resultado.reglasActivadas,
    })
    .eq('id_evaluacion', idEvaluacion);
  if (errUpdate) throw errUpdate;

  const { data: recomendaciones, error: errRec } = await supabase
    .from('asigna_recomendacion')
    .select('recomendacion(titulo, descripcion)')
    .eq('id_nivel', nivelRow.id_nivel);
  if (errRec) throw errRec;

  return {
    nivel: resultado.nivelFinal,
    nivelBase: resultado.nivelBase,
    puntaje: resultado.puntaje,
    puntajeMax: resultado.puntajeMax,
    reglasActivadas: resultado.reglasActivadas,
    recomendaciones: (recomendaciones || []).map((r) => r.recomendacion).filter(Boolean),
  };
}

/**
 * Trae el detalle "para mostrar" de una evaluación YA guardada:
 * porcentaje general, porcentaje por categoría (mapa emocional) y
 * consejos según el nivel. No recalcula nada con el motor de inferencia
 * (eso ya se hizo al momento de guardar) — solo lee y agrupa lo guardado.
 *
 * @param {number} idEvaluacion
 * @param {number} idNivel  - id_nivel ya asignado a esa evaluación
 * @returns {Promise<{ porcentajeGeneral: number, porCategoria: Array<{nombre: string, porcentaje: number}>, consejos: Array<{titulo: string, descripcion: string}> }>}
 */
export async function obtenerDetalleEvaluacion(idEvaluacion, idNivel) {
  const { data: filas, error: errFilas } = await supabase
    .from('respuesta')
    .select('indicador(codigo, peso), opcion_respuesta(ponderacion)')
    .eq('id_evaluacion', idEvaluacion);
  if (errFilas) throw errFilas;

  let porcentajeGeneral = 0;
  let porCategoria = [];

  if (filas && filas.length > 0) {
    const puntajeTotal = filas.reduce(
      (acc, f) => acc + (f.opcion_respuesta?.ponderacion || 0) * (f.indicador?.peso || 1),
      0
    );
    const puntajeMax = filas.reduce(
      (acc, f) => acc + PONDERACION_MAXIMA * (f.indicador?.peso || 1),
      0
    );
    porcentajeGeneral = puntajeMax > 0 ? Math.round((puntajeTotal / puntajeMax) * 100) : 0;

    porCategoria = CATEGORIAS_CUESTIONARIO.map((cat) => {
      const filasCategoria = filas.filter((f) => cat.codigos.includes(f.indicador?.codigo));
      const puntaje = filasCategoria.reduce(
        (acc, f) => acc + (f.opcion_respuesta?.ponderacion || 0) * (f.indicador?.peso || 1),
        0
      );
      const max = filasCategoria.reduce(
        (acc, f) => acc + PONDERACION_MAXIMA * (f.indicador?.peso || 1),
        0
      );
      return {
        nombre: cat.nombre,
        porcentaje: max > 0 ? Math.round((puntaje / max) * 100) : 0,
      };
    });
  }

  let consejos = [];
  if (idNivel) {
    const { data: asignaciones, error: errAsig } = await supabase
      .from('asigna_recomendacion')
      .select('recomendacion(titulo, descripcion)')
      .eq('id_nivel', idNivel);
    if (errAsig) throw errAsig;
    const todosLosConsejos = (asignaciones || []).map((a) => a.recomendacion).filter(Boolean);
    const cantidad = Math.random() < 0.5 ? 1 : 2;
    consejos = elegirAlAzar(todosLosConsejos, cantidad);
  }

  return { porcentajeGeneral, porCategoria, consejos };
}

// Elige N elementos al azar de un arreglo, sin repetir, sin mutar el original.
// Sirve para que "Mis Reportes" no muestre siempre los mismos consejos.
function elegirAlAzar(arreglo, cantidad) {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, cantidad);
}