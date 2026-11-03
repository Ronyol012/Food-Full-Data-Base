import test from 'node:test';
import assert from 'node:assert/strict';
import { traducirNombre as t, concordar } from '../scripts/nombres.mjs';

test('concuerda género y número', () => {
  assert.equal(concordar('cocido', 'f', 'p'), 'cocidas');
  assert.equal(concordar('verde', 'm', 'p'), 'verdes');
  assert.equal(concordar('integral', 'm', 'p'), 'integrales');
  assert.equal(concordar('natural', 'f', 's'), 'natural');
  assert.equal(concordar('naranja', 'f', 'p'), 'naranjas');
});
test('traduce con la concordancia de la cabeza', () => {
  assert.equal(t('Beans, black, mature seeds, cooked, boiled, without salt'), 'Frijoles, negros, semillas maduras, cocidos, hervidos, sin sal');
  assert.equal(t('Apples, raw, with skin'), 'Manzanas, crudas, con piel');
  assert.equal(t('Broccoli, raw'), 'Brócoli, crudo');
  assert.equal(t('Peppers, sweet, red, raw'), 'Pimientos, dulces, rojos, crudos');
  assert.equal(t('Squash, winter, butternut, raw'), 'Calabaza, de invierno, butternut, cruda');
});
test('cabeza de dos segmentos y multipalabra invariable', () => {
  assert.equal(t('Beans, snap, green, raw'), 'Ejotes, verdes, crudos');
  assert.equal(t('Peas, green, cooked, boiled, drained, without salt'), 'Guisantes, verdes, cocidos, hervidos, escurridos, sin sal');
});
test('concuerda también las frases fijas', () => {
  assert.equal(t('Waffles, plain, prepared from recipe'), 'Waffles, naturales, preparados con receta');
  assert.equal(t('Pork sausage, reduced sodium, cooked'), 'Salchicha de cerdo, reducida en sodio, cocida');
  assert.equal(t('Cheese, mozzarella, low moisture, part-skim, shredded'), 'Queso, mozzarella, bajo en humedad, semidescremado, rallado');
  assert.equal(t('Beans, snap, green, raw'), 'Ejotes, verdes, crudos');
  assert.equal(t('Beets, canned, no salt added, solids and liquids'), 'Remolachas, enlatadas, sin sal añadida, sólidos y líquidos');
});
test('la clara de huevo no se traduce como "huevo blanco"', () => {
  assert.equal(t('Egg, white, dried'), null);
  assert.equal(t('Egg, whole, raw, fresh'), null);
});
test('lo que no está en el vocabulario NO se traduce', () => {
  assert.equal(t('Beef, ground, 85% lean meat / 15% fat, raw'), null);
  assert.equal(t('Babyfood, cereal, rice, dry'), null);
  assert.equal(t('Broccoli, flibbertigibbet, raw'), null);
  assert.equal(t(''), null);
});
test('nunca traduce marcas', () => {
  assert.equal(t('Beans, black, QUAKER'), null);
  assert.equal(t("Cereals, McDONALD'S"), null);
  assert.equal(t("Potatoes, DENNY'S, raw"), null);
});
