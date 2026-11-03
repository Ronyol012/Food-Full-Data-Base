# Contribuir

Gracias por ayudar. Hay tres formas, de más fácil a más trabajosa.

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

## 3. Añadir una fuente nueva (otros países)

Es lo más valioso y lo más delicado. Antes de añadir datos de otra tabla (BEDCA, CIQUAL, tablas
latinoamericanas…) hay que comprobar su **licencia**: debe permitir redistribuir y mezclar con CC BY 4.0.
Abre un *issue* con el enlace a la fuente y a sus condiciones de uso antes de escribir código. Las fuentes con
condiciones no comerciales o con *share-alike* (como Open Food Facts, ODbL) **no pueden mezclarse** en este
conjunto.

## Licencia de las contribuciones

Al contribuir aceptas que tu aporte se publique bajo **CC BY 4.0**, igual que el resto del proyecto.
