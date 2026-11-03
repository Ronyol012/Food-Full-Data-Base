/* Traduce la descripción de un alimento de la USDA al español con un VOCABULARIO CERRADO
 * (src/vocabulario.json). Es una traducción AUTOMÁTICA: se marca como `automatica` y nunca como `revisada`.
 *
 * Gramática: <Cabeza>[, <calificativo>]*  — p. ej. "Beans, black, mature seeds, cooked, boiled, without salt"
 *   → "Frijoles, negros, semillas maduras, cocidos, hervidos, sin sal".
 *
 * - La cabeza lleva género y número; los calificativos que son adjetivos concuerdan con ella
 *   ("cocido / cocida / cocidos / cocidas"). Los demás son invariables (marcados con "=" en el vocabulario).
 * - Si CUALQUIER segmento no está en el vocabulario, devuelve null: no se traduce a medias ni se adivina.
 * - Se excluyen las descripciones con marcas (palabras en MAYÚSCULAS, apóstrofes) y las que empiezan
 *   por categorías cuyo sustantivo real viene después (Babyfood, Snacks, Beverages…): no están en las cabezas.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const V = JSON.parse(readFileSync(join(here, '..', 'src', 'vocabulario.json'), 'utf8'));
const CAB = V.cabezas, CAL = V.calificativos;
// los calificativos se buscan sin distinguir mayúsculas
const CAL_MIN = new Map(Object.entries(CAL).map(([k, v]) => [k.toLowerCase(), v]));

/** Concuerda un adjetivo regular con género (m|f) y número (s|p). */
export function concordar(base, g, n) {
  let w = base;
  if (g === 'f' && w.endsWith('o')) w = w.slice(0, -1) + 'a';
  if (n === 'p') {
    if (/[aeiouáéíóú]$/.test(w)) w += 's';
    else if (/z$/.test(w)) w = w.slice(0, -1) + 'ces';
    else w += /[ií]n$|[áéíóú]n$/.test(w) ? 'es' : 'es';
  }
  return w;
}
function calificativo(def, g, n) {
  if (def.startsWith('=')) return def.slice(1);                    // invariable
  if (def.startsWith('~')) {                                       // concuerda solo la primera palabra
    const [a, ...r] = def.slice(1).split(' ');
    return [concordar(a, g, n), ...r].join(' ');
  }
  if (def.includes(' ')) return def;                               // varias palabras: invariable
  return concordar(def, g, n);
}

export function traducirNombre(descripcion) {
  const d = String(descripcion || '').trim();
  if (!d || /[A-Z]{3,}/.test(d) || d.includes("'")) return null;
  const partes = d.split(',').map(x => x.trim());
  let cab = partes[0], resto = partes.slice(1);
  if (partes.length > 1 && CAB[partes[0] + ', ' + partes[1]]) { cab = partes[0] + ', ' + partes[1]; resto = partes.slice(2); }
  const h = CAB[cab];
  if (!h) return null;
  const [es, g, n] = h;
  const out = [];
  for (const seg of resto) {
    const def = CAL_MIN.get(seg.toLowerCase());
    if (def === undefined) return null;
    out.push(calificativo(def, g, n));
  }
  return [es, ...out].join(', ');
}
