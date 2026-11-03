#!/usr/bin/env node
/* Comprueba que data/ es coherente. Se ejecuta en cada cambio (ver .github/workflows/verify.yml).
 *   node scripts/verify.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const d = JSON.parse(readFileSync(join(here, '..', 'data', 'alimentos.json'), 'utf8'));
const csv = readFileSync(join(here, '..', 'data', 'alimentos.csv'), 'utf8').trim().split('\n');
const fail = [];
const ids = new Set(), names = new Set(), fdc = new Set();
for (const a of d.alimentos) {
  if (ids.has(a.id)) fail.push('id repetido: ' + a.id); ids.add(a.id);
  if (names.has(a.nombre)) fail.push('nombre repetido: ' + a.nombre); names.add(a.nombre);
  if (fdc.has(a.fdc_id)) fail.push('fdc_id repetido (' + a.fdc_id + '): ' + a.nombre); fdc.add(a.fdc_id);
  if (!a.nombre || a.nombre.length < 3) fail.push('nombre vacío: ' + a.id);
  if (!a.descripcion_usda) fail.push('falta la descripción de la USDA: ' + a.nombre);
  if (!(a.energia_kcal >= 0 && a.energia_kcal <= 950)) fail.push('kcal fuera de rango: ' + a.nombre);
  for (const k of ['proteina_g', 'carbohidratos_g', 'grasas_g']) if (!(a[k] >= 0 && a[k] <= 100)) fail.push(k + ' fuera de rango: ' + a.nombre);
  if (a.proteina_g + a.carbohidratos_g + a.grasas_g > 101) fail.push('los macros suman más de 100 g: ' + a.nombre);
}
if (csv.length - 1 !== d.alimentos.length) fail.push(`el CSV tiene ${csv.length - 1} filas y el JSON ${d.alimentos.length}`);
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log(`ok: ${d.alimentos.length} alimentos`);
