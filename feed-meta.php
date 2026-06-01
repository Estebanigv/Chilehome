<?php
/**
 * ChileHome — Feed de productos para Meta (Facebook/Instagram) Commerce
 * URL pública: https://www.chilehome.cl/feed-meta.csv
 * Formato: CSV con columnas requeridas por Meta Product Catalog
 */

// Sin caché — Meta debe leer siempre datos frescos
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: inline; filename="feed-meta.csv"');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

// Conexión a base de datos (reutiliza .env.php si existe)
$envFile = __DIR__ . '/admin/config/.env.php';
if (file_exists($envFile)) {
    $env = require $envFile;
    $dbHost = $env['db_host'] ?? 'localhost';
    $dbName = $env['db_name'] ?? 'chilehome_crm';
    $dbUser = $env['db_user'] ?? 'root';
    $dbPass = $env['db_pass'] ?? '';
} else {
    $dbHost = 'localhost';
    $dbName = 'chilehome_crm';
    $dbUser = 'root';
    $dbPass = '';
}

// Modelos fallback (se usan si la DB no está disponible)
$modelosFallback = [
    [
        'id'          => 'CH-36-2A',
        'title'       => 'Casa Prefabricada 36m2 Dos Aguas',
        'description' => 'Casa prefabricada 36m2 dos aguas en pino impregnado. Kit Basico - 1 a 2 dormitorios - 1 bano. Flete de Chañaral a Puerto Montt. Entrega inmediata.',
        'price'       => 1590000,
        'sale_price'  => null,
        'availability'=> 'in stock',
        'link'        => 'https://www.chilehome.cl/',
        'image_link'  => 'https://www.chilehome.cl/Imagenes/modelos/36m2-2a/36m2-2a-horizontal.png',
        'custom_label'=> 'Linea Clasica',
    ],
    [
        'id'          => 'CH-54-2A',
        'title'       => 'Casa Prefabricada 54m2 Dos Aguas',
        'description' => 'Casa prefabricada 54m2 dos aguas en pino impregnado. Kit Basico - 2 dormitorios - 1 bano. Flete de Chañaral a Puerto Montt. Entrega inmediata.',
        'price'       => 1990000,
        'sale_price'  => null,
        'availability'=> 'in stock',
        'link'        => 'https://www.chilehome.cl/',
        'image_link'  => 'https://www.chilehome.cl/Imagenes/modelos/54m2-2a/54m2-2a-horizontal.png',
        'custom_label'=> 'Linea Clasica',
    ],
    [
        'id'          => 'CH-72-2A',
        'title'       => 'Casa Prefabricada 72m2 Dos Aguas',
        'description' => 'Casa prefabricada 72m2 dos aguas en pino impregnado. 3 dormitorios - 1 bano. Flete de Chañaral a Puerto Montt. Entrega inmediata.',
        'price'       => 2740000,
        'sale_price'  => null,
        'availability'=> 'in stock',
        'link'        => 'https://www.chilehome.cl/',
        'image_link'  => 'https://www.chilehome.cl/Imagenes/modelos/72m2-2a/72m2-2a-portada.webp',
        'custom_label'=> 'Linea Clasica',
    ],
];

// Mapa slug → ID de feed estable
$slugToFeedId = [
    'clasica-36'    => 'CH-36-2A',
    'clasica-54'    => 'CH-54-2A',
    'clasica-72-2a' => 'CH-72-2A',
];

// Mapa slug → URL imagen
$slugToImage = [
    'clasica-36'    => 'https://www.chilehome.cl/Imagenes/modelos/36m2-2a/36m2-2a-horizontal.png',
    'clasica-54'    => 'https://www.chilehome.cl/Imagenes/modelos/54m2-2a/54m2-2a-horizontal.png',
    'clasica-72-2a' => 'https://www.chilehome.cl/Imagenes/modelos/72m2-2a/72m2-2a-portada.webp',
];

$rows = [];

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser, $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->query("
        SELECT slug, nombre, descripcion, precio, precio_oferta, en_oferta, activo
        FROM modelos
        WHERE activo = 1
          AND slug IN ('" . implode("','", array_keys($slugToFeedId)) . "')
        ORDER BY metros ASC
    ");
    $modelos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($modelos as $m) {
        $feedId = $slugToFeedId[$m['slug']] ?? null;
        if (!$feedId) continue;

        $precio     = (int)$m['precio'];
        $salePrice  = ($m['en_oferta'] && $m['precio_oferta'] > 0) ? (int)$m['precio_oferta'] : null;
        $desc       = trim(strip_tags($m['descripcion'] ?? ''));
        if (empty($desc)) {
            // Usar descripción del fallback si la DB no tiene
            foreach ($modelosFallback as $fb) {
                if ($fb['id'] === $feedId) { $desc = $fb['description']; break; }
            }
        }

        $rows[] = [
            'id'          => $feedId,
            'title'       => 'Casa Prefabricada ' . $m['nombre'],
            'description' => $desc,
            'price'       => $precio,
            'sale_price'  => $salePrice,
            'availability'=> 'in stock',
            'link'        => 'https://www.chilehome.cl/',
            'image_link'  => $slugToImage[$m['slug']] ?? '',
            'custom_label'=> 'Linea Clasica',
        ];
    }
} catch (Exception $e) {
    // DB no disponible: usar fallback estático
    $rows = array_map(fn($fb) => [
        'id'          => $fb['id'],
        'title'       => $fb['title'],
        'description' => $fb['description'],
        'price'       => $fb['price'],
        'sale_price'  => $fb['sale_price'],
        'availability'=> $fb['availability'],
        'link'        => $fb['link'],
        'image_link'  => $fb['image_link'],
        'custom_label'=> $fb['custom_label'],
    ], $modelosFallback);
}

// Generar CSV
$out = fopen('php://output', 'w');

// BOM UTF-8 para Excel (no lo necesita Meta pero ayuda en preview)
// fwrite($out, "\xEF\xBB\xBF");

// Cabecera
fputcsv($out, [
    'id', 'title', 'description', 'availability', 'condition',
    'price', 'sale_price', 'link', 'image_link', 'brand',
    'quantity_to_sell_on_facebook', 'custom_label_0'
]);

foreach ($rows as $r) {
    fputcsv($out, [
        $r['id'],
        $r['title'],
        $r['description'],
        $r['availability'],
        'new',
        $r['price'] . ' CLP',
        $r['sale_price'] ? $r['sale_price'] . ' CLP' : '',
        $r['link'],
        $r['image_link'],
        'ChileHome',
        100,
        $r['custom_label'],
    ]);
}

fclose($out);
