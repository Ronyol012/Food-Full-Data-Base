# Contribuir

Gracias por ayudar. Hay cinco formas, de más fácil a más trabajosa.

## 1. Corregir un nombre o añadir un alias

Abre un *issue* (ver [REVISION.md](REVISION.md)) o edita directamente `src/lista.json`:

```json
{ "es": "Aguacate (palta)", "usda": "Avocados, raw, all commercial varieties", "alias": ["palta"] }
```

## 2. Proponer un alimento de la USDA

1. Busca el alimento en <https://fdc.nal.usda.gov/> (dataset **SR Legacy**).
2. Añade una entrada a `src/lista.json` con el nombre en español y la descripción **exacta** de la USDA
   (copiada tal cual: el script se detiene si no coincide o es ambigua).
3. Regenera y verifica:

   ```bash
   node scripts/build.mjs /ruta/a/FoodData_Central_sr_legacy_food_csv_2018-04
   node scripts/verify.mjs
   node --test test/*.test.mjs
   ```

### Cómo se escribe un nombre

- **Frase normal**, sin poner cada palabra en mayúscula: *Pechuga de pollo, cocida*.
- Primero el alimento, después el estado: *crudo*, *cocido*, *asado*, *frito*, *enlatado*, *congelado*.
- **Si la entrada es "con sal", "bajo en grasa", "congelado" o "mezcla en polvo, sin preparar", el nombre debe
  decirlo.** Cambia los números, y quien registra una comida no tiene por qué saberlo.
- Un solo nombre principal; las variantes regionales van en `alias` (sin tildes está bien: se busca sin ellas).
- Evita marcas. Si la USDA solo tiene una versión de marca, pon el nombre genérico y *(tipo Marca)* si ayuda.

## 3. Traducir un alimento `pendiente` (nivel extendido)

Añade una entrada a `src/traducciones.json`, con el `fdc_id` (está en `data/extendido.csv`) y el nombre:

```json
{ "167571": { "nombre": "Chocolate blanco", "alias": ["chocolate blanco"] } }
```

Al regenerar, ese alimento pasa a `curada`. El script se detiene si el `fdc_id` no existe o ya está en el núcleo. Sigue las
mismas reglas de nombre de arriba (frase normal, primero el alimento, decir si es "con sal", "congelado"…).

Si lo que está mal es un **patrón** (por ejemplo, un calificativo traducido o concordado mal), corrígelo en
`src/vocabulario.json` y se arregla en todos los alimentos que lo usan; no hace falta editarlos uno por uno.

## 4. Añadir o corregir una receta

Las recetas están en `src/recetas.json`. Cada ingrediente se escribe con el **nombre exacto de un alimento del núcleo**
(`alimento`) y los gramos (`g`), o con su `fdc_id`:

```json
{
  "id": "rc-0029", "nombre": "Arepa reina pepiada (1 unidad)", "paises": ["Venezuela"],
  "raciones": 1, "peso_final_g": 200,
  "ingredientes": [
    { "alimento": "Harina de maíz amarilla (cornmeal)", "g": 50 },
    { "alimento": "Pechuga de pollo hervida", "g": 70 },
    { "alimento": "Aguacate (palta)", "g": 40 }
  ],
  "metodo": "Arepa abierta y rellena de pollo desmenuzado con aguacate.",
  "nota": "Qué simplifica esta receta."
}
```

Reglas para que sea honesta: usa ingredientes **ya cocinados** siempre que puedas; el `peso_final_g` incluye el agua
añadida y descuenta lo que se evapora (el script se detiene si es físicamente imposible); y la `nota` debe decir qué se
simplifica. Después:

```bash
node scripts/build-recetas.mjs
node scripts/verify.mjs
node --test test/*.test.mjs
```

## 5. Añadir una fuente nueva (otros países)

Es lo más valioso y lo más delicado. Antes de añadir datos de otra tabla (BEDCA, CIQUAL, tablas
latinoamericanas…) hay que comprobar su **licencia**: debe permitir redistribuir y mezclar con CC BY 4.0.
Abre un *issue* con el enlace a la fuente y a sus condiciones de uso antes de escribir código. Las fuentes con
condiciones no comerciales o con *share-alike* (como Open Food Facts, ODbL) **no pueden mezclarse** en este
conjunto.

## Licencia de las contribuciones

Al contribuir aceptas que tu aporte se publique bajo **CC BY 4.0**, igual que el resto del proyecto.
