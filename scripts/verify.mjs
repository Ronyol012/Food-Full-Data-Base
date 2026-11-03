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
const niveles = [
  { nombre: 'nucleo', json: JSON.parse(read('alimentos.json')), csv: read('alimentos.csv').trim().split('\n'), pcsv: read('porciones.csv').trim().split('\n'), prefijo: 'es-' },
  { nombre: 'extendido', json: JSON.parse(read('extendido.json')), csv: read('extendido.csv').trim().split('\n'), pcsv: read('porciones_extendido.csv').trim().split('\n'), prefijo: 'ex-' }
];
const fail = [], aviso = [], avisoGrasa = [];

// Tolerancias: la USDA mide, y medir tiene ruido. La suma de agua y macros puede pasar de 100 g un par de puntos
// (p. ej. el atún en lata suma 101,5), y los azúcares medidos pueden superar un poco los carbohidratos "por
// diferencia" (suero de leche, aderezos). Son datos reales de la fuente: no se corrigen, solo se toleran.
const RUIDO_SUMA = 106, RUIDO_AZUCAR = 1.0;
// Casos que se desvían más que el ruido normal y son tal cual en la fuente. Se listan para que cada excepción
// sea explícita y revisable, en lugar de subir la tolerancia para todos.
const ANOMALIAS_AZUCAR = new Map([
  [171627, 'jamón picado: azúcares medidos 5 g por encima de los carbohidratos "por diferencia"'],
  [173522, 'fórmula infantil: los azúcares (lactosa) medidos superan en 1,2 g los carbohidratos "por diferencia"']
]);

