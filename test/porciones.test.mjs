import test from 'node:test';
import assert from 'node:assert/strict';
import { traducirMedida as t } from '../scripts/porciones.mjs';

test('unidades simples, con singular y plural', () => {
  assert.equal(t('cup', 1), 'taza');
  assert.equal(t('cup', 2), 'tazas');
  assert.equal(t('tbsp', 1), 'cucharada');
  assert.equal(t('fl oz', 8), 'onzas líquidas');
  assert.equal(t('slice', 1), 'rebanada');
});
test('con estado, con coma o sin ella', () => {
  assert.equal(t('cup, chopped', 1), 'taza, picado');
  assert.equal(t('cup chopped', 1), 'taza, picado');
  assert.equal(t('cup, shredded', 1), 'taza, rallado');
  assert.equal(t('cup, chopped or diced', 1), 'taza, picado o en cubos');
});
test('tamaños sueltos', () => {
  assert.equal(t('large', 1), 'grande');
  assert.equal(t('medium', 1), 'mediano');
  assert.equal(t('small', 1), 'pequeño');
});
test('medida entre paréntesis: solo si lleva números y unidades', () => {
  assert.equal(t('cup (8 fl oz)', 1), 'taza (8 fl oz)');
  assert.equal(t('slice (1 oz)', 1), 'rebanada (1 oz)');
  assert.equal(t('can (303 x 406)', 1), 'lata (303 x 406)');
});
test('paréntesis con frases conocidas y diámetros', () => {
  assert.equal(t('cup (not packed)', 1), 'taza (sin comprimir)');
  assert.equal(t('medium (2-1/2" dia)', 1), 'mediano (diám. 2-1/2")');
  assert.equal(t('can or bottle (12 fl oz)', 1), 'lata o botella (12 fl oz)');
  assert.equal(t('leaf inner', 1), 'hoja, interior');
});
test('lo que no está en el vocabulario NO se traduce', () => {
  assert.equal(t('piece, cooked, excluding refuse (yield from 1 lb raw meat with refuse)', 1), null);
  assert.equal(t('unit (yield from 1 lb ready-to-cook chicken)', 1), null);
  assert.equal(t('cup, flibbertigibbet', 1), null);
  assert.equal(t('', 1), null);
  assert.equal(t(undefined, 1), null);
});
