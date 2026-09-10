-- ChileHome — enrutar el contacto de la web al Agente IA (2026-09-10)
--
-- La web resuelve el WhatsApp por dos vias y ambas deben apuntar al agente:
--   site_config.whatsapp_global    -> id de ejecutivos, lo lee admin/api/whatsapp.php
--                                     (script inline de index.html, el que manda)
--   site_config.whatsapp_principal -> numero plano, lo lee site-config.js
--
-- Antes: whatsapp_global = 10 (Maria Jose)  /  whatsapp_principal = 56998654665 (Nataly)
-- Ahora: ambos al ejecutivo id 24 "Agente IA ChileHome" (+56 9 4487 8554)

START TRANSACTION;

UPDATE site_config SET config_value = '24'          WHERE config_key = 'whatsapp_global';
UPDATE site_config SET config_value = '56944878554' WHERE config_key = 'whatsapp_principal';

COMMIT;

SELECT c.config_key, c.config_value, e.nombre, e.whatsapp
FROM site_config c
LEFT JOIN ejecutivos e ON e.id = c.config_value
WHERE c.config_key IN ('whatsapp_global','whatsapp_principal');
