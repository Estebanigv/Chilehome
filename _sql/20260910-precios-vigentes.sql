-- ChileHome — sincronizacion de precios publicos vigentes (2026-09-10)
--
-- La tabla `modelos` tiene DOS columnas de precio y las consumen APIs distintas:
--   precio        int    -> lo usa feed-meta.php (feed de catalogo de Meta)
--   precio_texto  varchar-> lo usa admin/api/modelos.php (web publica)
-- Deben actualizarse juntas o el feed y la web se contradicen.
--
-- Kit basico / dos aguas / tabiqueria 2x3:
--   36 m2  $1.590.000 -> $1.630.000
--   54 m2  $1.990.000 -> $2.030.000
--   72 m2  $2.740.000 -> $2.780.000
-- Las demas variantes (un agua, seis aguas, siding) ya estaban correctas.
-- Terra 36 y 108 m2 quedan con precio 0 / NULL: la API los devuelve "Consultar"
-- y no forman parte del feed de Meta.

START TRANSACTION;

UPDATE modelos SET precio = 1630000, precio_texto = '$1.630.000' WHERE slug = 'clasica-36';
UPDATE modelos SET precio = 2030000, precio_texto = '$2.030.000' WHERE slug = 'clasica-54';
UPDATE modelos SET precio = 2780000, precio_texto = '$2.780.000' WHERE slug = 'clasica-72-2a';

COMMIT;

-- Chequeo: precio numerico y texto deben coincidir en todas las filas con precio
SELECT slug, precio, precio_texto,
       CASE WHEN precio = 0 AND precio_texto IS NULL THEN 'Consultar'
            WHEN CAST(REPLACE(REPLACE(precio_texto,'$',''),'.','') AS UNSIGNED) = precio THEN 'OK'
            ELSE 'DESAJUSTE' END AS estado
FROM modelos ORDER BY orden ASC, metros ASC;
