# Alimentos ES

Composición de alimentos **en español**, en dos niveles: un **núcleo de 875** alimentos comunes con nombre curado y un
**nivel extendido con los otros 6.918** de USDA SR Legacy (7.793 en total), más **28 platos regionales calculados**. Calorías, macros y **más de 20 nutrientes**
por 100 g, y **14.431 porciones** en gramos ("1 huevo grande = 50 g"), en CSV y JSON. Libre para usar, también en productos comerciales, citando la fuente
([CC BY 4.0](LICENSE)). **Datos: CC BY 4.0. Código (`scripts/`): [MIT](LICENSE-CODE).**

> **Versión 0.4.0 — en revisión.** Ningún nombre ha sido revisado todavía por hablantes nativos. Del total,
> **875 tienen nombre curado a mano, 674 un nombre automático y 6.244 siguen sin traducir** (se identifican por su
> descripción original en inglés). Ver [REVISION.md](REVISION.md): ayuda bienvenida.

## Qué hay

Tres **niveles** con exactamente las mismas columnas, para que se puedan concatenar:

| Nivel | Qué es | Alimentos | Archivos |
|---|---|---|---|
| **Núcleo** | Los alimentos cotidianos, con nombre en español escrito a mano y alias regionales | 875 | `data/alimentos.csv`, `data/alimentos.json`, `data/porciones.csv` |
| **Extendido** | El resto de SR Legacy | 6.918 | `data/extendido.csv`, `data/extendido.json`, `data/porciones_extendido.csv` |
| **Recetas** | Platos regionales calculados desde sus ingredientes (**estimaciones**) | 28 | `data/recetas.csv`, `data/recetas.json`, `data/porciones_recetas.csv`, `data/recetas_ingredientes.csv`, `data/recetas_detalle.csv` |

Otros archivos: `src/lista.json` (el núcleo: nombre en español → descripción **exacta** de la USDA), `src/traducciones.json`
(nombres aportados a mano para el nivel extendido), `src/vocabulario.json` y `src/categorias.json`, y en `scripts/` el
generador (`build.mjs`), el verificador (`verify.mjs`) y los traductores de nombres y porciones.

**Tamaños:** `alimentos.json` ≈ 1 MB y `extendido.json` ≈ 6 MB (compacto). Para una app web, carga el núcleo y deja el
extendido para cuando haga falta.

### Estados de la traducción (`traduccion`)

| Estado | Significa | Hoy |
|---|---|---|
| `revisada` | Un hablante nativo lo comprobó (y queda anotado en `REVISION.md`) | **0** |
| `curada` | Escrita a mano por quien mantiene el dataset, **sin** revisión de hablantes nativos | 875 |
| `automatica` | Generada con un vocabulario cerrado (ver abajo); nunca se presenta como revisada | 674 |
| `pendiente` | Sin traducir: `nombre` es `null` y hay que usar `descripcion_usda` (inglés) | 6.244 |

**Cómo se traduce de forma automática:** `scripts/nombres.mjs` solo traduce una descripción si **cada** segmento
está en `src/vocabulario.json`, y hace concordar género y número ("Frijoles, negros, semillas maduras, cocidos…"). Si un
solo segmento no está, devuelve `null` y el alimento queda `pendiente`: no se traduce a medias ni se adivina. Se excluyen
las marcas, y por eso lo más frecuente en `pendiente` son los cortes de res, cerdo, cordero y ternera (cuyo nombre
cambia según el país), la comida infantil, las bebidas, las botanas y las cadenas de comida rápida.

### Recetas (platos regionales)

28 platos (pabellón criollo, arepas, gallo pinto, casado, baleadas, tacos, chilaquiles, pozole, mofongo, tortilla
española, lomo saltado, milanesa, empanadas…) **calculados sumando los nutrientes de sus ingredientes**, que ya están en
el núcleo. Tienen el mismo esquema que un alimento (valores por 100 g y una porción "1 ración"), así que se tratan igual.

- `data/recetas.csv` / `recetas.json`: los platos, con las mismas columnas que `alimentos.csv` (`nivel` = `receta`).
  En el JSON, cada plato trae además `receta`: países, raciones, peso final, método, nota, ingredientes en gramos y los
  nutrientes **por ración**.
