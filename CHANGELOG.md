# Cambios

## 0.3.0 — 2026-11-03

**Todo SR Legacy, en dos niveles.** Ahora el dataset cubre los 7.793 alimentos de USDA SR Legacy.

- **Nivel extendido** (`data/extendido.csv|json`, `data/porciones_extendido.csv`): los otros 6.918 alimentos, con el mismo
  esquema que el núcleo, 28 columnas nutricionales y 12.270 porciones.
- **Columna `traduccion`** (`curada` | `automatica` | `pendiente`, y `revisada` cuando la haya): del total,
  875 curadas (el núcleo), 674 automáticas, 6.244 pendientes. **Ninguna está revisada todavía.**
- **Traducción automática de nombres** con vocabulario cerrado (`scripts/nombres.mjs`, `src/vocabulario.json`): hace
  concordar género y número y devuelve `null` si cualquier segmento no está en el vocabulario. Excluye marcas. Un nombre
  `pendiente` tiene `nombre` vacío; úsese `descripcion_usda`.
- **Columna `categoria`** (las 25 categorías de la USDA, en español) y columna `nivel` (`nucleo` | `extendido`), también en el núcleo.
- **`src/traducciones.json`**: aporta un nombre a mano para un alimento del nivel extendido (queda `curada`).
- Porciones traducidas: 9.801 de 14.431 (68 %).
- El verificador revisa los dos niveles, las reglas de `traduccion`, y distingue avisos (rarezas plausibles de la fuente)
  de errores (valores absurdos). Corrige un error propio de v0.2: las grasas trans son un subconjunto de las mono y
  poliinsaturadas en la USDA y no deben sumarse aparte.
- **Cambio de posición de columnas:** `categoria`, `traduccion` y `nivel` se insertan tras `descripcion_usda`, así que el
  CSV del núcleo cambia de posiciones. Los nombres y significados de las columnas existentes no cambian; quien lea por
  posición debe actualizarse.

## 0.2.0 — 2026-11-03

- **Nutrientes nuevos** (todos de la misma fuente, USDA SR Legacy): agua, fibra, azúcares, grasa saturada,
  monoinsaturada, poliinsaturada y trans, colesterol, sodio, potasio, calcio, hierro, magnesio, fósforo, zinc,
  vitaminas A, C, D, E, K y B12, folato, alcohol y cafeína.
  **Un valor vacío (`null`) significa "no medido", no 0.**
- **Porciones en gramos**: 2.161 porciones de 872 de los 875 alimentos (`data/porciones.csv`, y anidadas en el JSON),
  con traducción por vocabulario cerrado (72 %); el resto conserva solo el texto original.
- El generador comprueba las unidades de cada nutriente contra la USDA y se detiene si alguna cambia.
- El verificador comprueba coherencia entre nutrientes (fibra y azúcares ≤ carbohidratos, saturadas ≤ grasa total,
  agua + macros ≈ 100 g…) con tolerancias documentadas para el ruido de medición.
- Pruebas del traductor de porciones (`node --test test/*.test.mjs`).
- Código bajo MIT (`LICENSE-CODE`); los datos siguen en CC BY 4.0.
- Cambio compatible: las columnas existentes no cambian de nombre ni de significado; las nuevas se añaden antes de `alias` y `basico`. Quien lea el CSV por posición en vez de por nombre de columna debe actualizarse.

## 0.1.0 — 2026-11-03

Primera versión pública, **en revisión**.

- 875 alimentos, valores por 100 g, de USDA FoodData Central SR Legacy (abril de 2018).
- Nombres en español y alias, sin revisar por hablantes nativos de cada país.
- Incluye alimentos latinos y mexicanos de la categoría "Restaurant" de la USDA (arepa, pupusas, tamales,
  empanadas, arroz con gandules…): son versiones de restaurante de EE. UU., con su receta.
- CSV, JSON, script de generación y verificador.
