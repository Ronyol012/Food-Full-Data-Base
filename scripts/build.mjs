#!/usr/bin/env node
/* Genera data/ a partir de src/lista.json y los CSV de la USDA.
 *
 *   node scripts/build.mjs <carpeta con los CSV de SR Legacy>
 *
 * Fuente: USDA FoodData Central, SR Legacy (abril de 2018, versión final), dominio público (CC0 1.0).
 *   https://fdc.nal.usda.gov/download-datasets/  →  SR Legacy → CSV
 *
 * Salidas, en dos niveles con el MISMO esquema (se pueden concatenar):
 *   núcleo     (los alimentos de src/lista.json, con nombre curado): data/alimentos.csv|json, data/porciones.csv
 *   extendido  (el resto de SR Legacy): data/extendido.csv|json, data/porciones_extendido.csv
 * Cada alimento lleva `categoria` (en español), `traduccion` (curada | automatica | pendiente) y `nivel`.
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
import { traducirNombre } from './nombres.mjs';

export const VERSION = '0.4.0';
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

import { SPEC } from './esquema.mjs';

const unidad = new Map();
for (const r of rows('nutrient.csv')) unidad.set(r.id, r.unit_name);
for (const [k, [ids, u]] of Object.entries(SPEC)) for (const id of ids) {
  if (unidad.get(id) !== u) { console.error(`la unidad de ${k} (nutriente ${id}) es ${unidad.get(id)}, se esperaba ${u}`); process.exit(1); }
}
const quien = new Map();   // id de nutriente → clave
for (const [k, [ids]] of Object.entries(SPEC)) ids.forEach(id => { if (!quien.has(id)) quien.set(id, k); });

// categorías: se comprueba que los nombres en inglés de src/categorias.json coinciden con los de la USDA
const CAT = JSON.parse(readFileSync(join(here, '..', 'src', 'categorias.json'), 'utf8'));
for (const r of rows('food_category.csv')) {
  const c = CAT[r.id];
  if (c && c[0] !== r.description) { console.error(`la categoría ${r.id} de la USDA es "${r.description}", no coincide con src/categorias.json`); process.exit(1); }
}

const todos = [...rows('food.csv')].map(r => ({ fdc: r.fdc_id, desc: r.description, cat: r.food_category_id }));
for (const f of todos) if (!CAT[f.cat]) { console.error(`el alimento "${f.desc}" usa la categoría ${f.cat}, que no está en src/categorias.json`); process.exit(1); }
const byDesc = new Map();
for (const f of todos) byDesc.set(f.desc, byDesc.has(f.desc) ? null : f.fdc);
const list = JSON.parse(readFileSync(join(here, '..', 'src', 'lista.json'), 'utf8'));
const curados = new Map();   // fdc_id → entrada de lista.json (el núcleo)
for (const e of list) {
  const id = byDesc.get(e.usda);
  if (id === undefined) { console.error('no está en los datos de la USDA: ' + e.usda); process.exit(1); }
  if (id === null) { console.error('ambigua en los datos de la USDA: ' + e.usda); process.exit(1); }
  if (curados.has(id)) { console.error('repetida: ' + e.usda); process.exit(1); }
  curados.set(id, e);
}

const nutr = new Map();      // fdc_id → { clave: { id de nutriente: valor } }
for (const r of rows('food_nutrient.csv')) {
  const k = quien.get(r.nutrient_id);
  if (!k) continue;
  const a = parseFloat(r.amount);
  if (!isFinite(a)) continue;
  const v = nutr.get(r.fdc_id) || nutr.set(r.fdc_id, {}).get(r.fdc_id);
  (v[k] ||= {})[r.nutrient_id] = a;
}
const valor = (v, k) => { const [ids, , dec] = SPEC[k]; for (const id of ids) if (v[k]?.[id] != null) { const f = Math.pow(10, dec); return Math.round(v[k][id] * f) / f; } return null; };

const porFood = new Map();
for (const r of rows('food_portion.csv')) {
  const g = parseFloat(r.gram_weight), amount = parseFloat(r.amount);
  if (!(g > 0) || !(amount > 0)) continue;
  (porFood.get(r.fdc_id) || porFood.set(r.fdc_id, []).get(r.fdc_id)).push({ orden: parseInt(r.seq_num, 10) || 0, cantidad: amount, medida_en: (r.modifier || '').trim() || 'serving', gramos: Math.round(g * 10) / 10 });
}

const sinTraducir = new Map(); let total = 0, traducidas = 0;
function construir(f, id, nombre, traduccion, nivel, alias, basico) {
  const v = nutr.get(f.fdc) || {};
  const n = {};
  for (const k of Object.keys(SPEC)) n[k] = valor(v, k);
  if (nivel === 'nucleo') {
    if (n.proteina_g == null && n.carbohidratos_g == null && n.grasas_g == null) { console.error('sin macronutrientes: ' + f.desc); process.exit(1); }
    for (const k of ['proteina_g', 'carbohidratos_g', 'grasas_g']) if (n[k] == null) n[k] = 0;
    if (n.energia_kcal == null) n.energia_kcal = Math.round(4 * n.proteina_g + 4 * n.carbohidratos_g + 9 * n.grasas_g);
  } else if (n.energia_kcal == null && n.proteina_g != null && n.carbohidratos_g != null && n.grasas_g != null) {
    n.energia_kcal = Math.round(4 * n.proteina_g + 4 * n.carbohidratos_g + 9 * n.grasas_g);
  }
  const ps = (porFood.get(f.fdc) || []).sort((a, b) => a.orden - b.orden || a.gramos - b.gramos).map(p => {
    const es = traducirMedida(p.medida_en, p.cantidad);
    total++; if (es) traducidas++; else sinTraducir.set(p.medida_en, (sinTraducir.get(p.medida_en) || 0) + 1);
    return { cantidad: p.cantidad, medida_es: es, medida_en: p.medida_en, gramos: p.gramos };
  });
  return { id, fdc_id: Number(f.fdc), nombre, descripcion_usda: f.desc, categoria: CAT[f.cat]?.[1] ?? null, traduccion, nivel, ...n, alias, basico, porciones: ps };
}

// núcleo: en el orden de lista.json
const porFdc = new Map(todos.map(f => [f.fdc, f]));
const nucleo = []; let i = 0;
for (const [fdc, e] of curados) nucleo.push(construir(porFdc.get(fdc), 'es-' + String(++i).padStart(4, '0'), e.es, 'curada', 'nucleo', e.alias || [], !!e.top));

// traducciones aportadas a mano para alimentos del nivel extendido: src/traducciones.json
//   { "<fdc_id>": { "nombre": "…", "alias": ["…"] } }
const manual = JSON.parse(readFileSync(join(here, '..', 'src', 'traducciones.json'), 'utf8'));
for (const id of Object.keys(manual)) {
  if (!porFdc.has(id)) { console.error(`src/traducciones.json: el fdc_id ${id} no existe en SR Legacy`); process.exit(1); }
  if (curados.has(id)) { console.error(`src/traducciones.json: el fdc_id ${id} ya está en el núcleo (src/lista.json)`); process.exit(1); }
  if (!manual[id].nombre || typeof manual[id].nombre !== 'string') { console.error(`src/traducciones.json: falta el nombre de ${id}`); process.exit(1); }
}

// extendido: todo lo demás, por fdc_id
const extendido = []; let j = 0; const estados = { curada: 0, automatica: 0, pendiente: 0 };
for (const f of todos.filter(f => !curados.has(f.fdc)).sort((a, b) => Number(a.fdc) - Number(b.fdc))) {
  const m = manual[f.fdc];
  const auto = m ? null : traducirNombre(f.desc);
  const estado = m ? 'curada' : auto ? 'automatica' : 'pendiente';
  estados[estado]++;
  extendido.push(construir(f, 'ex-' + String(++j).padStart(5, '0'), m ? m.nombre : auto, estado, 'extendido', m?.alias || [], false));
}

const out = join(here, '..', 'data');
mkdirSync(out, { recursive: true });
const cabecera = {
  version: VERSION, por: '100 g', licencia: 'CC BY 4.0',
  fuente: 'USDA FoodData Central, SR Legacy (abril de 2018), dominio público (CC0 1.0). Nombres en español, alias, categorías y traducción de porciones: este proyecto.',
  nota: 'Un nutriente en null no fue medido por la USDA: no es lo mismo que 0. traduccion: curada = escrita a mano, sin revisión de hablantes nativos; automatica = vocabulario cerrado; pendiente = sin traducir (nombre null; ver descripcion_usda).'
};
writeFileSync(join(out, 'alimentos.json'), JSON.stringify({ ...cabecera, nivel: 'nucleo', alimentos: nucleo }, null, 1));
writeFileSync(join(out, 'extendido.json'), JSON.stringify({ ...cabecera, nivel: 'extendido', alimentos: extendido }));   // compacto: es grande

const q = s => { s = s == null ? '' : String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const cols = ['id', 'fdc_id', 'nombre', 'descripcion_usda', 'categoria', 'traduccion', 'nivel', ...Object.keys(SPEC), 'alias', 'basico'];
const csv = items => [cols.join(',')].concat(items.map(x => cols.map(k => q(k === 'alias' ? x.alias.join('; ') : k === 'basico' ? (x.basico ? 1 : 0) : x[k])).join(','))).join('\n') + '\n';
writeFileSync(join(out, 'alimentos.csv'), csv(nucleo));
writeFileSync(join(out, 'extendido.csv'), csv(extendido));
const pc = ['id', 'fdc_id', 'orden', 'cantidad', 'medida_es', 'medida_en', 'gramos'];
const porcCsv = items => [pc.join(',')].concat(items.flatMap(x => x.porciones.map((p, k) => pc.map(c => q({ id: x.id, fdc_id: x.fdc_id, orden: k + 1, ...p }[c])).join(',')))).join('\n') + '\n';
writeFileSync(join(out, 'porciones.csv'), porcCsv(nucleo));
writeFileSync(join(out, 'porciones_extendido.csv'), porcCsv(extendido));

const nP = items => items.reduce((n, x) => n + x.porciones.length, 0);
console.log(`núcleo:    ${nucleo.length} alimentos, ${nP(nucleo)} porciones`);
console.log(`extendido: ${extendido.length} alimentos (${estados.curada} curados a mano, ${estados.automatica} con nombre automático, ${estados.pendiente} pendientes), ${nP(extendido)} porciones`);
console.log(`porciones traducidas: ${traducidas} de ${total} (${Math.round(100 * traducidas / total)} %)`);
if (process.argv.includes('--sin-traducir')) {
  console.log('\nPorciones sin traducir, por frecuencia:');
  [...sinTraducir].sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([k, c]) => console.log(String(c).padStart(5), k));
}
