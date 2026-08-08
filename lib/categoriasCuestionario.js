// lib/categoriasCuestionario.js
//
// Fuente única de verdad para agrupar los códigos IV01-IV18 en categorías.
// Si cambias las categorías o los códigos, cámbialos aquí y se reflejará
// tanto en el cuestionario como en el agente y en Mis Reportes.

export const CATEGORIAS_CUESTIONARIO = [
  { nombre: 'Entorno universitario', codigos: ['IV01', 'IV02', 'IV03', 'IV04'] },
  { nombre: 'Bienestar emocional', codigos: ['IV05', 'IV06', 'IV07', 'IV08'] },
  { nombre: 'Interacciones no deseadas', codigos: ['IV09', 'IV10', 'IV11', 'IV12'] },
  { nombre: 'Control', codigos: ['IV13', 'IV14', 'IV15'] },
  { nombre: 'Contacto físico y seguridad', codigos: ['IV16', 'IV17', 'IV18'] },
];

export const PONDERACION_MAXIMA = 3; // "Frecuentemente" = techo de la escala