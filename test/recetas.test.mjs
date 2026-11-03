import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../scripts/recetas.mjs';
import { SPEC } from '../scripts/esquema.mjs';

// alimentos de juguete: todo medido salvo lo que se indique
const base = () => Object.fromEntries(Object.keys(SPEC).map(k => [k, 0]));
const arroz = { ...base(), energia_kcal: 130, proteina_g: 2.7, carbohidratos_g: 28, grasas_g: 0.3, sodio_mg: 1, vitamina_d_ug: null };
const aceite = { ...base(), energia_kcal: 884, grasas_g: 100, sodio_mg: 2, vitamina_d_ug: 0 };
const foods = { arroz, aceite };
const res = ing => foods[ing.alimento];

test('suma ponderada por gramos, y se reparte por ración y por 100 g del peso final', () => {
  // 210 g de ingredientes sin agua caben en un peso final de 220 g (los 10 g restantes son agua añadida)
  const r = { nombre: 't', raciones: 2, peso_final_g: 220, ingredientes: [{ alimento: 'arroz', g: 200 }, { alimento: 'aceite', g: 10 }] };
  const c = calcular(r, res);
  assert.equal(c.por_racion.energia_kcal, Math.round((260 + 88.4) / 2));         // 174
  assert.equal(c.por_100g.energia_kcal, Math.round(((260 + 88.4) / 220) * 100)); // 158
  assert.equal(c.por_100g.grasas_g, Math.round((((0.6 + 10) / 220) * 100) * 10) / 10);
  assert.equal(c.peso_racion_g, 110);
});
test('un nutriente no medido en UN ingrediente queda en null en el plato, no en 0', () => {
  const r = { nombre: 't', raciones: 1, peso_final_g: 220, ingredientes: [{ alimento: 'arroz', g: 200 }, { alimento: 'aceite', g: 10 }] };
  const c = calcular(r, res);
  assert.equal(c.por_100g.vitamina_d_ug, null);
  assert.equal(c.por_racion.vitamina_d_ug, null);
  assert.ok(c.no_medidos.includes('vitamina_d_ug'));
  assert.notEqual(c.por_100g.sodio_mg, null);
});
test('el peso final cambia lo que sale por 100 g pero no por ración', () => {
  const ing = [{ alimento: 'arroz', g: 100 }];
  const a = calcular({ nombre: 't', raciones: 1, peso_final_g: 100, ingredientes: ing }, res);
  const b = calcular({ nombre: 't', raciones: 1, peso_final_g: 200, ingredientes: ing }, res);
  assert.equal(a.por_racion.energia_kcal, b.por_racion.energia_kcal);
  assert.equal(b.por_100g.energia_kcal, a.por_100g.energia_kcal / 2);
  assert.equal(b.ratio_peso, 2);
});
test('el agua sale de la conservación de la masa, no de sumar el agua de los ingredientes', () => {
  const sec = { ...base(), energia_kcal: 350, carbohidratos_g: 78, agua_g: 10 };         // 90 g de sólidos por 100 g
  const f = { sec };
  const rs = ing => f[ing.alimento];
  // 100 g de harina + agua añadida: el peso final sube, el agua final = final - sólidos
  const masa = calcular({ nombre: 't', raciones: 1, peso_final_g: 250, ingredientes: [{ alimento: 'sec', g: 100 }] }, rs);
  assert.equal(masa.por_racion.agua_g, 160);                // 250 - 90
  // lo mismo pero evaporando: final 80 g con 90 g de sólidos no es posible
  assert.throws(() => calcular({ nombre: 't', raciones: 1, peso_final_g: 80, ingredientes: [{ alimento: 'sec', g: 100 }] }, rs), /agua/);
  // agua y el resto suman el peso final: nunca más de 100 g por 100 g
  assert.ok(masa.por_100g.agua_g + 100 * 0.90 / 2.5 <= 100.01);
});
test('si un ingrediente no tiene el agua medida, el agua del plato es null', () => {
  const sin = { ...base(), agua_g: null };
  const c = calcular({ nombre: 't', raciones: 1, peso_final_g: 100, ingredientes: [{ alimento: 'x', g: 100 }] }, () => sin);
  assert.equal(c.por_100g.agua_g, null);
  assert.ok(c.no_medidos.includes('agua_g'));
});
test('rechaza datos imposibles en vez de calcular algo', () => {
  const ing = [{ alimento: 'arroz', g: 100 }];
  assert.throws(() => calcular({ nombre: 't', raciones: 0, peso_final_g: 100, ingredientes: ing }, res), /raciones/);
  assert.throws(() => calcular({ nombre: 't', raciones: 1, peso_final_g: 0, ingredientes: ing }, res), /peso_final_g/);
  assert.throws(() => calcular({ nombre: 't', raciones: 1, peso_final_g: 100, ingredientes: [{ alimento: 'arroz', g: -5 }] }, res), /gramos/);
});
