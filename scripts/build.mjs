#!/usr/bin/env node
/* Genera data/ a partir de src/lista.json y los CSV de la USDA.
 *
 *   node scripts/build.mjs <carpeta con los CSV de SR Legacy>
 *
 * Fuente: USDA FoodData Central, SR Legacy (abril de 2018, versión final), dominio público (CC0 1.0).
 *   https://fdc.nal.usda.gov/download-datasets/  →  SR Legacy → CSV
 *
 * Salidas: data/alimentos.csv, data/alimentos.json (con porciones anidadas) y data/porciones.csv.
 *
 * src/lista.json es la parte curada: nombre en español, la descripción EXACTA de la USDA y alias.
 * Si una descripción falta o es ambigua, el script se detiene: no adivina nada.
 *
 * Un nutriente que la USDA no midió queda VACÍO (null): "no medido" no es lo mismo que 0.
 * Las unidades se comprueban contra nutrient.csv; si alguna cambia, el script se detiene.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { traducirMedida } from './porciones.mjs';

export const VERSION = '0.2.0';
const here = dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
if (!dir) { console.error('uso: node scripts/build.mjs <carpeta con los CSV de SR Legacy>'); process.exit(1); }

function parseLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
function* rows(file) {
  const lines = readFileSync(join(dir, file), 'utf8').split(/\r?\n/);
  const head = parseLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = parseLine(lines[i]); const o = {};
    head.forEach((h, j) => { o[h] = f[j]; });
    yield o;
  }
}

// clave → [ids de nutriente de la USDA por orden de preferencia, unidad esperada, decimales]
const BASE = {
  energia_kcal: [['1008', '2047', '2048'], 'KCAL', 0], proteina_g: [['1003'], 'G', 1], carbohidratos_g: [['1005'], 'G', 1], grasas_g: [['1004'], 'G', 1]
};
const EXTRA = {
  agua_g: [['1051'], 'G', 2], fibra_g: [['1079'], 'G', 2], azucares_g: [['2000', '1063'], 'G', 2],
  grasa_saturada_g: [['1258'], 'G', 2], grasa_monoinsaturada_g: [['1292'], 'G', 2], grasa_poliinsaturada_g: [['1293'], 'G', 2], grasa_trans_g: [['1257'], 'G', 2],
  colesterol_mg: [['1253'], 'MG', 1], sodio_mg: [['1093'], 'MG', 1], potasio_mg: [['1092'], 'MG', 1], calcio_mg: [['1087'], 'MG', 1],
  hierro_mg: [['1089'], 'MG', 2], magnesio_mg: [['1090'], 'MG', 1], fosforo_mg: [['1091'], 'MG', 1], zinc_mg: [['1095'], 'MG', 2],
  vitamina_a_ug: [['1106'], 'UG', 1], vitamina_c_mg: [['1162'], 'MG', 1], vitamina_d_ug: [['1114'], 'UG', 1], vitamina_e_mg: [['1109'], 'MG', 2],
  vitamina_k_ug: [['1185'], 'UG', 1], vitamina_b12_ug: [['1178'], 'UG', 2], folato_ug: [['1190'], 'UG', 1],
  alcohol_g: [['1018'], 'G', 2], cafeina_mg: [['1057'], 'MG', 1]
};
const SPEC = { ...BASE, ...EXTRA };

const unidad = new Map();
for (const r of rows('nutrient.csv')) unidad.set(r.id, r.unit_name);
for (const [k, [ids, u]] of Object.entries(SPEC)) for (const id of ids) {
  if (unidad.get(id) !== u) { console.error(`la unidad de ${k} (nutriente ${id}) es ${unidad.get(id)}, se esperaba ${u}`); process.exit(1); }
}
const quien = new Map();   // id de nutriente → clave
for (const [k, [ids]] of Object.entries(SPEC)) ids.forEach(id => { if (!quien.has(id)) quien.set(id, k); });

const byDesc = new Map();
for (const r of rows('food.csv')) byDesc.set(r.description, byDesc.has(r.description) ? null : r.fdc_id);
const list = JSON.parse(readFileSync(join(here, '..', 'src', 'lista.json'), 'utf8'));
const wanted = new Map();
for (const e of list) {
  const id = byDesc.get(e.usda);
  if (id === undefined) { console.error('no está en los datos de la USDA: ' + e.usda); process.exit(1); }
  if (id === null) { console.error('ambigua en los datos de la USDA: ' + e.usda); process.exit(1); }
  if (wanted.has(id)) { console.error('repetida: ' + e.usda); process.exit(1); }
  wanted.set(id, { e, v: {} });
}
for (const r of rows('food_nutrient.csv')) {
  const w = wanted.get(r.fdc_id);
  if (!w) continue;
  const a = parseFloat(r.amount);
  if (!isFinite(a)) continue;
  const k = quien.get(r.nutrient_id);
  if (k) (w.v[k] ||= {})[r.nutrient_id] = a;
}
const valor = (v, k) => { const [ids, , dec] = SPEC[k]; for (const id of ids) if (v[k]?.[id] != null) { const f = Math.pow(10, dec); return Math.round(v[k][id] * f) / f; } return null; };

// porciones
const porFood = new Map();
for (const r of rows('food_portion.csv')) {
  if (!wanted.has(r.fdc_id)) continue;
  const g = parseFloat(r.gram_weight), amount = parseFloat(r.amount);
  if (!(g > 0) || !(amount > 0)) continue;
  (porFood.get(r.fdc_id) || porFood.set(r.fdc_id, []).get(r.fdc_id)).push({ orden: parseInt(r.seq_num, 10) || 0, cantidad: amount, medida_en: (r.modifier || '').trim() || 'serving', gramos: Math.round(g * 10) / 10 });
}

const items = []; const porciones = []; let i = 0;
const sinTraducir = new Map(); let total = 0, traducidas = 0;
for (const [fdc, { e, v }] of wanted) {
  const n = {};
  for (const k of Object.keys(SPEC)) n[k] = valor(v, k);
  if (n.proteina_g == null && n.carbohidratos_g == null && n.grasas_g == null) { console.error('sin macronutrientes: ' + e.usda); process.exit(1); }
  for (const k of ['proteina_g', 'carbohidratos_g', 'grasas_g']) if (n[k] == null) n[k] = 0;
  if (n.energia_kcal == null) n.energia_kcal = Math.round(4 * n.proteina_g + 4 * n.carbohidratos_g + 9 * n.grasas_g);
  const id = 'es-' + String(++i).padStart(4, '0');
  const ps = (porFood.get(fdc) || []).sort((a, b) => a.orden - b.orden || a.gramos - b.gramos).map(p => {
    const es = traducirMedida(p.medida_en, p.cantidad);
    total++; if (es) traducidas++; else sinTraducir.set(p.medida_en, (sinTraducir.get(p.medida_en) || 0) + 1);
    return { cantidad: p.cantidad, medida_es: es, medida_en: p.medida_en, gramos: p.gramos };
  });
  ps.forEach((p, j) => porciones.push({ id, fdc_id: Number(fdc), orden: j + 1, ...p }));
  items.push({ id, fdc_id: Number(fdc), nombre: e.es, descripcion_usda: e.usda, ...n, alias: e.alias || [], basico: !!e.top, porciones: ps });
}

const out = join(here, '..', 'data');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'alimentos.json'), JSON.stringify({
  version: VERSION, por: '100 g', licencia: 'CC BY 4.0',
  fuente: 'USDA FoodData Central, SR Legacy (abril de 2018), dominio público (CC0 1.0). Nombres en español, alias y traducción de porciones: este proyecto.',
  nota: 'Un nutriente en null no fue medido por la USDA: no es lo mismo que 0.',
  alimentos: items
}, null, 1));

const q = s => { s = s == null ? '' : String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const cols = ['id', 'fdc_id', 'nombre', 'descripcion_usda', ...Object.keys(SPEC), 'alias', 'basico'];
writeFileSync(join(out, 'alimentos.csv'), [cols.join(',')].concat(items.map(x => cols.map(k => q(k === 'alias' ? x.alias.join('; ') : k === 'basico' ? (x.basico ? 1 : 0) : x[k])).join(','))).join('\n') + '\n');
const pc = ['id', 'fdc_id', 'orden', 'cantidad', 'medida_es', 'medida_en', 'gramos'];
writeFileSync(join(out, 'porciones.csv'), [pc.join(',')].concat(porciones.map(p => pc.map(k => q(p[k])).join(','))).join('\n') + '\n');

console.log(`${items.length} alimentos, ${porciones.length} porciones (${traducidas} de ${total} traducidas, ${Math.round(100 * traducidas / total)} %)`);
if (process.argv.includes('--sin-traducir')) {
  console.log('\nPorciones sin traducir, por frecuencia:');
  [...sinTraducir].sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([k, c]) => console.log(String(c).padStart(5), k));
}
