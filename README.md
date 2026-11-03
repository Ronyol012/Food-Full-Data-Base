# Alimentos ES

Composición de alimentos **en español**: 875 alimentos comunes con calorías, macros y **más de 20 nutrientes** por
100 g, más **2.161 porciones** en gramos ("1 huevo grande = 50 g"), en CSV y JSON. Libre para usar, también en productos comerciales, citando la fuente
([CC BY 4.0](LICENSE)). **Datos: CC BY 4.0. Código (`scripts/`): [MIT](LICENSE-CODE).**

> **Versión 0.2.0 — en revisión.** Los nombres en español son una traducción sin revisar por hablantes
> nativos de cada país. Ver [REVISION.md](REVISION.md): ayuda bienvenida.

## Qué hay

| Archivo | Contenido |
|---|---|
| `data/alimentos.csv` | La tabla de alimentos, para hojas de cálculo y pandas |
| `data/alimentos.json` | La misma tabla, con alias como lista y las porciones anidadas |
| `data/porciones.csv` | Las porciones, una fila cada una |
| `src/lista.json` | La parte curada: nombre en español → descripción **exacta** de la USDA |
| `scripts/build.mjs` | Regenera `data/` desde los datos de la USDA |
| `scripts/verify.mjs` | Comprueba que `data/` es coherente |
| `scripts/porciones.mjs` | Traduce las descripciones de porciones (vocabulario cerrado) |

### Columnas de `alimentos.csv`

Todos los valores son **por 100 g de alimento tal como se describe** (crudo, cocido, enlatado…).

| Columna | Significado |
|---|---|
| `id` | Identificador estable de este dataset (`es-0001`…) |
| `fdc_id` | Identificador del alimento en FoodData Central de la USDA |
| `nombre` | Nombre en español |
| `descripcion_usda` | Descripción original de la USDA (en inglés), tal cual |
| `energia_kcal` | Energía (kcal) |
| `proteina_g`, `carbohidratos_g`, `grasas_g` | Macronutrientes (g) |
| `agua_g`, `fibra_g`, `azucares_g` | Agua, fibra y azúcares totales (g) |
| `grasa_saturada_g`, `grasa_monoinsaturada_g`, `grasa_poliinsaturada_g`, `grasa_trans_g` | Tipos de grasa (g) |
| `colesterol_mg`, `sodio_mg`, `potasio_mg`, `calcio_mg`, `hierro_mg`, `magnesio_mg`, `fosforo_mg`, `zinc_mg` | Colesterol y minerales (mg) |
| `vitamina_a_ug` (RAE), `vitamina_d_ug`, `vitamina_k_ug`, `vitamina_b12_ug`, `folato_ug` (DFE) | Vitaminas (µg) |
| `vitamina_c_mg`, `vitamina_e_mg` | Vitaminas (mg) |
| `alcohol_g`, `cafeina_mg` | Alcohol (g) y cafeína (mg) |
| `alias` | Otros nombres con los que se busca: regionales, plurales, inglés |
| `basico` | `1` si es un alimento cotidiano, para ordenar resultados primero |

> **Una celda vacía (o `null` en el JSON) significa "la USDA no lo midió". No es lo mismo que 0.**
> Una fibra de `0` es un alimento sin fibra; una fibra vacía es un dato que no existe. No rellenes los vacíos con ceros.

### Porciones (`porciones.csv`, y `porciones` dentro de cada alimento del JSON)

| Columna | Significado |
|---|---|
| `id`, `fdc_id` | El alimento al que pertenece |
| `orden` | Orden en que la USDA las lista |
| `cantidad` | Cuántas unidades de la medida (casi siempre 1) |
| `medida_es` | La medida en español (`taza, picado`), o **vacía si no se pudo traducir con seguridad** |
| `medida_en` | La descripción original de la USDA, siempre presente |
| `gramos` | Lo que pesan `cantidad` unidades, en gramos |

Ejemplo: huevo entero crudo → `1 · grande · large · 50 g`.

**Sobre la traducción de porciones:** se hace con un vocabulario cerrado (`scripts/porciones.mjs`). Si una descripción no
encaja entera (por ejemplo, *"piece, cooked, excluding refuse (yield from 1 lb raw meat)"*), se deja sin traducir en
lugar de adivinar y se conserva el texto original. Hoy se traducen **1.564 de 2.161 (72 %)**. Los estados se escriben en
masculino ("taza, picado") porque describen el alimento, no la unidad.