- `data/recetas_ingredientes.csv`: una fila por ingrediente (`receta_id`, `alimento`, `fdc_id`, `gramos`).
- `data/recetas_detalle.csv`: países, raciones, pesos, método y nota de cada plato.

**Son estimaciones, y hay que leerlas como tales:**
- Son recetas **estándar y simplificadas**, escritas por este proyecto: no son las de nadie en particular, y cada país y
  cada casa las prepara distinto. Cada una lleva una `nota` con lo que simplifica.
- El **peso final** es una estimación (incluye el agua añadida y descuenta la que se evapora). El **agua** del plato se
  calcula por conservación de la masa, no sumando el agua de los ingredientes.
- **No se descuentan pérdidas de nutrientes** por cocción (vitaminas, etc.).
- Siempre que se puede se usan ingredientes **ya cocinados** (arroz cocido, frijoles cocidos) para no tener que estimar
  cuánto agua se pierde al cocinar.
- **Un nutriente que algún ingrediente no tiene medido queda en `null` en el plato**; no se suma solo lo medido.
- `verify.mjs` **recalcula cada receta** desde sus ingredientes y falla si lo guardado no coincide, para que ningún
  archivo quede desactualizado al cambiar el núcleo.

### Categoría (`categoria`)

Las 25 categorías de la USDA, en español: Res, Cerdo, Aves, Cordero ternera y caza, Pescados y mariscos, Lácteos y huevos,
Verduras y derivados, Frutas y jugos de fruta, Legumbres y derivados, Frutos secos y semillas, Cereales en grano y pasta,
Panes y productos horneados, Dulces, Grasas y aceites, Bebidas, Sopas salsas y caldos, Especias y hierbas, Cereales de
desayuno, Botanas, Embutidos y fiambres, Comida rápida, Comida de restaurante, Platos preparados y guarniciones,
Alimentos para bebés y Alimentos de pueblos indígenas de América y Alaska.

### Columnas (iguales en los dos niveles)

Todos los valores son **por 100 g de alimento tal como se describe** (crudo, cocido, enlatado…).

| Columna | Significado |
|---|---|
| `id` | Identificador de este dataset: `es-0001`… (núcleo) y `ex-00001`… (extendido, por `fdc_id`) |
| `fdc_id` | Identificador del alimento en FoodData Central de la USDA |
| `nombre` | Nombre en español; **`null`/vacío si `traduccion` es `pendiente`** |
| `descripcion_usda` | Descripción original de la USDA (en inglés), tal cual |
| `categoria` | Categoría de la USDA, en español |
| `traduccion` | `curada`, `automatica` o `pendiente` (y `revisada` cuando la haya) |
| `nivel` | `nucleo` o `extendido` |
| `energia_kcal` | Energía (kcal) |
| `proteina_g`, `carbohidratos_g`, `grasas_g` | Macronutrientes (g) |
| `agua_g`, `fibra_g`, `azucares_g` | Agua, fibra y azúcares totales (g) |
| `grasa_saturada_g`, `grasa_monoinsaturada_g`, `grasa_poliinsaturada_g`, `grasa_trans_g` | Tipos de grasa (g) |
| `colesterol_mg`, `sodio_mg`, `potasio_mg`, `calcio_mg`, `hierro_mg`, `magnesio_mg`, `fosforo_mg`, `zinc_mg` | Colesterol y minerales (mg) |
| `vitamina_a_ug` (RAE), `vitamina_d_ug`, `vitamina_k_ug`, `vitamina_b12_ug`, `folato_ug` (DFE) | Vitaminas (µg) |
| `vitamina_c_mg`, `vitamina_e_mg` | Vitaminas (mg) |
| `alcohol_g`, `cafeina_mg` | Alcohol (g) y cafeína (mg) |
| `alias` | Otros nombres con los que se busca: regionales, plurales, inglés (hoy solo en el núcleo) |
| `basico` | `1` si es un alimento cotidiano, para ordenar resultados primero (solo núcleo) |

> **Una celda vacía (o `null` en el JSON) significa "la USDA no lo midió". No es lo mismo que 0.**
> Una fibra de `0` es un alimento sin fibra; una fibra vacía es un dato que no existe. No rellenes los vacíos con ceros.

