// lib/motorInferencia.js
//
// Motor de inferencia basado en reglas (forward chaining).
// No depende de Supabase ni de React Native — solo recibe datos y regresa
// un resultado. Esto lo hace fácil de probar por separado.
//
// Entrada esperada (respuestasConDatos): array de objetos así:
//   { codigo: 'IV09', valor: 'Frecuentemente', ponderacion: 3, peso: 1.3 }
// (ponderacion viene de Opcion_Respuesta, peso viene de Indicador)
//
// Entrada opcional (apoyo): { tieneConfianza: bool|null, quiereApoyo: bool|null }
// — viene de IV19 ("tengo a alguien de confianza") e IV20 ("me gustaría
// recibir apoyo"). Estas dos preguntas no tienen ponderación en el catálogo
// (no cuentan para el puntaje base), pero sí funcionan como un modificador:
// la falta de red de apoyo agrava una situación que ya muestra señales,
// tal como pasaría en la realidad.

const NIVELES = ['Bajo', 'Medio', 'Alto'];
const PONDERACION_MAXIMA = 3; // "Frecuentemente" = 3, es el techo de la escala

// ───────────────────────────────────────────────────────────
// Base de conocimiento: reglas críticas
// Cada regla se evalúa contra el hecho (las respuestas). Si su condición
// se cumple, "se dispara" y aplica su acción — esto ES el forward chaining:
// vas de hechos (respuestas) hacia conclusiones (nivel de riesgo).
// ───────────────────────────────────────────────────────────
function tieneFrecuencia(respuestas, codigo, frecuenciasQueAplican) {
  const r = respuestas.find((x) => x.codigo === codigo);
  return !!r && frecuenciasQueAplican.includes(r.valor);
}

const FRECUENTE = ['Frecuentemente'];
const ALGUNAS_O_MAS = ['Algunas veces', 'Frecuentemente'];

const REGLAS_CRITICAS = [
  {
    id: 'temor_mas_contacto_fisico',
    descripcion: 'Temor a que le hagan daño + contacto físico no consentido, con frecuencia relevante',
    condicion: (r) =>
      tieneFrecuencia(r, 'IV17', ALGUNAS_O_MAS) && tieneFrecuencia(r, 'IV16', ALGUNAS_O_MAS),
    accion: { tipo: 'nivel_minimo', nivel: 'Alto' },
  },
  {
    id: 'mensajes_mas_insistencia',
    descripcion: 'Mensajes no deseados + insistencia después de rechazo, ambos frecuentes',
    condicion: (r) =>
      tieneFrecuencia(r, 'IV09', FRECUENTE) && tieneFrecuencia(r, 'IV10', FRECUENTE),
    accion: { tipo: 'incrementar_nivel' },
  },
  {
    id: 'vigilancia_mas_privacidad',
    descripcion: 'Sensación de vigilancia + invasión de privacidad, ambos presentes',
    condicion: (r) =>
      tieneFrecuencia(r, 'IV11', ALGUNAS_O_MAS) && tieneFrecuencia(r, 'IV15', ALGUNAS_O_MAS),
    accion: { tipo: 'nivel_minimo', nivel: 'Medio' },
  },
  {
    id: 'libertad_restringida',
    descripcion: 'Sensación de no ser libre de decidir o retirarse, de forma frecuente',
    condicion: (r) => tieneFrecuencia(r, 'IV18', FRECUENTE),
    accion: { tipo: 'nivel_minimo', nivel: 'Alto' },
  },
];

// ───────────────────────────────────────────────────────────
// Análisis A: puntuación ponderada
// ───────────────────────────────────────────────────────────
function calcularPuntuacion(respuestasConDatos) {
  const puntaje = respuestasConDatos.reduce(
    (acc, r) => acc + r.ponderacion * r.peso,
    0
  );
  const puntajeMax = respuestasConDatos.reduce(
    (acc, r) => acc + PONDERACION_MAXIMA * r.peso,
    0
  );
  const proporcion = puntajeMax > 0 ? puntaje / puntajeMax : 0;

  let nivel = 'Bajo';
  if (proporcion >= 0.65) nivel = 'Alto';
  else if (proporcion >= 0.35) nivel = 'Medio';

  return { puntaje, puntajeMax, proporcion, nivel };
}

