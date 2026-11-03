# Cambios

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
