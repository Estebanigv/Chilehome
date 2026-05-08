<?php
/**
 * ChileHome CRM - API de Modelos
 * Devuelve los modelos de casas con todos sus datos
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=300'); // Cache 5 minutos

// CORS: solo orígenes propios
$allowedOrigins = ['https://chilehome.cl', 'https://www.chilehome.cl', 'http://localhost', 'http://127.0.0.1'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} elseif (empty($origin)) {
    header('Access-Control-Allow-Origin: *');
}

require_once __DIR__ . '/../config/config.php';

try {
    $db = Database::getInstance();

    // Parámetros opcionales
    $soloActivos = !isset($_GET['all']);
    $destacados = isset($_GET['destacados']);
    $ofertas = isset($_GET['ofertas']);
    $nuevos = isset($_GET['nuevos']);
    $linea = isset($_GET['linea']) ? sanitize($_GET['linea']) : null;
    $slug = isset($_GET['slug']) ? sanitize($_GET['slug']) : null;

    // Obtener configuración global (WhatsApp y email por defecto)
    $configGlobal = [];
    $configs = $db->fetchAll("SELECT config_key, config_value FROM site_config WHERE config_key IN ('whatsapp_principal', 'email_ventas')");
    foreach ($configs as $c) {
        $configGlobal[$c['config_key']] = $c['config_value'];
    }

    // Obtener ejecutivos para hacer join
    $ejecutivosMap = [];
    try {
        $ejecutivos = $db->fetchAll("SELECT id, nombre, whatsapp, email FROM ejecutivos WHERE activo = 1");
        foreach ($ejecutivos as $ej) {
            $ejecutivosMap[$ej['id']] = $ej;
        }
    } catch (Exception $e) {}

    if ($slug) {
        // Obtener un modelo específico
        $modelo = $db->fetchOne(
            "SELECT * FROM modelos WHERE slug = ? AND activo = 1",
            [$slug]
        );

        if ($modelo) {
            // Procesar modelo
            $modelo = processModelo($modelo, $configGlobal, $ejecutivosMap);

            echo json_encode([
                'success' => true,
                'data' => $modelo
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Modelo no encontrado'
            ]);
        }
    } else {
        // Construir query
        $conditions = [];
        $params = [];

        if ($soloActivos) {
            $conditions[] = "activo = 1";
        }

        if ($destacados) {
            $conditions[] = "destacado = 1";
        }

        if ($ofertas) {
            $conditions[] = "en_oferta = 1";
        }

        if ($nuevos) {
            $conditions[] = "nuevo = 1";
        }

        if ($linea) {
            $conditions[] = "linea = ?";
            $params[] = $linea;
        }

        $where = !empty($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

        $modelos = $db->fetchAll(
            "SELECT * FROM modelos $where ORDER BY orden ASC, metros ASC",
            $params
        );

        // Procesar cada modelo
        $modelos = array_map(function($m) use ($configGlobal, $ejecutivosMap) {
            return processModelo($m, $configGlobal, $ejecutivosMap);
        }, $modelos);

        echo json_encode([
            'success' => true,
            'count' => count($modelos),
            'data' => $modelos
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener modelos'
    ]);
}

/**
 * Procesa un modelo agregando campos calculados
 */
function processModelo($modelo, $configGlobal, $ejecutivosMap = []) {
    // Convertir características a array
    $modelo['caracteristicas_array'] = $modelo['caracteristicas']
        ? explode('|', $modelo['caracteristicas'])
        : [];

    // Obtener datos del ejecutivo asignado
    $ejecutivo = null;
    if (!empty($modelo['ejecutivo_id']) && isset($ejecutivosMap[$modelo['ejecutivo_id']])) {
        $ejecutivo = $ejecutivosMap[$modelo['ejecutivo_id']];
        $modelo['ejecutivo'] = [
            'id' => $ejecutivo['id'],
            'nombre' => $ejecutivo['nombre'],
            'whatsapp' => $ejecutivo['whatsapp'],
            'email' => $ejecutivo['email']
        ];
    } else {
        $modelo['ejecutivo'] = null;
    }

    // WhatsApp efectivo: Prioridad: ejecutivo > whatsapp_modelo > global
    if ($ejecutivo && $ejecutivo['whatsapp']) {
        $modelo['whatsapp_efectivo'] = $ejecutivo['whatsapp'];
    } elseif ($modelo['whatsapp_modelo']) {
        $modelo['whatsapp_efectivo'] = $modelo['whatsapp_modelo'];
    } else {
        $modelo['whatsapp_efectivo'] = $configGlobal['whatsapp_principal'] ?? '+56944878554';
    }

    // Email efectivo: Prioridad: ejecutivo > email_modelo > global
    if ($ejecutivo && $ejecutivo['email']) {
        $modelo['email_efectivo'] = $ejecutivo['email'];
    } elseif ($modelo['email_modelo']) {
        $modelo['email_efectivo'] = $modelo['email_modelo'];
    } else {
        $modelo['email_efectivo'] = $configGlobal['email_ventas'] ?? 'contacto@chilehome.cl';
    }

    // Precio a mostrar (oferta si aplica)
    if ($modelo['en_oferta'] && $modelo['precio_oferta_texto']) {
        $modelo['precio_mostrar'] = $modelo['precio_oferta_texto'];
        $modelo['precio_original'] = $modelo['precio_texto'];
        $modelo['tiene_descuento'] = true;
    } else {
        $modelo['precio_mostrar'] = $modelo['precio_texto'];
        $modelo['precio_original'] = null;
        $modelo['tiene_descuento'] = false;
    }

    // Convertir flags a boolean
    $modelo['activo'] = (bool)$modelo['activo'];
    $modelo['destacado'] = (bool)$modelo['destacado'];
    $modelo['nuevo'] = (bool)$modelo['nuevo'];
    $modelo['en_oferta'] = (bool)$modelo['en_oferta'];

    // Generar link de WhatsApp
    $whatsappNum = preg_replace('/\D/', '', $modelo['whatsapp_efectivo']);
    $mensaje = urlencode("Hola, me interesa el modelo {$modelo['nombre']} [web]");
    $modelo['whatsapp_link'] = "https://wa.me/{$whatsappNum}?text={$mensaje}";

    return $modelo;
}