// tope de cada nutriente por 100 g: generosos, para cazar errores de unidad y no valores raros pero reales
const TOPE = {
  energia_kcal: 950, proteina_g: 100, carbohidratos_g: 100, grasas_g: 100, agua_g: 100, fibra_g: 100, azucares_g: 100,
  grasa_saturada_g: 100, grasa_monoinsaturada_g: 100, grasa_poliinsaturada_g: 100, grasa_trans_g: 100, alcohol_g: 100,
  colesterol_mg: 5000, sodio_mg: 40000, potasio_mg: 20000, calcio_mg: 10000, hierro_mg: 200, magnesio_mg: 2000, fosforo_mg: 15000, zinc_mg: 300,
  vitamina_a_ug: 30000, vitamina_c_mg: 6000, vitamina_d_ug: 500, vitamina_e_mg: 500, vitamina_k_ug: 5000, vitamina_b12_ug: 500, folato_ug: 10000, cafeina_mg: 6000
};
const ids = new Set(), names = new Set(), fdc = new Set();
const NUCL = ['energia_kcal', 'proteina_g', 'carbohidratos_g', 'grasas_g'];
const estados = { curada: 0, automatica: 0, pendiente: 0 }; let total = 0, totalPorc = 0;
for (const nv of niveles) {
  let nPorc = 0;
  const alimentos = nv.json.alimentos;
  if (nv.json.nivel !== nv.nombre) fail.push(`${nv.nombre}: el JSON dice que es el nivel "${nv.json.nivel}"`);
  for (const a of alimentos) {
    const w = a.nombre ?? a.descripcion_usda;
    total++;
    if (ids.has(a.id)) fail.push('id repetido: ' + a.id); ids.add(a.id);
    if (!a.id.startsWith(nv.prefijo)) fail.push(`id con prefijo equivocado en ${nv.nombre}: ${a.id}`);
    if (fdc.has(a.fdc_id)) fail.push(`fdc_id repetido (${a.fdc_id}): ${w}`); fdc.add(a.fdc_id);
    if (!a.descripcion_usda) fail.push('falta la descripción de la USDA: ' + a.id);
    if (a.nivel !== nv.nombre) fail.push(`nivel incoherente (${a.nivel}): ${w}`);
    if (!a.categoria) fail.push('sin categoría: ' + w);
    if (!(a.traduccion in estados)) fail.push(`traduccion desconocida (${a.traduccion}): ${w}`); else estados[a.traduccion]++;
    if (a.traduccion === 'pendiente' ? a.nombre !== null : !a.nombre || a.nombre.length < 3) fail.push(`nombre incoherente con traduccion=${a.traduccion}: ${w}`);
    if (nv.nombre === 'nucleo' && a.traduccion !== 'curada') fail.push('el núcleo solo puede ser "curada": ' + w);
    if (a.traduccion === 'curada' || a.traduccion === 'automatica') {
      if (names.has(a.nombre)) fail.push('nombre repetido: ' + a.nombre); names.add(a.nombre);
    }
    for (const [k, max] of Object.entries(TOPE)) {
      if (!(k in a)) { fail.push(`falta la columna ${k}: ${w}`); continue; }
      if (a[k] == null) { if (nv.nombre === 'nucleo' && NUCL.includes(k)) fail.push(`${k} vacío: ${w}`); continue; }
      if (!(a[k] >= 0 && a[k] <= max)) fail.push(`${k} fuera de rango (${a[k]}): ${w}`);
    }
    const n = k => a[k] ?? 0;
    if (n('proteina_g') + n('carbohidratos_g') + n('grasas_g') > 101) fail.push('los macros suman más de 100 g: ' + w);
    if (n('agua_g') + n('proteina_g') + n('carbohidratos_g') + n('grasas_g') + n('alcohol_g') > RUIDO_SUMA) fail.push('agua + macros + alcohol suman más de ' + RUIDO_SUMA + ' g: ' + w);
    if (n('fibra_g') > n('carbohidratos_g') + RUIDO_AZUCAR) fail.push('más fibra que carbohidratos: ' + w);
    if (n('azucares_g') > n('carbohidratos_g') + RUIDO_AZUCAR && !ANOMALIAS_AZUCAR.has(a.fdc_id)) fail.push('más azúcares que carbohidratos: ' + w);
    if (n('grasa_saturada_g') > n('grasas_g') + 0.5) fail.push('más grasa saturada que grasa total: ' + w);
    // Ojo: las grasas trans son un SUBCONJUNTO de las mono y poliinsaturadas en la USDA, así que no se suman aparte.
    if (n('grasa_trans_g') > n('grasas_g') + 0.5) fail.push('más grasa trans que grasa total: ' + w);
    const tipos = n('grasa_saturada_g') + n('grasa_monoinsaturada_g') + n('grasa_poliinsaturada_g');
    if (tipos > n('grasas_g') * 3 + 1) fail.push(`los tipos de grasa (${tipos.toFixed(1)} g) triplican la grasa total (${n('grasas_g')} g): ` + w);
    else if (tipos > n('grasas_g') * 1.15 + 0.5) avisoGrasa.push(w);
    if (NUCL.every(k => a[k] != null)) {
      const esperado = 4 * n('proteina_g') + 4 * n('carbohidratos_g') + 9 * n('grasas_g') + 7 * n('alcohol_g');
      if (a.energia_kcal > 20 && Math.abs(a.energia_kcal - esperado) / a.energia_kcal > 0.35) aviso.push(`${w}: ${a.energia_kcal} kcal frente a ${Math.round(esperado)} por macros`);
    }
    for (const p of a.porciones) {
      nPorc++;
      if (!(p.gramos > 0 && p.gramos <= 15000)) fail.push(`porción con gramos raros (${p.gramos}): ${w} / ${p.medida_en}`);
      if (!(p.cantidad > 0)) fail.push(`porción con cantidad inválida: ${w} / ${p.medida_en}`);
      if (p.medida_es === '') fail.push(`traducción vacía (debe ser null): ${w} / ${p.medida_en}`);
      if (!p.medida_en) fail.push(`porción sin texto original: ${w}`);
    }
  }
  if (nv.csv.length - 1 !== alimentos.length) fail.push(`${nv.nombre}: el CSV tiene ${nv.csv.length - 1} filas y el JSON ${alimentos.length}`);
  if (nv.pcsv.length - 1 !== nPorc) fail.push(`${nv.nombre}: el CSV de porciones tiene ${nv.pcsv.length - 1} filas y el JSON ${nPorc}`);
  const idsNivel = new Set(alimentos.map(a => a.id));
  for (const l of nv.pcsv.slice(1)) { const id = l.split(',')[0]; if (!idsNivel.has(id)) { fail.push(`${nv.nombre}: porciones menciona un id que no existe: ${id}`); break; } }
  totalPorc += nPorc;
}

if (aviso.length) { console.log(`avisos (${aviso.length}) — calorías que no cuadran con los macros:`); aviso.slice(0, 12).forEach(x => console.log('  ' + x)); if (aviso.length > 12) console.log(`  … y ${aviso.length - 12} más`); }
if (avisoGrasa.length) console.log(`avisos (${avisoGrasa.length}) — los ácidos grasos medidos superan la grasa total (dato de la fuente)`);
if (fail.length) { console.error('\nERRORES (' + fail.length + '):\n' + fail.slice(0, 40).join('\n') + (fail.length > 40 ? `\n… y ${fail.length - 40} más` : '')); process.exit(1); }
console.log(`ok: ${total} alimentos (${estados.curada} curados, ${estados.automatica} con nombre automático, ${estados.pendiente} pendientes), ${totalPorc} porciones`);
