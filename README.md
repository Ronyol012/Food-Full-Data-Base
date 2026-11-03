# Alimentos ES

Composición de alimentos **en español**: 875 alimentos comunes con calorías, proteína, carbohidratos y
grasas por 100 g, en CSV y JSON. Libre para usar, también en productos comerciales, citando la fuente
([CC BY 4.0](LICENSE)). **Datos: CC BY 4.0. Código (`scripts/`): [MIT](LICENSE-CODE).**

> **Versión 0.1.0 — en revisión.** Los nombres en español son una traducción sin revisar por hablantes
> nativos de cada país. Ver [REVISION.md](REVISION.md): ayuda bienvenida.

## Qué hay

| Archivo | Contenido |
|---|---|
| `data/alimentos.csv` | La tabla, para hojas de cálculo y pandas |
| `data/alimentos.json` | La misma tabla, con alias como lista |
| `src/lista.json` | La parte curada: nombre en español → descripción **exacta** de la USDA |
| `scripts/build.mjs` | Regenera `data/` desde los datos de la USDA |
| `scripts/verify.mjs` | Comprueba que `data/` es coherente |

### Columnas

| Columna | Significado |
|---|---|
| `id` | Identificador estable de este dataset (`es-0001`…) |
| `fdc_id` | Identificador del alimento en FoodData Central de la USDA |
| `nombre` | Nombre en español |
| `descripcion_usda` | Descripción original de la USDA (en inglés), tal cual |
| `energia_kcal` | Energía por 100 g (entero) |
| `proteina_g`, `carbohidratos_g`, `grasas_g` | Gramos por 100 g (un decimal) |
| `alias` | Otros nombres con los que se busca: regionales, plurales, inglés |
| `basico` | `1` si es un alimento cotidiano, para ordenar resultados primero |

Todos los valores son **por 100 g de alimento tal como se describe** (crudo, cocido, enlatado…).

## Usarlo

Desde GitHub, sin instalar nada (jsDelivr sirve los archivos con CORS):

```js
const r = await fetch('https://cdn.jsdelivr.net/gh/USUARIO/alimentos-es@v0.1.0/data/alimentos.json');
const { alimentos } = await r.json();
const pollo = alimentos.find(a => a.nombre.startsWith('Pechuga de pollo, cocida'));
// → { energia_kcal: 165, proteina_g: 31, carbohidratos_g: 0, grasas_g: 3.6, … }
```

```python
import pandas as pd
df = pd.read_csv('data/alimentos.csv')
df[df.nombre.str.contains('arepa', case=False)]
```

Fija siempre una versión (`@v0.1.0`) en lugar de `@main`: los nombres pueden corregirse entre versiones.

## Origen de los datos y licencia

- **Valores nutricionales:** [USDA FoodData Central](https://fdc.nal.usda.gov/), conjunto **SR Legacy**
  (abril de 2018, versión final). La USDA lo publica como **dominio público (CC0 1.0)**.
- **Nombres en español, alias, selección y orden:** trabajo de este proyecto, bajo **CC BY 4.0**.
- **Código** (`scripts/`, flujos de GitHub): **MIT** ([LICENSE-CODE](LICENSE-CODE)).
- **No incluye datos de Open Food Facts** (licencia ODbL con share-alike). Ver [NOTICE.md](NOTICE.md).

### Cómo citarlo

> Alimentos ES (v0.1.0). Composición de alimentos en español, a partir de USDA FoodData Central, SR Legacy.
> CC BY 4.0. https://github.com/USUARIO/alimentos-es

Hay un archivo [CITATION.cff](CITATION.cff) que GitHub muestra como "Cite this repository".

## Límites que conviene conocer

- **Es una selección, no toda la USDA.** Son alimentos que la gente registra de verdad. Lo que falta puede
  buscarse en la base original o proponerse (ver abajo).
- **SR Legacy es una versión final de 2018:** no se actualizará. Son valores de alimentos de EE. UU.; un
  mismo alimento puede variar en otro país.
- **Los nombres dicen lo que cambia los números.** Si una entrada es *"con sal"*, *"enlatado"*, *"congelado"*
  o *"mezcla en polvo, sin preparar"*, es porque la USDA lo mide así. Una mezcla en polvo por 100 g **no** es
  el plato ya preparado.
- **Calorías y macros no siempre cuadran** (4·P + 4·C + 9·G): el alcohol aporta energía que no sale en
  ninguno de los tres, y la fibra cuenta menos. Es lo esperado (cerveza, vino, licores, especias, limón).
- **Es una referencia, no consejo nutricional ni médico.**

## Reconstruirlo

1. Descarga **SR Legacy → CSV** de <https://fdc.nal.usda.gov/download-datasets/> y descomprímelo.
2. `node scripts/build.mjs /ruta/a/FoodData_Central_sr_legacy_food_csv_2018-04`
3. `node scripts/verify.mjs`

(El zip de Foundation Foods publicado en octubre de 2026 trae solo tablas de laboratorio, sin `food.csv` ni
`food_nutrient.csv`: no sirve para esto.)

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Lo más útil ahora: **revisar nombres** de tu país y **proponer alimentos**
que uses a menudo.

---

## In English

**Alimentos ES** is a free, Spanish-language food composition table: 875 everyday foods with energy,
protein, carbohydrate and fat per 100 g (CSV and JSON). Nutrient values come from the USDA FoodData Central
SR Legacy dataset (public domain, CC0 1.0); the Spanish names, aliases and curation are licensed
**CC BY 4.0**. Every row keeps the exact USDA description and `fdc_id`, so it can be traced and extended.
Version 0.1.0: the translations are unreviewed by native speakers from different countries — see
[REVISION.md](REVISION.md). Not nutritional or medical advice.
