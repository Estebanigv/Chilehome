<?php
/**
 * Chile Home - Descarga de Fichas Técnicas
 * Sirve el PDF del modelo solicitado de forma segura
 */

$allowedModels = ['36', '54', '72'];
$model = $_GET['m'] ?? '';

if (!in_array($model, $allowedModels)) {
    http_response_code(404);
    echo 'Ficha no encontrada';
    exit;
}

$pattern = __DIR__ . "/Imagenes/Fichas Tecnicas/{$model} 2a-*/{$model} 2a/*.pdf";
$matches = glob($pattern);

if (empty($matches) || !file_exists($matches[0])) {
    http_response_code(404);
    echo 'Archivo no disponible';
    exit;
}

$filePath = $matches[0];
$fileName = "Ficha Tecnica - Chile Home {$model}m2 2 Aguas.pdf";

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: public, max-age=86400');

readfile($filePath);