## Usarlo

Desde GitHub, sin instalar nada (jsDelivr sirve los archivos con CORS):

```js
const r = await fetch('https://cdn.jsdelivr.net/gh/Ronyol012/Food-Full-Data-Base@v0.2.0/data/alimentos.json');
const { alimentos } = await r.json();
const pollo = alimentos.find(a => a.nombre.startsWith('Pechuga de pollo, cocida'));
// → { energia_kcal: 165, proteina_g: 31, carbohidratos_g: 0, grasas_g: 3.6, … }
```

```python
import pandas as pd
df = pd.read_csv('data/alimentos.csv')
df[df.nombre.str.contains('arepa', case=False)]
```

Fija siempre una versión (`@v0.2.0`) en lugar de `@main`: los nombres pueden corregirse entre versiones.

## Origen de los datos y licencia

- **Valores nutricionales:** [USDA FoodData Central](https://fdc.nal.usda.gov/), conjunto **SR Legacy**
  (abril de 2018, versión final). La USDA lo publica como **dominio público (CC0 1.0)**.
- **Nombres en español, alias, selección y orden:** trabajo de este proyecto, bajo **CC BY 4.0**.
- **Código** (`scripts/`, flujos de GitHub): **MIT** ([LICENSE-CODE](LICENSE-CODE)).
- **No incluye datos de Open Food Facts** (licencia ODbL con share-alike). Ver [NOTICE.md](NOTICE.md).

### Cómo citarlo

> Alimentos ES (v0.2.0). Composición de alimentos en español, a partir de USDA FoodData Central, SR Legacy.
> CC BY 4.0. https://github.com/Ronyol012/Food-Full-Data-Base

Hay un archivo [CITATION.cff](CITATION.cff) que GitHub muestra como "Cite this repository".

## Límites que conviene conocer

- **Es una selección, no toda la USDA.** Son alimentos que la gente registra de verdad. Lo que falta puede
  buscarse en la base original o proponerse (ver abajo).
- **SR Legacy es una versión final de 2018:** no se actualizará. Son valores de alimentos de EE. UU.; un
  mismo alimento puede variar en otro país.
- **Los nombres dicen lo que cambia los números.** Si una entrada es *"con sal"*, *"enlatado"*, *"congelado"*
  o *"mezcla en polvo, sin preparar"*, es porque la USDA lo mide así. Una mezcla en polvo por 100 g **no** es
  el plato ya preparado.
- **Calorías y macros no siempre cuadran** (4·P + 4·C + 9·G + 7·alcohol): la fibra cuenta menos energía, y las
  especias, el limón o el cacao tienen mucha. Es lo esperado. Además, **medir tiene ruido**: la suma de agua y
  macros puede pasar de 100 g en un par de puntos, y los azúcares medidos pueden superar un poco los
  carbohidratos "por diferencia". Son datos reales de la USDA, no se corrigen.
- **Es una referencia, no consejo nutricional ni médico.**

## Reconstruirlo

1. Descarga **SR Legacy → CSV** de <https://fdc.nal.usda.gov/download-datasets/> y descomprímelo.
2. `node scripts/build.mjs /ruta/a/FoodData_Central_sr_legacy_food_csv_2018-04`
3. `node scripts/verify.mjs` y `node --test test/*.test.mjs`

(El zip de Foundation Foods publicado en octubre de 2026 trae solo tablas de laboratorio, sin `food.csv` ni
`food_nutrient.csv`: no sirve para esto.)

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Lo más útil ahora: **revisar nombres** de tu país y **proponer alimentos**
que uses a menudo.

---

## In English

**Alimentos ES** is a free, Spanish-language food composition table: 875 everyday foods with energy, macros and
20+ nutrients per 100 g, plus 2,161 portion sizes in grams (CSV and JSON). A blank cell means *not measured*, not 0. Nutrient values come from the USDA FoodData Central
SR Legacy dataset (public domain, CC0 1.0); the Spanish names, aliases and curation are licensed
**CC BY 4.0**. Every row keeps the exact USDA description and `fdc_id`, so it can be traced and extended.
Version 0.2.0: the translations are unreviewed by native speakers from different countries — see
[REVISION.md](REVISION.md). Not nutritional or medical advice.
