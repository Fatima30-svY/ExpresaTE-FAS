// pruebas_motor.js
// Prueba el motor de inferencia con casos de ejemplo, SIN necesidad de
// Supabase ni de la app — corre standalone.
//
// CÓMO CORRERLO (desde la raíz del proyecto, junto a package.json):
//   node pruebas_motor.js

const { calcularNivelRiesgo } = require('./lib/motorInferencia');

// ─────────────────────────────────────────────
// Mismos datos que ya tienes en Supabase (si cambias pesos/ponderaciones
// allá, cámbialos aquí también para que las pruebas sigan siendo fieles)
// ─────────────────────────────────────────────
const PESOS = {
  IV01: 1.0, IV02: 1.0, IV03: 1.0, IV04: 1.0,
  IV05: 1.0, IV06: 1.0, IV07: 1.0, IV08: 1.2,
  IV09: 1.3, IV10: 1.3, IV11: 1.5, IV12: 1.4,
  IV13: 1.2, IV14: 1.2, IV15: 1.3,
  IV16: 2.0, IV17: 2.0, IV18: 1.8,
};

const PONDERACION = {
  'Nunca': 0,
  'Una vez': 1,
  'Algunas veces': 2,
  'Frecuentemente': 3,
};

const TODOS_LOS_CODIGOS = Object.keys(PESOS);

// Arma las 18 respuestas: por default "Nunca" en todas, y sobreescribe
// las que le pases en "overrides", ej: { IV16: 'Algunas veces' }
function armarRespuestas(overrides = {}) {
  return TODOS_LOS_CODIGOS.map((codigo) => {
    const valor = overrides[codigo] || 'Nunca';
    return {
      codigo,
      valor,
      ponderacion: PONDERACION[valor],
      peso: PESOS[codigo],
    };
  });
}

// ─────────────────────────────────────────────
// CASOS DE PRUEBA
// ─────────────────────────────────────────────
const CASOS = [
  {
    nombre: 'Todo en Nunca',
    respuestas: armarRespuestas({}),
    esperado: 'Bajo',
  },
  {
    nombre: 'Todo en Frecuentemente',
    respuestas: armarRespuestas(
      Object.fromEntries(TODOS_LOS_CODIGOS.map((c) => [c, 'Frecuentemente']))
    ),
    esperado: 'Alto',
  },
  {
    nombre: 'Mezcla moderada (varios indicadores en Algunas veces, sin disparar reglas críticas)',
    respuestas: armarRespuestas({
      IV01: 'Algunas veces', IV02: 'Algunas veces', IV03: 'Algunas veces',
      IV04: 'Algunas veces', IV05: 'Algunas veces', IV06: 'Algunas veces',
      IV07: 'Algunas veces', IV09: 'Algunas veces', IV10: 'Algunas veces',
      IV13: 'Algunas veces', IV14: 'Algunas veces', IV15: 'Algunas veces',
    }),
    esperado: 'Medio',
  },
  {
    nombre: 'Regla crítica: temor + contacto físico (puntaje base bajo)',
    respuestas: armarRespuestas({
      IV16: 'Algunas veces',
      IV17: 'Algunas veces',
    }),
    esperado: 'Alto', // por la regla crítica, aunque el puntaje solo no llegue a Alto
  },
  {
    nombre: 'Regla crítica: mensajes + insistencia frecuentes',
    respuestas: armarRespuestas({
      IV09: 'Frecuentemente',
      IV10: 'Frecuentemente',
    }),
    // el puntaje base con solo estas 2 en frecuente da Bajo, pero la regla
    // "incrementar_nivel" lo debe subir un escalón -> Medio
    esperado: 'Medio',
  },
  {
    nombre: 'Regla crítica: vigilancia + invasión de privacidad',
    respuestas: armarRespuestas({
      IV11: 'Algunas veces',
      IV15: 'Algunas veces',
    }),
    esperado: 'Medio', // nivel_minimo Medio por regla
  },
  {
    nombre: 'Regla crítica: libertad restringida frecuente',
    respuestas: armarRespuestas({
      IV18: 'Frecuentemente',
    }),
    esperado: 'Alto', // nivel_minimo Alto por regla, aunque sea la única señal
  },
  {
    nombre: 'Un solo "Una vez" aislado, resto Nunca',
    respuestas: armarRespuestas({ IV03: 'Una vez' }),
    esperado: 'Bajo',
  },
];

// ─────────────────────────────────────────────
// EJECUCIÓN
// ─────────────────────────────────────────────
console.log('🧪 Corriendo pruebas del motor de inferencia...\n');

let pasaron = 0;

CASOS.forEach((caso, i) => {
  const resultado = calcularNivelRiesgo(caso.respuestas);
  const ok = resultado.nivelFinal === caso.esperado;
  if (ok) pasaron++;

  console.log(`${ok ? '✅' : '❌'} Caso ${i + 1}: ${caso.nombre}`);
  console.log(`   Esperado: ${caso.esperado}  |  Obtenido: ${resultado.nivelFinal} (base: ${resultado.nivelBase})`);
  console.log(`   Puntaje: ${resultado.puntaje.toFixed(1)} / ${resultado.puntajeMax.toFixed(1)}`);
  if (resultado.reglasActivadas.length > 0) {
    console.log(`   Reglas activadas: ${resultado.reglasActivadas.map((r) => r.id).join(', ')}`);
  }
  console.log('');
});

console.log(`Resultado final: ${pasaron}/${CASOS.length} casos pasaron.`);