/* Esquema nutricional compartido por el generador (build.mjs) y el calculador de recetas (build-recetas.mjs). */

// clave → [ids de nutriente de la USDA por orden de preferencia, unidad esperada, decimales]
export const BASE = {
  energia_kcal: [['1008', '2047', '2048'], 'KCAL', 0], proteina_g: [['1003'], 'G', 1], carbohidratos_g: [['1005'], 'G', 1], grasas_g: [['1004'], 'G', 1]
};
export const EXTRA = {
  agua_g: [['1051'], 'G', 2], fibra_g: [['1079'], 'G', 2], azucares_g: [['2000', '1063'], 'G', 2],
  grasa_saturada_g: [['1258'], 'G', 2], grasa_monoinsaturada_g: [['1292'], 'G', 2], grasa_poliinsaturada_g: [['1293'], 'G', 2], grasa_trans_g: [['1257'], 'G', 2],
  colesterol_mg: [['1253'], 'MG', 1], sodio_mg: [['1093'], 'MG', 1], potasio_mg: [['1092'], 'MG', 1], calcio_mg: [['1087'], 'MG', 1],
  hierro_mg: [['1089'], 'MG', 2], magnesio_mg: [['1090'], 'MG', 1], fosforo_mg: [['1091'], 'MG', 1], zinc_mg: [['1095'], 'MG', 2],
  vitamina_a_ug: [['1106'], 'UG', 1], vitamina_c_mg: [['1162'], 'MG', 1], vitamina_d_ug: [['1114'], 'UG', 1], vitamina_e_mg: [['1109'], 'MG', 2],
  vitamina_k_ug: [['1185'], 'UG', 1], vitamina_b12_ug: [['1178'], 'UG', 2], folato_ug: [['1190'], 'UG', 1],
  alcohol_g: [['1018'], 'G', 2], cafeina_mg: [['1057'], 'MG', 1]
};
export const SPEC = { ...BASE, ...EXTRA };

