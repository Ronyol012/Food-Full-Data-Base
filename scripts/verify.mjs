#!/usr/bin/env node
/* Comprueba que data/ es coherente. Se ejecuta en cada cambio (ver .github/workflows/verify.yml).
 *   node scripts/verify.mjs
 *
 * Errores (detienen el proceso): duplicados, valores fuera de rango, nutrientes imposibles entre sí.
 * Avisos (solo se muestran): calorías que no cuadran con los macros sin que lo explique el alcohol.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(here, '..', 'data', f), 'utf8');
const d = JSON.parse(read('alimentos.json'));
const csv = read('alimentos.csv').trim().split('\n');
const pcsv = read('porciones.csv').trim().split('\n');
const fail = [], aviso = [];

// Tolerancias: la USDA mide, y medir tiene ruido. La suma de agua y macros puede pasar de 100 g un par de puntos
// (p. ej. el atún en lata suma 101,5), y los azúcares medidos pueden superar un poco los carbohidratos "por
// diferencia" (suero de leche, aderezos). Son datos reales de la fuente: no se corrigen, solo se toleran.
const RUIDO_SUMA = 103, RUIDO_AZUCAR = 1.0;

// tope de cada nutriente por 100 g: generosos, para cazar errores de unidad y no valores raros pero reales
const TOPE = {
  energia_kcal: 950, proteina_g: 100, carbohidratos_g: 100, grasas_g: 100, agua_g: 100, fibra_g: 100, azucares_g: 100,
  grasa_saturada_g: 100, grasa_monoinsaturada_g: 100, grasa_poliinsaturada_g: 100, grasa_trans_g: 100, alcohol_g: 100,
  colesterol_mg: 5000, sodio_mg: 40000, potasio_mg: 20000, calcio_mg: 10000, hierro_mg: 200, magnesio_mg: 2000, fosforo_mg: 15000, zinc_mg: 300,
  vitamina_a_ug: 30000, vitamina_c_mg: 6000, vitamina_d_ug: 500, vitamina_e_mg: 500, vitamina_k_ug: 5000, vitamina_b12_ug: 500, folato_ug: 5000, cafeina_mg: 6000
};
const ids = new Set(), names = new Set(), fdc = new Set();
let nPorc = 0;
for (const a of d.alimentos) {
  const w = a.nombre;
  if (ids.has(a.id)) fail.push('id repetido: ' + a.id); ids.add(a.id);
  if (names.has(w)) fail.push('nombre repetido: ' + w); names.add(w);
  if (fdc.has(a.fdc_id)) fail.push(`fdc_id repetido (${a.fdc_id}): ${w}`); fdc.add(a.fdc_id);
  if (!w || w.length < 3) fail.push('nombre vacío: ' + a.id);
  if (!a.descripcion_usda) fail.push('falta la descripción de la USDA: ' + w);
  for (const [k, max] of Object.entries(TOPE)) {
    if (!(k in a)) { fail.push(`falta la columna ${k}: ${w}`); continue; }
    if (a[k] == null) { if (['energia_kcal', 'proteina_g', 'carbohidratos_g', 'grasas_g'].includes(k)) fail.push(`${k} vacío: ${w}`); continue; }
    if (!(a[k] >= 0 && a[k] <= max)) fail.push(`${k} fuera de rango (${a[k]}): ${w}`);
  }
  const n = k => a[k] ?? 0;
  if (n('proteina_g') + n('carbohidratos_g') + n('grasas_g') > 101) fail.push('los macros suman más de 100 g: ' + w);
  if (n('agua_g') + n('proteina_g') + n('carbohidratos_g') + n('grasas_g') + n('alcohol_g') > RUIDO_SUMA) fail.push('agua + macros + alcohol suman más de ' + RUIDO_SUMA + ' g: ' + w);
  if (n('fibra_g') > n('carbohidratos_g') + RUIDO_AZUCAR) fail.push('más fibra que carbohidratos: ' + w);
  if (n('azucares_g') > n('carbohidratos_g') + RUIDO_AZUCAR) fail.push('más azúcares que carbohidratos: ' + w);
  if (n('grasa_saturada_g') > n('grasas_g') + 0.5) fail.push('más grasa saturada que grasa total: ' + w);
  if (n('grasa_saturada_g') + n('grasa_monoinsaturada_g') + n('grasa_poliinsaturada_g') + n('grasa_trans_g') > n('grasas_g') * 1.15 + 0.5) fail.push('los tipos de grasa suman más que la grasa total: ' + w);
  const esperado = 4 * n('proteina_g') + 4 * n('carbohidratos_g') + 9 * n('grasas_g') + 7 * n('alcohol_g');
  if (a.energia_kcal > 20 && Math.abs(a.energia_kcal - esperado) / a.energia_kcal > 0.35) aviso.push(`${w}: ${a.energia_kcal} kcal frente a ${Math.round(esperado)} por macros`);
  for (const p of a.porciones) {
    nPorc++;
    if (!(p.gramos > 0 && p.gramos <= 5000)) fail.push(`porción con gramos raros (${p.gramos}): ${w} / ${p.medida_en}`);
    if (!(p.cantidad > 0)) fail.push(`porción con cantidad inválida: ${w} / ${p.medida_en}`);
    if (p.medida_es === '') fail.push(`traducción vacía (debe ser null): ${w} / ${p.medida_en}`);
    if (!p.medida_en) fail.push(`porción sin texto original: ${w}`);
  }
}
if (csv.length - 1 !== d.alimentos.length) fail.push(`el CSV tiene ${csv.length - 1} filas y el JSON ${d.alimentos.length}`);
if (pcsv.length - 1 !== nPorc) fail.push(`porciones.csv tiene ${pcsv.length - 1} filas y el JSON ${nPorc}`);
const idsPorc = new Set(pcsv.slice(1).map(l => l.split(',')[0]));
for (const id of idsPorc) if (!ids.has(id)) fail.push('porciones.csv menciona un id que no existe: ' + id);

if (aviso.length) { console.log(`avisos (${aviso.length}) — calorías que no cuadran con los macros:`); aviso.slice(0, 15).forEach(x => console.log('  ' + x)); if (aviso.length > 15) console.log(`  … y ${aviso.length - 15} más`); }
if (fail.length) { console.error('\nERRORES:\n' + fail.join('\n')); process.exit(1); }
console.log(`ok: ${d.alimentos.length} alimentos, ${nPorc} porciones`);