### Porciones (`porciones*.csv`, y `porciones` dentro de cada alimento del JSON)

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
lugar de adivinar y se conserva el texto original. Hoy se traducen **9.801 de 14.431 (68 %)**. Los estados se escriben en
masculino ("taza, picado") porque describen el alimento, no la unidad.

## Usarlo

Desde GitHub, sin instalar nada (jsDelivr sirve los archivos con CORS):

```js
const r = await fetch('https://cdn.jsdelivr.net/gh/Ronyol012/Food-Full-Data-Base@v0.4.0/data/alimentos.json');
const { alimentos } = await r.json();      // el núcleo; el extendido está en data/extendido.json
const pollo = alimentos.find(a => a.nombre.startsWith('Pechuga de pollo, cocida'));
// → { energia_kcal: 165, proteina_g: 31, carbohidratos_g: 0, grasas_g: 3.6, … }
```

```python
import pandas as pd
df = pd.read_csv('data/alimentos.csv')
df[df.nombre.str.contains('arepa', case=False)]
```

Fija siempre una versión (`@v0.4.0`) en lugar de `@main`: los nombres pueden corregirse entre versiones.

## Origen de los datos y licencia

- **Valores nutricionales:** [USDA FoodData Central](https://fdc.nal.usda.gov/), conjunto **SR Legacy**
  (abril de 2018, versión final). La USDA lo publica como **dominio público (CC0 1.0)**.
- **Nombres en español, alias, selección y orden:** trabajo de este proyecto, bajo **CC BY 4.0**.
- **Código** (`scripts/`, flujos de GitHub): **MIT** ([LICENSE-CODE](LICENSE-CODE)).
- **No incluye datos de Open Food Facts** (licencia ODbL con share-alike). Ver [NOTICE.md](NOTICE.md).

### Cómo citarlo

> Alimentos ES (v0.4.0). Composición de alimentos en español, a partir de USDA FoodData Central, SR Legacy.
> CC BY 4.0. https://github.com/Ronyol012/Food-Full-Data-Base

Hay un archivo [CITATION.cff](CITATION.cff) que GitHub muestra como "Cite this repository".

## Límites que conviene conocer

- **El nivel extendido no está traducido en su mayoría:** 6.244 de 6.918 son `pendiente` y los 674 automáticos tienen
  una calidad menor que el núcleo. Úsalo por su `descripcion_usda`, `categoria` y nutrientes mientras se traduce.
- **Incluye de todo lo que trae SR Legacy**, también marcas de EE. UU., comida infantil, fórmulas y alimentos de pueblos
  indígenas de América y Alaska (incluye animales marinos y de caza). Filtra por `categoria` para quedarte con lo que necesites.
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
2. `node scripts/build.mjs /ruta/a/FoodData_Central_sr_legacy_food_csv_2018-04` (genera núcleo y extendido)
   `node scripts/build-recetas.mjs` (genera las recetas; no necesita la USDA)
3. `node scripts/verify.mjs` y `node --test test/*.test.mjs`

(El zip de Foundation Foods publicado en octubre de 2026 trae solo tablas de laboratorio, sin `food.csv` ni
`food_nutrient.csv`: no sirve para esto.)

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Lo más útil ahora: **revisar nombres** de tu país y **proponer alimentos**
que uses a menudo.

---

## In English

**Alimentos ES** is a free, Spanish-language food composition table in two tiers plus 28 calculated regional dishes (estimates): a **core of 875** everyday foods with
hand-written Spanish names, and an **extended tier with the other 6,918** foods of USDA SR Legacy (7,793 in total), with
energy, macros and 20+ nutrients per 100 g and 14,431 portion sizes in grams (CSV and JSON). Each food has a `traduccion`
status: 875 `curada`, 674 `automatica` (closed vocabulary), 6,244 `pendiente` (not translated; use `descripcion_usda`). A blank cell means *not measured*, not 0. Nutrient values come from the USDA FoodData Central
SR Legacy dataset (public domain, CC0 1.0); the Spanish names, aliases and curation are licensed
**CC BY 4.0**. Every row keeps the exact USDA description and `fdc_id`, so it can be traced and extended.
Version 0.4.0: the translations are unreviewed by native speakers from different countries — see
[REVISION.md](REVISION.md). Not nutritional or medical advice.