// ───────────────────────────────────────────────────────────
// Análisis B: reglas críticas (forward chaining)
// Aplica todas las reglas cuya condición se cumple, y ajusta el nivel
// hacia arriba según lo que digan (nunca lo baja).
// ───────────────────────────────────────────────────────────
function aplicarReglasCriticas(respuestasConDatos, nivelBase) {
  let nivelFinal = nivelBase;
  const reglasActivadas = [];

  REGLAS_CRITICAS.forEach((regla) => {
    if (regla.condicion(respuestasConDatos)) {
      reglasActivadas.push({ id: regla.id, descripcion: regla.descripcion });

      if (regla.accion.tipo === 'nivel_minimo') {
        if (NIVELES.indexOf(regla.accion.nivel) > NIVELES.indexOf(nivelFinal)) {
          nivelFinal = regla.accion.nivel;
        }
      } else if (regla.accion.tipo === 'incrementar_nivel') {
        const idxActual = NIVELES.indexOf(nivelFinal);
        if (idxActual < NIVELES.length - 1) {
          nivelFinal = NIVELES[idxActual + 1];
        }
      }
    }
  });

  return { nivelFinal, reglasActivadas };
}

// ───────────────────────────────────────────────────────────
// Análisis C: modificador de red de apoyo (IV19 / IV20)
// No suma puntaje — solo puede empeorar el nivel ya calculado, nunca
// mejorarlo, y solo si YA hay señales de riesgo (Medio/Alto o alguna
// regla crítica activada). No tener a nadie de confianza en un cuestionario
// tranquilo no es una alerta por sí sola; no tener a nadie de confianza
// CUANDO YA hay señales, sí lo es.
// ───────────────────────────────────────────────────────────
function aplicarModificadorApoyo(nivelActual, apoyo) {
  if (!apoyo || apoyo.tieneConfianza !== false) {
    // Si sí tiene con quién contar, o no contestó esa pregunta, no hay
    // modificador que aplicar.
    return { nivel: nivelActual, reglaApoyoActivada: null };
  }

  const sinRedDeApoyo = true; // ya confirmado arriba
  const quiereApoyo = apoyo.quiereApoyo === true;

  // Caso más fuerte: no tiene a nadie Y le gustaría recibir apoyo —
  // eso solo, aunque el puntaje general sea bajo, merece que el nivel
  // no se quede en "Bajo": aseguramos un piso de Medio.
  if (sinRedDeApoyo && quiereApoyo && nivelActual === 'Bajo') {
    return {
      nivel: 'Medio',
      reglaApoyoActivada: {
        id: 'sin_red_apoyo_pide_ayuda',
        descripcion: 'No cuenta con alguien de confianza y le gustaría recibir apoyo',
      },
    };
  }

  // Si ya había señales (Medio o Alto por otras reglas/puntaje), la
  // falta de red de apoyo agrava lo que ya está pasando — sube un nivel.
  if (sinRedDeApoyo && nivelActual !== 'Bajo') {
    const idxActual = NIVELES.indexOf(nivelActual);
    if (idxActual < NIVELES.length - 1) {
      return {
        nivel: NIVELES[idxActual + 1],
        reglaApoyoActivada: {
          id: 'aislamiento_agrava_riesgo',
          descripcion: 'La falta de una red de apoyo agrava el riesgo ya detectado',
        },
      };
    }
  }

  return { nivel: nivelActual, reglaApoyoActivada: null };
}

// ───────────────────────────────────────────────────────────
// Punto de entrada del motor
// ───────────────────────────────────────────────────────────
function calcularNivelRiesgo(respuestasConDatos, apoyo) {
  const { puntaje, puntajeMax, proporcion, nivel: nivelBase } = calcularPuntuacion(respuestasConDatos);
  const { nivelFinal: nivelTrasReglas, reglasActivadas } = aplicarReglasCriticas(respuestasConDatos, nivelBase);
  const { nivel: nivelFinal, reglaApoyoActivada } = aplicarModificadorApoyo(nivelTrasReglas, apoyo);

  const reglasActivadasCompletas = reglaApoyoActivada
    ? [...reglasActivadas, reglaApoyoActivada]
    : reglasActivadas;

  return {
    puntaje,
    puntajeMax,
    proporcion,
    nivelBase,                          // lo que dio solo la puntuación
    nivelFinal,                         // el nivel real, tras reglas críticas + modificador de apoyo
    reglasActivadas: reglasActivadasCompletas, // para explicar "por qué" subió el nivel
  };
}

module.exports = { calcularNivelRiesgo };