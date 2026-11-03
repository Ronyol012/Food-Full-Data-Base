#!/usr/bin/env node
/* Genera las recetas de data/ a partir de src/recetas.json y de los datos ya publicados (no necesita la USDA).
 *
 *   node scripts/build-recetas.mjs
 *
 * Cada ingrediente se escribe con `alimento` (el `nombre` exacto de un alimento del núcleo) o con `fdc_id`
 * (para cualquier alimento, también del nivel extendido). Si no se encuentra uno solo, el script se detiene.
 *
 * Salidas: data/recetas.json, data/recetas.csv (mismo esquema que alimentos.csv: valores por 100 g, para poder
 * concatenarlos), data/porciones_recetas.csv, data/recetas_ingredientes.csv y data/recetas_detalle.csv.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEC } from './esquema.mjs';
import { calcular } from './recetas.mjs';

const VERSION = '0.4.0';
const here = dirname(fileURLToPath(import.meta.url));
const data = f => join(here, '..', 'data', f);
const src = JSON.parse(readFileSync(join(here, '..', 'src', 'recetas.json'), 'utf8'));
const nucleo = JSON.parse(readFileSync(data('alimentos.json'), 'utf8')).alimentos;
const porNombre = new Map(nucleo.map(a => [a.nombre, a]));
const porFdc = new Map(nucleo.map(a => [a.fdc_id, a]));
if (src.some(r => r.ingredientes.some(i => i.fdc_id != null)) && existsSync(data('extendido.json'))) {
  for (const a of JSON.parse(readFileSync(data('extendido.json'), 'utf8')).alimentos) porFdc.set(a.fdc_id, a);
}

function resolver(ing) {
  const a = ing.fdc_id != null ? porFdc.get(ing.fdc_id) : porNombre.get(ing.alimento);
  if (!a) { console.error(`ingrediente no encontrado: ${ing.alimento ?? 'fdc_id ' + ing.fdc_id}`); process.exit(1); }
  return a;
}

const ids = new Set(), nombres = new Set();
const recetas = [];
for (const r of src) {
  if (ids.has(r.id)) { console.error('id de receta repetido: ' + r.id); process.exit(1); }
  if (nombres.has(r.nombre)) { console.error('nombre de receta repetido: ' + r.nombre); process.exit(1); }
  ids.add(r.id); nombres.add(r.nombre);
  const c = calcular(r, resolver);
  recetas.push({
    id: r.id, fdc_id: null, nombre: r.nombre, descripcion_usda: null, categoria: 'Platos regionales', traduccion: 'curada', nivel: 'receta',
    ...c.por_100g, alias: r.alias || [], basico: false,
    porciones: [{ cantidad: 1, medida_es: 'ración', medida_en: 'serving', gramos: c.peso_racion_g }],
    receta: {
      paises: r.paises, raciones: r.raciones, peso_final_g: r.peso_final_g, peso_racion_g: c.peso_racion_g, estimacion: true,
      metodo: r.metodo, nota: r.nota || '',
      ingredientes: r.ingredientes.map(i => { const a = resolver(i); return { alimento: a.nombre, fdc_id: a.fdc_id, gramos: i.g }; }),
      por_racion: c.por_racion, nutrientes_no_medidos: c.no_medidos
    }
  });
}

writeFileSync(data('recetas.json'), JSON.stringify({
  version: VERSION, por: '100 g', licencia: 'CC BY 4.0', nivel: 'receta',
  fuente: 'Recetas estándar simplificadas de este proyecto: ingredientes en gramos, nutrientes calculados con los valores del núcleo (USDA SR Legacy).',
  nota: 'ESTIMACIONES. No descuentan pérdidas de nutrientes por cocción y el peso final es una estimación. Un nutriente en null no está medido en algún ingrediente: no es 0.',
  alimentos: recetas
}, null, 1));

const q = s => { s = s == null ? '' : String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const cols = ['id', 'fdc_id', 'nombre', 'descripcion_usda', 'categoria', 'traduccion', 'nivel', ...Object.keys(SPEC), 'alias', 'basico'];
writeFileSync(data('recetas.csv'), [cols.join(',')].concat(recetas.map(x => cols.map(k => q(k === 'alias' ? x.alias.join('; ') : k === 'basico' ? 0 : x[k])).join(','))).join('\n') + '\n');
const pc = ['id', 'fdc_id', 'orden', 'cantidad', 'medida_es', 'medida_en', 'gramos'];
writeFileSync(data('porciones_recetas.csv'), [pc.join(',')].concat(recetas.map(x => pc.map(k => q({ id: x.id, fdc_id: '', orden: 1, ...x.porciones[0] }[k])).join(','))).join('\n') + '\n');
const ic = ['receta_id', 'orden', 'alimento', 'fdc_id', 'gramos'];
writeFileSync(data('recetas_ingredientes.csv'), [ic.join(',')].concat(recetas.flatMap(x => x.receta.ingredientes.map((i, n) => ic.map(k => q({ receta_id: x.id, orden: n + 1, ...i }[k])).join(',')))).join('\n') + '\n');
const dc = ['receta_id', 'nombre', 'paises', 'raciones', 'peso_final_g', 'peso_racion_g', 'metodo', 'nota'];
writeFileSync(data('recetas_detalle.csv'), [dc.join(',')].concat(recetas.map(x => dc.map(k => q(k === 'receta_id' ? x.id : k === 'nombre' ? x.nombre : k === 'paises' ? x.receta.paises.join('; ') : x.receta[k])).join(','))).join('\n') + '\n');

console.log(`${recetas.length} recetas, ${recetas.reduce((n, x) => n + x.receta.ingredientes.length, 0)} líneas de ingredientes`);
