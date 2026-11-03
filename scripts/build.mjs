#!/usr/bin/env node
/* Genera data/alimentos.csv y data/alimentos.json a partir de src/lista.json y los CSV de la USDA.
 *
 *   node scripts/build.mjs <carpeta con food.csv y food_nutrient.csv de SR Legacy>
 *
 * Fuente: USDA FoodData Central, SR Legacy (abril de 2018, versión final), dominio público (CC0 1.0).
 *   https://fdc.nal.usda.gov/download-datasets/  →  SR Legacy → CSV
 *
 * src/lista.json es la parte curada: nombre en español, la descripción EXACTA de la USDA y alias.
 * Si una descripción falta o es ambigua, el script se detiene: no adivina nada.
 * Valores por 100 g: kcal (entero) y proteína, carbohidratos y grasas en gramos (un decimal).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
if (!dir) { console.error('uso: node scripts/build.mjs <carpeta con food.csv y food_nutrient.csv>'); process.exit(1); }

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

const KCAL = ['1008', '2047', '2048'];
const NUT = { 1003: 'p', 1005: 'c', 1004: 'f' };
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
  if (KCAL.includes(r.nutrient_id)) w.v['k' + r.nutrient_id] = a;
  else if (NUT[r.nutrient_id]) w.v[NUT[r.nutrient_id]] = a;
}

const r1 = n => Math.round(n * 10) / 10;
const items = [];
let i = 0;
for (const [fdc, { e, v }] of wanted) {
  const p = v.p ?? 0, c = v.c ?? 0, f = v.f ?? 0;
  if (v.p == null && v.c == null && v.f == null) { console.error('sin macronutrientes: ' + e.usda); process.exit(1); }
  const kcal = v.k1008 ?? v.k2047 ?? v.k2048 ?? Math.round(4 * p + 4 * c + 9 * f);
  items.push({
    id: 'es-' + String(++i).padStart(4, '0'), fdc_id: Number(fdc), nombre: e.es,
    descripcion_usda: e.usda, energia_kcal: Math.round(kcal), proteina_g: r1(p), carbohidratos_g: r1(c), grasas_g: r1(f),
    alias: e.alias || [], basico: !!e.top
  });
}

const out = join(here, '..', 'data');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'alimentos.json'), JSON.stringify({
  version: '0.1.0', por: '100 g', licencia: 'CC BY 4.0',
  fuente: 'USDA FoodData Central, SR Legacy (abril de 2018), dominio público (CC0 1.0). Nombres en español y alias: este proyecto.',
  alimentos: items
}, null, 1));

const q = s => { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const cols = ['id', 'fdc_id', 'nombre', 'descripcion_usda', 'energia_kcal', 'proteina_g', 'carbohidratos_g', 'grasas_g', 'alias', 'basico'];
const csv = [cols.join(',')].concat(items.map(x => cols.map(k => q(k === 'alias' ? x.alias.join('; ') : k === 'basico' ? (x.basico ? 1 : 0) : x[k])).join(','))).join('\n') + '\n';
writeFileSync(join(out, 'alimentos.csv'), csv);
console.log(`${items.length} alimentos → data/alimentos.csv y data/alimentos.json`);
