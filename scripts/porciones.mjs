/* Traduce las descripciones de porciones de la USDA ("cup, chopped", "slice (1 oz)", "large") al español.
 *
 * Es un vocabulario CERRADO a propósito: si una descripción no encaja entera en la gramática
 * (<unidad>[, <estado>][ (<medida>)] o un tamaño), la función devuelve null y la porción se queda
 * sin traducir, con el texto original de la USDA. Nunca se adivina.
 *
 * Los estados ("picado", "rallado"…) se escriben en masculino porque describen el alimento, no la unidad.
 */

// unidad en inglés → [singular, plural]
const UNIDADES = {
  cup: ['taza', 'tazas'], oz: ['onza', 'onzas'], tbsp: ['cucharada', 'cucharadas'], tablespoon: ['cucharada', 'cucharadas'],
  tsp: ['cucharadita', 'cucharaditas'], teaspoon: ['cucharadita', 'cucharaditas'], 'fl oz': ['onza líquida', 'onzas líquidas'],
  fillet: ['filete', 'filetes'], slice: ['rebanada', 'rebanadas'], slices: ['rebanadas', 'rebanadas'], piece: ['pieza', 'piezas'], pieces: ['piezas', 'piezas'],
  can: ['lata', 'latas'], quart: ['cuarto de galón', 'cuartos de galón'], pint: ['pinta', 'pintas'], lb: ['libra', 'libras'],
  leaf: ['hoja', 'hojas'], head: ['cabeza', 'cabezas'], package: ['paquete', 'paquetes'], container: ['envase', 'envases'],
  stick: ['barra', 'barras'], bar: ['barra', 'barras'], sandwich: ['sándwich', 'sándwiches'], taco: ['taco', 'tacos'],
  link: ['salchicha', 'salchichas'], enchilada: ['enchilada', 'enchiladas'], order: ['orden', 'órdenes'], serving: ['porción', 'porciones'],
  unit: ['unidad', 'unidades'], 'cubic inch': ['pulgada cúbica', 'pulgadas cúbicas'], 'nlea serving': ['porción (etiqueta NLEA)', 'porciones (etiqueta NLEA)'],
  bottle: ['botella', 'botellas'], packet: ['sobre', 'sobres'], pouch: ['bolsita', 'bolsitas'], tortilla: ['tortilla', 'tortillas'],
  roll: ['rollo', 'rollos'], patty: ['hamburguesa', 'hamburguesas'], egg: ['huevo', 'huevos'], clove: ['diente', 'dientes'],
  stalk: ['tallo', 'tallos'], spear: ['punta', 'puntas'], sprig: ['ramita', 'ramitas'], wedge: ['cuña', 'cuñas'], breast: ['pechuga', 'pechugas'],
  thigh: ['muslo', 'muslos'], drumstick: ['pierna', 'piernas'], wing: ['ala', 'alas'], cookie: ['galleta', 'galletas'], cracker: ['galleta salada', 'galletas saladas'],
  biscuit: ['bizcocho', 'bizcochos'], muffin: ['muffin', 'muffins'], bagel: ['bagel', 'bagels'], pancake: ['panqueque', 'panqueques'],
  'can or bottle': ['lata o botella', 'latas o botellas'], half: ['mitad', 'mitades'], block: ['bloque', 'bloques'], tamale: ['tamal', 'tamales'],
  sprigs: ['ramitas', 'ramitas'], chop: ['chuleta', 'chuletas'], nuts: ['fruto seco', 'frutos secos'], shrimp: ['camarón', 'camarones'], nut: ['nuez', 'nueces'], kernel: ['grano', 'granos'], berry: ['baya', 'bayas'], olive: ['aceituna', 'aceitunas']
};
const CLAVES = Object.keys(UNIDADES).sort((x, y) => y.length - x.length);
const TAMANOS = {
  small: 'pequeño', medium: 'mediano', large: 'grande', 'extra large': 'extra grande', jumbo: 'jumbo', 'extra small': 'extra pequeño',
  mini: 'mini', whole: 'entero', 'bite size': 'tamaño bocado', thin: 'delgado', thick: 'grueso'
};
const ESTADOS = {
  sliced: 'en rebanadas', chopped: 'picado', shredded: 'rallado', diced: 'en cubos', cubes: 'en cubos', whole: 'entero', halves: 'en mitades',
  mashed: 'en puré', pureed: 'hecho puré', pieces: 'en trozos', sections: 'en gajos', balls: 'en bolitas', ground: 'molido', boneless: 'sin hueso',
  cooked: 'cocido', raw: 'crudo', thin: 'delgado', thick: 'grueso', 'not packed': 'sin comprimir', packed: 'compactado', slices: 'en rebanadas',
  grated: 'rallado', crumbled: 'desmenuzado', melted: 'derretido', unpacked: 'sin comprimir', 'chopped or diced': 'picado o en cubos',
  inner: 'interior', outer: 'exterior', fluid: 'líquido', whipped: 'batido', 'bone-in': 'con hueso', drained: 'escurrido', strips: 'en tiras', 'crushed': 'triturado', 'whole kernels': 'en granos', 'cut up': 'cortado'
};
// una medida entre paréntesis que solo lleva números y unidades de medida: se conserva tal cual
// frases entre paréntesis que sí se pueden traducir
const PARENTESIS = { 'not packed': 'sin comprimir', packed: 'compactado' };
const MEDIDA = /^[\d\s./\-x"',]*(?:\s*(?:fl oz|oz|lb|g|ml|cm|in)\b)?[\d\s./\-x"',]*(?:\s*(?:fl oz|oz|lb|g|ml|cm|in)\b)?$/;

/**
 * @param {string} modificador  El campo `modifier` de la USDA.
 * @param {number} cantidad     El campo `amount`: sirve para elegir singular o plural.
 * @returns {string|null}       La descripción en español, o null si no está en el vocabulario.
 */
export function traducirMedida(modificador, cantidad = 1) {
  const m = String(modificador || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!m) return null;
  const plural = Number(cantidad) !== 1;
  const par = m.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  const cuerpo = par ? par[1].trim() : m;
  const medida = par ? par[2].trim() : '';
  let sufijo = '';
  if (par) {
    const dia = medida.match(/^([\d\s./\-]+)"\s*dia$/);          // 2-1/2" dia → diám. 2-1/2"
    if (MEDIDA.test(medida)) sufijo = ` (${medida})`;
    else if (PARENTESIS[medida]) sufijo = ` (${PARENTESIS[medida]})`;
    else if (dia) sufijo = ` (diám. ${dia[1].trim()}")`;
    else return null;
  }

  if (TAMANOS[cuerpo] && !UNIDADES[cuerpo]) return TAMANOS[cuerpo] + sufijo;

  // la unidad más larga que abra la descripción; lo que sigue es el estado ("chopped", "chopped or diced"…)
  let unidad = null, resto = '';
  for (const k of CLAVES) {
    if (cuerpo === k || cuerpo.startsWith(k + ',') || cuerpo.startsWith(k + ' ')) { unidad = k; resto = cuerpo.slice(k.length).replace(/^[,\s]+/, ''); break; }
  }
  if (!unidad) return null;
  const extra = resto ? resto.split(/,\s*/) : [];
  const nombre = UNIDADES[unidad][plural ? 1 : 0];
  const estados = [];
  for (const e of extra) {
    const k = e.trim();
    if (!k) continue;
    const t = ESTADOS[k] ?? TAMANOS[k];
    if (!t) return null;
    estados.push(t);
  }
  return nombre + (estados.length ? ', ' + estados.join(', ') : '') + sufijo;
}
