/* Calcula los nutrientes de una receta a partir de sus ingredientes. Funciones puras: no leen archivos.
 *
 * Reglas, pensadas para no inventar nada:
 *  - Cada nutriente del plato es la SUMA de (gramos / 100 × valor por 100 g) de los ingredientes.
 *  - Si CUALQUIER ingrediente no tiene medido un nutriente, ese nutriente queda en null en el plato:
 *    "no medido" no se convierte en 0, ni se suma solo lo medido.
 *  - Los valores por 100 g del plato se calculan sobre el PESO FINAL (peso_final_g), que incluye el agua
 *    añadida y descuenta lo que se pierde al cocinar. Es una estimación hecha por quien escribe la receta.
 *  - No se descuentan pérdidas de nutrientes por cocción (vitaminas, etc.).
 *  - EL AGUA NO SE SUMA: se calcula por conservación de la masa. Lo que no es agua en los ingredientes se conserva;
 *    el agua final es el peso final menos eso. Así se refleja el agua que se evapora al cocinar o la que se añade.
 */
import { SPEC } from './esquema.mjs';

const redondear = (v, k) => { const f = Math.pow(10, SPEC[k][2]); return Math.round(v * f) / f; };

/**
 * @param {{ raciones:number, peso_final_g:number, ingredientes:{ g:number }[] }} receta
 * @param {(ing:object) => object} resolver  Devuelve el alimento (con sus claves nutricionales por 100 g) de un ingrediente.
 */
export function calcular(receta, resolver) {
  const { raciones, peso_final_g: final } = receta;
  if (!(raciones > 0)) throw new Error(`${receta.nombre}: raciones inválidas`);
  if (!(final > 0)) throw new Error(`${receta.nombre}: peso_final_g inválido`);
  const total = {}, noMedidos = [];
  const usados = receta.ingredientes.map(ing => ({ ing, food: resolver(ing) }));
  let suma = 0;
  for (const { ing } of usados) {
    if (!(ing.g > 0)) throw new Error(`${receta.nombre}: gramos inválidos en un ingrediente`);
    suma += ing.g;
  }
  for (const k of Object.keys(SPEC)) {
    let t = 0, falta = false;
    for (const { ing, food } of usados) {
      const v = food[k];
      if (v == null) { falta = true; break; }
      t += (ing.g / 100) * v;
    }
    if (falta) { total[k] = null; noMedidos.push(k); } else total[k] = t;
  }
  // agua por conservación de la masa (ver arriba)
  let solidos = 0, aguaConocida = true;
  for (const { ing, food } of usados) { if (food.agua_g == null) { aguaConocida = false; break; } solidos += (ing.g / 100) * (100 - food.agua_g); }
  if (aguaConocida) {
    if (solidos > final * 1.02) throw new Error(`${receta.nombre}: el peso final (${final} g) es menor que lo que no es agua en los ingredientes (${Math.round(solidos)} g)`);
    total.agua_g = Math.max(0, final - solidos);
    const i = noMedidos.indexOf('agua_g'); if (i >= 0) noMedidos.splice(i, 1);
  } else { total.agua_g = null; if (!noMedidos.includes('agua_g')) noMedidos.push('agua_g'); }
  const por_100g = {}, por_racion = {};
  for (const k of Object.keys(SPEC)) {
    por_100g[k] = total[k] == null ? null : redondear((total[k] / final) * 100, k);
    por_racion[k] = total[k] == null ? null : redondear(total[k] / raciones, k);
  }
  return {
    por_100g, por_racion, no_medidos: noMedidos,
    peso_racion_g: Math.round((final / raciones) * 10) / 10,
    suma_ingredientes_g: Math.round(suma * 10) / 10,
    ratio_peso: Math.round((final / suma) * 100) / 100
  };
}
